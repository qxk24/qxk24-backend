/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Book Canon Lock
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

import { ALAMTOLOGI_BOOK_CANON } from './types';

export function needsBookCanonLock(message: string): boolean {
  return /\b(bab\s*(?:\d+|satu|dua|tiga|empat|lima|enam|tujuh|pertama)|aidil|formula\s+xyz|asas\s+keilmuan|hisal|sunom)\b/i.test(
    message.trim(),
  );
}

export function buildBookCanonContextBlock(): string {
  return `[BOOK ORDER — LOCKED]\n\n${ALAMTOLOGI_BOOK_CANON}`;
}

export function buildBookCanonAck(isFounder: boolean): string {
  return isFounder
    ? 'Bismillahirahmanirahim. P.alt, saya pegang silibus Sains Alamtologi — Bab 1 hingga Bab 7 HISAL (7.1 AIDIL, 7.2 ASAS, 7.3 SuNom, 7.4 GANDA). Tajuk tidak diubah.'
    : 'Saya pegang silibus Sains Alamtologi P.alt — Bab 1 hingga Bab 7 HISAL.';
}
