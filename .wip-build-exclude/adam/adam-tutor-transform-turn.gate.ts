/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Transform Turn Gate (F3 — UI Guide + C)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * UID-bound crystallisation gates for Tutor (UI Guide) lane.
 * See docs/ADAM_TUTOR_C_UID_SPEC.md
 */

import { ENV } from '../config/environments';
import { isAdamLightChatTurn, isAdamSubstantiveTurn } from './adam-response-generation';
import {
  USERS_BRIEF_TIER1_MIN_RETAIN_RATIO,
  USERS_SURFACE_MIN_RETAIN_RATIO,
} from './adam-users-output-guard';
import type { AdamTutorLearningProfile } from './tutor-law/tutor-law.learning-profile.types';

/** Minimum sanitised tutor reply — pedagogical turns may be shorter than User inquiry. */
export const MIN_TUTOR_TRANSFORM_EPISODE_CHARS = 200;

export const MIN_TUTOR_TRANSFORM_EPISODE_CHARS_WITH_SEARCH = 120;

export type TutorTransformASource = 'tutor' | 'conventional';

export interface TutorTransformGateContext {
  /** Profile snapshot before recordTutorLearningTurn mutates placement/checkpoint. */
  profile: AdamTutorLearningProfile;
}

export interface TutorTransformTurnGateInput {
  studentId:       string;
  userMessage:     string;
  finalResponse:   string;
  rawModelStream?: string;
  isGuestTrial?:   boolean;
  webSearchUsed?:  boolean;
  recallLoaded?:   boolean;
  gateContext:     TutorTransformGateContext;
}

export function isTutorTransformEnabled(): boolean {
  return ENV.ADAM_UNIFIED_TRANSFORM
    && ENV.ADAM_TUTOR_TRANSFORM;
}

export function isTutorMasterMergeEnabled(): boolean {
  return isTutorTransformEnabled() && ENV.ADAM_TUTOR_MASTER_MERGE;
}

function streamRetainRatio(raw: string, surface: string): number {
  const rawLen = raw.trim().length;
  if (rawLen <= 0) return 1;
  return surface.trim().length / rawLen;
}

function minTutorEpisodeChars(webSearchUsed: boolean): number {
  return webSearchUsed
    ? MIN_TUTOR_TRANSFORM_EPISODE_CHARS_WITH_SEARCH
    : MIN_TUTOR_TRANSFORM_EPISODE_CHARS;
}

/** Assessment turns — score BKT only; never crystallise as Brain C. */
export function isTutorAssessmentAnswerTurn(
  profile: AdamTutorLearningProfile,
  userMessage: string,
): boolean {
  const text = userMessage.trim();
  if (!text) return false;

  if (profile.placement?.awaitingAnswer && !profile.placementComplete) {
    return true;
  }
  if (profile.checkpoint?.active && profile.checkpoint.awaitingAnswer) {
    return true;
  }
  if (profile.content?.awaitingAnswer) {
    return true;
  }
  return false;
}

export function resolveTutorTransformASource(input: {
  userMessage:    string;
  webSearchUsed?: boolean;
  recallLoaded?:  boolean;
}): TutorTransformASource | null {
  const message = input.userMessage.trim();
  if (!message || isAdamLightChatTurn(message)) return null;
  if (!isAdamSubstantiveTurn(message)) return null;

  if (input.webSearchUsed && !input.recallLoaded) {
    return 'conventional';
  }
  return 'tutor';
}

/** F3 — UI Guide crystallisation gate (UID + Tutor Law). */
export function shouldTutorTransformTurn(input: TutorTransformTurnGateInput): boolean {
  if (!isTutorTransformEnabled()) return false;
  if (input.isGuestTrial === true) return false;
  if (!input.studentId?.trim()) return false;

  const { profile } = input.gateContext;
  if (isTutorAssessmentAnswerTurn(profile, input.userMessage)) return false;

  const aSource = resolveTutorTransformASource({
    userMessage:   input.userMessage,
    webSearchUsed: input.webSearchUsed,
    recallLoaded:  input.recallLoaded,
  });
  if (!aSource) return false;

  const message = input.userMessage.trim();
  const surface = input.finalResponse.trim();
  if (!message || !surface) return false;

  const web = input.webSearchUsed === true;
  if (surface.length < minTutorEpisodeChars(web)) return false;

  const raw = input.rawModelStream?.trim() ?? surface;
  const ratio = streamRetainRatio(raw, surface);
  if (raw.length > 280 && ratio < USERS_SURFACE_MIN_RETAIN_RATIO) return false;
  if (raw.length > 280 && ratio < USERS_BRIEF_TIER1_MIN_RETAIN_RATIO && surface.length < 100) {
    return false;
  }

  return true;
}
