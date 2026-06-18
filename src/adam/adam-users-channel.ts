/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Universal Channel
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
 * Universal Scholar substantive channel — prose default (MALAY_LAYOUT).
 * Structured technical display is a narrow opt-in via isAdamTechnicalKonvensionalDisplayTurn.
 */

import {
  isAdamArithmeticWordProblemTurn,
  isAdamCivicsGovernmentTurn,
  isAdamHistoricalBiographyTurn,
  isAdamHistorySynthesisTurn,
  isAdamLifeWellbeingTurn,
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamRelationalPersonalTurn,
  isAdamScienceNatureSynthesisTurn,
  isAdamSimpleFactualTurn,
  isAdamTeachingDepthTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  isAdamVisualDrawTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';

/** Substantive Universal Scholar turns — prose or structured opt-in. */
export function isAdamUsersChannelTurn(message: string): boolean {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isAdamPracticalAdvisoryTurn(t)) return false;
  if (isAdamVisualDrawTurn(t)) return false;
  if (isAdamArithmeticWordProblemTurn(t)) return false;
  if (isAdamSimpleFactualTurn(t)) return false;
  if (isAdamRelationalPersonalTurn(t)) return false;
  if (isAdamLifeWellbeingTurn(t)) return false;
  if (isAdamTechnicalKonvensionalDisplayTurn(t)) return true;
  if (isAdamTeachingDepthTurn(t)) return true;
  if (isAdamScienceNatureSynthesisTurn(t)) return true;
  if (isAdamHistorySynthesisTurn(t)) return true;
  if (isAdamCivicsGovernmentTurn(t)) return true;
  if (isAdamHistoricalBiographyTurn(t)) return true;
  if (/\bapakah\s+kesan\b/i.test(t)) return true;
  return false;
}

/**
 * Structured technical display only — founder/command never enter this path.
 * Structure repair, mandatory ### injection, and TEKNIKAL+ESEI guards gate on this.
 */
export function isAdamUsersTechnicalChannelActive(
  message: string,
  isFounder: boolean,
): boolean {
  return !isFounder && isAdamTechnicalKonvensionalDisplayTurn(message);
}

/** Turns that stay on short / practical paths — not universal substantive channel. */
export function isAdamUsersChannelExcludedTurn(message: string): boolean {
  return !isAdamUsersChannelTurn(message);
}

export { isAdamTechnicalKonvensionalDisplayTurn };
