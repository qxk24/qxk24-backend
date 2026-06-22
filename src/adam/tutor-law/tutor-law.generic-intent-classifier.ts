/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Fallback Intent Classifier
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Covers Sejarah, Geografi, Ekonomi, Sastera, Komsas, Sivik, Seni, and
 * any domain without a dedicated classifier. Argument-quality pedagogy.
 */

export type {
  GenericClassifierInput,
  GenericClassifierOutput,
  GenericIntentResult,
  GenericSessionState,
  GenericTurnContext,
  GenericTurnHandler,
} from './tutor-law.generic-intent.types';

export {
  GenericIntent,
  GenericDomain,
} from './tutor-law.generic-intent.types';

export { classifyGenericIntent } from './tutor-law.generic-intent-classifier.core';
export { detectGenericDomain, isTutorGenericHumanitiesDomainMessage } from './tutor-law.generic-intent-signals';

import type { AdamTutorProfile } from './tutor-law.types';
import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { classifyGenericIntent } from './tutor-law.generic-intent-classifier.core';
import {
  createInitialSession,
  detectDomain,
  SubjectDomain,
} from './tutor-law.router';
import {
  applyGenericSessionToOutput,
  applyGenericThreadIntentLock,
  buildGenericIntentResult,
  deriveGenericSessionState,
  genericIntentSkipsMathPedagogy,
  genericIntentSkipsZeroAnswer,
  mergeGenericSessionState,
  resolveGenericTurnHandler,
} from './tutor-law.generic-mode';
import type {
  GenericClassifierInput,
  GenericClassifierOutput,
  GenericDomain,
  GenericIntentResult,
  GenericSessionState,
  GenericTurnContext,
} from './tutor-law.generic-intent.types';

const DRAFT_MIN_WORDS = 30;

function estimateWordCount(raw: string): number {
  return raw.trim().split(/\s+/).filter(Boolean).length;
}

function detectGenericDraftContent(raw: string): boolean {
  const wordCount = estimateWordCount(raw);
  if (wordCount < DRAFT_MIN_WORDS) return false;
  const sentenceEnds = (raw.match(/[.!?]/g) ?? []).length;
  return sentenceEnds >= 2 || wordCount >= 80;
}

export function buildGenericClassifierInput(input: {
  userMessage:         string;
  sessionState?: {
    genericPriorDomain?: GenericDomain | null;
    stuckCount?:         number;
  };
  profile?: GenericClassifierInput['profile'];
}): GenericClassifierInput {
  const rawText = input.userMessage ?? '';
  const normText = normalizeMathClassifierText(rawText);
  return {
    rawText,
    normText,
    hasDraftContent: detectGenericDraftContent(rawText),
    stuckCount:      input.sessionState?.stuckCount ?? 0,
    priorDomain:     input.sessionState?.genericPriorDomain ?? null,
    profile:         input.profile,
  };
}

export function classifyTutorGenericIntent(
  userMessage: string,
  sessionState?: {
    genericPriorDomain?: GenericDomain | null;
    stuckCount?:         number;
  },
): ReturnType<typeof classifyGenericIntent> {
  return classifyGenericIntent(buildGenericClassifierInput({
    userMessage,
    sessionState,
  }));
}

/** True when router would route this turn to the generic fallback domain. */
export function isTutorGenericDomainMessage(
  message: string,
  recentUserMessages: string[] = [],
): boolean {
  const domain = detectDomain({
    userMessage: message,
    recentUserMessages,
    session: createInitialSession('domain-probe', 'domain-probe'),
  });
  return domain === SubjectDomain.GENERIC;
}

export function buildTutorGenericTurnContext(input: {
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  profile?:                 AdamTutorProfile;
  sessionState?:            Partial<GenericSessionState>;
  stuckCount?:              number;
}): GenericTurnContext {
  return {
    userMessage:             input.userMessage ?? '',
    recentUserMessages:      input.recentUserMessages ?? [],
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
    sessionState:            input.sessionState,
    stuckCount:              input.stuckCount,
  };
}

/** Full Section 10 result — handler + session state for prompt laws. */
export function classifyTutorGenericIntentFull(
  ctx: GenericTurnContext,
): GenericIntentResult | null {
  if (!isTutorGenericDomainMessage(ctx.userMessage, ctx.recentUserMessages)) {
    return null;
  }

  const derived = deriveGenericSessionState(ctx);
  const merged = mergeGenericSessionState(ctx.sessionState, derived);
  const sessionState: GenericSessionState = {
    ...merged,
    stuckCount: Math.max(merged.stuckCount, ctx.stuckCount ?? 0),
  };

  const classified = classifyGenericIntent(buildGenericClassifierInput({
    userMessage: ctx.userMessage,
    profile:     ctx.profile,
    sessionState: {
      genericPriorDomain: sessionState.lockedDomain,
      stuckCount:         sessionState.stuckCount,
    },
  }));

  const lockedOutput = applyGenericThreadIntentLock(classified, sessionState);
  const handler = resolveGenericTurnHandler(lockedOutput, sessionState);
  const { output, reviewAnchorSkipped } = applyGenericSessionToOutput(
    lockedOutput,
    sessionState,
    handler,
  );

  return buildGenericIntentResult(output, sessionState, handler, reviewAnchorSkipped);
}

/** Classifier output only — for prompt laws and guards. */
export function classifyTutorGenericIntentOutput(
  ctx: GenericTurnContext,
): GenericClassifierOutput | null {
  return classifyTutorGenericIntentFull(ctx)?.output ?? null;
}

export { genericIntentSkipsZeroAnswer, genericIntentSkipsMathPedagogy };
