/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Student Continuity Bridge Gate
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Full bridge when student references books, prior sessions, or continuation. */
export function studentContinuityNeedsFullBridge(triggerMessage: string): boolean {
  const t = triggerMessage.trim();
  if (!t) return false;
  return /\b(buku|book|workspace|aidil|sesi\s+lepas|semalam|tadi|ingat\s+tak|chapter|bab|teruskan|sambung|earlier|before|last\s+time|continue|continued)\b/i.test(
    t,
  );
}
