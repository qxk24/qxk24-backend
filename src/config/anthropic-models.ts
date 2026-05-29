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

export type ModelTier = 'fast' | 'deep';

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

export interface ResolvedAdamModel {
  model:  string;
  tier:   ModelTier;
  reason: string;
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
    return {
      model:  getAnthropicModelDeep(),
      tier:   'deep',
      reason: 'founder_session',
    };
  }

  if (hasUploads) {
    return {
      model:  getAnthropicModelDeep(),
      tier:   'deep',
      reason: 'teaching_upload',
    };
  }

  if (participant.sessionType === 'group') {
    return {
      model:  getAnthropicModelDeep(),
      tier:   'deep',
      reason: 'group_session',
    };
  }

  if (DEEP_MODES.includes(mode)) {
    return {
      model:  getAnthropicModelDeep(),
      tier:   'deep',
      reason: `mode_${mode.toLowerCase()}`,
    };
  }

  if (len >= ENV.ADAM_DEEP_MESSAGE_MIN_CHARS) {
    return {
      model:  getAnthropicModelDeep(),
      tier:   'deep',
      reason: 'long_message',
    };
  }

  if (DEEP_MESSAGE_PATTERNS.some((re) => re.test(text))) {
    return {
      model:  getAnthropicModelDeep(),
      tier:   'deep',
      reason: 'substantive_topic',
    };
  }

  return {
    model:  getAnthropicModelFast(),
    tier:   'fast',
    reason: 'routine_student_chat',
  };
}

/** Brain transformation and constitutional writes — always deep */
export function resolveBrainDeepModel(): string {
  return getAnthropicModelDeep();
}

/** Student alignment JSON check — fast tier */
export function resolveBrainFastModel(): string {
  return getAnthropicModelFast();
}
