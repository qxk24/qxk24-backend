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
 *
 * Rule 61 classifyMathIntent is upstream; classifyTutorMathIntent bridges
 * to legacy prompt-law / guard tags until tutor-law.math-mode.ts lands.
 */

export type {
  ClassifierInput,
  ClassifierOutput,
  TutorMathIntentMode,
  TutorMathIntentResult,
  TutorMathQueryShape,
  TutorMathReleaseLayer,
  TutorMathSessionState,
  TutorMathTopic,
  TutorMathTurnContext,
} from './tutor-law.math-intent.types';

export {
  ConceptReadiness,
  MathIntent,
  MathTopic,
} from './tutor-law.math-intent.types';

export {
  canAutoClose,
  classifyMathIntent,
  isEscalationPermitted,
  requiresConceptCheck,
} from './tutor-law.math-intent-classifier.core';

export { normalizeMathClassifierText } from './tutor-law.math-intent.signals';

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
import { resolveActiveAddThenSubtractProblem } from './tutor-law.arithmetic-phase';
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
  studentRequestsAnswerVerification,
  studentRequestsTeachMePattern,
} from './tutor-law.math-intent-detectors';
import {
  deriveTutorMathSessionState,
  mergeTutorMathSessionState,
} from './tutor-law.math-session-state';
import {
  canAutoClose,
  classifyMathIntent,
  requiresConceptCheck,
} from './tutor-law.math-intent-classifier.core';
import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import {
  ConceptReadiness,
  MathIntent,
  MathTopic,
  type ClassifierInput,
  type TutorMathIntentMode,
  type TutorMathIntentResult,
  type TutorMathQueryShape,
  type TutorMathReleaseLayer,
  type TutorMathSessionState,
  type TutorMathTopic,
  type TutorMathTurnContext,
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

  if (!hasNumericalComputation(message) && tutorQuestionIsScienceFactual(message)) {
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

function rule61TopicFromTutorTopic(topic: TutorMathTopic): MathTopic | null {
  switch (topic) {
    case 'arithmetic_place_value':
    case 'arithmetic_multi_op':
      return MathTopic.ARITHMETIC_BASIC;
    case 'fraction_remainder':
      return MathTopic.ARITHMETIC_FRACTION;
    case 'percentage_word':
      return MathTopic.WORD_PROBLEM;
    case 'algebra_linear':
      return MathTopic.ALGEBRA_LINEAR;
    case 'algebra_quadratic':
      return MathTopic.ALGEBRA_QUADRATIC;
    case 'general_math':
      return MathTopic.UNKNOWN;
    case 'none':
      return null;
    default:
      return null;
  }
}

function tutorTopicFromRule61(ruleTopic: MathTopic, ctx: TutorMathTurnContext): TutorMathTopic {
  const routed = resolveTutorMathTopic(ctx);
  if (routed !== 'none') return routed;
  switch (ruleTopic) {
    case MathTopic.ARITHMETIC_BASIC:
      return 'arithmetic_multi_op';
    case MathTopic.ARITHMETIC_FRACTION:
      return 'fraction_remainder';
    case MathTopic.ARITHMETIC_DECIMAL:
      return 'general_math';
    case MathTopic.ALGEBRA_LINEAR:
    case MathTopic.ALGEBRA_SYSTEMS:
      return 'algebra_linear';
    case MathTopic.ALGEBRA_QUADRATIC:
      return 'algebra_quadratic';
    case MathTopic.WORD_PROBLEM:
      return 'percentage_word';
    default:
      return 'general_math';
  }
}

function conceptReadinessFromState(state: TutorMathSessionState): ConceptReadiness {
  if (state.conceptUnderstood) return ConceptReadiness.PASSED;
  const topic = rule61TopicFromTutorTopic(state.lockedTopic);
  if (topic && !requiresConceptCheck(topic)) return ConceptReadiness.BYPASSED;
  return ConceptReadiness.UNVERIFIED;
}

function buildClassifierInput(ctx: TutorMathTurnContext, state: TutorMathSessionState): ClassifierInput {
  return {
    rawText:          ctx.userMessage,
    normText:         normalizeMathClassifierText(ctx.userMessage),
    hasShownWorking:  state.workingShown,
    stuckCount:       state.stuckCount,
    conceptReadiness: conceptReadinessFromState(state),
    priorTopic:       rule61TopicFromTutorTopic(state.lockedTopic),
  };
}

function mathIntentToMode(
  intent: MathIntent,
  inMathLane: boolean,
): TutorMathIntentMode {
  switch (intent) {
    case MathIntent.A_CONCEPT:
      return 'concept';
    case MathIntent.B_PROCEDURE:
      return 'procedural';
    case MathIntent.C_VERIFICATION:
      return 'verification';
    case MathIntent.EXAM_DIRECT:
      return 'exam_block';
    case MathIntent.SCIENCE_FACTUAL:
      return 'non_math';
    case MathIntent.AMBIGUOUS:
      return inMathLane ? 'concept' : 'non_math';
    default:
      return 'concept';
  }
}

function threadExpectsShortAnswer(ctx: TutorMathTurnContext): boolean {
  const lastAssistant = ctx.recentAssistantMessages[0] ?? '';
  return (
    /\?/.test(lastAssistant)
    || /→\s*_{3,}/.test(lastAssistant)
    || /\b(?:berapa|how many|what is)\b/i.test(lastAssistant)
  );
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
  rule61: ReturnType<typeof classifyMathIntent>,
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
  if (rule61.intent === MathIntent.AMBIGUOUS && rule61.probeQuestion) {
    tags.push('AMBIGUOUS_PROBE');
  }
  if (allowsEscalation) tags.push('STUCK_ESCALATION');
  if (warrantsClosure) tags.push('SESSION_CLOSURE_WITH_CHECK');
  return tags;
}

/** Intent-first classifier — Rule 61 core + legacy bridge. */
export function classifyTutorMathIntent(ctx: TutorMathTurnContext): TutorMathIntentResult {
  const derived = deriveTutorMathSessionState(ctx);
  const state = mergeTutorMathSessionState(ctx.sessionState, derived);
  const rule61 = classifyMathIntent(buildClassifierInput(ctx, state));
  const queryShape = classifyTutorMathQueryShape(ctx.userMessage, ctx.recentUserMessages);
  const topic = tutorTopicFromRule61(rule61.topic, ctx);

  const threadBlob = [
    ...ctx.recentUserMessages,
    ctx.userMessage,
    ...ctx.recentAssistantMessages,
  ].join('\n');
  const inMathLane = isTutorMathDomainMessage(ctx.userMessage)
    || isTutorMathDomainMessage(threadBlob)
    || studentRequestsAnswerVerification(ctx.userMessage)
    || topic !== 'none';

  let mode = mathIntentToMode(rule61.intent, inMathLane);

  if (studentRequestsTeachMePattern(ctx.userMessage)) {
    mode = 'teach_me';
  }

  if (
    rule61.intent === MathIntent.C_VERIFICATION
    || (threadExpectsShortAnswer(ctx) && hasExplicitAnswerShort(ctx.userMessage))
  ) {
    mode = 'verification';
  }

  if (!inMathLane && queryShape !== 'science_factual' && rule61.intent !== MathIntent.EXAM_DIRECT) {
    mode = 'non_math';
  }

  const releaseLayer = inferTutorMathReleaseLayer(mode, state);
  const allowsScienceFactual = (
    rule61.intent === MathIntent.SCIENCE_FACTUAL
    || queryShape === 'science_factual'
  );
  const allowsStuckEscalation = (
    rule61.escalationActive || tutorTurnAllowsStuckEscalation(ctx, state, topic)
  );
  const warrantsAutoClosure = !allowsScienceFactual
    && (
      tutorTurnWarrantsAutoClosure(ctx, mode, topic, state)
      || canAutoClose(
        rule61.topic,
        state.workingShown,
        state.workingShown,
        rule61.escalationActive,
      )
    );

  const requiresWorkingFirst = (
    mode === 'verification'
    || (mode === 'procedural' && !state.workingShown)
    || mode === 'teach_me'
  ) && !allowsScienceFactual;

  const closureIncludesCheckQ = warrantsAutoClosure || mode === 'teach_me';

  const decisionTrace = [
    ...rule61._trace,
    `queryShape=${queryShape}`,
    `mode=${mode}`,
    `tutorTopic=${topic}`,
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
    promptLawTags: buildPromptLawTags(mode, rule61, allowsStuckEscalation, warrantsAutoClosure),
    topicGuardTags: buildTopicGuardTags(topic),
    decisionTrace,
    nextSessionState,
    rule61,
  };
}

function hasExplicitAnswerShort(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return (
    /^\d+[\d,]*\s*(?:orang|unit|cm|kg|rm|ringgit)?\s*$/i.test(t)
    || /^\d+[\d,]*$/.test(t)
  );
}

export function buildTutorMathTurnContext(input: {
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  profile?:                 TutorMathTurnContext['profile'];
  sessionState?:            Partial<TutorMathSessionState>;
}): TutorMathTurnContext {
  return {
    userMessage:             input.userMessage ?? '',
    recentUserMessages:      input.recentUserMessages ?? [],
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
    sessionState:            input.sessionState,
  };
}
