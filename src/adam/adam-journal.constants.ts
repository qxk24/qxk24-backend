/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Constants
 * Platform : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Target length — living journal standard (Founder: heart + mind). */
export const JOURNAL_TARGET_WORD_MIN = 4_000;
export const JOURNAL_TARGET_WORD_MAX = 5_500;
export const JOURNAL_MIN_REFERENCES = 15;

/** @deprecated Use JOURNAL_TARGET_WORD_MIN — kept for error copy compatibility */
export const JOURNAL_MIN_PAGES = 8;

/** ≈5 chars/word floor for 4,000 words */
export const JOURNAL_MIN_MANUSCRIPT_CHARS = 20_000;

/** Count words in manuscript prose (whitespace-separated tokens). */
export function countJournalWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
}

/** True when accumulated manuscript meets the 4,000-word target (or char fallback). */
export function meetsJournalLengthMinimum(text: string): boolean {
  if (countJournalWords(text) >= JOURNAL_TARGET_WORD_MIN) return true;
  return text.trim().length >= JOURNAL_MIN_MANUSCRIPT_CHARS;
}
