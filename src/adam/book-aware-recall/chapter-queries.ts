/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Chapter Query Helpers
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { FORMULA_XYZ_BOOK_ID } from '../../llm-pipeline/formula-xyz-syllabus';
import { resolveBookChapter } from './resolve';

export function isFormulaXyzBab1AsasQuery(message: string): boolean {
  return resolveBookChapter(message.trim())?.chapterId === 'bab-1-asas';
}

export function isFormulaXyzBab2FaktorQuery(message: string): boolean {
  return resolveBookChapter(message.trim())?.chapterId === 'bab-2-faktor-xyz';
}

export function isFormulaXyzBab3HukumQuery(message: string): boolean {
  return resolveBookChapter(message.trim())?.chapterId === 'bab-3-hukum';
}

export function isFormulaXyzBab4SainsQuery(message: string): boolean {
  return resolveBookChapter(message.trim())?.chapterId === 'bab-4-sains';
}

export function isFormulaXyzBab5MasaQuery(message: string): boolean {
  return resolveBookChapter(message.trim())?.chapterId === 'bab-5-masa';
}

export function isFormulaXyzBab6TenagaQuery(message: string): boolean {
  return resolveBookChapter(message.trim())?.chapterId === 'bab-6-tenaga';
}

export function isFormulaXyzChapterQuery(message: string, chapterId: string): boolean {
  return resolveBookChapter(message.trim())?.chapterId === chapterId;
}

export function resolveFormulaXyzChapterId(message: string): string | null {
  const match = resolveBookChapter(message.trim());
  if (match?.bookId !== FORMULA_XYZ_BOOK_ID) return null;
  return match.chapterId;
}
