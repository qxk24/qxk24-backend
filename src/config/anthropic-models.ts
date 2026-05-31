/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Model Router (Claude production · Qwen lab)
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

function useQwen(): boolean {
  return ENV.QXK24_STACK === 'lab' || ENV.LLM_PROVIDER === 'qwen';
}

export interface ModelRouterParticipant {
  userId:      string;
  userName:    string;
  role:        'founder' | 'student';
  sessionType: 'founder' | 'student' | 'group';
}

const DEEP_MODES: ADAMChatMode[] = [
  'TEACHING',
  'CONSTITUTIONAL',
  'AUDIT',
  'JOURNAL_GEN',
];

/** Substantive-topic cues → deep tier (Qwen plus on lab, Claude Sonnet on production) */
const DEEP_MESSAGE_PATTERNS = [
  /\b(student|students|pelajar|izwahanie|suhaila|aziz|amer|iskandar|haqimi)\b/i,
  /\b(communicat|bercakap|spoken|speak|said|tanya|asked)\b/i,
  /\b(constitution|perlembagaan|makmur|islah|waqf|alamtologi)\b/i,
  /\b(quran|qur'an|hadith|founder|pengasas)\b/i,
  /\b(teach|teaching|ajar|mengajar|brain|otak)\b/i,
];

export function getAnthropicModelDeep(): string {
  return ENV.ANTHROPIC_MODEL_DEEP;
}

export function getAnthropicModelFast(): string {
  return ENV.ANTHROPIC_MODEL_FAST;
}

/** Deep tier — Sonnet (production) or Qwen deep (lab) */
export function getDeepModel(): string {
  return useQwen() ? ENV.QWEN_MODEL_DEEP : getAnthropicModelDeep();
}

/** Fast tier — Haiku (production) or Qwen flash (lab) */
export function getFastModel(): string {
  return useQwen() ? ENV.QWEN_MODEL_FAST : getAnthropicModelFast();
}

/** Vision uploads — Haiku (production) or Qwen-VL (lab) */
export function getVisionModel(): string {
  return useQwen() ? ENV.QWEN_MODEL_VISION : getAnthropicModelFast();
}

export interface ResolvedAdamModel {
  model:  string;
  tier:   ModelTier;
  reason: string;
}

/** Qwen lab — routine founder chat uses turbo; plus reserved for deep turns. */
function resolveQwenFounderModel(
  mode: ADAMChatMode,
  message: string,
  hasUploads: boolean,
): ResolvedAdamModel {
  const text = message.trim();
  const len = text.length;

  if (hasUploads || mode === 'JOURNAL_GEN' || mode === 'TEACHING') {
    // NEVER CHANGE THE SETTING — founder teaching requires deep model (voice quality)
    return { model: getDeepModel(), tier: 'deep', reason: 'qwen_founder_deep' };
  }

  if (mode === 'CONSTITUTIONAL' || mode === 'AUDIT') {
    return { model: getDeepModel(), tier: 'deep', reason: 'qwen_founder_deep' };
  }

  if (len >= 800 || shouldEnableWebSearchForMessage(text)) {
    return { model: getDeepModel(), tier: 'deep', reason: 'qwen_founder_substantive' };
  }

  if (len >= ENV.ADAM_DEEP_MESSAGE_MIN_CHARS) {
    return { model: getDeepModel(), tier: 'deep', reason: 'qwen_founder_long' };
  }

  if (DEEP_MESSAGE_PATTERNS.some((re) => re.test(text))) {
    return { model: getDeepModel(), tier: 'deep', reason: 'qwen_founder_substantive' };
  }

  return { model: getFastModel(), tier: 'fast', reason: 'qwen_founder_routine' };
}

export function resolveAdamMaxTokens(
  tier: ModelTier,
  isFounder: boolean,
  mode?: ADAMChatMode,
): number {
  if (mode === 'JOURNAL_GEN') {
    return ENV.ADAM_JOURNAL_MAX_TOKENS;
  }
  if (useQwen()) {
    // NEVER CHANGE THE SETTING — fast tier floor 4096; lower values truncate ADAM mid-thought
    if (tier === 'fast') return ENV.ADAM_QWEN_FAST_MAX_TOKENS;
    return isFounder ? ENV.ADAM_FOUNDER_DEEP_MAX_TOKENS : ENV.ADAM_STUDENT_DEEP_MAX_TOKENS;
  }
  if (isFounder || tier === 'deep') {
    return Math.max(4096, ENV.ADAM_FOUNDER_DEEP_MAX_TOKENS);
  }
  return Math.min(4096, ENV.ADAM_STUDENT_DEEP_MAX_TOKENS);
}

export function resolveQwenEnableThinking(
  tier: ModelTier,
  mode: ADAMChatMode,
): boolean {
  if (!ENV.QWEN_ENABLE_THINKING) return false;
  if (tier === 'fast') return false;
  return DEEP_MODES.includes(mode);
}

/**
 * Production: Haiku (fast) / Sonnet (deep).
 * Lab: qwen-turbo (fast) / qwen-plus or qwen3.6-plus (deep) — never Claude.
 */
export function resolveAdamChatModel(params: {
  participant: ModelRouterParticipant;
  mode:        ADAMChatMode;
  message:     string;
  hasUploads:  boolean;
}): ResolvedAdamModel {
  const { participant, mode, message, hasUploads } = params;
  const text = message.trim();
  const len = text.length;

  if (participant.role === 'founder') {
    if (useQwen()) {
      return resolveQwenFounderModel(mode, message, hasUploads);
    }
    return {
      model:  getDeepModel(),
      tier:   'deep',
      reason: 'founder_session',
    };
  }

  if (hasUploads) {
    return {
      model:  getDeepModel(),
      tier:   'deep',
      reason: 'teaching_upload',
    };
  }

  if (participant.sessionType === 'group') {
    return {
      model:  getDeepModel(),
      tier:   'deep',
      reason: 'group_session',
    };
  }

  if (DEEP_MODES.includes(mode)) {
    return {
      model:  getDeepModel(),
      tier:   'deep',
      reason: `mode_${mode.toLowerCase()}`,
    };
  }

  if (len >= ENV.ADAM_DEEP_MESSAGE_MIN_CHARS) {
    return {
      model:  getDeepModel(),
      tier:   'deep',
      reason: 'long_message',
    };
  }

  /** Lab students — qwen-turbo for routine questions */
  if (ENV.QXK24_STACK === 'lab' && mode === 'QUESTIONING') {
    return {
      model:  getFastModel(),
      tier:   'fast',
      reason: 'lab_student_routine',
    };
  }

  if (DEEP_MESSAGE_PATTERNS.some((re) => re.test(text))) {
    return {
      model:  getDeepModel(),
      tier:   'deep',
      reason: 'substantive_topic',
    };
  }

  return {
    model:  getFastModel(),
    tier:   'fast',
    reason: 'routine_student_chat',
  };
}

/** Brain transformation and constitutional writes — always deep */
export function resolveBrainDeepModel(): string {
  return getDeepModel();
}

/** Student alignment JSON check — fast tier */
export function resolveBrainFastModel(): string {
  return getFastModel();
}
