/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Intent Classifier (Rule 61 core)
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
 * Primary SENSE→ORIENT entry — call before topic guards.
 */

import {
  ConceptReadiness,
  MathIntent,
  MathTopic,
  type ClassifierInput,
  type ClassifierOutput,
} from './tutor-law.math-intent.types';
import {
  CONCEPT_SIGNALS_EN,
  CONCEPT_SIGNALS_MS,
  EXAM_DIRECT_SIGNALS,
  EXAM_REDIRECT_EN,
  EXAM_REDIRECT_MS,
  PROCEDURE_SIGNALS_EN,
  PROCEDURE_SIGNALS_MS,
  SCIENCE_FACTUAL_SIGNALS,
  VERIFICATION_SIGNALS_EN,
  VERIFICATION_SIGNALS_MS,
  buildProbeQuestion,
  classifierHasNumericalComputation,
  countSignalHits,
  detectMathTopic,
  hasExplicitAnswer,
  hasWorkingShown,
} from './tutor-law.math-intent.signals';

export function canAutoClose(
  topic: MathTopic,
  hasShownWorkingSpontaneously: boolean,
  workingStructureValid: boolean,
  escalationActive: boolean,
): boolean {
  const eligibleTopics = [
    MathTopic.ARITHMETIC_BASIC,
    MathTopic.WORD_PROBLEM,
  ];
  return (
    eligibleTopics.includes(topic)
    && hasShownWorkingSpontaneously
    && workingStructureValid
    && !escalationActive
  );
}

export function requiresConceptCheck(topic: MathTopic): boolean {
  const bypassed = [
    MathTopic.ARITHMETIC_BASIC,
    MathTopic.ARITHMETIC_DECIMAL,
    MathTopic.ARITHMETIC_FRACTION,
  ];
  return !bypassed.includes(topic);
}

export function isEscalationPermitted(
  conceptReadiness: ConceptReadiness,
  stuckCount: number,
): boolean {
  if (conceptReadiness === ConceptReadiness.UNVERIFIED) return false;
  return stuckCount >= 3;
}

/** Rule 61 primary classifier — upstream of topic guards. */
export function classifyMathIntent(input: ClassifierInput): ClassifierOutput {
  const {
    rawText,
    normText,
    hasShownWorking,
    stuckCount,
    conceptReadiness,
    priorTopic,
  } = input;
  const trace: string[] = [];
  const topic = detectMathTopic(normText, priorTopic);
  trace.push(`topic detected: ${topic}`);

  const escalationActive = isEscalationPermitted(conceptReadiness, stuckCount);
  trace.push(
    `escalationActive: ${escalationActive} (stuckCount=${stuckCount}, conceptReadiness=${conceptReadiness})`,
  );

  const examHits = countSignalHits(normText, EXAM_DIRECT_SIGNALS);
  if (examHits >= 1) {
    trace.push(`EXAM_DIRECT: ${examHits} signal(s) matched`);
    const isMs = /tolong|soalan|tugasan|kerja sekolah/.test(normText);
    return {
      intent:           MathIntent.EXAM_DIRECT,
      topic,
      confidence:       examHits >= 2 ? 'HIGH' : 'MEDIUM',
      probeQuestion:    null,
      escalationActive: false,
      redirectScript:   isMs ? EXAM_REDIRECT_MS : EXAM_REDIRECT_EN,
      _trace:           trace,
    };
  }

  const sciHits = countSignalHits(normText, SCIENCE_FACTUAL_SIGNALS);
  if (topic === MathTopic.SCIENCE_MATH && sciHits >= 1 && !classifierHasNumericalComputation(rawText)) {
    trace.push(`SCIENCE_FACTUAL: sciHits=${sciHits}, no computation detected`);
    return {
      intent:           MathIntent.SCIENCE_FACTUAL,
      topic,
      confidence:       'HIGH',
      probeQuestion:    null,
      escalationActive: false,
      redirectScript:   null,
      _trace:           trace,
    };
  }

  const verifyHits = countSignalHits(normText, [
    ...VERIFICATION_SIGNALS_MS,
    ...VERIFICATION_SIGNALS_EN,
  ]);
  const hasAnswer = hasExplicitAnswer(normText);

  if (verifyHits >= 1 || hasAnswer) {
    const autoCloseCandidate =
      topic === MathTopic.ARITHMETIC_BASIC && hasShownWorking;
    trace.push(
      `C_VERIFICATION: verifyHits=${verifyHits}, hasAnswer=${hasAnswer}, autoCloseCandidate=${autoCloseCandidate}`,
    );
    return {
      intent:           MathIntent.C_VERIFICATION,
      topic,
      confidence:       hasAnswer ? 'HIGH' : 'MEDIUM',
      probeQuestion:    null,
      escalationActive,
      redirectScript:   null,
      _trace:           trace,
    };
  }

  const procHits = countSignalHits(normText, [
    ...PROCEDURE_SIGNALS_MS,
    ...PROCEDURE_SIGNALS_EN,
  ]);
  const workingInText = hasWorkingShown(normText);

  if (procHits >= 1 || hasShownWorking || workingInText) {
    if (requiresConceptCheck(topic) && conceptReadiness === ConceptReadiness.UNVERIFIED) {
      trace.push(`B→A redirect: concept UNVERIFIED for topic ${topic}`);
      return {
        intent:           MathIntent.A_CONCEPT,
        topic,
        confidence:       'MEDIUM',
        probeQuestion:    buildProbeQuestion(topic),
        escalationActive: false,
        redirectScript:   null,
        _trace:           trace,
      };
    }
    trace.push(
      `B_PROCEDURE: procHits=${procHits}, workingInText=${workingInText}, hasShownWorking=${hasShownWorking}`,
    );
    return {
      intent:           MathIntent.B_PROCEDURE,
      topic,
      confidence:       procHits >= 2 || workingInText ? 'HIGH' : 'MEDIUM',
      probeQuestion:    null,
      escalationActive,
      redirectScript:   null,
      _trace:           trace,
    };
  }

  const conceptHits = countSignalHits(normText, [
    ...CONCEPT_SIGNALS_MS,
    ...CONCEPT_SIGNALS_EN,
  ]);

  if (conceptHits >= 1) {
    trace.push(`A_CONCEPT: conceptHits=${conceptHits}`);
    return {
      intent:           MathIntent.A_CONCEPT,
      topic,
      confidence:       conceptHits >= 2 ? 'HIGH' : 'MEDIUM',
      probeQuestion:    null,
      escalationActive: false,
      redirectScript:   null,
      _trace:           trace,
    };
  }

  trace.push('AMBIGUOUS: no clear signal — probe required');
  return {
    intent:           MathIntent.AMBIGUOUS,
    topic,
    confidence:       'LOW',
    probeQuestion:    buildProbeQuestion(topic),
    escalationActive: false,
    redirectScript:   null,
    _trace:           trace,
  };
}
