/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildFactualGroundingPromptBlock,
  buildTechnicalVerificationFallback,
  precisionAskAlreadyAnchored,
  finalizeVerificationGatedOutput,
  consolidateVerificationCatatan,
  INVENTED_CITATION_NOTE,
  prependSearchUnavailableNotice,
  resolveTechnicalPrecisionTurn,
  sanitizeTechnicalPrecisionOutput,
  shouldForceWebSearchForTechnicalTurn,
  stripInventedTechnicalCitations,
  stripTechnicalGuessHallucination,
  UNIFIED_VERIFICATION_CATATAN,
  paragraphIsTechnicalAskDeflection,
} from '../src/adam/adam-factual-grounding';
import { getAdamWebSearchPrompt, getWebSearchGateReason } from '../src/adam/adam-web-search';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  isTechnicalPrecisionQuestion,
  messageHasSlashSeparatedDimensions,
} from '../src/adam/adam-universal-voice';

describe('Technical precision detection (universal — no brand lists)', () => {
  it('detects torque questions by dimension word', () => {
    expect(isTechnicalPrecisionQuestion('Berapakah kuasa tork model A dan model B?')).toBe(true);
    expect(isTechnicalPrecisionQuestion('tork?')).toBe(true);
  });

  it('detects medicine dosage questions', () => {
    expect(isTechnicalPrecisionQuestion('Berapa mg paracetamol untuk dewasa?')).toBe(true);
  });

  it('detects chemistry questions', () => {
    expect(isTechnicalPrecisionQuestion('Apakah jisim molar air?')).toBe(true);
  });

  it('detects electronics specs', () => {
    expect(isTechnicalPrecisionQuestion('battery capacity mAh for this phone')).toBe(true);
  });

  it('detects nak tahu + dimension without brand names', () => {
    expect(isTechnicalPrecisionQuestion('Saya nak tahu tork enjin ini')).toBe(true);
  });

  it('detects trim + dimension without brand names', () => {
    expect(isTechnicalPrecisionQuestion('Exclusive vs Elite torque difference')).toBe(true);
  });

  it('does not flag pure greetings or emotional turns', () => {
    expect(isTechnicalPrecisionQuestion('salam')).toBe(false);
    expect(isTechnicalPrecisionQuestion('Kenapa saya rasa sedih?')).toBe(false);
  });
});

describe('Universal technical grounding', () => {
  it('builds same mandate for automotive and chemistry', () => {
    const auto = buildFactualGroundingPromptBlock('Berapakah tork varian Elite?');
    const chem = buildFactualGroundingPromptBlock('Apakah takat didih nitrogen?');
    expect(auto).toMatch(/UNIVERSAL POLICY/);
    expect(chem).toMatch(/UNIVERSAL POLICY/);
    expect(auto).not.toMatch(/PERODUA|VIVA|660 cc|K3-VE|EJ-VE/i);
    expect(chem).not.toMatch(/PERODUA|VIVA|660 cc/i);
  });

  it('includes universal answer structure', () => {
    const block = buildFactualGroundingPromptBlock('Berapa watt charger laptop?');
    expect(block).toMatch(/TECHNICAL ANSWER STRUCTURE/);
    expect(block).toMatch(/trim vs engine/i);
  });

  it('returns empty block for non-technical turns', () => {
    expect(buildFactualGroundingPromptBlock('salam')).toBe('');
  });

  it('forces web search on all technical turns', () => {
    expect(shouldForceWebSearchForTechnicalTurn('Berapa mg vitamin C sehari?')).toBe(true);
    expect(shouldForceWebSearchForTechnicalTurn('salam')).toBe(false);
  });

  it('uses universal technical search prompt for students', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      userMessage: 'Berapa mg paracetamol untuk kanak-kanak 10 tahun?',
    });
    expect(prompt).toMatch(/UNIVERSAL/);
    expect(prompt).toMatch(/every domain, every product/);
    expect(prompt).not.toMatch(/660 cc|Perodua|Viva/i);
  });
});

describe('Technical follow-up detection', () => {
  it('detects Exclusive pula after torque question', () => {
    const recent = ['Berapakah kuasa tork varian Elite dan Exclusive?'];
    const ctx = resolveTechnicalPrecisionTurn('Exclusive pula?', recent);
    expect(ctx.isFollowUp).toBe(true);
    expect(ctx.isActive).toBe(true);
    expect(ctx.precisionText).toContain('tork');
  });

  it('detects short cc follow-up in technical thread', () => {
    const recent = ['Berapakah tork enjin 1.0L?'];
    const ctx = resolveTechnicalPrecisionTurn('850cc?', recent);
    expect(ctx.isActive).toBe(true);
  });

  it('adds follow-up block to grounding prompt', () => {
    const block = buildFactualGroundingPromptBlock('Exclusive pula?', {
      recentUserMessages: ['Berapakah tork varian Elite dan Exclusive?'],
    });
    expect(block).toMatch(/TECHNICAL FOLLOW-UP TURN/);
  });

  it('does not treat emotional thread as technical follow-up', () => {
    const ctx = resolveTechnicalPrecisionTurn('juga', ['Kenapa saya rasa sedih?']);
    expect(ctx.isActive).toBe(false);
  });

  it('enables search gate for short technical follow-up', () => {
    const reason = getWebSearchGateReason('850cc?', { technicalFollowUp: true });
    expect(reason).toBe('technical_follow_up');
  });
});

describe('Search unavailable notice', () => {
  it('does not prepend catatan when search dropped (silent gate)', () => {
    const raw = 'Tork 90 Nm.';
    expect(prependSearchUnavailableNotice(raw, {
      technicalTurn: true,
      searchWasDropped: true,
    })).toBe(raw);
  });

  it('skips notice when search succeeded', () => {
    const raw = 'Tork 90 Nm.';
    expect(prependSearchUnavailableNotice(raw, {
      technicalTurn: true,
      searchWasDropped: false,
    })).toBe(raw);
  });
});

describe('Universal technical output guard', () => {
  it('strips hedged invented numbers on any technical question', () => {
    const raw =
      'Paracetamol untuk dewasa mungkin sekitar 5000 mg setiap 4 jam.\n\n'
      + 'Jangan melebihi dos maksimum tanpa nasihat doktor.';
    const out = stripTechnicalGuessHallucination(raw, 'Berapa mg paracetamol dewasa?');
    expect(out).not.toMatch(/5000 mg/);
    expect(out).toMatch(/nasihat doktor/);
    expect(out).not.toMatch(/^Catatan:/);
  });

  it('de-hedges sekitar but keeps verified-style numbers (no whole-paragraph wipe)', () => {
    const raw =
      'Varian A 2.5L: tork maksimum sekitar 233 Nm.\n\n'
      + 'Varian B 2.0L: tork maksimum sekitar 196 Nm.';
    const out = stripTechnicalGuessHallucination(raw, 'Apa beza tork varian A 2.5 dengan 2.0');
    expect(out).toMatch(/233\s*Nm/i);
    expect(out).toMatch(/196\s*Nm/i);
    expect(out).not.toMatch(/sekitar/i);
  });

  it('strips confident fake authority reaffirmation', () => {
    const raw =
      'Soalan sudah dibincangkan beberapa kali, jawapannya tetap sama: 89 Nm @ 4,000 rpm. '
      + 'Ini bukan anggaran — nilai diukur secara fizikal.';
    const out = stripInventedTechnicalCitations(raw, 'Saya nak tahu tork enjin');
    expect(out).not.toMatch(/89\s*Nm/);
    expect(out).not.toMatch(/^Catatan:/);
  });

  it('strips fabricated bulletin source stack', () => {
    const raw =
      'Tork 89 Nm.\n\n'
      + 'Dilaporkan dalam Manual pemilik (Edisi 2011), Laporan ujian MIROS, '
      + 'dan Technical Bulletin V10-2008.';
    const out = stripInventedTechnicalCitations(raw, 'Berapakah tork?');
    expect(out).not.toMatch(/Technical Bulletin/i);
    expect(out).not.toMatch(/MIROS/);
  });

  it('strips invented bulletins on technical questions', () => {
    const raw =
      'Tork maksimum 90 Nm.\n\n'
      + 'Sumber: Technical Bulletin No. X1-2008 dan Vehicle Dynamics Report 2009.';
    const out = stripInventedTechnicalCitations(raw, 'Berapakah tork varian Elite?');
    expect(out).not.toMatch(/Technical Bulletin/i);
    expect(out).toMatch(/90 Nm/);
    expect(out).not.toMatch(/^Catatan:/);
  });

  it('strips invented journal vol/issue on chemistry question', () => {
    const raw =
      'Takat didih 77 K.\n\n'
      + 'Menurut Nature Vol. 412 Issue 3, nitrogen mencair pada tekanan ini.';
    const out = stripInventedTechnicalCitations(raw, 'Apakah takat didih nitrogen?');
    expect(out).not.toMatch(/Nature Vol/i);
    expect(out).toMatch(/77 K/);
  });

  it('does not strip on non-technical emotional questions', () => {
    const raw = 'Mungkin sekitar tiga minggu anda akan rasa lebih tenang.';
    const out = sanitizeTechnicalPrecisionOutput(raw, 'Kenapa saya cemas?');
    expect(out).toBe(raw);
  });

  it('integrates universal guard in student output sanitize', () => {
    const raw =
      'Dos biasanya sekitar 8000 mg sehari.\n\n'
      + 'Sumber: Lancet Vol. 99 Issue 12.';
    const out = sanitizeStudentOutputSync(raw, 'Berapa mg vitamin C?');
    expect(out).not.toMatch(/8000 mg/);
    expect(out).not.toMatch(/Lancet Vol/i);
  });

  it('strips telah jalankan carian variant (not only menjalankan)', () => {
    const raw =
      'Saya telah jalankan carian khusus untuk kuasa kuda (horsepower) bagi model Z 2.0L dan 2.5L tahun 2016.\n\n'
      + 'Kuasa 141 hp dan 171 hp.';
    const out = sanitizeTechnicalPrecisionOutput(raw, 'Berapa hp model Z 2.0 vs 2.5?');
    expect(out).not.toMatch(/jalankan\s+carian/i);
    expect(out).toMatch(/141\s*hp/i);
  });

  it('finalize strips catatan and false verified paragraphs silently', () => {
    const stacked =
      `${UNIFIED_VERIFICATION_CATATAN}\n\n`
      + 'Ini berdasarkan spesifikasi rasmi dan data teknikal yang disahkan melalui carian web terkini:\n\n'
      + 'Sumber: [Brochure](https://maker.example), [Specs](https://reviews.example/spec).';
    const out = finalizeVerificationGatedOutput(stacked, 'Berapa tork enjin?');
    expect(out).not.toMatch(/disahkan melalui carian/i);
    expect(out).not.toMatch(/Sumber:/i);
    expect(out).not.toMatch(/^Catatan:/);
    expect(out).not.toMatch(/tidak dapat mengesahkan|Taip semula/i);
  });

  it('strips stacked catatan paragraphs and keeps honest body', () => {
    const stacked =
      `${INVENTED_CITATION_NOTE}\n\n`
      + 'Catatan: Pengesahan SuNom (lika pasif) — ADAM tidak dapat melengkapkan gelung bukti.\n\n'
      + 'Saya di sini bersama kamu.';
    const out = consolidateVerificationCatatan(stacked);
    expect(out).not.toMatch(/^Catatan:/);
    expect(out).toContain('Saya di sini bersama kamu.');
  });

  it('precisionAskAlreadyAnchored detects compare with two variant anchors', () => {
    expect(precisionAskAlreadyAnchored('Apa beza tork produk Y 2.5 dengan 2.0')).toBe(true);
    expect(precisionAskAlreadyAnchored('tork?')).toBe(false);
  });

  it('buildTechnicalVerificationFallback does not echo when ask is already anchored', () => {
    const anchored = buildTechnicalVerificationFallback('Apa beza tork produk Y 2.5 dengan 2.0');
    expect(anchored).toMatch(/tidak dapat mengesahkan/i);
    expect(anchored).toMatch(/tahun keluaran/i);
    expect(anchored).not.toMatch(/Taip semula/i);
    expect(anchored).not.toMatch(/contoh:/i);
  });

  it('finalize strips technical ask deflection ramble (silent, no product lists)', () => {
    const raw =
      'Soalan anda. hp/tork model Z 2024. kelihatan merujuk kepada kategori lain.\n\n'
      + 'Namun, berdasarkan carian semasa di internet, tiada rekod rasmi.\n\n'
      + 'Bolehkah anda nyatakan dengan lebih jelas?\n\n'
      + 'Saya di sini. bersama anda. langkah demi langkah.';
    const out = finalizeVerificationGatedOutput(raw, 'hp/tork model Z 2024');
    expect(out).toBe('');
  });

  it('paragraphIsTechnicalAskDeflection catches reinterpretation without product lists', () => {
    expect(paragraphIsTechnicalAskDeflection('kelihatan merujuk kepada kategori lain.')).toBe(true);
    expect(paragraphIsTechnicalAskDeflection('Kuasa maksimum 141 hp @ 6000 rpm.')).toBe(false);
  });

  it('messageHasSlashSeparatedDimensions is domain-agnostic', () => {
    expect(messageHasSlashSeparatedDimensions('hp/tork model Z 2024')).toBe(true);
    expect(messageHasSlashSeparatedDimensions('mg/dos produk A')).toBe(true);
    expect(messageHasSlashSeparatedDimensions('foo/bar unrelated')).toBe(false);
  });

  it('buildTechnicalVerificationFallback echoes user ask without brand hardcoding', () => {
    const auto = buildTechnicalVerificationFallback('Exclusive pula?', ['Berapa tork enjin model X?']);
    const chem = buildTechnicalVerificationFallback('Berapa mg paracetamol dewasa?');
    expect(auto).toMatch(/model X/i);
    expect(auto).not.toMatch(/PERODUA|VIVA|660 cc|Perodua|Viva/i);
    expect(chem).toMatch(/paracetamol/i);
    expect(chem).not.toMatch(/PERODUA|VIVA|tork enjin/i);
  });
});
