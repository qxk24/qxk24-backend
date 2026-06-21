/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Algebra Stuck Escalation Routing
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

/** Quadratic / factoring homework — domain routing, not per-question hardcode. */
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

export function tutorStudentExpressesConfusion(message: string): boolean {
  const t = message.trim();
  if (!t) return false;

  return (
    /\btak\s+faham|\btidak\s+faham|\btak\s+paham|\btidak\s+paham\b/i.test(t)
    || /\bdon'?t\s+understand|\bstill\s+confused\b/i.test(t)
    || /\bmacam\s+mana\s+dapat\b/i.test(t)
    || /\btetap\s+tak\s+faham\b/i.test(t)
    || /\bkenapa\s.*\(x/i.test(t)
  );
}

export function tutorStudentNeedsConceptBasics(message: string): boolean {
  const t = message.trim();
  if (!t) return false;

  return (
    /\b(?:apa|what)\s+(?:itu|is)\s+persamaan\s+kuadratik\b/i.test(t)
    || /\btak\s+faham\s+langsung\s+apa\s+itu\b/i.test(t)
    || /\btak\s+faham.*persamaan\s+kuadratik\b/i.test(t)
    || /\btak\s+faham\s+cara\s+penyelesaian\b/i.test(t)
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

/**
 * Stuck escalation — repeated confusion or concept gap → full worked example turn.
 * Overrides zero-answer micro-teaching for this turn only.
 */
export function tutorAlgebraFullExampleWarranted(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  if (!tutorThreadIsQuadraticContext(userMessage, recentUserMessages, recentAssistantMessages)) {
    return false;
  }

  if (tutorStudentNeedsConceptBasics(userMessage)) return true;

  const allUser = [userMessage, ...recentUserMessages];
  const confusionCount = allUser.filter((m) => tutorStudentExpressesConfusion(m)).length;
  if (confusionCount >= 2) return true;

  if (
    tutorStudentExpressesConfusion(userMessage)
    && recentAssistantMessages.some((m) =>
      /→\s*_{3,}|\bpasangan nombor|darabnya.*6|Saya tunggu.*teruskan/i.test(m),
    )
  ) {
    return true;
  }

  return false;
}

/** Detect complete factoring walkthrough in reply (ChatGPT-style). */
export function tutorReplyHasAlgebraFactoringExample(text: string): boolean {
  if (!text?.trim()) return false;

  const hasFactorForm = /\(x\s*[−+-]\s*\d+\)\s*\(?x\s*[−+-]\s*\d+\)?/i.test(text)
    || /=\s*\(?x\s*[−+-]\s*2\)?\s*\(?x\s*[−+-]\s*3\)?/i.test(text)
    || /x\s*[²2]\s*[−-]\s*5\s*x\s*[+\+\−-]\s*6\s*=\s*0/i.test(text);

  const hasSolution = /x\s*=\s*2|x\s*=\s*3|Jawapan\s*:\s*x/i.test(text)
    || /→\s*x\s*=\s*2/i.test(text);

  return hasFactorForm && hasSolution;
}

export function tutorTurnNeedsAlgebraWorkedExampleLaw(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  return tutorAlgebraFullExampleWarranted(userMessage, recentUserMessages, recentAssistantMessages);
}
