/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Arithmetic Proficiency Routing
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

export type TutorArithmeticProficiency = 'micro' | 'compact' | 'fluent';

const WEAK_SIGNALS = [
  /\btidak\s+tahu\b/i,
  /\btak\s+tahu\b/i,
  /\bsaya\s+rasa\s+awak\b/i,
  /\btak\s+faham\b/i,
];

const FLUENT_SIGNALS = [
  /\bpinjam(?:an)?\b.*\b(?:puluh|ratus|ribu|rumah)\b/i,
  /\bbawa(?:an)?\b.*\b(?:puluh|ratus|ribu)\b/i,
  /\brumah\s+(?:sa|puluh|ratus|ribu)\b/i,
  /\b(?:lebih\s+kecil|kurang\s+dari).*\bpinjam\b/i,
  /\b\d+\s*[−-]\s*\d+\s*=\s*\d+.*(?:puluh|ratus).*(?:berkurang|kurang)/i,
  /\bhendaklah\s+dipinjam\b/i,
];

const COMPACT_SIGNALS = [
  /\bbawa(?:an)?\b/i,
  /\bpinjam\b/i,
  /\btidak\s+boleh\s+tolak\b/i,
  /\bnilai\s+\d+\s+lebih\s+kecil\b/i,
];

/** Infer student arithmetic tier from recent answers (not first turn). */
export function tutorInferArithmeticProficiency(
  ...userMessages: string[]
): TutorArithmeticProficiency {
  const blob = userMessages.filter(Boolean).join('\n');
  if (!blob.trim()) return 'micro';

  if (FLUENT_SIGNALS.some((re) => re.test(blob))) return 'fluent';
  if (COMPACT_SIGNALS.some((re) => re.test(blob))) return 'compact';

  const numericAnswers = userMessages.filter((m) => /^\s*\d+\s*$/.test(m.trim()));
  if (numericAnswers.length >= 2) return 'compact';

  if (WEAK_SIGNALS.some((re) => re.test(blob))) return 'micro';

  return 'micro';
}

export function tutorThreadWarrantsCompactArithmetic(
  userMessage: string,
  recentUserMessages: string[] = [],
): boolean {
  const tier = tutorInferArithmeticProficiency(userMessage, ...recentUserMessages);
  return tier === 'compact' || tier === 'fluent';
}

export function tutorThreadIsMultiStepArithmetic(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  const blob = [userMessage, ...recentUserMessages, ...recentAssistantMessages].join('\n');
  return (
    /\b\d[\d,]*\s*[+\+\−-]\s*\d[\d,]*\s*[+\+\−-]\s*\d/.test(blob)
    || (/\btambah\b|\bmembeli\b|\bdilupuskan\b|\bdikurangkan\b/i.test(blob)
      && (blob.match(/\d[\d,]*/g)?.length ?? 0) >= 3)
  );
}
