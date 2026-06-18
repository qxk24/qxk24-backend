/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Plan
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
 * Single pre-turn contract — Lane + Mode before prompt, search, repair.
 * v1 scope: Users lane (General / Technical). Student + Founder passthrough.
 */

import type { AdamChannelId } from './adam-channel-router';
import {
  isAdamCivicsGovernmentTurn,
  isAdamCompareTurn,
  isAdamContinuationDepthTurn,
  isAdamHistoricalBiographyTurn,
  isAdamHistorySynthesisTurn,
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamRelationalPersonalTurn,
  isAdamScienceNatureSynthesisTurn,
  isAdamSimpleArithmeticTurn,
  isAdamSimpleFactualTurn,
  isAdamTeachingDepthTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import { isAdamUsersChannelTurn } from './adam-users-channel';
import type { AdamAnswerComposer } from './adam-answer-composer';
import type { AdamUsersDomainFacet } from './adam-users-domain-router';
import type { AdamDisplayChannel } from './turn-gate/adam-turn-gate.types';

export type AdamAnswerLane = 'founder' | 'users' | 'student' | 'niaga';

export type AdamUsersAnswerMode = 'general' | 'technical';

export type AdamUsersIntent =
  | 'light'
  | 'factual'
  | 'relational'
  | 'practical'
  | 'substantive';

export type AdamAnswerPolicy = 'direct' | 'withhold';

export interface AdamAnswerPlan {
  lane: AdamAnswerLane;
  usersMode?: AdamUsersAnswerMode;
  usersIntent?: AdamUsersIntent;
  answerPolicy: AdamAnswerPolicy;
  legacyChannelId: AdamChannelId;
  /** Universal Scholar shape — intent drives ### / table structure. */
  answerShape?: import('./adam-answer-shape').AdamAnswerShape;
  /** Section headers + topic — single contract for prompt + repair + guard. */
  answerComposer?: AdamAnswerComposer;
  /** Users minor route — economics, science, technology, … (one facet per turn). */
  usersDomain?: AdamUsersDomainFacet;
  /** Formal display channel from Turn Gate IQ — prompt + repair read this. */
  displayChannel?: AdamDisplayChannel;
}

/** Substantive Users turns — direct answer with structured technical display. */
export function isAdamUsersSubstantiveTurn(message: string): boolean {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isAdamPracticalAdvisoryTurn(t)) return false;
  if (isAdamRelationalPersonalTurn(t)) return false;
  if (isAdamSimpleFactualTurn(t) || isAdamSimpleArithmeticTurn(t)) return false;
  return isAdamTeachingDepthTurn(t)
    || isAdamScienceNatureSynthesisTurn(t)
    || isAdamHistorySynthesisTurn(t)
    || isAdamHistoricalBiographyTurn(t)
    || isAdamCivicsGovernmentTurn(t)
    || isAdamCompareTurn(t)
    || isAdamContinuationDepthTurn(t)
    || isAdamTechnicalKonvensionalDisplayTurn(t)
    || isAdamUsersChannelTurn(t);
}

export function isUsersTechnicalPlan(plan: AdamAnswerPlan): boolean {
  return plan.lane === 'users' && plan.usersMode === 'technical';
}

export function isUsersDirectAnswerPlan(plan: AdamAnswerPlan): boolean {
  return plan.lane === 'users' && plan.answerPolicy === 'direct';
}

export function formatAdamAnswerPlanLog(plan: AdamAnswerPlan): string {
  const parts = [`lane=${plan.lane}`, `policy=${plan.answerPolicy}`];
  if (plan.usersMode) parts.push(`usersMode=${plan.usersMode}`);
  if (plan.usersIntent) parts.push(`intent=${plan.usersIntent}`);
  if (plan.answerShape) parts.push(`shape=${plan.answerShape.intent}`);
  if (plan.answerComposer) parts.push(`sections=${plan.answerComposer.sections.length}`);
  if (plan.usersDomain) parts.push(`domain=${plan.usersDomain}`);
  if (plan.displayChannel && plan.displayChannel !== 'none') {
    parts.push(`display=${plan.displayChannel}`);
  }
  if (plan.answerShape?.formalDataLayout) parts.push('formalData=true');
  return `[adam:answer-plan] ${parts.join(' ')}`;
}

export { resolveAdamAnswerPlan } from './turn-gate/adam-turn-gate';
