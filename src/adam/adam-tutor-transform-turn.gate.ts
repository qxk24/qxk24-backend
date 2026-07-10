/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Transform Turn Gate (F3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 */

import { isAdamLightChatTurn } from './adam-response-generation';
import type { AdamTutorLearningProfile } from './tutor-law/tutor-law.learning-profile.types';

const MIN_TRANSFORM_RESPONSE_CHARS = 200;

export function isTutorAssessmentAnswerTurn(
  profile: AdamTutorLearningProfile,
  _userMessage: string,
): boolean {
  if (profile.placement?.awaitingAnswer) return true;
  if (profile.checkpoint?.active && profile.checkpoint?.awaitingAnswer) return true;
  return false;
}

export function resolveTutorTransformASource(input: {
  userMessage:    string;
  webSearchUsed?: boolean;
  recallLoaded?:  boolean;
}): 'conventional' | 'tutor' {
  void input.userMessage;
  if (input.webSearchUsed && !input.recallLoaded) return 'conventional';
  return 'tutor';
}

export function shouldTutorTransformTurn(input: {
  studentId:     string;
  userMessage:   string;
  finalResponse: string;
  gateContext:   { profile: AdamTutorLearningProfile };
}): boolean {
  if (!input.studentId?.trim()) return false;
  if (isAdamLightChatTurn(input.userMessage)) return false;
  if (isTutorAssessmentAnswerTurn(input.gateContext.profile, input.userMessage)) return false;
  if (!input.gateContext.profile.placementComplete) return false;
  if (input.finalResponse.trim().length < MIN_TRANSFORM_RESPONSE_CHARS) return false;
  return true;
}
