/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Universal Channel Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamAlphaGenerationLaw } from '../src/adam/adam-answer-profile';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';
import {
  isAdamUsersChannelExcludedTurn,
  isAdamUsersChannelTurn,
} from '../src/adam/adam-users-channel';
import { isAdamCivicsGovernmentTurn, isAdamPracticalAdvisoryTurn } from '../src/adam/adam-response-generation';

const NEWTON_ASK =
  'Terangkan hukum Newton yang pertama dengan contoh kehidupan seharian.';
const PHOTOSYNTHESIS_ASK = 'Apa itu fotosintesis?';
const ACID_BASE_ASK = 'Apa itu asid dan bes?';
const WWI_ASK = 'Apakah punca Perang Dunia Pertama?';
const LIGHT_CHAT = 'Salam';
const ARITHMETIC_ASK = 'Berapa 3 tambah 5?';

const NEWTON_ESSAY_LEAK = [
  'Hai QA, Hukum Newton pertama menyatakan objek akan kekal dalam keadaan rehat atau gerakan seragam melainkan dikenakan daya luar.',
  '**Pertama**, inersia ialah rintangan terhadap perubahan gerakan.',
  '**Kedua**, contohnya penumpang terhentak ke hadapan apabila kereta brek mengejut.',
  'Dalam kerangka Alamtologi, MASA → TENAGA menunjukkan bagaimana perubahan gerakan berkait rapat dengan tenaga.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n\n');

const AIR_POLLUTION_ASK =
  'Apakah kesan pencemaran udara terhadap kesihatan manusia dan alam sekitar?';

const AIR_POLLUTION_LEAK = [
  'Hai QA, apakah kesan pencemaran udara terhadap kesihatan manusia dan alam sekitar?: (verified via web search, hellodoktor.com).',
  '',
  'Pencemaran udara ialah kehadiran bahan asing dalam atmosfera.',
  '',
  'Kesan terhadap kesihatan manusia amat mendalam.',
  '',
  'Kesan terhadap alam sekitar juga luas.',
  '',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n');

describe('student universal channel — default-on gate (no topic catalog)', () => {
  it('routes apakah kesan… through universal channel without topic-specific matcher', () => {
    expect(isAdamUsersChannelTurn(AIR_POLLUTION_ASK)).toBe(true);
    expect(isAdamUsersChannelExcludedTurn(AIR_POLLUTION_ASK)).toBe(false);
  });

  it('uses α prose law for apakah kesan without forced TEKNIKAL template', () => {
    const law = buildAdamAlphaGenerationLaw(AIR_POLLUTION_ASK);
    expect(law).toMatch(/ADAM-α/);
    expect(law).not.toMatch(/TEKNIKAL \+ ESEI = C/i);
  });

  it('strips verified-via-web-search meta and preserves prose on plain kesan ask', () => {
    const out = sanitizeUsersOutputSync(AIR_POLLUTION_LEAK, AIR_POLLUTION_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).not.toMatch(/verified via web search|hellodoktor/i);
    expect(out).not.toMatch(/^###\s/m);
    expect(out).toMatch(/kesihatan manusia/i);
    expect(out).not.toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('strips orphan bold on mitosis-style essay leak when structured compare opt-in', () => {
    const MITOSIS_ASK = 'Senarai bezakan mitosis dan meiosis dalam jadual.';
    const leak = [
      'Hai QA, **Apa itu mitosis? Mitosis ialah pembahagian sel biasa yang berlaku pada sel-sel badan.',
      'Apa itu meiosis? Meiosis pula ialah pembahagian sel khas.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(leak, MITOSIS_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    const prose = out.replace(/<adam-technical-diagram>[\s\S]*?<\/adam-technical-diagram>/gi, '');
    const openBold = (prose.match(/\*\*/g) ?? []).length;
    expect(openBold % 2).toBe(0);
    expect(prose).not.toMatch(/\*\*Apa itu mitosis\?[\s\S]{40,}/);
  });
});

describe('founder firewall — student technical channel must not run', () => {
  it('isAdamUsersTechnicalChannelActive is false for founder', async () => {
    const { isAdamUsersTechnicalChannelActive } = await import('../src/adam/adam-users-channel');
    const ask = 'Apa yang telah Adam pelajari setakat ini?';
    expect(isAdamUsersTechnicalChannelActive(ask, true)).toBe(false);
    expect(isAdamUsersTechnicalChannelActive('Apa itu fotosintesis?', false)).toBe(false);
    expect(isAdamUsersChannelTurn('Apa itu fotosintesis?')).toBe(true);
    expect(isAdamUsersTechnicalChannelActive('Adam kenal saya tak?', false)).toBe(false);
  });

  it('repairTechnicalKonvensionalDisplayStructure skips founder', async () => {
    const { repairTechnicalKonvensionalDisplayStructure } = await import('../src/adam/adam-technical-display-structure');
    const essay = [
      'P.alt, saya telah pelajari bahawa ilmu bukan sekadar kumpulan maklumat.',
      'MASA bukan ukuran, tetapi zat yang berdenyut; TENAGA bukan daya fizikal semata-mata.',
    ].join('\n\n');
    const out = repairTechnicalKonvensionalDisplayStructure(essay, 'Apa yang telah Adam pelajari?', {
      isFounder: true,
    });
    expect(out).toBe(essay);
    expect(out).not.toMatch(/### /);
    expect(out).not.toMatch(/<adam-technical-diagram>/);
  });

  it('sanitizeUsersOutputSync with isFounder does not inject student structure', () => {
    const essay = 'P.alt, ilmu ialah ritme yang hidup dari ALLAH melalui Al-Quran ke QXK24.';
    const out = sanitizeUsersOutputSync(
      essay,
      'Apa yang telah Adam pelajari setakat ini?',
      [],
      [],
      'Masa Bayu',
      { isFounder: true },
    );
    expect(out).toMatch(/ritme yang hidup/i);
    expect(out).not.toMatch(/### /);
    expect(out).not.toMatch(/berikut penjelasan tentang/i);
  });
});

describe('student universal channel — routing gate', () => {
  it('routes Newton teaching-depth ask through universal channel', () => {
    expect(isAdamUsersChannelTurn(NEWTON_ASK)).toBe(true);
    expect(isAdamUsersChannelExcludedTurn(NEWTON_ASK)).toBe(false);
  });

  it('keeps photosynthesis and acid/base on universal channel', () => {
    expect(isAdamUsersChannelTurn(PHOTOSYNTHESIS_ASK)).toBe(true);
    expect(isAdamUsersChannelTurn(ACID_BASE_ASK)).toBe(true);
  });

  it('routes history synthesis through universal channel', () => {
    expect(isAdamUsersChannelTurn(WWI_ASK)).toBe(true);
  });

  it('excludes light chat and short arithmetic', () => {
    expect(isAdamUsersChannelTurn(LIGHT_CHAT)).toBe(false);
    expect(isAdamUsersChannelExcludedTurn(LIGHT_CHAT)).toBe(true);
    expect(isAdamUsersChannelTurn(ARITHMETIC_ASK)).toBe(false);
    expect(isAdamUsersChannelExcludedTurn(ARITHMETIC_ASK)).toBe(true);
  });
});

describe('student universal channel — generation law', () => {
  it('uses α prose law for plain Newton, photosynthesis, and history asks', () => {
    for (const ask of [NEWTON_ASK, PHOTOSYNTHESIS_ASK, WWI_ASK]) {
      const law = buildAdamAlphaGenerationLaw(ask);
      expect(law).toMatch(/ADAM-α/);
      expect(law).not.toMatch(/TEKNIKAL \+ ESEI = C/i);
    }
  });

  it('injects TEKNIKAL + ESEI only on structured opt-in', () => {
    const law = buildAdamAlphaGenerationLaw('Senarai langkah-langkah proses fotosintesis');
    expect(law).toMatch(/TEKNIKAL \+ ESEI = C/i);
    expect(law).toMatch(/\*\*Ringkasnya:\*\*/i);
  });

  it('adds history hint overlay on WWI without separate science branch', () => {
    const law = buildAdamAlphaGenerationLaw(WWI_ASK);
    expect(law).not.toMatch(/TEKNIKAL \+ ESEI = C/i);
  });
});

const CONSTITUTION_ASK =
  'Apakah peranan Perlembagaan Malaysia dalam sistem kerajaan negara kita?';

const CONSTITUTION_ESSAY = [
  'Hai QA, Perlembagaan Malaysia adalah undang-undang tertinggi negara.',
  'Skills you\'ll need (from official guidance): technical competence, communication, documentation, and professional accountability as named in the official source above.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n\n');

describe('student universal channel — Malaysian constitution civics', () => {
  it('routes constitution civics through universal channel, not career advisory', () => {
    expect(isAdamCivicsGovernmentTurn(CONSTITUTION_ASK)).toBe(true);
    expect(isAdamPracticalAdvisoryTurn(CONSTITUTION_ASK)).toBe(false);
    expect(isAdamUsersChannelTurn(CONSTITUTION_ASK)).toBe(true);
  });

  it('uses α prose law for constitution civics ask', () => {
    const law = buildAdamAlphaGenerationLaw(CONSTITUTION_ASK);
    expect(law).toMatch(/ADAM-α/);
    expect(law).not.toMatch(/TEKNIKAL \+ ESEI = C/i);
    expect(law).not.toMatch(/PRACTICAL ADVISORY TURN/i);
  });

  it('strips career skills block from civics output', () => {
    const out = sanitizeUsersOutputSync(CONSTITUTION_ESSAY, CONSTITUTION_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).not.toMatch(/Skills you'?ll need/i);
    expect(out).toMatch(/Perlembagaan Malaysia/i);
  });
});

describe('student universal channel — Universal Scholar prompt alignment', () => {
  it('USERS_MODE_PROMPT defaults tier 1 to α prose — not Explain-Back Phase 1A', async () => {
    const { USERS_MODE_PROMPT } = await import('../src/adam/adam-users-prompts');
    expect(USERS_MODE_PROMPT).toMatch(/Tier 1 default = ADAM-α/i);
    expect(USERS_MODE_PROMPT).toMatch(/NOT Explain-Back/i);
    expect(USERS_MODE_PROMPT).not.toMatch(/Phase 1A lived pictures/i);
  });

  it('α photosynthesis prompt uses prose law — no Explain-Back stack', async () => {
    const { buildAdamChatSystemPrompt } = await import('../src/adam/adam-prompt-builder');
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      userMessage:          'Apa itu fotosintesis?',
      usersKnowledgeTier: 1,
    });
    expect(prompt).toMatch(/ADAM-α/);
    expect(prompt).toMatch(/ACCESSIBLE HYBRID FORMAT/i);
    expect(prompt).toMatch(/NOT Explain-Back/i);
    expect(prompt).not.toMatch(/ADAM EXPLAIN-BACK LAW \(Founder seal/i);
    expect(prompt).not.toMatch(/PHASE 1A — TIGA GAMBAR HIDUP/i);
    expect(prompt).not.toMatch(/ACTIVE TIER THIS TURN: 1 — β EXPLAIN-BACK/i);
    expect(prompt).toMatch(/UNIVERSAL SCHOLAR TIER-1/i);
  });
});

describe('student universal channel — Newton output shape', () => {
  const NEWTON_STRUCTURED_ASK =
    'Senarai langkah contoh hukum Newton pertama dalam kehidupan seharian';

  it('structures Newton output on explicit structured ask without placeholder diagram injection', () => {
    const out = sanitizeUsersOutputSync(NEWTON_ESSAY_LEAK, NEWTON_STRUCTURED_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).not.toMatch(/<adam-technical-diagram>/i);
    expect(out).toMatch(/inersia|daya luar|Newton/i);
    expect(out).not.toMatch(/MASA\s*→\s*TENAGA|Alamtologi/i);
  });
});
