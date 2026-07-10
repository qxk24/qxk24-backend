/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Model Router (Qwen / DashScope)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * ⚠️  NEVER CHANGE THE SETTING — Sacred model routing & output token limits.
 * Founder TEACHING must stay on deep tier. ADAM_QWEN_FAST_MAX_TOKENS ≥ 4096.
 * See .cursor/rules/adam-memory-sacred-settings.mdc
 */

import { ENV } from './environments';
import type { ADAMChatMode } from '../adam/adam.types';
import { shouldEnableWebSearchForMessage } from '../adam/adam-web-search';
export type ModelTier = 'fast' | 'deep';

export interface ModelRouterParticipant {
  userId:      string;
  userName:    string;
  role:        'founder' | 'student' | 'guru';
  sessionType: 'founder' | 'student' | 'group' | 'guru' | 'tutor' | 'coaching' | 'tools' | 'niaga';
}

const DEEP_MODES: ADAMChatMode[] = [
  'TEACHING',
  'TUTOR',
  'CONSTITUTIONAL',
  'AUDIT',
  'JOURNAL_GEN',
];

/** Substantive-topic cues → deep tier (qwen-plus / deep model) */
const DEEP_MESSAGE_PATTERNS = [
  /\b(student|students|pelajar|izwahanie|suhaila|aziz|amer|iskandar|haqimi)\b/i,
  /\b(communicat|bercakap|spoken|speak|said|tanya|asked)\b/i,
  /\b(constitution|perlembagaan|makmur|islah|waqf|alamtologi)\b/i,
  /\b(quran|qur'an|hadith|founder|pengasas)\b/i,
  /\b(teach|teaching|ajar|mengajar|brain|otak)\b/i,
];

export function getDeepModel(): string {
  return 'deep-ul';
}

export function getFastModel(): string {
  return 'fast-ul';
}

export function getVisionModel(): string {
  return 'vision-ul';
}

export interface ResolvedAdamModel {
  model:  string;
  tier:   ModelTier;
  reason: string;
}

function resolveFounderModel(
  mode: ADAMChatMode,
  message: string,
  hasUploads: boolean,
): ResolvedAdamModel {
  const text = message.trim();
  const len = text.length;

  if (hasUploads || mode === 'JOURNAL_GEN' || mode === 'TEACHING' || mode === 'TUTOR') {
    // NEVER CHANGE THE SETTING — founder teaching requires deep model (voice quality)
    return { model: getDeepModel(), tier: 'deep', reason: 'founder_deep' };
  }

  if (mode === 'CONSTITUTIONAL' || mode === 'AUDIT') {
    return { model: getDeepModel(), tier: 'deep', reason: 'founder_deep' };
  }

  if (len >= 800 || shouldEnableWebSearchForMessage(text)) {
    return { model: getDeepModel(), tier: 'deep', reason: 'founder_substantive' };
  }

  if (len >= ENV.ADAM_DEEP_MESSAGE_MIN_CHARS) {
    return { model: getDeepModel(), tier: 'deep', reason: 'founder_long' };
  }

  if (DEEP_MESSAGE_PATTERNS.some((re) => re.test(text))) {
    return { model: getDeepModel(), tier: 'deep', reason: 'founder_substantive' };
  }

  return { model: getFastModel(), tier: 'fast', reason: 'founder_routine' };
}

function resolveStudentModel(
  mode: ADAMChatMode,
  message: string,
  hasUploads: boolean,
): ResolvedAdamModel {
  // Same router as founder — one ADAM, same speed/depth tradeoffs.
  return resolveFounderModel(mode, message, hasUploads);
}

export function resolveAdamMaxTokens(
  tier: ModelTier,
  _isFounder: boolean,
  mode?: ADAMChatMode,
): number {
  if (mode === 'JOURNAL_GEN') {
    return ENV.ADAM_JOURNAL_MAX_TOKENS;
  }
  // NEVER CHANGE THE SETTING — fast tier floor 4096; lower values truncate ADAM mid-thought
  if (tier === 'fast') return ENV.ADAM_QWEN_FAST_MAX_TOKENS;
  // Deep — same cap for founder and student (knowledge has no rank)
  return ENV.ADAM_FOUNDER_DEEP_MAX_TOKENS;
}

export function resolveQwenEnableThinking(
  tier: ModelTier,
  mode: ADAMChatMode,
  options?: {
    founderTeachingAbsorption?: boolean;
    isStudent?: boolean;
    lightChat?: boolean;
    /** α simple factual — stream L1 tokens immediately (no silent reasoning phase). */
    simpleFactualTurn?: boolean;
    /** Search-first factual — prefetch already waited; stream answer tokens immediately. */
    searchFirstSynthesis?: boolean;
  },
): boolean {
  // UL mode — no silent reasoning phase (100% deterministic synthesis)
  void tier;
  void mode;
  void options;
  return false;
}

/** qwen-turbo (fast) / qwen-plus (deep) — production and lab */
export function resolveAdamChatModel(params: {
  participant: ModelRouterParticipant;
  mode:        ADAMChatMode;
  message:     string;
  hasUploads:  boolean;
}): ResolvedAdamModel {
  const { participant, mode, message, hasUploads } = params;

  if (participant.role === 'founder') {
    return resolveFounderModel(mode, message, hasUploads);
  }

  if (
    participant.sessionType === 'group'
    || participant.sessionType === 'guru'
    || participant.sessionType === 'tutor'
  ) {
    const reason =
      participant.sessionType === 'guru'
        ? 'guru_kelas'
        : participant.sessionType === 'tutor'
          ? 'adam_tutor'
          : 'group_session';
    return {
      model:  getDeepModel(),
      tier:   'deep',
      reason,
    };
  }

  // Guest trial — same model router as registered students (unified ADAM voice)
  return resolveStudentModel(mode, message, hasUploads);
}

/** Brain transformation and constitutional writes — always deep */
export function resolveBrainDeepModel(): string {
  return getDeepModel();
}

/** Student alignment JSON check — fast tier */
export function resolveBrainFastModel(): string {
  return getFastModel();
}
