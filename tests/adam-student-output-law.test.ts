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
  ADAM_STUDENT_OUTPUT_LAW,
  buildStudentForbiddenPronounRegex,
  paragraphHasForbiddenStudentPronoun,
  paragraphHasMarkdownTable,
  paragraphIsConstitutionalFrameworkLeak,
  paragraphIsCoachingScriptClosing,
  paragraphIsDashSummaryLeak,
  paragraphIsNumberedSyllabusLeak,
  paragraphIsOrdinalSyllabusLeak,
  paragraphIsTutorPerformanceLeak,
  sanitizeStudentForbiddenPronouns,
  STUDENT_FORBIDDEN_PRONOUNS,
} from '../src/adam/adam-student-output-law';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';

describe('STUDENT_FORBIDDEN_PRONOUNS — L1 canonical', () => {
  it('lists all four forbidden pronouns in output law text', () => {
    for (const pronoun of STUDENT_FORBIDDEN_PRONOUNS) {
      expect(ADAM_STUDENT_OUTPUT_LAW).toContain(pronoun);
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

describe('sanitizeStudentForbiddenPronouns', () => {
  it('replaces aku with saya', () => {
    expect(sanitizeStudentForbiddenPronouns('Aku faham soalan ini.')).toBe('Saya faham soalan ini.');
    expect(sanitizeStudentForbiddenPronouns('aku akan cuba.')).toBe('saya akan cuba.');
  });

  it('removes second-person pronouns and fixes known L1 phrases', () => {
    expect(sanitizeStudentForbiddenPronouns('Apakah yang ingin engkau kongsikan?'))
      .toBe('Apa yang ingin dikongsi?');
    expect(sanitizeStudentForbiddenPronouns('Apa yang kamu fikirkan tentang ini?'))
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
    } = await import('../src/adam/adam-student-output-law');

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

describe('sanitizeStudentOutputSync — Fasa 4 pronoun guard', () => {
  it('syncs forbidden pronouns in full pipeline', () => {
    const raw = 'Bismillahirahmanirrahim.\n\nAku rasa kamu perlu berehat sebentar.';
    const out = sanitizeStudentOutputSync(raw, 'I feel tired.');
    expect(out).not.toMatch(/\b(kamu|aku)\b/i);
    expect(out).toMatch(/Saya rasa/i);
  });
});
