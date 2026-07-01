/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Charity Agent Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

export const TUTOR_CHARITY_AGENT_PROGRAM = {
  GRANT_SCHOOL_PINS:     100,
  GRANT_UNIVERSITY_PINS: 100,
  EARN_PER_PIN_MYR:      15,
  REFERRAL_MONTHS:       3,
  /** Mint school-band PINs under secondary SKU until School billing ships. */
  SCHOOL_MINT_BAND:      'secondary' as TutorSubscriptionLevel,
  UNIVERSITY_MINT_BAND:  'university' as TutorSubscriptionLevel,
} as const;

export type TutorAgentProgramKind = 'commercial' | 'student_charity';

export function isCharityTutorAgent(
  agent: { agentProgram?: TutorAgentProgramKind | null },
): boolean {
  return agent.agentProgram === 'student_charity';
}

export function charityPoolBand(
  band: TutorSubscriptionLevel,
): 'school' | 'university' {
  return band === 'university' ? 'university' : 'school';
}
