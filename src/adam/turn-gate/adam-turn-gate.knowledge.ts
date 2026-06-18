/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate Knowledge Surface
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Knowledge mode resolved once at fuse — downstream must not re-open faith/Alamtologi.
 */

import type { AdamKnowledgeMode } from '../adam-knowledge-mode';
import { isAdamNiagaMode } from '../adam-niaga-law';
import { isAdamTutorMode } from '../adam-tutor-law';
import type { AdamTurnEQ, AdamTurnGateInput, AdamTurnIQ } from './adam-turn-gate.types';
import type { AdamSensingBundle } from './sensing-engine/adam-sensing.types';

/** Fuse-time knowledge surface — IQ/EQ only; no message re-parse. */
export function resolveGateKnowledgeMode(
  input: AdamTurnGateInput,
  iq: AdamTurnIQ,
  eq: AdamTurnEQ,
  sensing: AdamSensingBundle,
  faithPermitted: boolean,
): AdamKnowledgeMode {
  if (!sensing.message) return 'konvensional';

  if (input.teachingFlags.founderTeachingAbsorption || input.teachingFlags.founderTeachingInquiry) {
    return 'alamtologi';
  }
  if (input.teachingFlags.founderTeachingSynthesis) {
    return 'sintesis';
  }

  if (input.isFounder || isAdamTutorMode(input.mode) || isAdamNiagaMode(input.mode)) {
    return 'konvensional';
  }

  if (faithPermitted) return 'konstitusi';

  if (eq.lane === 'users' && iq.usersMode === 'technical' && iq.domainFacet !== 'general') {
    return 'konvensional';
  }

  if (eq.affectiveTone === 'light') return 'konvensional';

  return 'konvensional';
}
