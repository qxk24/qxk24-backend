/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Islamic Education Session Mode
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
 * Session state for Islamic turns — probe answered, fabrication guard,
 * locked intent/tier across thread continuations.
 */

import {
  IslamicIntent,
  IslamicIntentResult,
  IslamicSessionState,
  IslamicTurnContext,
  SourceTier,
} from './tutor-law.islamic-intent.types';
import type { IslamicClassifierOutput } from './tutor-law.islamic-intent.types';

const ISLAMIC_PEDAGOGY_PROBE_MARKERS = [
  /\bSebelum kita bincang maksud ayat\b/i,
  /\bSebelum kita teruskan\b/i,
  /\bSoalan hukum yang baik\b/i,
  /\bSoalan iman yang penting\b/i,
  /\bTentang sejarah Islam ni\b/i,
  /\bSoalan perbandingan agama\b/i,
  /\bBefore we discuss the meaning of\b/i,
  /\bBefore we continue\b/i,
];

const FABRICATION_GUARD_MARKERS = [
  /\btidak akan menulis teks ayat\b/i,
  /\bwill not reproduce Quranic verses\b/i,
  /\bquran\.com\b/i,
];

export function defaultIslamicSessionState(): IslamicSessionState {
  return {
    lockedIntent:              null,
    lockedSourceTier:          null,
    pedagogyProbeAnswered:     false,
    fabricationGuardDelivered: false,
    verificationAcknowledged:  false,
    stuckCount:                0,
  };
}

function countIslamicStuckSignals(messages: string[]): number {
  let n = 0;
  for (const m of messages) {
    if (/\btak\s+faham|\btidak\s+faham|\btak\s+paham|\bconfused\b/i.test(m)) n += 1;
  }
  return n;
}

function threadHasIslamicPedagogyProbeAnswered(
  recentAssistantMessages: string[],
  recentUserMessages: string[],
): boolean {
  const pairs = Math.min(recentAssistantMessages.length, recentUserMessages.length);
  for (let i = 0; i < pairs; i++) {
    const assistant = recentAssistantMessages[i] ?? '';
    const user = recentUserMessages[i] ?? '';
    if (!user.trim() || user.trim().length < 10) continue;
    if (/\btak\s+faham|\btidak\s+faham\b/i.test(user)) continue;
    if (ISLAMIC_PEDAGOGY_PROBE_MARKERS.some((re) => {
      re.lastIndex = 0;
      return re.test(assistant);
    })) {
      return true;
    }
    if (
      /\?/.test(assistant)
      && /\b(?:surah|hadis|hukum|iman|sejarah|akhlak|quran)\b/i.test(assistant)
      && user.trim().length >= 12
    ) {
      return true;
    }
  }
  return false;
}

function threadFabricationGuardDelivered(recentAssistantMessages: string[]): boolean {
  return recentAssistantMessages.some((msg) =>
    FABRICATION_GUARD_MARKERS.some((re) => {
      re.lastIndex = 0;
      return re.test(msg);
    }));
}

function threadVerificationAcknowledged(recentAssistantMessages: string[]): boolean {
  return recentAssistantMessages.some((msg) =>
    /\b(?:quran\.com|sunnah\.com|sila sahkan|please verify)\b/i.test(msg));
}

export function deriveIslamicSessionState(ctx: IslamicTurnContext): IslamicSessionState {
  const base = defaultIslamicSessionState();
  const users = [...(ctx.recentUserMessages ?? []), ctx.userMessage].filter(Boolean);
  const assistants = ctx.recentAssistantMessages ?? [];

  base.stuckCount = countIslamicStuckSignals(users);
  base.pedagogyProbeAnswered = threadHasIslamicPedagogyProbeAnswered(
    assistants,
    ctx.recentUserMessages ?? [],
  );
  base.fabricationGuardDelivered = threadFabricationGuardDelivered(assistants);
  base.verificationAcknowledged = threadVerificationAcknowledged(assistants);

  return base;
}

export function mergeIslamicSessionState(
  prior: Partial<IslamicSessionState> | undefined,
  derived: IslamicSessionState,
): IslamicSessionState {
  return {
    lockedIntent: prior?.lockedIntent ?? derived.lockedIntent ?? null,
    lockedSourceTier: prior?.lockedSourceTier ?? derived.lockedSourceTier ?? null,
    pedagogyProbeAnswered:
      (prior?.pedagogyProbeAnswered ?? false) || derived.pedagogyProbeAnswered,
    fabricationGuardDelivered:
      (prior?.fabricationGuardDelivered ?? false) || derived.fabricationGuardDelivered,
    verificationAcknowledged:
      (prior?.verificationAcknowledged ?? false) || derived.verificationAcknowledged,
    stuckCount: Math.max(prior?.stuckCount ?? 0, derived.stuckCount),
  };
}

export function commitIslamicSessionState(
  state: IslamicSessionState,
  output: IslamicClassifierOutput,
): IslamicSessionState {
  return {
    ...state,
    lockedIntent: output.intent !== IslamicIntent.AMBIGUOUS
      ? output.intent
      : state.lockedIntent,
    lockedSourceTier: output.sourceTier !== SourceTier.UNKNOWN
      ? output.sourceTier
      : state.lockedSourceTier,
    fabricationGuardDelivered:
      state.fabricationGuardDelivered
      || output.intent === IslamicIntent.FABRICATION_RISK,
    verificationAcknowledged:
      state.verificationAcknowledged
      || (
        output.verificationReminder == null
        && state.lockedIntent !== IslamicIntent.Q_QURAN
        && state.lockedIntent !== IslamicIntent.Q_HADITH
      ),
  };
}

export function applyLockedIntentToOutput(
  output: IslamicClassifierOutput,
  lockedIntent: IslamicIntent | null,
): IslamicClassifierOutput {
  if (
    !lockedIntent
    || lockedIntent === IslamicIntent.AMBIGUOUS
    || lockedIntent === IslamicIntent.FABRICATION_RISK
    || output.intent !== IslamicIntent.AMBIGUOUS
  ) {
    return output;
  }

  const tierMap: Partial<Record<IslamicIntent, SourceTier>> = {
    [IslamicIntent.Q_QURAN]:   SourceTier.QURAN,
    [IslamicIntent.Q_HADITH]:  SourceTier.HADITH,
    [IslamicIntent.Q_FIQH]:    SourceTier.IJMAK,
    [IslamicIntent.Q_IMAN]:    SourceTier.QURAN,
    [IslamicIntent.Q_AKHLAQ]:  SourceTier.HADITH,
    [IslamicIntent.Q_HISTORY]: SourceTier.ACADEMIC,
    [IslamicIntent.Q_COMPARE]: SourceTier.ACADEMIC,
  };

  return {
    ...output,
    intent:               lockedIntent,
    sourceTier:           tierMap[lockedIntent] ?? SourceTier.UNKNOWN,
    confidence:           'MEDIUM',
    probeQuestion:        null,
    decisionTrace:        [
      ...(output.decisionTrace ?? []),
      `thread-lock=${lockedIntent}`,
    ],
  };
}

export function applyIslamicSessionToOutput(
  output: IslamicClassifierOutput,
  state: IslamicSessionState,
): { output: IslamicClassifierOutput; pedagogyProbeSkipped: boolean } {
  let pedagogyProbeSkipped = false;
  let next = output;

  if (state.pedagogyProbeAnswered && output.pedagogyProbe) {
    pedagogyProbeSkipped = true;
    next = { ...next, pedagogyProbe: null };
  }

  if (
    state.fabricationGuardDelivered
    && output.intent === IslamicIntent.FABRICATION_RISK
    && output.fabricationGuard
  ) {
    next = { ...next, fabricationGuard: null };
  }

  if (
    state.verificationAcknowledged
    && output.verificationReminder
  ) {
    next = { ...next, verificationReminder: null };
  }

  return { output: next, pedagogyProbeSkipped };
}

export function buildIslamicIntentResult(
  output: IslamicClassifierOutput,
  sessionState: IslamicSessionState,
  pedagogyProbeSkipped: boolean,
): IslamicIntentResult {
  return {
    output,
    sessionState,
    nextSessionState: commitIslamicSessionState(sessionState, output),
    pedagogyProbeSkipped,
  };
}
