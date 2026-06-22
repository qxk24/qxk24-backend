/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Session Pedagogy State
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
 */

import { tutorInferFurthestColumnInThread } from './tutor-law.arithmetic-phase';
import { studentDemandsTutorDirectAnswer } from './tutor-law.intro';
import {
  studentShowsFullWorking,
  studentShowsPartialWorking,
  threadHasMicroTeachingBlank,
  threadHasArithmeticClosureSummary,
} from './tutor-law.math-intent-detectors';
import type {
  TutorMathSessionState,
  TutorMathTurnContext,
} from './tutor-law.math-intent.types';

export type { TutorMathSessionState, TutorMathTurnContext } from './tutor-law.math-intent.types';

export function defaultTutorMathSessionState(): TutorMathSessionState {
  return {
    activeMode:         'concept',
    conceptUnderstood:  false,
    workingShown:       false,
    diagnosticAnswered: false,
    stuckCount:         0,
    lockedTopic:        'none',
    releaseLayer:       1,
    closureDelivered:   false,
  };
}

export function mergeTutorMathSessionState(
  persisted: Partial<TutorMathSessionState> | undefined,
  derived:   TutorMathSessionState,
): TutorMathSessionState {
  if (!persisted) return derived;
  return {
    ...derived,
    ...persisted,
    stuckCount: Math.max(persisted.stuckCount ?? 0, derived.stuckCount),
    releaseLayer: Math.max(
      persisted.releaseLayer ?? 1,
      derived.releaseLayer,
    ) as TutorMathSessionState['releaseLayer'],
    conceptUnderstood: (persisted.conceptUnderstood ?? false) || derived.conceptUnderstood,
    workingShown: (persisted.workingShown ?? false) || derived.workingShown,
    diagnosticAnswered: (persisted.diagnosticAnswered ?? false) || derived.diagnosticAnswered,
    closureDelivered: (persisted.closureDelivered ?? false) || derived.closureDelivered,
  };
}

function studentExplainedConcept(message: string): boolean {
  const t = message.trim();
  if (t.length < 40) return false;
  if (/\btak\s+faham|\btidak\s+faham\b/i.test(t)) return false;
  return (
    /\b(?:maksudnya|jadi|macam|like|rupa|rupa-rupanya|contohnya)\b/i.test(t)
    || /\b(?:saya\s+faham|i\s+think|oh\s*!)/i.test(t)
  );
}

function countStuckSignals(messages: string[]): number {
  let n = 0;
  for (const m of messages) {
    if (/\btak\s+faham|\btidak\s+faham|\btak\s+paham\b/i.test(m)) n += 1;
    if (studentDemandsTutorDirectAnswer(m)) n += 1;
  }
  return n;
}

function threadHasDiagnosticAnswer(
  recentAssistantMessages: string[],
  recentUserMessages: string[],
): boolean {
  const pairCount = Math.min(recentAssistantMessages.length, recentUserMessages.length);
  for (let i = 0; i < pairCount; i++) {
    const a = recentAssistantMessages[i] ?? '';
    const u = recentUserMessages[i] ?? '';
    if (!u.trim()) continue;
    if (/→\s*_{3,}/.test(a) || /\b(?:Sebelum kita mula|what do you already know)\b/i.test(a)) {
      return true;
    }
    if (/\?/.test(a) && u.trim().length >= 8 && !/\btak\s+faham\b/i.test(u)) {
      return true;
    }
  }
  return false;
}

export function deriveTutorMathSessionState(ctx: TutorMathTurnContext): TutorMathSessionState {
  const base = defaultTutorMathSessionState();
  const users = [...ctx.recentUserMessages, ctx.userMessage].filter(Boolean);

  base.workingShown = users.some(
    (m) => studentShowsPartialWorking(m) || studentShowsFullWorking(m),
  ) || tutorInferFurthestColumnInThread(
    ctx.recentUserMessages,
    ctx.recentAssistantMessages,
    ctx.userMessage,
  ) != null || threadHasMicroTeachingBlank(ctx.recentAssistantMessages);

  base.diagnosticAnswered = threadHasDiagnosticAnswer(
    ctx.recentAssistantMessages,
    ctx.recentUserMessages,
  );

  base.stuckCount = countStuckSignals(users);

  base.conceptUnderstood = users.some(studentExplainedConcept)
    || (base.diagnosticAnswered && base.workingShown)
    || (base.diagnosticAnswered && !/\btak\s+faham\b/i.test(ctx.userMessage));

  if (base.workingShown && base.diagnosticAnswered) {
    base.releaseLayer = 2;
  }
  if (base.conceptUnderstood && base.workingShown) {
    base.releaseLayer = 3;
  }

  base.closureDelivered = threadHasArithmeticClosureSummary(ctx.recentAssistantMessages);

  return base;
}
