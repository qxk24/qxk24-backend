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
