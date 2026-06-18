/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Konvensional Surface
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
 *
 * Founder konvensional leak strip — no student-output-guard imports.
 */

import { sanitizeTechnicalPrecisionOutput } from './adam-factual-grounding';
import { repairStaleOfficeHolderOutput } from './adam-current-affairs';
import { stripWebSearchAttributionInline } from './adam-users-output-law';

/** Founder surface hygiene — attribution + stale facts only; never strip MASA/TENAGA voice. */
export function repairFounderKonvensionalSurface(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  let out = stripWebSearchAttributionInline(text.trim());
  out = sanitizeTechnicalPrecisionOutput(out, userMessage, recentUserMessages);
  out = repairStaleOfficeHolderOutput(out, userMessage);
  return out.trim();
}
