/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Prose Sanitize
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-05
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Em/en dash clause bridges → comma-led Malay prose (P.alt voice law). */
export function sanitizeMalayJournalDashBridges(text: string): string {
  if (!text) return '';

  let out = text.replace(/\s*[—–]\s+/g, ', ');
  out = out.replace(/,\s*,+/g, ', ');
  out = out.replace(/;\s*,/g, '; ');
  out = out.replace(/\(\s*,/g, '(');
  return out.trim();
}
