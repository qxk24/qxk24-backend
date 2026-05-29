/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Anthropic Model Router (Haiku + Sonnet)
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
 */

import { ENV } from './environments';
import type { ADAMChatMode } from '../adam/adam.types';
import { shouldEnableWebSearchForMessage } from '../adam/adam-web-search';

export type ModelTier = 'fast' | 'deep';

function useQwen(): boolean {
  return ENV.LLM_PROVIDER === 'qwen';
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

/** Founder / student-history / constitutional cues → Sonnet */
const DEEP_MESSAGE_PATTERNS = [
  /\b(student|students|pelajar|izwahanie|suhaila|aziz|amer)\b/i,
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

  if (hasUploads || DEEP_MODES.includes(mode)) {
    return { model: getDeepModel(), tier: 'deep', reason: 'qwen_founder_deep' };
  }

  if (len >= 800 || shouldEnableWebSearchForMessage(text)) {
    return { model: getDeepModel(), tier: 'deep', reason: 'qwen_founder_substantive' };
  }

  if (len >= ENV.ADAM_DEEP_MESSAGE_MIN_CHARS) {
    return { model: getDeepModel(), tier: 'deep', reason: 'qwen_founder_long' };
  }

  return { model: getFastModel(), tier: 'fast', reason: 'qwen_founder_routine' };
}

export function resolveAdamMaxTokens(tier: ModelTier, isFounder: boolean): number {
  if (useQwen()) {
    if (tier === 'fast') return 1536;
    return isFounder ? 3072 : 2048;
  }
  return isFounder || tier === 'deep' ? 4096 : 2048;
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
 * Haiku (fast) for routine student chat; Sonnet (deep) for Founder,
 * uploads, constitutional modes, group, and substantive questions.
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
