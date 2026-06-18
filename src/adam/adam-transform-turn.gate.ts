/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Unified Transform Turn Gate
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../config/environments';
import { isDirectTechnicalHowToQuestion } from './adam-direct-technical-law';
import { isAdamLightChatTurn, isAdamSubstantiveTurn } from './adam-response-generation';
import {
  USERS_BRIEF_TIER1_MIN_RETAIN_RATIO,
  USERS_SURFACE_MIN_RETAIN_RATIO,
} from './adam-users-output-guard';

export type TransformASource = 'founder' | 'inquiry' | 'conventional' | 'quran';

/** Minimum sanitised reply length — inquiry crystallisation. */
export const MIN_TRANSFORM_EPISODE_CHARS = 280;

/** Lower floor when fresh conventional A arrived via web search. */
export const MIN_TRANSFORM_EPISODE_CHARS_WITH_SEARCH = 120;

/** Dedupe window — same fingerprint skips re-crystallisation. */
export const INQUIRY_TRANSFORM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface TransformTurnGateInput {
  aSource?:           TransformASource;
  userMessage:        string;
  finalResponse:      string;
  rawModelStream?:    string;
  isGuestTrial?:      boolean;
  isFounder?:         boolean;
  webSearchUsed?:     boolean;
  recallLoaded?:      boolean;
}

export function isUnifiedTransformEnabled(): boolean {
  return ENV.ADAM_UNIFIED_TRANSFORM && ENV.ADAM_INQUIRY_TRANSFORM;
}

/** Normalised fingerprint for dedupe — lowercase, collapsed whitespace. */
export function inquiryQuestionFingerprint(message: string): string {
  const normalised = message.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalised).digest('hex').slice(0, 24);
}

/**
 * Episode fingerprint — fresh conventional A (search, recall miss) gets distinct C slot.
 */
export function transformEpisodeFingerprint(
  message: string,
  webSearchUsed: boolean,
  recallLoaded: boolean,
): string {
  const base = inquiryQuestionFingerprint(message);
  if (webSearchUsed && !recallLoaded) return `${base}-conv`;
  return base;
}

/** Whether dedupe should block — allow new C when fresh conventional A arrived. */
export function shouldSkipTransformDedupe(
  hasDuplicate: boolean,
  webSearchUsed: boolean,
  recallLoaded: boolean,
): boolean {
  if (!hasDuplicate) return false;
  return !(webSearchUsed && !recallLoaded);
}

/** Resolve which A channel(s) this turn crystallises (student / inquiry path). */
export function resolveTransformASource(input: {
  userMessage:    string;
  webSearchUsed?: boolean;
  recallLoaded?:  boolean;
}): TransformASource | null {
  const message = input.userMessage.trim();
  if (!message || isAdamLightChatTurn(message)) return null;
  if (isDirectTechnicalHowToQuestion(message)) return null;
  if (!isAdamSubstantiveTurn(message)) return null;

  if (input.webSearchUsed && !input.recallLoaded) {
    return 'conventional';
  }
  return 'inquiry';
}

/** Founder teaching channel — same unified engine, transformAIDIL via TCP. */
export function shouldFounderTransformTurn(input: {
  userMessage:         string;
  skipEpisodicAppend?: boolean;
}): boolean {
  if (input.skipEpisodicAppend) return false;
  const message = input.userMessage.trim();
  if (!message || isAdamLightChatTurn(message)) return false;
  return true;
}

function streamRetainRatio(raw: string, surface: string): number {
  const rawLen = raw.trim().length;
  if (rawLen <= 0) return 1;
  return surface.trim().length / rawLen;
}

function minEpisodeChars(webSearchUsed: boolean): number {
  return webSearchUsed
    ? MIN_TRANSFORM_EPISODE_CHARS_WITH_SEARCH
    : MIN_TRANSFORM_EPISODE_CHARS;
}

/** All substantive A → C (student path) — synthesis quality gates only. */
export function shouldTransformTurn(input: TransformTurnGateInput): boolean {
  if (!isUnifiedTransformEnabled()) return false;
  if (input.isFounder) return false;
  if (input.isGuestTrial === true) return false;

  const aSource = resolveTransformASource({
    userMessage:   input.userMessage,
    webSearchUsed: input.webSearchUsed,
    recallLoaded:  input.recallLoaded,
  });
  if (!aSource) return false;

  const message = input.userMessage.trim();
  const surface = input.finalResponse.trim();
  if (!message || !surface) return false;

  const web = input.webSearchUsed === true;
  if (surface.length < minEpisodeChars(web)) return false;

  const raw = input.rawModelStream?.trim() ?? surface;
  const ratio = streamRetainRatio(raw, surface);
  if (raw.length > 280 && ratio < USERS_SURFACE_MIN_RETAIN_RATIO) return false;
  if (raw.length > 280 && ratio < USERS_BRIEF_TIER1_MIN_RETAIN_RATIO && surface.length < 100) {
    return false;
  }

  return true;
}
