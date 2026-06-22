/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Quran Translation Guard Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  enforceQuranTranslationOnlyGuard,
  stripParentheticalSegments,
} from '../src/adam/tutor-law/tutor-law.quran-translation';
import { enforceTutorReplyGuards } from '../src/adam/adam-tutor-law';

describe('quran translation-only guard', () => {
  it('V-QT-01: strips parenthetical ayat from text', () => {
    const raw = 'Maksudnya (Inna lillahi wa inna ilayhi rajiun) ialah sabar.';
    expect(stripParentheticalSegments(raw)).toBe('Maksudnya ialah sabar.');
  });

  it('V-QT-02: strips nested parentheses iteratively', () => {
    const raw = 'Ayat (terjemahan (tafsir ulama)) tentang sabar.';
    expect(stripParentheticalSegments(raw)).not.toMatch(/tafsir|terjemahan/);
  });

  it('V-QT-03: enforceQuranTranslationOnlyGuard cleans assistant reply', () => {
    const raw = 'Terjemahan: (Sesungguhnya bersama kesulitan ada kemudahan — tafsir Ibnu Katsir)';
    const out = enforceQuranTranslationOnlyGuard(raw);
    expect(out).not.toMatch(/tafsir Ibnu Katsir/);
    expect(out).toMatch(/Terjemahan:/);
  });

  it('V-QT-04: pipeline strips parenthetical ayat on Quran turn', () => {
    const raw = 'Surah Al-Asr bermaksud (wal asri innal insaana lafii khusr) manusia dalam kerugian.';
    const out = enforceTutorReplyGuards(
      raw,
      { level: 'secondary', curriculum: 'national', language: 'malay' },
      'Apa maksud surah Al-Asr?',
    );
    expect(out).not.toMatch(/wal asri/);
    expect(out).toMatch(/kerugian/);
  });
});
