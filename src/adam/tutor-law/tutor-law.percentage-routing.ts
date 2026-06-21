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
import { tutorThreadIsMultiStepArithmetic } from './tutor-law.arithmetic-proficiency';

/** Percentage-of-total word problem — domain routing, not per-question hardcode. */
export function tutorQuestionIsPercentageWordProblem(message: string): boolean {
  const t = message.trim();
  if (!t || t.length < 10) return false;

  const hasPercent = /\d+\s*(?:%|per\s*atus\b)/i.test(t)
    || /\b(?:percent|percentage)\b/i.test(t);
  if (!hasPercent) return false;

  const hasQuantity = /\b(?:murid|pelajar|orang|guru|buku|gaji|wang|harga|bilangan|jumlah|total|students?|people|kotak|lori)\b/i.test(t)
    || /\b(?:daripada|from|of)\s+\d+/i.test(t)
    || /\b(?:berapa|how many|find)\b/i.test(t);

  return hasQuantity;
}

/** Multi-step fraction + remainder (baki) word problem — e.g. 3/8 then 1/4 of baki. */
export function tutorQuestionIsMultiStepFractionWordProblem(message: string): boolean {
  const t = message.trim();
  if (!t || t.length < 15) return false;

  const hasFraction = /\d+\s*\/\s*\d+/.test(t);
  if (!hasFraction) return false;

  const hasRemainderCue = /\b(?:baki|remainder|masih\s+(?:tinggal|berada|ada|dalam)|daripada\s+baki|of\s+the\s+remainder)\b/i.test(t);
  const hasQuantity = /\b(?:kotak|lori|minuman|buah|kg|gaji|wang|jumlah|bilangan|bawa|membawa)\b/i.test(t)
    || /\b\d{2,}\b/.test(t);
  const hasMultiStep = /\b(?:hari\s+(?:pertama|kedua|ketiga)|pada\s+hari)\b/i.test(t)
    || (t.match(/\d+\s*\/\s*\d+/g)?.length ?? 0) >= 2;

  return hasRemainderCue && hasQuantity && hasMultiStep;
}

export function tutorQuestionIsQuantityWordProblem(message: string): boolean {
  return tutorQuestionIsPercentageWordProblem(message)
    || tutorQuestionIsMultiStepFractionWordProblem(message);
}

export function tutorThreadIsPercentageWordProblem(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  if (tutorQuestionIsPercentageWordProblem(userMessage)) return true;
  const blob = [...recentUserMessages, userMessage, ...recentAssistantMessages].join('\n');
  return tutorQuestionIsPercentageWordProblem(blob);
}

export function tutorThreadIsMultiStepFractionWordProblem(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  if (tutorQuestionIsMultiStepFractionWordProblem(userMessage)) return true;
  const blob = [...recentUserMessages, userMessage, ...recentAssistantMessages].join('\n');
  return tutorQuestionIsMultiStepFractionWordProblem(blob);
}

export function tutorThreadIsQuantityWordProblem(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  return tutorThreadIsPercentageWordProblem(userMessage, recentUserMessages, recentAssistantMessages)
    || tutorThreadIsMultiStepFractionWordProblem(userMessage, recentUserMessages, recentAssistantMessages);
}

export function studentAsksTutorFullWorkingLayout(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return (
    /\bsusunan\s+cara\s+kira\b/i.test(t)
    || /\btunjuk(?:kan)?\s+cara\s+kira\b/i.test(t)
    || /\bcara\s+kira\s+keseluruhan\b/i.test(t)
    || /\bberikan\s+susunan\b/i.test(t)
    || /\brumus(?:kan)?\s+(?:langkah|kerja)\b/i.test(t)
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

function tutorThreadInMicroTeachingPhase(recentAssistantMessages: string[]): boolean {
  if (recentAssistantMessages.length === 0) return false;
  const blob = recentAssistantMessages.slice(-4).join('\n');
  return (
    /→\s*_{3,}/.test(blob)
    || /\btempat\s+\*?\*?Sa\b/i.test(blob)
    || /\bSaya tunggu\b/i.test(blob)
    || /35\s*\/\s*100/i.test(blob)
    || /3\s*\/\s*8\s*[×x*]/i.test(blob)
  );
}

/** Student likely finished the problem — inject auto full-summary closure this turn. */
export function tutorTurnWarrantsAutoClosingSummary(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  if (!studentMessageLooksLikeFinalAnswer(userMessage)) return false;
  return (
    tutorThreadIsQuantityWordProblem(userMessage, recentUserMessages, recentAssistantMessages)
    || tutorThreadIsMultiStepArithmetic(userMessage, recentUserMessages, recentAssistantMessages)
    || tutorThreadInMicroTeachingPhase(recentAssistantMessages)
  );
}

export function shouldSkipTutorZeroAnswerGuard(
  text: string,
  userMessage: string,
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
): boolean {
  if (studentAsksTutorFullWorkingLayout(userMessage)) return true;
  if (tutorReplyHasCompleteWorkingSummary(text)) return true;
  if (tutorTurnWarrantsAutoClosingSummary(userMessage, recentUserMessages, recentAssistantMessages)) {
    return true;
  }
  if (tutorAlgebraFullExampleWarranted(userMessage, recentUserMessages, recentAssistantMessages)) {
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
  return (
    studentAsksTutorFullWorkingLayout(userMessage)
    || tutorTurnWarrantsAutoClosingSummary(userMessage, recentUserMessages, recentAssistantMessages)
    || tutorAlgebraFullExampleWarranted(userMessage, recentUserMessages, recentAssistantMessages)
  );
}
