/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Alamtologi Chapter One Test
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
  needsBookAwareTeachingRecall,
  resolveBookChapter,
} from '../src/adam/adam-book-aware-recall';
import { FORMULA_XYZ_BOOK_ID } from '../src/llm-pipeline/formula-xyz-syllabus';

function isHukumChapter(message: string): boolean {
  const match = resolveBookChapter(message);
  return match?.bookId === FORMULA_XYZ_BOOK_ID && match.chapterId === 'bab-3-hukum';
}

describe('Formula XYZ Bab 3 — Hukum Alamtologi (Hukum Z / Hukum X)', () => {
  it('flags Hukum Z / Hukum X', () => {
    expect(isHukumChapter('Apa itu Hukum Z?')).toBe(true);
    expect(needsBookAwareTeachingRecall('Terangkan Hukum X')).toBe(true);
  });

  it('does not treat Formula XYZ Bab 1 as Hukum chapter', () => {
    expect(isHukumChapter('asas keilmuan alamtologi')).toBe(false);
    expect(resolveBookChapter('asas keilmuan alamtologi')?.chapterId).toBe('bab-1-asas');
  });

  it('does not treat AMA as constitutional topic', () => {
    expect(isHukumChapter('Terangkan pola AMA')).toBe(false);
    expect(needsBookAwareTeachingRecall('Terangkan pola AMA')).toBe(false);
  });
});
