/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate
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
 * Mandatory pre-turn cognition — IQ (analytic) + EQ (relational) → fuse → gate.
 * Single entry before Brain River branch opens domain channels.
 */

import { resolveAdamTurnEQ } from './adam-turn-gate.eq';
import { fuseAdamTurnGate } from './adam-turn-gate.fuse';
import { resolveAdamTurnIQ } from './adam-turn-gate.iq';
import { runAdamSensingEngine } from './sensing-engine';
import type { AdamAnswerPlan } from '../adam-answer-plan';
import type { AdamTurnGateDecision, AdamTurnGateInput } from './adam-turn-gate.types';

/** Entry tunggal — dipanggil dari beginAdamBrainRiver(). */
export function resolveAdamTurnGate(input: AdamTurnGateInput): AdamTurnGateDecision {
  const sensing = runAdamSensingEngine(input);
  const eq = resolveAdamTurnEQ(input, sensing);
  const rawIq = resolveAdamTurnIQ(input, eq, sensing);
  return fuseAdamTurnGate(rawIq, eq, input, sensing);
}

/** Thin wrapper — downstream modules keep importing from adam-answer-plan. */
export function resolveAdamAnswerPlan(input: AdamTurnGateInput): AdamAnswerPlan {
  return resolveAdamTurnGate(input).answerPlan;
}

export type {
  AdamAddressPolicy,
  AdamAffectiveTone,
  AdamDisplayChannel,
  AdamThreadPosture,
  AdamTurnEQ,
  AdamTurnGateDecision,
  AdamTurnGateFlags,
  AdamTurnGateInput,
  AdamTurnIQ,
} from './adam-turn-gate.types';

export { formatAdamTurnGateLog } from './adam-turn-gate.log';
