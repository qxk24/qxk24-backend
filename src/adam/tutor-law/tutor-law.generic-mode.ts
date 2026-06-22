/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Fallback Mode
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
 * Section 10 usage contract — G_FACT + significance, G_ANALYSIS argument-quality only.
 */

import { REVIEW_ANCHOR } from './tutor-law.generic-intent.probes';
import {
  SIGNIFICANCE_BY_DOMAIN,
} from './tutor-law.generic-intent.probes';
import type { GenericClassifierOutput } from './tutor-law.generic-intent.types';
import {
  GenericDomain,
  GenericIntent,
  type GenericIntentResult,
  type GenericSessionState,
  type GenericTurnContext,
  type GenericTurnHandler,
} from './tutor-law.generic-intent.types';

const REVIEW_ANCHOR_MARKERS = [
  /tidak puas hati/i,
  /paling tidak pasti/i,
  /weakest/i,
  /least happy with/i,
  /bahagian mana yang kamu/i,
];

const SIGNIFICANCE_MARKERS = [
  /MENGAPA peristiwa/i,
  /mengapa perkara ini penting/i,
  /why did it happen/i,
  /why does this matter/i,
  /kesan perkara ini/i,
  /how does this affect/i,
];

export function defaultGenericSessionState(): GenericSessionState {
  return {
    lockedDomain:           null,
    reviewAnchorAnswered:   false,
    factAnsweredThisThread: false,
    significanceAsked:      false,
    argumentProbeDelivered: false,
    stuckCount:             0,
  };
}

function countGenericStuckSignals(messages: string[]): number {
  let n = 0;
  for (const m of messages) {
    if (/\btak\s+faham|\btidak\s+faham|\bconfused\b/i.test(m)) n += 1;
  }
  return n;
}

function threadHasReviewAnchorAnswered(
  recentAssistantMessages: string[],
  recentUserMessages: string[],
  currentUserMessage = '',
): boolean {
  const lastAssistant = recentAssistantMessages[0] ?? '';
  const current = currentUserMessage.trim();
  if (
    lastAssistant
    && current.length >= 8
    && !/\btak\s+faham|\btidak\s+faham\b/i.test(current)
  ) {
    const askedAnchor = REVIEW_ANCHOR_MARKERS.some((re) => {
      re.lastIndex = 0;
      return re.test(lastAssistant);
    }) || lastAssistant.includes(REVIEW_ANCHOR.slice(0, 40));
    if (askedAnchor) return true;
  }

  const pairs = Math.min(recentAssistantMessages.length, recentUserMessages.length);
  for (let i = 0; i < pairs; i++) {
    const assistant = recentAssistantMessages[i] ?? '';
    const user = recentUserMessages[i] ?? '';
    if (!user.trim() || user.trim().length < 8) continue;
    if (/\btak\s+faham|\btidak\s+faham\b/i.test(user)) continue;
    const askedAnchor = REVIEW_ANCHOR_MARKERS.some((re) => {
      re.lastIndex = 0;
      return re.test(assistant);
    }) || assistant.includes(REVIEW_ANCHOR.slice(0, 40));
    if (askedAnchor) return true;
  }
  return false;
}

function threadSignificanceWasAsked(recentAssistantMessages: string[]): boolean {
  return recentAssistantMessages.some((msg) =>
    SIGNIFICANCE_MARKERS.some((re) => {
      re.lastIndex = 0;
      return re.test(msg);
    })
    || Object.values(SIGNIFICANCE_BY_DOMAIN).some((q) => msg.includes(q.slice(0, 28))));
}

function threadDeliveredFactAnswer(recentAssistantMessages: string[]): boolean {
  return recentAssistantMessages.some((msg) =>
    /\b(?:betul|tepat|correct|ya,|yes,|tokoh itu|peristiwa itu|jawapannya)\b/i.test(msg)
    && msg.trim().length >= 40);
}

export function deriveGenericSessionState(ctx: GenericTurnContext): GenericSessionState {
  const base = defaultGenericSessionState();
  const users = [...(ctx.recentUserMessages ?? []), ctx.userMessage].filter(Boolean);
  const assistants = ctx.recentAssistantMessages ?? [];

  base.stuckCount = countGenericStuckSignals(users);
  base.reviewAnchorAnswered = threadHasReviewAnchorAnswered(
    assistants,
    ctx.recentUserMessages ?? [],
    ctx.userMessage,
  );
  base.significanceAsked = threadSignificanceWasAsked(assistants);
  base.factAnsweredThisThread = threadDeliveredFactAnswer(assistants);
  base.argumentProbeDelivered = assistants.some((msg) =>
    /\bpandangan awal kamu\b/i.test(msg)
    || /\bapa SATU faktor\b/i.test(msg)
    || /\bquality of your argument\b/i.test(msg));

  return base;
}

export function mergeGenericSessionState(
  prior: Partial<GenericSessionState> | undefined,
  derived: GenericSessionState,
): GenericSessionState {
  return {
    lockedDomain: prior?.lockedDomain ?? derived.lockedDomain ?? null,
    reviewAnchorAnswered:
      (prior?.reviewAnchorAnswered ?? false) || derived.reviewAnchorAnswered,
    factAnsweredThisThread:
      (prior?.factAnsweredThisThread ?? false) || derived.factAnsweredThisThread,
    significanceAsked:
      (prior?.significanceAsked ?? false) || derived.significanceAsked,
    argumentProbeDelivered:
      (prior?.argumentProbeDelivered ?? false) || derived.argumentProbeDelivered,
    stuckCount: Math.max(prior?.stuckCount ?? 0, derived.stuckCount),
  };
}

export function commitGenericSessionState(
  state: GenericSessionState,
  output: GenericClassifierOutput,
  handler: GenericTurnHandler,
): GenericSessionState {
  return {
    ...state,
    lockedDomain: output.domain !== GenericDomain.UMUM
      ? output.domain
      : state.lockedDomain,
    reviewAnchorAnswered:
      state.reviewAnchorAnswered
      || handler === 'REVIEW_FEEDBACK',
    factAnsweredThisThread:
      state.factAnsweredThisThread
      || handler === 'FACT_WITH_SIGNIFICANCE'
      || handler === 'FACT_SIGNIFICANCE_ONLY',
    significanceAsked:
      state.significanceAsked
      || handler === 'FACT_WITH_SIGNIFICANCE'
      || handler === 'FACT_SIGNIFICANCE_ONLY',
    argumentProbeDelivered:
      state.argumentProbeDelivered
      || handler === 'ARGUMENT_PROBE',
  };
}

/** Section 10 handler resolution. */
export function resolveGenericTurnHandler(
  output: GenericClassifierOutput,
  state: GenericSessionState,
): GenericTurnHandler {
  switch (output.intent) {
    case GenericIntent.EXAM_DIRECT:
      return 'REDIRECT';
    case GenericIntent.AMBIGUOUS:
      return 'AMBIGUOUS_PROBE';
    case GenericIntent.G_ANALYSIS:
      return 'ARGUMENT_PROBE';
    case GenericIntent.G_FACT:
      if (state.factAnsweredThisThread && !state.significanceAsked) {
        return 'FACT_SIGNIFICANCE_ONLY';
      }
      if (state.significanceAsked) {
        return 'FACT_SIGNIFICANCE_ONLY';
      }
      return 'FACT_WITH_SIGNIFICANCE';
    case GenericIntent.G_REVIEW:
      return state.reviewAnchorAnswered ? 'REVIEW_FEEDBACK' : 'REVIEW_ANCHOR';
    case GenericIntent.G_CONCEPT:
      return 'CONCEPT_DIAGNOSE';
    default:
      return 'AMBIGUOUS_PROBE';
  }
}

export function applyGenericSessionToOutput(
  output: GenericClassifierOutput,
  state: GenericSessionState,
  handler: GenericTurnHandler,
): { output: GenericClassifierOutput; reviewAnchorSkipped: boolean } {
  let reviewAnchorSkipped = false;
  let next = output;

  if (handler === 'REVIEW_FEEDBACK') {
    reviewAnchorSkipped = true;
    if (output.reviewAnchor) {
      next = { ...next, reviewAnchor: null };
    }
  }

  if (handler === 'FACT_SIGNIFICANCE_ONLY') {
    next = {
      ...next,
      redirectScript:  null,
      argumentProbe:   null,
      reviewAnchor:    null,
      probeQuestion:   null,
    };
  }

  if (handler === 'ARGUMENT_PROBE' && state.argumentProbeDelivered && output.argumentProbe) {
    next = {
      ...next,
      argumentProbe:
        'Ada bukti konkrit untuk menyokong hujah kamu? Cuba nyatakan satu contoh atau rujukan.',
    };
  }

  return { output: next, reviewAnchorSkipped };
}

export function buildGenericIntentResult(
  output: GenericClassifierOutput,
  sessionState: GenericSessionState,
  handler: GenericTurnHandler,
  reviewAnchorSkipped: boolean,
): GenericIntentResult {
  return {
    output,
    handler,
    sessionState,
    nextSessionState: commitGenericSessionState(sessionState, output, handler),
    reviewAnchorSkipped,
  };
}

export function genericIntentSkipsZeroAnswer(output: GenericClassifierOutput): boolean {
  return (
    output.intent === GenericIntent.EXAM_DIRECT
    || output.intent === GenericIntent.G_REVIEW
    || output.intent === GenericIntent.G_ANALYSIS
    || output.intent === GenericIntent.G_CONCEPT
    || output.intent === GenericIntent.G_FACT
    || output.intent === GenericIntent.AMBIGUOUS
  );
}

export function applyGenericThreadIntentLock(
  output: GenericClassifierOutput,
  state: GenericSessionState,
): GenericClassifierOutput {
  if (
    state.reviewAnchorAnswered
    && output.intent !== GenericIntent.EXAM_DIRECT
  ) {
    return {
      ...output,
      intent:         GenericIntent.G_REVIEW,
      reviewAnchor:   null,
      redirectScript: null,
      probeQuestion:  null,
    };
  }
  return output;
}

export function genericIntentSkipsMathPedagogy(_output: GenericClassifierOutput): boolean {
  return true;
}
