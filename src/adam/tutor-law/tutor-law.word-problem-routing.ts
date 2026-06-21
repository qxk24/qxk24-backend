/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Word Problem Routing
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

export function tutorQuestionIsQuadraticEquation(message: string): boolean {
  const t = message.trim();
  if (!t || t.length < 8) return false;

  return (
    /\bpersamaan\s+kuadratik\b/i.test(t)
    || /\bfungsi\s+kuadratik\b/i.test(t)
    || /x\s*[²2^]\s*[\+\−-]/i.test(t)
    || /\bf\s*\(\s*x\s*\)\s*=\s*0\b/i.test(t)
    || /\bmemfaktorkan\b|\bfaktorkan\b|\bfactor(?:ise|ize)\b/i.test(t)
    || /x\s*[²2]\s*[−-]\s*5\s*x/i.test(t)
    || /Cari\s+nilai\s+.*\bx\b/i.test(t) && /f\s*\(\s*x\s*\)/i.test(t)
  );
}

export function tutorThreadIsQuadraticContext(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  const blob = [userMessage, ...recentUserMessages, ...recentAssistantMessages].join('\n');
  return tutorQuestionIsQuadraticEquation(blob);
}
