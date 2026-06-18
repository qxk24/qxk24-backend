/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sensing — Situation Signal (S2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

import {
  isAdamContinuationDepthTurn,
  isAdamLightChatTurn,
  isAdamLifeWellbeingTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamRelationalPersonalTurn,
} from '../../adam-response-generation';
import { isAdamProseCraftTurn } from '../../adam-prose-craft';
import { isAdamCurrentAffairsTurn } from '../../adam-web-search';
import {
  resolveUserUmumCadanganTurn,
  userUmumPerlaksanaanTurnActive,
} from '../../adam-universal-scholar';
import { isAdamEntityCorrectionTurn } from './emotional-signal';
import type { AdamSituationPosture } from './adam-sensing.types';

export interface SituationSignalInput {
  message: string;
  recentUserMessages?: string[];
  recentAssistantMessages?: string[];
}

/** SituationSignalReader — situational posture for EQ overlay. */
export function readSituationSignal(input: SituationSignalInput | string): AdamSituationPosture {
  const message = typeof input === 'string' ? input : input.message;
  const recentUser = typeof input === 'string' ? [] : (input.recentUserMessages ?? []);
  const recentAssistant = typeof input === 'string' ? [] : (input.recentAssistantMessages ?? []);
  const t = message.trim();

  if (!t || isAdamLightChatTurn(t)) return 'light-social';
  if (isAdamEntityCorrectionTurn(t)) return 'entity-correction';
  if (userUmumPerlaksanaanTurnActive(t, recentAssistant, recentUser)) {
    return 'companion-perlaksanaan';
  }
  if (resolveUserUmumCadanganTurn(t, recentAssistant, recentUser)) {
    return 'companion-cadangan';
  }
  if (isAdamCurrentAffairsTurn(t)) return 'current-affairs';
  if (isAdamProseCraftTurn(t)) return 'relational';
  if (isAdamRelationalPersonalTurn(t)) return 'relational';
  if (isAdamPracticalAdvisoryTurn(t)) return 'practical-advisory';
  if (isAdamLifeWellbeingTurn(t)) return 'wellbeing';
  if (isAdamContinuationDepthTurn(t)) return 'continuation';
  if (/\b(?:terangkan|jelaskan|huraikan)\s+lagi\b/i.test(t)) return 'depth-request';
  return 'substantive';
}
