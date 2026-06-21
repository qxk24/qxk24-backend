/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Auto-Closure Gate (S1)
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

import { tutorInferFurthestColumnInThread, tutorStudentFlagsTeachingLoopError } from './tutor-law.arithmetic-phase';
import { tutorThreadIsMultiStepArithmetic } from './tutor-law.arithmetic-proficiency';
import { threadHasMicroTeachingBlank } from './tutor-law.math-intent-detectors';
import type {
  TutorMathIntentMode,
  TutorMathSessionState,
  TutorMathTopic,
  TutorMathTurnContext,
} from './tutor-law.math-intent.types';

const ARITHMETIC_TOPICS: TutorMathTopic[] = [
  'arithmetic_place_value',
  'arithmetic_multi_op',
  'percentage_word',
  'fraction_remainder',
];

function looksLikeSessionFinalAnswer(message: string): boolean {
  const t = message.trim();
  if (!t || tutorStudentFlagsTeachingLoopError(t)) return false;
  if (/jawapan\s+akhir/i.test(t) && /\d/.test(t)) return true;
  if (/^[\d,]{3,}(?:\.\d+)?$/.test(t.replace(/\s/g, ''))) return true;
  return /^[\d,]+(?:\.\d+)?\s*(?:biji|buah|guli|orang|kotak|buku)\.?\s*$/i.test(t);
}

/** S1 — narrow auto-close: arithmetic with spontaneous working only. */
export function tutorTurnWarrantsAutoClosure(
  ctx: TutorMathTurnContext,
  mode: TutorMathIntentMode,
  topic: TutorMathTopic,
  state: TutorMathSessionState,
): boolean {
  if (mode === 'exam_block' || mode === 'teach_me' || mode === 'non_math') return false;
  if (topic === 'algebra_linear' || topic === 'algebra_quadratic') return false;
  if (!ARITHMETIC_TOPICS.includes(topic) && topic !== 'general_math') return false;

  const { userMessage, recentUserMessages, recentAssistantMessages } = ctx;

  if (tutorStudentFlagsTeachingLoopError(userMessage)) return false;

  const inMicro = tutorInferFurthestColumnInThread(
    recentUserMessages,
    recentAssistantMessages,
    userMessage,
  ) != null || threadHasMicroTeachingBlank(recentAssistantMessages);

  const spontaneousWorking = state.workingShown || inMicro;
  if (!spontaneousWorking) return false;

  const finalAnswerCue = looksLikeSessionFinalAnswer(userMessage);

  if (finalAnswerCue && spontaneousWorking) return true;

  if (
    inMicro
    && tutorThreadIsMultiStepArithmetic(userMessage, recentUserMessages, recentAssistantMessages)
  ) {
    return finalAnswerCue;
  }

  return false;
}
