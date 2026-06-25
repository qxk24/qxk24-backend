/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Factual Correction Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildRukunNegaraCurriculumPromptBlock,
  buildStudentFactualCorrectionPromptBlock,
  enforceTutorStudentFactualCorrectionGuard,
  isClassroomEnumerationAsk,
  isRukunNegaraPrinciplesContext,
  isStudentFactualChallengeMessage,
  resolveStudentFactualCorrectionTurn,
} from '../src/adam/adam-student-factual-correction';
import { getWebSearchGateReason } from '../src/adam/adam-web-search';

const RUKUN_PRIOR = `
Lima prinsipnya ialah:

**1. Kepercayaan kepada Tuhan**
**2. Kesetiaan kepada Raja dan Negara**
**3. Keluhuran Perlembagaan**
**4. Kedaulatan Undang-undang**
**5. Keadilan Sosial**
`.trim();

const STUDENT_CORRECTION =
  'apa yang saya faham, yang kelima bukankah kesopanan dan kesusilaan?';

const STUDENT_CORRECTION_REAL =
  `setahu saya Lima prinsip Rukunegara adalah:
Kepercayaan kepada Tuhan
Kesetiaan kepada Raja dan Negara
Keluhuran Perlembagaan
Kedaulatan Undang-undang
Kesopanan dan Kesusilaan

dan bukannya "Keadilan Sosial"`;

describe('isStudentFactualChallengeMessage', () => {
  it('detects Rukun Negara style correction without hardcoded topic', () => {
    expect(isStudentFactualChallengeMessage(STUDENT_CORRECTION, [RUKUN_PRIOR])).toBe(true);
  });

  it('detects real setahu saya / bukannya correction wording', () => {
    expect(isStudentFactualChallengeMessage(STUDENT_CORRECTION_REAL, [RUKUN_PRIOR])).toBe(true);
  });

  it('does not flag entity brand correction', () => {
    expect(
      isStudentFactualChallengeMessage('Kenapa proton? ini perodua. Anda sengaja buat silap', []),
    ).toBe(false);
  });

  it('does not flag pure greetings', () => {
    expect(isStudentFactualChallengeMessage('salam cikgu', [RUKUN_PRIOR])).toBe(false);
  });
});

describe('resolveStudentFactualCorrectionTurn', () => {
  it('extracts affirmed syllabus term from bukankah', () => {
    const ctx = resolveStudentFactualCorrectionTurn(STUDENT_CORRECTION, [RUKUN_PRIOR]);
    expect(ctx.isActive).toBe(true);
    expect(ctx.affirmedHint?.toLowerCase()).toContain('kesopanan');
    expect(ctx.ordinalHint?.toLowerCase()).toMatch(/kelima|lima/);
  });

  it('extracts the affirmed Rukun Negara fifth principle from real wording', () => {
    const ctx = resolveStudentFactualCorrectionTurn(STUDENT_CORRECTION_REAL, [RUKUN_PRIOR]);
    expect(ctx.isActive).toBe(true);
    expect(ctx.affirmedHint).toBe('Kesopanan dan Kesusilaan');
  });
});

describe('buildStudentFactualCorrectionPromptBlock', () => {
  it('includes mandate and student affirmed hint', () => {
    const block = buildStudentFactualCorrectionPromptBlock(STUDENT_CORRECTION, [RUKUN_PRIOR]);
    expect(block).toMatch(/PELAJAR BETULKAN FAKTA/);
    expect(block).toMatch(/kesopanan/i);
    expect(block).not.toMatch(/RUKUN NEGARA/);
  });
});

describe('Rukun Negara curriculum override', () => {
  it('detects Rukun Negara principles context', () => {
    expect(isRukunNegaraPrinciplesContext('Apakah 5 prinsip rukun negara?')).toBe(true);
  });

  it('builds canonical curriculum prompt for first enumeration ask', () => {
    const block = buildRukunNegaraCurriculumPromptBlock('Apakah 5 prinsip rukun negara?');
    expect(block).toMatch(/Kesopanan dan Kesusilaan/);
    expect(block).toMatch(/BUKAN prinsip kelima/i);
  });
});

describe('isClassroomEnumerationAsk', () => {
  it('detects generic syllabus list questions', () => {
    expect(isClassroomEnumerationAsk('Apakah 5 prinsip rukun negara?')).toBe(true);
    expect(isClassroomEnumerationAsk('berapa prinsip dalam senarai itu')).toBe(true);
  });

  it('does not flag unrelated chat', () => {
    expect(isClassroomEnumerationAsk('salam cikgu')).toBe(false);
  });
});

describe('getWebSearchGateReason — factual correction', () => {
  it('forces search on student syllabus correction', () => {
    expect(getWebSearchGateReason(STUDENT_CORRECTION, {
      recentAssistantMessages: [RUKUN_PRIOR],
    })).toBe('student_factual_correction');
  });

  it('forces search on classroom enumeration ask', () => {
    expect(getWebSearchGateReason('Apakah 5 prinsip rukun negara?')).toBe('classroom_enumeration');
  });
});

describe('enforceTutorStudentFactualCorrectionGuard', () => {
  it('strips double-down rejecting student affirmed term', () => {
    const bad = [
      'Prinsip kelima Rukun Negara **bukan** "kesopanan dan kesusilaan".',
      '',
      'Ia ialah **Keadilan Sosial**.',
      '',
      'Jika kita bayangkan Rukun Negara sebagai sebuah rumah, kelima ialah lantai yang rata.',
    ].join('\n\n');

    const out = enforceTutorStudentFactualCorrectionGuard(
      bad,
      STUDENT_CORRECTION,
      [RUKUN_PRIOR],
    );

    expect(out.toLowerCase()).toContain('terima kasih');
    expect(out.toLowerCase()).toContain('kesopanan');
    expect(out).not.toMatch(/bukan.*kesopanan/i);
    expect(out).not.toMatch(/sebuah rumah/i);
  });

  it('replaces Rukun Negara double-down with canonical school list', () => {
    const bad = [
      'Memang benar: "Kesopanan dan Kesusilaan" adalah prinsip kelima yang disebutkan dalam draf awal.',
      '',
      'Namun, versi akhir diubah kepada "Keadilan Sosial".',
    ].join('\n\n');

    const out = enforceTutorStudentFactualCorrectionGuard(
      bad,
      STUDENT_CORRECTION_REAL,
      [RUKUN_PRIOR],
    );

    expect(out).toMatch(/anda betul/i);
    expect(out).toMatch(/Kesopanan dan Kesusilaan/);
    expect(out).not.toMatch(/diubah kepada "Keadilan Sosial"/i);
  });

  it('replaces first Rukun Negara answer if it uses Keadilan Sosial', () => {
    const bad = 'Lima prinsip Rukun Negara ialah Kepercayaan kepada Tuhan, Kesetiaan kepada Raja dan Negara, Keluhuran Perlembagaan, Kedaulatan Undang-undang dan Keadilan Sosial.';
    const out = enforceTutorStudentFactualCorrectionGuard(
      bad,
      'Apakah 5 prinsip rukun negara?',
      [],
    );

    expect(out).toMatch(/Kesopanan dan Kesusilaan/);
    expect(out).not.toMatch(/Keadilan Sosial/);
  });

  it('strips fabricated search verification numbers', () => {
    const bad = 'Apakah 5 prinsip rukun negara?: 4,632 (disahkan melalui carian web, malaysia.gov.my).';
    const out = enforceTutorStudentFactualCorrectionGuard(
      bad,
      STUDENT_CORRECTION,
      [RUKUN_PRIOR],
    );
    expect(out).not.toMatch(/4,632/);
    expect(out).not.toMatch(/disahkan melalui carian/i);
  });
});
