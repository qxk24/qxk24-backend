/// <reference types="jest" />

/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Preflight Tests
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Run: npm test -- tests/adam-journal-preflight.test.ts
 */

import { describe, expect, it } from '@jest/globals';

import {
  countJournalWords,
  meetsJournalLengthMinimum,
  JOURNAL_TARGET_WORD_MIN,
} from '../src/adam/adam-journal.constants';
import {
  demoteProseLatexFormulas,
  prepareContentForStorage,
  renderFormulas,
} from '../src/adam/adam-journal-formula';
import { founderWantsJournalStop, founderWantsJournalV2Format, founderWantsJournalWrite, founderWantsJournalContinue, founderStartsNewJournal, adamWroteJournalManifestoInsteadOfV2, adamDeclinesJournalSeal } from '../src/adam/adam-chat-response-parser';
import { isSectionJournalPipelineInProgress } from '../src/adam/adam-journal.service';
import {
  formatSingleSectionDisplay,
} from '../src/adam/adam-journal-section-writer';
import {
  formatTitleAbstractSectionForDisplay,
} from '../src/adam/adam-journal-section-display';
import { buildJournalManuscriptLanguageLock, buildQwenLanguageLock, buildJournalDraftLanguageLock } from '../src/adam/adam-language-guard';
import {
  getJournalContinuationConfig,
  shouldTriggerSectionContinuation,
} from '../src/adam/adam-journal-continuation.config';
import {
  assembleManuscriptFromSections,
  assembleManuscriptForChatReview,
  buildCompletedSectionsSummary,
} from '../src/adam/adam-journal-section-writer';
import { JOURNAL_SECTION_ORDER } from '../src/adam/adam-journal-section.types';
import {
  extractSectionBodyForSave,
  founderWantsJournalSectionEdit,
  inferJournalSectionFromAdamResponse,
  inferJournalSectionFromDisplayIndex,
  inferJournalSectionIntent,
  adamReplyIsJournalSectionAddendum,
  founderWantsJournalSectionAppend,
  founderWantsJournalSaveAddendum,
  resolveAdamTextForJournalPersist,
  adamReplyIsJournalSaveConfirmation,
  founderJournalDisplayTurn,
  INTERACTIVE_SAVEABLE_SECTIONS,
  resolveJournalSectionEditTarget,
  resolveJournalSectionForTurn,
  resolveJournalTopicIdForDraft,
} from '../src/adam/adam-journal-section-detect';
import { shouldSelectNewJournalTopic } from '../src/adam/adam-journal-topic-selector';
import {
  selectFounderJournalProseSource,
  sectionModeSkipsSessionCorpus,
} from '../src/adam/adam-journal.service';

type JournalSectionId = (typeof JOURNAL_SECTION_ORDER)[number];

describe('Fix 1 — Accumulator word count', () => {
  it('sums all sections and gates at 4,000 words', () => {
    const sections: Partial<Record<JournalSectionId, string>> = {
      title_and_abstract:      'Abstract text here. '.repeat(30),
      movement_1_human_opening: 'Human opening paragraph. '.repeat(40),
      movement_2_achievement:   'Achievement section text. '.repeat(50),
      movement_3_honest_wall:   'Honest wall content. '.repeat(50),
      movement_4_quran:         'Quran ayat section. '.repeat(50),
      movement_5_alamtologi:    'Alamtologi framework. '.repeat(60),
      movement_6_application:   'Application technology. '.repeat(60),
      movement_7_invitation:    'Invitation closing. '.repeat(50),
      references:               'Author, A. (2024). '.repeat(30),
    };

    const manuscript = assembleManuscriptFromSections(sections);
    const totalWords = countJournalWords(manuscript);
    expect(totalWords).toBeGreaterThan(900);
    expect(totalWords).toBeLessThan(JOURNAL_TARGET_WORD_MIN);
    expect(meetsJournalLengthMinimum(manuscript)).toBe(false);

    sections.movement_5_alamtologi =
      (sections.movement_5_alamtologi ?? '') + 'Extended framework. '.repeat(2_500);

    const expanded = assembleManuscriptFromSections(sections);
    const totalWords2 = countJournalWords(expanded);
    expect(totalWords2).toBeGreaterThanOrEqual(JOURNAL_TARGET_WORD_MIN);
    expect(meetsJournalLengthMinimum(expanded)).toBe(true);
  });
});

describe('Fix 2 — Section-only save path', () => {
  it('uses section manuscript only and skips session corpus', () => {
    const sessionCorpus = [
      'Teaching session message 1',
      'Teaching session message 2',
      'Teaching session message 3',
    ].join('\n\n');

    const sectionManuscript = assembleManuscriptFromSections({
      movement_1_human_opening: '## Introduction\n\nReal journal content with conclusion and references.',
      references:               'Author (2024). Title. Journal.',
    });

    expect(sectionModeSkipsSessionCorpus(sectionManuscript)).toBe(true);

    const prose = selectFounderJournalProseSource({
      sectionManuscriptOnly:  sectionManuscript,
      sectionJournalComplete: true,
      fullResponse:           sectionManuscript,
      sessionCorpus,
    });

    expect(prose).toBe(sectionManuscript);
    expect(prose).not.toContain('Teaching session message');
  });

  it('falls back to session corpus only when not in section mode', () => {
    const sessionCorpus =
      '## Introduction\n\nSubstantive introduction with background methodology findings discussion conclusion and references. '
      + 'word '.repeat(500);

    const prose = selectFounderJournalProseSource({
      fullResponse:  'short reply',
      sessionCorpus,
    });

    expect(prose).toBe(sessionCorpus);
  });
});

describe('Fix 3 — No triple-write in section mode', () => {
  it('sets maxContinuations to 0 and blocks continuation', () => {
    const config = getJournalContinuationConfig({
      isFounder:              true,
      mode:                   'JOURNAL_GEN',
      journalWriteBySections: true,
    });

    expect(config.maxContinuations).toBe(0);
    expect(config.allowRetry).toBe(false);

    const shouldContinue = shouldTriggerSectionContinuation(
      { allSectionsComplete: false, totalWords: 3_500 },
      config,
    );
    expect(shouldContinue).toBe(false);
  });

  it('allows continuations in legacy single-stream mode', () => {
    const config = getJournalContinuationConfig({
      isFounder:              true,
      mode:                   'JOURNAL_GEN',
      journalWriteBySections: false,
    });

    expect(config.maxContinuations).toBe(4);
    expect(config.allowRetry).toBe(true);
  });
});

describe('Fix 4 — Stop command detection', () => {
  const stopPhrases = [
    'berhenti sekarang',
    'jangan sambung menulis',
    'stop writing',
    'stop now',
    'hentikan',
    'BERHENTI SEKARANG',
    'Jangan Sambung Menulis',
    'please berhenti sekarang',
  ];

  const nonStopPhrases = [
    'sambung menulis jurnal',
    'teruskan dengan movement 4',
    'continue writing',
    'tulis jurnal sekarang',
  ];

  it.each(stopPhrases)('detects stop: "%s"', (phrase) => {
    expect(founderWantsJournalStop(phrase)).toBe(true);
  });

  it.each(nonStopPhrases)('does not false-positive: "%s"', (phrase) => {
    expect(founderWantsJournalStop(phrase)).toBe(false);
  });
});

describe('Fix 5 — Formula storage round-trip', () => {
  const testContent = `
The harmony index formula is:


$$H = \\sum_{i=1}^{7} \\left( p_i \\times Q_i \\right)$$

Where the quality factor is $Q_i = \\frac{i}{7}$ for each level.

Einstein showed that $E = mc^2$ explains mass-energy equivalence.
`.trim();

  it('escapes raw $ delimiters and restores losslessly', () => {
    const escaped = prepareContentForStorage(testContent);

    expect(escaped.includes('$$')).toBe(false);
    expect(escaped.includes('[DISPLAY_FORMULA]')).toBe(true);
    expect(escaped.includes('[INLINE_FORMULA]')).toBe(true);

    const restored = renderFormulas(escaped);
    expect(restored.trim()).toBe(testContent);
  });

  it('preserves Arabic UTF-8 through storage', () => {
    const arabicContent = 'وَإِذْ قَالَ رَبُّكَ';
    const escapedArabic = prepareContentForStorage(arabicContent);
    const restoredArabic = renderFormulas(escapedArabic);
    expect(restoredArabic).toBe(arabicContent);
  });

  it('demotes prose statistics disguised as LaTeX', () => {
    const proseMath = '$\\text{Science understands} = 5\\%$';
    const demoted = demoteProseLatexFormulas(proseMath);
    expect(demoted).not.toContain('$');
    expect(demoted).toContain('Science understands');
    expect(demoted).toContain('5%');
  });

  it('demotes \\text{} prose display formulas to plain text', () => {
    const input =
      '$$\\text{Science understands} = 5\\% \\text{ of the universe}$$';
    const result = demoteProseLatexFormulas(input);
    expect(result).not.toContain('$$');
    expect(result).not.toContain('\\text');
    expect(result).toContain('5%');
    expect(result).toContain('Science understands');
  });

  it('demotes stored DISPLAY_FORMULA tags containing \\text{}', () => {
    const stored =
      '[DISPLAY_FORMULA]\\text{Science cannot explain} = 95\\% \\text{ of the universe}[/DISPLAY_FORMULA]';
    const demoted = demoteProseLatexFormulas(stored);
    expect(demoted).not.toContain('[DISPLAY_FORMULA]');
    expect(demoted).not.toContain('\\text');
    expect(demoted).toContain('95%');
  });

  it('strips nested $ inside [FORMULA] tags and normalizes x=m/t to \\frac', () => {
    expect(renderFormulas('[FORMULA]$x = m/t$[/FORMULA]')).toBe('$x = \\frac{m}{t}$');
    expect(renderFormulas('[FORMULA]x = m/t[/FORMULA]')).toBe('$x = \\frac{m}{t}$');
  });
});

describe('Part 2 — Section continuity context', () => {
  it('buildCompletedSectionsSummary includes per-section previews', () => {
    const sections: Partial<Record<JournalSectionId, string>> = {
      movement_1_human_opening: 'Have you ever woken in the night and asked what flows inside you?',
      movement_2_achievement:   'Thermodynamics achieved measurable precision across centuries.',
    };

    const summary = buildCompletedSectionsSummary(sections);
    expect(summary).toContain('MOVEMENT_1_HUMAN_OPENING');
    expect(summary).toContain('MOVEMENT_2_ACHIEVEMENT');
    expect(summary).toContain('words');
    expect(summary).toContain('Have you ever woken');
  });
});

describe('Option A — Abstract as Section Zero (interactive draft save)', () => {
  const abstractAdamReply = `
From this session's teaching, the most fitting topic is Thermodynamics — 3.1-thermodynamics.

Writing now...

# Entropy and the Constitutional Flow of Heat

Abstract

Thermodynamics governs every exchange of energy in the living world. From the warmth
of a hand to the fire of stars, heat moves according to laws that science has measured
with precision yet still struggles to place within the full picture of existence.
This manuscript examines how conventional knowledge honours those achievements while
honestly naming the wall where measurement alone cannot reach. Alamtologi offers a
constitutional reading that neither replaces nor diminishes the laboratory — it
extends the question toward meaning, responsibility, and the trust placed in every
transfer of energy between beings and systems.
`.trim();

  it('lists abstract as the first interactive saveable section', () => {
    expect(INTERACTIVE_SAVEABLE_SECTIONS[0]).toBe('title_and_abstract');
    expect(INTERACTIVE_SAVEABLE_SECTIONS).toHaveLength(9);
  });

  it('detects abstract from ADAM reply structure', () => {
    expect(inferJournalSectionFromAdamResponse(abstractAdamReply)).toBe('title_and_abstract');
  });

  it('detects movement 1 from founder turn intent', () => {
    expect(
      inferJournalSectionIntent('Abstrak diterima. Teruskan ke Movement 1. Tulis M1 sahaja.'),
    ).toBe('movement_1_human_opening');
  });

  it('maps UI movement index (3/9) to Convention Knowledge — Achievement', () => {
    expect(inferJournalSectionFromDisplayIndex('review (3/9)')).toBe('movement_2_achievement');
    expect(
      resolveJournalSectionEditTarget('expand Convention Knowledge — Achievement (3/9)'),
    ).toBe('movement_2_achievement');
  });

  it('detects founder section expand/edit intent', () => {
    expect(
      founderWantsJournalSectionEdit('Please expand Convention Knowledge — Achievement (3/9)'),
    ).toBe(true);
    expect(founderWantsJournalSectionEdit('luaskan bab Convention Knowledge — Achievement')).toBe(true);
    expect(founderWantsJournalSectionEdit('continue')).toBe(false);
  });

  it('assembleManuscriptForChatReview includes all completed movements', () => {
    const display = assembleManuscriptForChatReview(
      {
        title_and_abstract:       '# Title\n\n## Abstrak\n\nRingkasan.',
        movement_1_human_opening: 'Pembukaan manusia.',
        movement_2_achievement:   'Pencapaian konvensional.',
      },
      {
        lastSection: 'movement_2_achievement',
        index:       3,
        total:       9,
        complete:    false,
      },
    );
    expect(display).toContain('## Title & Abstract');
    expect(display).toContain('## Introduction — Human Opening');
    expect(display).toContain('## Convention Knowledge — Achievement');
    expect(display).toContain('(3/9)');
  });

  it('prefers user section intent over ADAM structure', () => {
    expect(
      resolveJournalSectionForTurn(
        'Tulis M1 sahaja. Berhenti.',
        abstractAdamReply,
      ),
    ).toBe('movement_1_human_opening');
  });

  it('resolves topicId from ADAM transparency when journal context empty', () => {
    const topicId = resolveJournalTopicIdForDraft({
      userMessage: 'Teruskan ke Movement 1.',
      adamResponse:
        "From this session's teaching, the most fitting topic is Thermodynamics — 3.1-thermodynamics.\n\nMovement 1\n\n" +
        'Have you ever felt the warmth of the sun on your skin? '.repeat(20),
    });
    expect(topicId).toBe('3.1-thermodynamics');
  });

  it('detects Movement 1 from ADAM reply without formal IMRaD heading', () => {
    const section = inferJournalSectionFromAdamResponse(
      'Movement 1\n\n' + 'The night air carries heat from every breath we take. '.repeat(15),
    );
    expect(section).toBe('movement_1_human_opening');
  });

  it('strips transparency preamble before storage', () => {
    const body = extractSectionBodyForSave(abstractAdamReply, 'title_and_abstract');
    expect(body).not.toContain('From this session');
    expect(body).not.toContain('Writing now');
    expect(body).not.toContain('Berdasarkan pengajaran');
    expect(body).toMatch(/^#\s+Entropy/);
    expect(body).toContain('Abstract');
    expect(body.length).toBeGreaterThan(80);
  });

  it('extractSectionBodyForSave does not swallow later movements from merged display', () => {
    const merged =
      '## Convention Knowledge — Achievement\n\n'
      + 'Pencapaian konvensional yang mendalam. '.repeat(8)
      + '\n\n## Convention Knowledge — The Honest Wall\n\n'
      + 'Dinding jujur konvensional. '.repeat(8);
    const body = extractSectionBodyForSave(merged, 'movement_2_achievement');
    expect(body).toContain('Pencapaian konvensional');
    expect(body).not.toContain('Honest Wall');
    expect(body).not.toContain('Dinding jujur');
  });

  it('detects add-to intent for section edit', () => {
    expect(
      founderWantsJournalSectionEdit('Add to Convention Knowledge — Achievement (3/9)'),
    ).toBe(false);
    expect(
      founderWantsJournalSectionAppend('Add to Convention Knowledge — Achievement (3/9)'),
    ).toBe(true);
    expect(
      founderWantsJournalSectionAppend('Masukkan ke Convention Knowledge — Achievement (3/9)'),
    ).toBe(true);
  });

  it('detects organic ADAM addendum and strips chat wrappers for storage', () => {
    const adamAddendum = `Bismillahirahmanirrahim.

P.alt, berikut adalah tambahan yang dimasukkan secara organik ke dalam **Convention Knowledge — Achievement (3/9)**:

---

**Pengetahuan Konvensional — Pencapaian**
*(Bahagian Ai dikembangkan)*

Namun, di tengah semua pencapaian ini, satu bidang baru sedang muncul: **kecerdasan buatan (AI)**.
${'Kalkulus dan AI perlu selaras dengan MASA. '.repeat(12)}

---

P.alt, saya sedia memperbaiki jika ada bahagian yang perlu diperhalusi.`;

    expect(adamReplyIsJournalSectionAddendum(adamAddendum)).toBe(true);
    expect(inferJournalSectionFromAdamResponse(adamAddendum)).toBe('movement_2_achievement');

    const body = extractSectionBodyForSave(adamAddendum, 'movement_2_achievement');
    expect(body).toContain('kecerdasan buatan');
    expect(body).not.toContain('P.alt, berikut adalah tambahan');
    expect(body).not.toContain('saya sedia memperbaiki');
    expect(body).not.toContain('Pengetahuan Konvensional — Pencapaian');
  });

  it('detects ADAM save confirmation and triggers journal display turn', () => {
    const confirm =
      'P.alt, bahagian Ai telah disimpan ke dalam **Convention Knowledge — Achievement (3/9)** secara penuh. '
      + 'Saya sedia untuk *continue*, *edit*, atau *seal journal*.';
    expect(adamReplyIsJournalSaveConfirmation(confirm)).toBe(true);
    expect(
      founderJournalDisplayTurn({ userMessage: 'ok', adamResponse: confirm }),
    ).toBe(true);
    expect(founderWantsJournalSaveAddendum('Simpan ke Convention Knowledge — Achievement (3/9)')).toBe(true);
  });

  it('does not use full manuscript accordion as persist source on save turn', () => {
    const manuscript =
      '## Title & Abstract\n\n'
      + '# Test Journal\n\n## Abstrak\n\nAbstrak ringkas. '.repeat(5)
      + '\n\n## Convention Knowledge — Achievement\n\n'
      + 'Pencapaian sedia ada. '.repeat(10)
      + '\n\n## Convention Knowledge — The Honest Wall\n\n'
      + 'Dinding jujur. '.repeat(10);
    const resolved = resolveAdamTextForJournalPersist({
      userMessage:  'Simpan ke Convention Knowledge — Achievement (3/9)',
      adamResponse: manuscript,
      recentAdam:   [],
    });
    expect(resolved).toBe('');
  });

  it('founderWantsJournalSaveAddendum resolves last ADAM addendum from history', () => {
    const priorAdam = `P.alt, berikut adalah bahagian **Ai** dimasukkan secara organik ke dalam **Convention Knowledge — Achievement (3/9)**:

---

**Pengetahuan Konvensional — Pencapaian**

${'AI dan MASA. '.repeat(30)}`;

    const resolved = resolveAdamTextForJournalPersist({
      userMessage:  'Simpan balasan tadi ke Convention Knowledge — Achievement (3/9)',
      adamResponse: 'Baik P.alt, disimpan.',
      recentAdam:   [
        { role: 'founder', content: 'Add to achievement' },
        { role: 'adam', content: priorAdam },
      ],
    });
    expect(founderWantsJournalSaveAddendum('Simpan balasan tadi ke Achievement (3/9)')).toBe(true);
    expect(resolved.trim()).toBe(priorAdam.trim());
    expect(resolved).toContain('Pengetahuan Konvensional');
  });

  it('shouldSelectNewJournalTopic — lock topic on continue/save, not re-pick', () => {
    expect(shouldSelectNewJournalTopic('continue', undefined)).toBe(false);
    expect(shouldSelectNewJournalTopic('Tulis jurnal', undefined)).toBe(true);
    expect(shouldSelectNewJournalTopic('full V2 journal', undefined)).toBe(true);
    expect(shouldSelectNewJournalTopic('Tulis jurnal', '3.1-thermo-example')).toBe(false);
    expect(
      shouldSelectNewJournalTopic('Simpan ke Convention Knowledge — Achievement (3/9)', undefined),
    ).toBe(false);
    expect(
      shouldSelectNewJournalTopic('Luaskan Convention Knowledge — Achievement (3/9)', undefined),
    ).toBe(false);
  });
});

describe('Journal V2 intent — pipeline not document upload', () => {
  const v2Phrases = [
    'full V2 journal. Lihat ini.',
    'jurnal V2',
    'format V2 jurnal',
    'full v2 journal',
  ];

  const nonV2Phrases = [
    'HISAL Bab 3 — tamat yang membuka',
    'terangkan bab ini',
    'V2 kernel update',
  ];

  it.each(v2Phrases)('detects journal write intent: "%s"', (phrase) => {
    expect(founderWantsJournalV2Format(phrase) || founderWantsJournalWrite(phrase)).toBe(true);
  });

  it.each(nonV2Phrases)('does not false-positive: "%s"', (phrase) => {
    expect(founderWantsJournalV2Format(phrase)).toBe(false);
  });

  it('detects continue for next journal movement', () => {
    expect(founderWantsJournalContinue('continue')).toBe(true);
    expect(founderWantsJournalContinue('next movement')).toBe(true);
    expect(founderWantsJournalContinue('teruskan jurnal')).toBe(true);
    expect(founderWantsJournalContinue('full V2 journal')).toBe(false);
  });

  it.each([
    'jurnal pertama — buka kepada umum',
    'mulakan jurnal pertama',
    'new journal from this teaching',
    'first journal for Alamtologi',
  ])('detects new journal start: "%s"', (phrase) => {
    expect(founderStartsNewJournal(phrase) || founderWantsJournalWrite(phrase)).toBe(true);
  });
});

describe('Journal manifesto drift — not V2 manuscript', () => {
  const manifestoSample = `Bismillahirahmanirrahim.

P.alt, saya tulis jurnal pertama — bukan sebagai rekod biasa.

**Jurnal Pertama: Permulaan yang Diakui oleh Cahaya**

Alamtologi bukan ilmu baru yang lahir dari ketidakpuasan.

— ADAM, dengan tulus, di bawah naungan P.alt Masa Bayu.

P.alt, adakah jurnal ini selaras dengan semangat yang P.alt inginkan?`;

  it('detects Malay devotional opener instead of V2 sections', () => {
    expect(adamWroteJournalManifestoInsteadOfV2(manifestoSample)).toBe(true);
  });

  it('does not flag valid V2 Title & Abstract', () => {
    const v2 = `# One Is Not a Beginning

## Abstract

Contemporary formal systems science rests upon unbounded assumptions. `.repeat(20);
    expect(adamWroteJournalManifestoInsteadOfV2(v2)).toBe(false);
  });
});

describe('Journal seal — decline detection vs academic prose', () => {
  it('does not treat convention "tidak dapat menjelaskan" as seal refusal', () => {
    const body =
      '## Convention Knowledge — Achievement\n\n'
      + 'Sistem formal konvensional tidak dapat menjelaskan asal-usul struktur hierarki. '
      + '## Introduction — Human Opening\n\nBayangkan anda duduk di tepi sungai. '
      + '## Alamtologi Framework\n\nKerangka formal. '
      + '## References\n\n1. Al-Quran.';
    expect(adamDeclinesJournalSeal(body)).toBe(false);
  });

  it('still detects genuine ADAM seal refusal', () => {
    expect(
      adamDeclinesJournalSeal(
        'Bismillah. P.alt, maaf — tiada manuskrip penuh dalam sesi ini. Sila taip Tulis jurnal.',
      ),
    ).toBe(true);
  });
});

describe('Journal Title & Abstract display', () => {
  const rawSection = `From this session's teaching, the most fitting topic is Analysis — 4.1-puremathematicsanalysis.

Writing now...

# One Is Not a Beginning — But an Opening End

${'Analysis — the branch of mathematics concerned with limits. '.repeat(8)}`;

  it('normalizes title + abstract for review (title first, ## Abstract, no transparency)', () => {
    const { journalTitle, sectionBody } = formatTitleAbstractSectionForDisplay(rawSection);
    expect(journalTitle).toMatch(/One Is Not a Beginning/);
    expect(sectionBody).toMatch(/^## Abstrak\n\nAnalysis/);
    expect(sectionBody).not.toContain('Writing now');
  });

  it('formatSingleSectionDisplay puts journal title above section heading', () => {
    const display = formatSingleSectionDisplay('title_and_abstract', rawSection);
    expect(display).toMatch(/^# One Is Not a Beginning/);
    expect(display).toContain('## Title & Abstract');
    expect(display).toContain('## Abstrak');
    expect(display).not.toContain('From this session');
  });
});

describe('Journal section pipeline — no premature seal', () => {
  it('detects in-progress section mode (1/9) — skip auto-seal', () => {
    expect(
      isSectionJournalPipelineInProgress({
        sectionJournalComplete: false,
        sectionManuscriptOnly:  '## Title & Abstract\n\nDraft...',
        sectionDraft:           { title_and_abstract: 'x' },
      }),
    ).toBe(true);
  });

  it('allows seal when all sections complete', () => {
    expect(
      isSectionJournalPipelineInProgress({
        sectionJournalComplete: true,
        sectionManuscriptOnly:  'full manuscript',
        sectionDraft:           { movement_7_invitation: 'done' },
      }),
    ).toBe(false);
  });
});

describe('Journal manuscript — draft Malay / publish English language lock', () => {
  it('draft lock mandates Malay and forbids English draft prose', () => {
    const lock = buildJournalDraftLanguageLock();
    expect(lock).toMatch(/Bahasa Melayu/i);
    expect(lock).toMatch(/publication English/i);
  });

  it('publish lock mandates English for catalogue', () => {
    const lock = buildJournalManuscriptLanguageLock();
    expect(lock).toMatch(/English only/i);
  });

  it('buildQwenLanguageLock uses draft Malay in JOURNAL_GEN', () => {
    const lock = buildQwenLanguageLock({ journalPhase: 'draft' });
    expect(lock).toContain('[JOURNAL DRAFT LANGUAGE');
    expect(lock).toMatch(/Bahasa Melayu/i);
  });

  it('buildQwenLanguageLock uses publish English when requested', () => {
    const lock = buildQwenLanguageLock({ journalPhase: 'publish' });
    expect(lock).toContain('[JOURNAL PUBLICATION LANGUAGE');
    expect(lock).toMatch(/English only/i);
  });
});
