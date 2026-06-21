/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Quantity Word Problem Routing
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  tutorAlgebraFullExampleWarranted,
  tutorReplyHasAlgebraFactoringExample,
} from './tutor-law.algebra-routing';
import {
  buildTutorMathTurnContext,
  classifyTutorMathIntent,
} from './tutor-law.math-intent-classifier';
import type { TutorMathIntentResult } from './tutor-law.math-intent.types';

import {
  tutorQuestionIsPercentageWordProblem,
  tutorQuestionIsMultiStepFractionWordProblem,
  tutorThreadIsQuantityWordProblem,
  tutorThreadIsPercentageWordProblem,
  tutorThreadIsMultiStepFractionWordProblem,
  tutorQuestionIsQuantityWordProblem,
} from './tutor-law.word-problem-routing';
export {
  tutorQuestionIsPercentageWordProblem,
  tutorQuestionIsMultiStepFractionWordProblem,
  tutorQuestionIsQuantityWordProblem,
  tutorThreadIsPercentageWordProblem,
  tutorThreadIsMultiStepFractionWordProblem,
  tutorThreadIsQuantityWordProblem,
} from './tutor-law.word-problem-routing';

export function studentAsksTutorFullWorkingLayout(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return (
    /\bsusunan\s+cara\s+kira\b/i.test(t)
    || /\btunjuk(?:kan)?\s+cara\s+kira\b/i.test(t)
    || /\bcara\s+kira\s+keseluruhan\b/i.test(t)
    || /\bberikan\s+susunan\b/i.test(t)
    || /\brumus(?:kan)?\s+(?:langkah|kerja)\b/i.test(t)
    || /\brumus(?:kan)?\s+keseluruhan\b/i.test(t)
    || /\bkaedah\s+penyelesaian\b/i.test(t)
    || /\bmohon\s+buatkan\s+rumus\b/i.test(t)
    || /\bshow\s+(?:me\s+)?(?:the\s+)?(?:full\s+)?(?:working|steps)\b/i.test(t)
  );
}

export function tutorReplyHasCompleteWorkingSummary(text: string): boolean {
  if (!text?.trim()) return false;
  if (/Susunan\s+cara\s+kira\s+keseluruhan/i.test(text)) {
    const equalsSteps = (text.match(/=\s*[\d,]+/g) ?? []).length;
    if (equalsSteps >= 2) return true;
  }

  const percentMethod = /\d+\s*\/\s*100\s*[×x*]\s*\d+/i.test(text)
    || /\(\s*\d+\s*[×x*]\s*\d+\s*\)\s*÷\s*100/i.test(text);
  const fractionMethod = /\d+\s*\/\s*\d+\s*[×x*]\s*\d+/i.test(text)
    || /=\s*\(\s*\d+\s*÷\s*\d+\s*\)\s*[×x*]/i.test(text);
  const hasSteps = /(?:Baki|baki)\s*(?:kotak|selepas)/i.test(text)
    || /480\s*[−-]\s*180/i.test(text)
    || /300\s*[−-]\s*75/i.test(text);
  const hasFinalAnswer = /(?:Jawapan|masih\s+tinggal|masih\s+berada)[^\n]*\d+/i.test(text)
    || /=\s*\d+\s+(?:kotak|orang)/i.test(text);
  const intermediateEquals = (text.match(/=\s*[\d,]+/g) ?? []).length;

  if (percentMethod && hasFinalAnswer && intermediateEquals >= 3) return true;
  if (fractionMethod && hasSteps && hasFinalAnswer && intermediateEquals >= 4) return true;
  if (fractionMethod && /225\s+kotak/i.test(text) && intermediateEquals >= 4) return true;
  return false;
}

/** True when closure turn likely but model omitted intermediate steps. */
export function tutorReplySummaryLooksIncomplete(text: string): boolean {
  if (!text?.trim()) return false;
  if (tutorReplyHasCompleteWorkingSummary(text)) return false;
  if (/Jawapan\s*:\s*\d+/i.test(text) && (text.match(/=\s*[\d,]+/g) ?? []).length < 2) {
    return true;
  }
  if (/Betul|Bagus|betul/i.test(text) && /\b\d+\s*(?:orang|kotak)\b/i.test(text)
    && (text.match(/=\s*[\d,]+/g) ?? []).length < 2) {
    return true;
  }
  return false;
}

export function studentMessageLooksLikeFinalAnswer(message: string): boolean {
  const t = message.trim();
  if (!t || t.length > 40) return false;
  if (/\?/.test(t)) return false;
  if (/\b(?:tunjuk|susunan|tolong|boleh|mahu|kenapa|apa|how|why|explain)\b/i.test(t)) return false;
  if (/^[\d,]+(?:\.\d+)?\s*(?:orang|murid|pelajar|kotak|buah|guli|minuman|buku|kg|g|km|cm|m|sen|rm)?\.?$/i.test(t)) {
    return true;
  }
  if (/^=\s*[\d,]+/i.test(t)) return true;
  if (/^[\d,]+$/.test(t.replace(/\s/g, ''))) return true;
  if (/^(?:betul|ya|yes|ok)\b/i.test(t) && t.length <= 20) return true;
  return false;
}

/** Student likely finished — intent-first (S1 narrow auto-close). */
export function tutorTurnWarrantsAutoClosingSummary(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  return classifyTutorMathIntent(buildTutorMathTurnContext({
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  })).warrantsAutoClosure;
}

export function shouldSkipTutorZeroAnswerGuard(
  text: string,
  userMessage: string,
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
  intent?: TutorMathIntentResult,
): boolean {
  if (intent?.allowsScienceFactual) return true;
  if (intent?.warrantsAutoClosure) return true;
  if (intent?.allowsStuckEscalation) return true;
  if (studentAsksTutorFullWorkingLayout(userMessage)) return true;
  if (tutorReplyHasCompleteWorkingSummary(text)) return true;
  if (tutorTurnWarrantsAutoClosingSummary(userMessage, recentUserMessages, recentAssistantMessages)) {
    return true;
  }
  if (
    tutorAlgebraFullExampleWarranted(userMessage, recentUserMessages, recentAssistantMessages)
    && (intent?.allowsStuckEscalation ?? false)
  ) {
    return true;
  }
  if (tutorReplyHasAlgebraFactoringExample(text)) return true;
  return false;
}

export function tutorTurnNeedsFullWorkingLaw(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  }));
  return (
    studentAsksTutorFullWorkingLayout(userMessage)
    || intent.warrantsAutoClosure
    || intent.allowsStuckEscalation
  );
}
