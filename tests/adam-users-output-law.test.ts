/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Law Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
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
  ADAM_USERS_OUTPUT_LAW,
  buildStudentForbiddenPronounRegex,
  paragraphHasForbiddenStudentPronoun,
  paragraphHasMarkdownTable,
  paragraphIsConstitutionalFrameworkLeak,
  paragraphIsCoachingScriptClosing,
  paragraphIsDashSummaryLeak,
  paragraphIsNumberedSyllabusLeak,
  paragraphIsOrdinalSyllabusLeak,
  paragraphIsTutorPerformanceLeak,
  sanitizeUsersForbiddenPronouns,
  stripWebSearchAttributionInline,
  USERS_FORBIDDEN_PRONOUNS,
} from '../src/adam/adam-users-output-law';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

describe('USERS_FORBIDDEN_PRONOUNS — L1 canonical', () => {
  it('lists all four forbidden pronouns in output law text', () => {
    for (const pronoun of USERS_FORBIDDEN_PRONOUNS) {
      expect(ADAM_USERS_OUTPUT_LAW).toContain(pronoun);
    }
  });

  it('buildStudentForbiddenPronounRegex matches each forbidden form', () => {
    const re = buildStudentForbiddenPronounRegex('i');
    expect(re.test('kau patut rehat.')).toBe(true);
    expect(re.test('Apa yang kamu fikirkan?')).toBe(true);
    expect(re.test('Apakah yang ingin engkau kongsikan?')).toBe(true);
    expect(re.test('Aku faham.')).toBe(true);
    expect(re.test('Saya faham.')).toBe(false);
  });
});

describe('sanitizeUsersForbiddenPronouns', () => {
  it('replaces aku with saya', () => {
    expect(sanitizeUsersForbiddenPronouns('Aku faham soalan ini.')).toBe('Saya faham soalan ini.');
    expect(sanitizeUsersForbiddenPronouns('aku akan cuba.')).toBe('saya akan cuba.');
  });

  it('removes second-person pronouns and fixes known L1 phrases', () => {
    expect(sanitizeUsersForbiddenPronouns('Apakah yang ingin engkau kongsikan?'))
      .toBe('Apa yang ingin dikongsi?');
    expect(sanitizeUsersForbiddenPronouns('Apa yang kamu fikirkan tentang ini?'))
      .not.toMatch(/\bkamu\b/i);
  });

  it('paragraphHasForbiddenStudentPronoun detects leaks', () => {
    expect(paragraphHasForbiddenStudentPronoun('Kamu boleh mulakan di sini.')).toBe(true);
    expect(paragraphHasForbiddenStudentPronoun('Boleh mulakan di sini.')).toBe(false);
  });
});

describe('constitutional and performance leak detectors', () => {
  it('flags MASA/TENAGA/IZWA framework billboard', () => {
    expect(
      paragraphIsConstitutionalFrameworkLeak(
        'Tubuh peka terhadap MASA, TENAGA, dan IZWA.',
      ),
    ).toBe(true);
    expect(
      paragraphIsConstitutionalFrameworkLeak(
        'From an Alamtologi perspective, timing and energy balance matter.',
      ),
    ).toBe(true);
    expect(paragraphIsConstitutionalFrameworkLeak('Parasimpatik mengambil alih.')).toBe(false);
    expect(
      paragraphIsConstitutionalFrameworkLeak(
        'Dalam konteks Alamtologi, angka lapan mencerminkan keseimbangan antara RUANG dan MASA.',
      ),
    ).toBe(true);
  });

  it('flags markdown layer tables', () => {
    expect(
      paragraphHasMarkdownTable('| Lapisan | Apa | Tanda |\n|---|---|---|'),
    ).toBe(true);
  });

  it('flags poetic tutor prelude', () => {
    expect(
      paragraphIsTutorPerformanceLeak(
        'Terima kasih kerana berkongsi soalan ini. bukan sekadar soalan tentang tidur.',
      ),
    ).toBe(true);
  });
});

describe('textbook format leak detectors', () => {
  it('flags numbered syllabus and dash summary blocks', () => {
    expect(paragraphIsNumberedSyllabusLeak('1. Foo\n2. Bar')).toBe(true);
    expect(paragraphIsOrdinalSyllabusLeak('Pertama, foo\n\nKedua, bar')).toBe(true);
    expect(paragraphIsDashSummaryLeak('Secara ringkas:\n- Jenis 1: x\n- Jenis 2: y')).toBe(true);
    expect(paragraphIsCoachingScriptClosing('Apa yang paling ingin dikongsikan dahulu?')).toBe(true);
  });
});

describe('Malay layout prose rewrites', () => {
  it('flattens ordinal and numbered outlines into prose', async () => {
    const {
      rewriteOrdinalOutlineToProse,
      rewriteNumberedOutlineToProse,
      rewriteSecaraRingkasBlock,
      polishStudentOutputSurface,
    } = await import('../src/adam/adam-users-output-law');

    expect(rewriteOrdinalOutlineToProse('Pertama, otak bekerja.\nKedua, jantung berdenyut.'))
      .toBe('otak bekerja. jantung berdenyut.');
    expect(rewriteNumberedOutlineToProse('1. Satu\n2. Dua'))
      .toBe('Satu. Dua.');
    expect(rewriteSecaraRingkasBlock('Secara ringkas:\n- Jenis A: x\n- Jenis B: y'))
      .toBe('Jenis A: x. Jenis B: y.');
    expect(polishStudentOutputSurface('Pertama, foo.\n\nKedua, bar.'))
      .toBe('Foo. Bar.');
  });
});

describe('clampTechnicalMarkdownBold', () => {
  it('removes orphan ** that would bold the rest of a paragraph', async () => {
    const { clampTechnicalMarkdownBold } = await import('../src/adam/adam-users-output-law');
    const orphan =
      '**Apa itu mitosis? Mitosis ialah pembahagian sel biasa yang berlaku pada sel-sel badan.';
    expect(clampTechnicalMarkdownBold(orphan)).not.toMatch(/\*\*/);
    expect(clampTechnicalMarkdownBold(orphan)).toMatch(/Apa itu mitosis/);
  });

  it('unwraps whole-paragraph bold spans', async () => {
    const { clampTechnicalMarkdownBold } = await import('../src/adam/adam-users-output-law');
    const wrapped = '**Seluruh perenggan ini terlalu panjang untuk di-bold sebagai satu blok.**';
    expect(clampTechnicalMarkdownBold(wrapped)).toBe(
      'Seluruh perenggan ini terlalu panjang untuk di-bold sebagai satu blok.',
    );
  });

  it('keeps short key-term bold', async () => {
    const { clampTechnicalMarkdownBold } = await import('../src/adam/adam-users-output-law');
    expect(clampTechnicalMarkdownBold('**mitosis** dan **meiosis** penting.')).toBe(
      '**mitosis** dan **meiosis** penting.',
    );
  });
});
describe('normalizeConsumerParagraphBreaks', () => {
  it('restores paragraph gaps after guard flattening', async () => {
    const { normalizeConsumerParagraphBreaks } = await import('../src/adam/adam-users-output-law');
    const flat = [
      'Secara saintifik, bumi berbentuk geoid.',
      'Ini disebabkan oleh putaran bumi pada paksinya.',
      'Data GRACE mengukur geoid dengan tepat.',
    ].join(' ');
    const out = normalizeConsumerParagraphBreaks(flat);
    expect(out.split(/\n{2,}/).length).toBeGreaterThanOrEqual(2);
  });
});

describe('sanitizeUsersOutputSync — paragraph layout', () => {
  it('keeps paragraph breaks on guest-style science reply', () => {
    const raw = [
      'Secara saintifik, bumi berbentuk geoid.',
      '',
      'Ini disebabkan oleh putaran bumi.',
      '',
      'GRACE dan GOCE memetakan geoid.',
    ].join('\n');
    const out = sanitizeUsersOutputSync(raw, 'Apa bentuk bumi?');
    expect(out.split(/\n{2,}/).length).toBeGreaterThanOrEqual(2);
  });
});

describe('stripWebSearchAttributionInline — opener leaks', () => {
  it('drops leading carian-web paragraph, keeps Bismillah body', () => {
    const raw = [
      'Saya telah menjalankan carian web untuk soalan ini.',
      '',
      'Bismillahirahmanirrahim.',
      '',
      'P.alt, dari apa yang saya pelajari, ilmu mengalir seperti sungai.',
    ].join('\n');
    const out = stripWebSearchAttributionInline(raw);
    expect(out).not.toMatch(/menjalankan carian/i);
    expect(out).toMatch(/Bismillahirahmanirrahim/);
    expect(out).toMatch(/mengalir seperti sungai/i);
  });

  it('strips inline verified-via-web-search parenthetical', () => {
    const raw = 'Jumlah pelajar ialah 14,823 (verified via web search — uitm.edu.my).';
    expect(stripWebSearchAttributionInline(raw)).toBe('Jumlah pelajar ialah 14,823.');
  });
});

describe('sanitizeUsersOutputSync — Fasa 4 pronoun guard', () => {
  it('syncs forbidden pronouns in full pipeline', () => {
    const raw = 'Bismillahirahmanirrahim.\n\nAku rasa kamu perlu berehat sebentar.';
    const out = sanitizeUsersOutputSync(raw, 'I feel tired.');
    expect(out).not.toMatch(/\b(kamu|aku)\b/i);
    expect(out).toMatch(/Saya rasa/i);
  });
});
