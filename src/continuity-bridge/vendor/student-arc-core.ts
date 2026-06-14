/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Student Relationship Arc — Pure Core (C1)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Vendor copy — canonical source: qxk24-adam/continuity-bridge/src/student-arc-core.ts
 */

export const ARC_MIN_TURNS = 3;
export const ARC_MAX_CHARS = 600;
export const ARC_MIN_CHARS = 30;
export const ARC_IDLE_MINUTES = 30;

export const RELATIONSHIP_ARC_BRIDGE_LABEL = 'Relationship Arc (growth narrative):';

export function extractOpenThreadFromArc(arc: string): string {
  const match = arc.match(
    /open question[:\s]+(.{20,120})|unresolved[:\s]+(.{20,120})|next session[:\s]+(.{20,120})/i,
  );
  if (!match) return '';
  return (match[1] ?? match[2] ?? match[3] ?? '').trim();
}

export function sessionTooThinForArc(turnCount: number): boolean {
  return turnCount < ARC_MIN_TURNS;
}

export function arcTooShortForSync(arc: string): boolean {
  return arc.length < ARC_MIN_CHARS;
}
