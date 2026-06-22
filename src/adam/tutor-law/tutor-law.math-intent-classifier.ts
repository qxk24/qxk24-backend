/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Intent Classifier
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

export type {
  TutorMathIntentMode,
  TutorMathIntentResult,
  TutorMathQueryShape,
  TutorMathReleaseLayer,
  TutorMathSessionState,
  TutorMathTopic,
  TutorMathTurnContext,
} from './tutor-law.math-intent.types';

export {
  hasNumericalComputation,
  isTutorMathDomainMessage,
  studentAsksMathConcept,
  studentAsksMathProcedural,
  studentHasNoAttemptSignal,
  studentPresentsExamOrHomeworkDump,
  studentRequestsAnswerVerification,
  studentRequestsTeachMePattern,
  studentShowsFullWorking,
  studentShowsPartialWorking,
  threadHasMicroTeachingBlank,
} from './tutor-law.math-intent-detectors';

export {
  deriveTutorMathSessionState,
  mergeTutorMathSessionState,
} from './tutor-law.math-session-state';

import { tutorQuestionIsQuadraticEquation } from './tutor-law.word-problem-routing';
import {
  tutorQuestionIsMultiStepFractionWordProblem,
  tutorQuestionIsPercentageWordProblem,
} from './tutor-law.word-problem-routing';
import {
  resolveActiveAddThenSubtractProblem,
} from './tutor-law.arithmetic-phase';
import { tutorThreadIsMultiStepArithmetic } from './tutor-law.arithmetic-proficiency';
import { tutorThreadIsPlaceValueAddition } from './tutor-law.place-value-routing';
import { tutorQuestionIsScienceFactual } from './tutor-law.science-routing';
import {
  buildScienceClassifierInput,
  classifyScienceIntent,
  isTutorScienceDomainMessage,
} from './tutor-law.science-intent-classifier';
import { ScienceIntent } from './tutor-law.science-intent.types';
import {
  hasNumericalComputation,
  isTutorMathDomainMessage,
  studentAsksMathConcept,
  studentAsksMathProcedural,
  studentHasNoAttemptSignal,
  studentPresentsExamOrHomeworkDump,
  studentRequestsAnswerVerification,
  studentRequestsTeachMePattern,
  studentShowsPartialWorking,
  threadHasMicroTeachingBlank,
} from './tutor-law.math-intent-detectors';
import {
  deriveTutorMathSessionState,
  mergeTutorMathSessionState,
} from './tutor-law.math-session-state';
import type {
  TutorMathIntentMode,
  TutorMathIntentResult,
  TutorMathQueryShape,
  TutorMathReleaseLayer,
  TutorMathSessionState,
  TutorMathTopic,
  TutorMathTurnContext,
} from './tutor-law.math-intent.types';
import { tutorTurnWarrantsAutoClosure } from './tutor-law.math-closure-gate';

export { tutorTurnWarrantsAutoClosure } from './tutor-law.math-closure-gate';

export function classifyTutorMathQueryShape(
  message: string,
  recentUserMessages: string[] = [],
): TutorMathQueryShape {
  const blob = [message, ...recentUserMessages].join('\n');
  const hasCompute = hasNumericalComputation(message) || hasNumericalComputation(blob);
  const hasConcept = studentAsksMathConcept(message);

  if (isTutorScienceDomainMessage(message, recentUserMessages)) {
    const sci = classifyScienceIntent(buildScienceClassifierInput({
      userMessage:         message,
      recentUserMessages,
    }));
    if (sci.intent === ScienceIntent.F_FACTUAL) return 'science_factual';
    if (sci.intent === ScienceIntent.C_CALCULATION) {
      if (hasConcept) return 'mixed';
      return 'computation';
    }
  }

  if (
    !hasNumericalComputation(message)
    && tutorQuestionIsScienceFactual(message)
  ) {
    return 'science_factual';
  }

  if (hasCompute && hasConcept) return 'mixed';
  if (hasCompute) return 'computation';
  if (hasConcept) return 'conceptual';
  return 'computation';
}

export function tutorQuestionIsScienceFactualIntent(ctx: TutorMathTurnContext): boolean {
  const shape = classifyTutorMathQueryShape(ctx.userMessage, ctx.recentUserMessages);
  return shape === 'science_factual';
}

export function resolveTutorMathTopic(ctx: TutorMathTurnContext): TutorMathTopic {
  const { userMessage, recentUserMessages, recentAssistantMessages } = ctx;
  const blob = [userMessage, ...recentUserMessages, ...recentAssistantMessages].join('\n');

  if (tutorQuestionIsQuadraticEquation(blob)) return 'algebra_quadratic';
  if (/[A-Za-z]\s*[+\-×÷]\s*\d+\s*=\s*\d/.test(blob) || /\b2x\b/i.test(blob)) {
    return 'algebra_linear';
  }
  if (tutorQuestionIsMultiStepFractionWordProblem(blob)) return 'fraction_remainder';
  if (tutorQuestionIsPercentageWordProblem(blob)) return 'percentage_word';
  if (
    tutorThreadIsMultiStepArithmetic(userMessage, recentUserMessages, recentAssistantMessages)
    || resolveActiveAddThenSubtractProblem(userMessage, recentUserMessages, recentAssistantMessages)
  ) {
    return 'arithmetic_multi_op';
  }
  if (
    tutorThreadIsPlaceValueAddition(userMessage, recentUserMessages, recentAssistantMessages)
    || /\btempat\s+(?:Sa|Puluh|Ratus)\b/i.test(blob)
  ) {
    return 'arithmetic_place_value';
  }
  if (isTutorMathDomainMessage(userMessage) || isTutorMathDomainMessage(blob)) {
    return 'general_math';
  }
  return 'none';
}

function resolveIntentMode(
  ctx: TutorMathTurnContext,
  queryShape: TutorMathQueryShape,
): TutorMathIntentMode {
  const { userMessage } = ctx;
  const threadBlob = [
    ...ctx.recentUserMessages,
    userMessage,
    ...ctx.recentAssistantMessages,
  ].join('\n');

  const inMathLane = isTutorMathDomainMessage(userMessage)
    || isTutorMathDomainMessage(threadBlob)
    || studentRequestsAnswerVerification(userMessage);

  if (!inMathLane) {
    return 'non_math';
  }

  if (queryShape === 'science_factual') {
    return 'non_math';
  }

  if (studentPresentsExamOrHomeworkDump(userMessage)) {
    return 'exam_block';
  }

  if (studentRequestsTeachMePattern(userMessage)) {
    return 'teach_me';
  }

  if (studentRequestsAnswerVerification(userMessage)) {
    return 'verification';
  }

  if (
    studentHasNoAttemptSignal(userMessage)
    && !studentAsksMathProcedural(userMessage)
  ) {
    return 'concept';
  }

  if (studentAsksMathProcedural(userMessage)) {
    return 'procedural';
  }

  if (studentAsksMathConcept(userMessage)) {
    return 'concept';
  }

  return 'concept';
}

export function inferTutorMathReleaseLayer(
  mode: TutorMathIntentMode,
  state: TutorMathSessionState,
): TutorMathReleaseLayer {
  if (mode === 'teach_me' && state.conceptUnderstood) return 4;
  if (mode === 'procedural' && state.workingShown) return 3;
  if (state.conceptUnderstood) return 2;
  if (state.diagnosticAnswered) return 2;
  return 1;
}

export function tutorTurnAllowsStuckEscalation(
  ctx: TutorMathTurnContext,
  state: TutorMathSessionState,
  topic: TutorMathTopic,
): boolean {
  return (
    state.conceptUnderstood
    && state.stuckCount >= 2
    && (topic === 'algebra_quadratic' || topic === 'algebra_linear')
    && (ctx.userMessage.match(/\btak\s+faham|\btidak\s+faham\b/gi)?.length ?? 0) >= 1
  );
}

function buildTopicGuardTags(topic: TutorMathTopic): string[] {
  switch (topic) {
    case 'arithmetic_place_value':
      return ['place_value', 'carry'];
    case 'arithmetic_multi_op':
      return ['place_value', 'carry', 'multi_op'];
    case 'percentage_word':
      return ['percentage'];
    case 'fraction_remainder':
      return ['fraction'];
    case 'algebra_quadratic':
      return ['algebra_micro', 'algebra_stuck'];
    case 'algebra_linear':
      return ['algebra_micro'];
    default:
      return [];
  }
}

function buildPromptLawTags(
  mode: TutorMathIntentMode,
  allowsEscalation: boolean,
  warrantsClosure: boolean,
): string[] {
  const tags: string[] = [];
  switch (mode) {
    case 'concept':
      tags.push('MOD_A_CONCEPT', 'DIAGNOSIS_SCRIPT');
      break;
    case 'procedural':
      tags.push('MOD_B_PROCEDURAL');
      break;
    case 'verification':
      tags.push('MOD_C_VERIFICATION');
      break;
    case 'teach_me':
      tags.push('MOD_TEACH_ME');
      break;
    case 'exam_block':
      tags.push('MOD_EXAM_BLOCK');
      break;
    default:
      break;
  }
  if (allowsEscalation) tags.push('STUCK_ESCALATION');
  if (warrantsClosure) tags.push('SESSION_CLOSURE_WITH_CHECK');
  return tags;
}

/** Intent-first classifier — call before topic guards and prompt laws. */
export function classifyTutorMathIntent(ctx: TutorMathTurnContext): TutorMathIntentResult {
  const derived = deriveTutorMathSessionState(ctx);
  const state = mergeTutorMathSessionState(ctx.sessionState, derived);
  const queryShape = classifyTutorMathQueryShape(ctx.userMessage, ctx.recentUserMessages);
  const topic = resolveTutorMathTopic(ctx);
  const mode = resolveIntentMode(ctx, queryShape);
  const releaseLayer = inferTutorMathReleaseLayer(mode, state);

  const allowsScienceFactual = queryShape === 'science_factual';
  const allowsStuckEscalation = tutorTurnAllowsStuckEscalation(ctx, state, topic);
  const warrantsAutoClosure = !allowsScienceFactual
    && tutorTurnWarrantsAutoClosure(ctx, mode, topic, state);

  const requiresWorkingFirst = (
    mode === 'verification'
    || (mode === 'procedural' && !state.workingShown)
    || mode === 'teach_me'
  ) && !allowsScienceFactual;

  const closureIncludesCheckQ = warrantsAutoClosure || mode === 'teach_me';

  const decisionTrace = [
    `queryShape=${queryShape}`,
    `mode=${mode}`,
    `topic=${topic}`,
    `conceptUnderstood=${state.conceptUnderstood}`,
    `workingShown=${state.workingShown}`,
  ];

  const nextSessionState: TutorMathSessionState = {
    ...state,
    activeMode: mode,
    lockedTopic: topic !== 'none' ? topic : state.lockedTopic,
    releaseLayer,
    closureDelivered: warrantsAutoClosure || state.closureDelivered,
  };

  return {
    mode,
    queryShape,
    topic,
    releaseLayer,
    warrantsAutoClosure,
    requiresWorkingFirst,
    allowsStuckEscalation,
    allowsScienceFactual,
    closureIncludesCheckQ,
    promptLawTags: buildPromptLawTags(mode, allowsStuckEscalation, warrantsAutoClosure),
    topicGuardTags: buildTopicGuardTags(topic),
    decisionTrace,
    nextSessionState,
  };
}

export function buildTutorMathTurnContext(input: {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile?:                TutorMathTurnContext['profile'];
  sessionState?:           Partial<TutorMathSessionState>;
}): TutorMathTurnContext {
  return {
    userMessage:             input.userMessage ?? '',
    recentUserMessages:      input.recentUserMessages ?? [],
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
    sessionState:            input.sessionState,
  };
}
