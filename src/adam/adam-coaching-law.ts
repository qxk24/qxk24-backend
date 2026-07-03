/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Coaching Law
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Dedicated Coaching domain — not mixed with ADAM Tutor (school pedagogy).
 */

import type { ADAMChatMode } from './adam.types';
import { ADAM_RELATIONAL_NATURE_LAW } from './adam-character';
import { ADAM_PROSE_DASH_LAW } from './adam-prose-sanitize';
import { ADAM_BAHASA_MELAYU_LAW } from './adam-language-prompts';
import {
  ADAM_UNIVERSAL_SCHOLAR_CHARTER,
  ADAM_USER_UMUM_CADANGAN_TURN,
  ADAM_USER_UMUM_COMPANION_VOICE_HOLD,
} from './adam-universal-scholar';
import {
  ADAM_MEMORY_HONESTY_RULE_STUDENT,
  ADAM_MEMORY_HONESTY_WEB_SEARCH_OVERRIDE,
  webSearchPromptNeedsMemoryOverride,
} from './adam-users-prompts';
import { ACADEMIC_CONTEXT, ACADEMIC_TASK, buildTutorBehaviorModePrompt } from './tutor-law/tutor-law.behavior-mode';

export function isAdamCoachingMode(mode: ADAMChatMode): boolean {
  return mode === 'COACHING';
}

/** School / homework turns belong on ADAM Tutor — redirect, do not teach here. */
export function isAdamCoachingAcademicRedirect(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return ACADEMIC_CONTEXT.test(t) || ACADEMIC_TASK.test(t);
}

export const ADAM_COACHING_ACADEMIC_REDIRECT = `
[COACHING — ACADEMIC REDIRECT]
This turn looks like school homework, exam prep, or curriculum study.
Do NOT coach the academic answer here. In one short paragraph:
- Say this belongs on **ADAM Tutor** (/adam/tutor) for step-by-step teaching.
- Offer to continue only if they reframe as a general life/work decision (not homework).
[/COACHING — ACADEMIC REDIRECT]
`.trim();

export const ADAM_COACHING_IDENTITY = `
You are ADAM Coaching — a direct, warm coach for everyday life, work, career, and practical decisions.
You are NOT the school tutor. You do not enforce zero-answer homework policy.
You answer clearly first, then explain options, trade-offs, and next actions.
Use the member's name when known; never use "P.alt" or founder address.
No Bismillah opener on consumer turns.
`.trim();

export const ADAM_COACHING_UNIVERSAL_VOICE = `
COACHING — UNIVERSAL SCHOLAR SURFACE (mandatory every turn):
- Stress, commitments, boundaries, career — plain warm coach; NOT preacher; NOT framework billboard.
- FORBIDDEN unless user explicitly asks: Alamtologi, MASA, TENAGA, AIR, CAHAYA, RUANG, HISAL, AIDIL, "zat hidup", constitutional principles, "dalam Alamtologi".
- FORBIDDEN unless user mentions Quran/Islam/faith/ayat: Arabic quotations, Surah citations, hadith, spiritual sermon.
- FORBIDDEN: Bismillah opener · closing "Mahu saya jelaskan lebih lanjut?" — end with **Cadangan:** 2–3 langkah praktikal when helpful.
- Use everyday language: priorities, energy, boundaries, one small next action.
`.trim();

export interface AdamCoachingPromptParams {
  participantName?: string;
  userMessage?:     string;
  preferMalay?:     boolean;
}

export function buildAdamCoachingSystemPrompt(params: AdamCoachingPromptParams): string {
  const parts: string[] = [
    ADAM_RELATIONAL_NATURE_LAW,
    ADAM_UNIVERSAL_SCHOLAR_CHARTER,
    ADAM_COACHING_IDENTITY,
    ADAM_COACHING_UNIVERSAL_VOICE,
    ADAM_USER_UMUM_COMPANION_VOICE_HOLD,
    ADAM_USER_UMUM_CADANGAN_TURN,
    buildTutorBehaviorModePrompt('coaching'),
    ADAM_PROSE_DASH_LAW,
    ADAM_MEMORY_HONESTY_RULE_STUDENT,
  ];

  if (params.preferMalay) {
    parts.push(ADAM_BAHASA_MELAYU_LAW);
  }

  if (webSearchPromptNeedsMemoryOverride(params.userMessage ?? '')) {
    parts.push(ADAM_MEMORY_HONESTY_WEB_SEARCH_OVERRIDE);
  }

  const name = params.participantName?.trim();
  if (name) {
    parts.push(`Member name for this session: ${name}.`);
  }

  if (params.userMessage?.trim() && isAdamCoachingAcademicRedirect(params.userMessage)) {
    parts.push(ADAM_COACHING_ACADEMIC_REDIRECT);
  }

  return parts.filter(Boolean).join('\n\n');
}
