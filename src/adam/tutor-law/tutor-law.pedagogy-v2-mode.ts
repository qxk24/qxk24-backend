/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pedagogy v2 Mode
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

import {
  studentAcceptedPracticeOffer,
  threadOfferedPractice,
} from './tutor-law.pedagogy-v2.signals';
import {
  PedagogyV2Intent,
  type PedagogyV2ClassifierOutput,
  type PedagogyV2SessionState,
  type PedagogyV2TurnInput,
  type PedagogyV2TurnResult,
} from './tutor-law.pedagogy-v2.types';

export function defaultPedagogyV2SessionState(): PedagogyV2SessionState {
  return {
    feynmanDelivered:        false,
    formativeQuizStarted:    false,
    formativeQuestionsAsked: 0,
    metacognitionDelivered:  false,
    practiceOfferAccepted:   false,
  };
}

export function derivePedagogyV2SessionState(
  input: PedagogyV2TurnInput,
): PedagogyV2SessionState {
  const base = defaultPedagogyV2SessionState();
  const assistants = input.recentAssistantMessages ?? [];
  const msg = input.userMessage ?? '';

  if (threadOfferedPractice(assistants) && studentAcceptedPracticeOffer(msg)) {
    base.practiceOfferAccepted = true;
    base.formativeQuizStarted = true;
  }

  return base;
}

export function mergePedagogyV2SessionState(
  prior: Partial<PedagogyV2SessionState> | undefined,
  derived: PedagogyV2SessionState,
): PedagogyV2SessionState {
  return {
    feynmanDelivered:
      (prior?.feynmanDelivered ?? false) || derived.feynmanDelivered,
    formativeQuizStarted:
      (prior?.formativeQuizStarted ?? false) || derived.formativeQuizStarted,
    formativeQuestionsAsked: Math.max(
      prior?.formativeQuestionsAsked ?? 0,
      derived.formativeQuestionsAsked,
    ),
    metacognitionDelivered:
      (prior?.metacognitionDelivered ?? false) || derived.metacognitionDelivered,
    practiceOfferAccepted:
      (prior?.practiceOfferAccepted ?? false) || derived.practiceOfferAccepted,
  };
}

export function commitPedagogyV2SessionState(
  state: PedagogyV2SessionState,
  output: PedagogyV2ClassifierOutput,
): PedagogyV2SessionState {
  return {
    ...state,
    feynmanDelivered:
      state.feynmanDelivered
      || output.intent === PedagogyV2Intent.FEYNMAN,
    formativeQuizStarted:
      state.formativeQuizStarted
      || output.intent === PedagogyV2Intent.FORMATIVE_QUIZ,
    formativeQuestionsAsked:
      output.intent === PedagogyV2Intent.FORMATIVE_QUIZ
        ? state.formativeQuestionsAsked + 1
        : state.formativeQuestionsAsked,
    metacognitionDelivered:
      state.metacognitionDelivered
      || output.intent === PedagogyV2Intent.METACOGNITION,
    practiceOfferAccepted:
      state.practiceOfferAccepted
      || output.intent === PedagogyV2Intent.FORMATIVE_QUIZ,
  };
}

export function buildPedagogyV2TurnResult(
  output: PedagogyV2ClassifierOutput,
  sessionState: PedagogyV2SessionState,
): PedagogyV2TurnResult {
  return {
    output,
    sessionState,
    nextSessionState: commitPedagogyV2SessionState(sessionState, output),
  };
}

export function pedagogyV2SkipsZeroAnswer(output: PedagogyV2ClassifierOutput): boolean {
  return (
    output.intent === PedagogyV2Intent.FEYNMAN
    || output.intent === PedagogyV2Intent.ITHINK_MAP
    || output.intent === PedagogyV2Intent.CROSS_CURRICULAR
    || output.intent === PedagogyV2Intent.FORMATIVE_QUIZ
    || output.intent === PedagogyV2Intent.METACOGNITION
  );
}
