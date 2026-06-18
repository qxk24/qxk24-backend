/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Law (L1)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */
import { ADAM_CHAT_MATH_NOTATION } from './adam-math-prompt';
import { paragraphIsUniversalScholarDoorOffer } from './adam-universal-scholar';
/** Pronouns forbidden in student-facing output — shared with guards (Fasa 4). */
export const USERS_FORBIDDEN_PRONOUNS = ['kau', 'kamu', 'engkau', 'aku'] as const;

export type StudentForbiddenPronoun = (typeof USERS_FORBIDDEN_PRONOUNS)[number];

/** Second-person pronouns (excludes aku — replaced with saya, not stripped). */
export const STUDENT_FORBIDDEN_ADDRESS_PRONOUNS = USERS_FORBIDDEN_PRONOUNS.filter(
  (p): p is Exclude<StudentForbiddenPronoun, 'aku'> => p !== 'aku',
);

const FORBIDDEN_PRONOUN_LIST = USERS_FORBIDDEN_PRONOUNS.join(', ');

export { FORBIDDEN_PRONOUN_LIST };

/** Regex alternation for guard patterns — `kau|kamu|engkau` or full list. */
export function studentForbiddenPronounAlternation(includeAku = false): string {
  const list = includeAku ? USERS_FORBIDDEN_PRONOUNS : STUDENT_FORBIDDEN_ADDRESS_PRONOUNS;
  return [...list].join('|');
}

export function buildStudentForbiddenPronounRegex(flags = 'gi'): RegExp {
  return new RegExp(`\\b(?:${studentForbiddenPronounAlternation(true)})\\b`, flags);
}

const ADDRESS_PRONOUN_PHRASE_FIXES: ReadonlyArray<readonly [RegExp, string]> = [
  [/Apa[kk]ah\s+yang\s+ingin\s+(?:kau|kamu|engkau)\s+kongsikan/gi, 'Apa yang ingin dikongsi'],
  [/Apa[kk]ah\s+yang\s+ingin\s+(?:kau|kamu|engkau)\b/gi, 'Apa yang ingin dikongsi'],
  [/Apa\s+yang\s+paling\s+ingin\s+(?:kau|kamu|engkau)\s+kembangkan/gi, 'Apa yang ingin dikembangkan seterusnya'],
  [/Apa\s+yang\s+ingin\s+(?:kau|kamu|engkau)\s+kongsikan/gi, 'Apa yang ingin dikongsi'],
];

/** Standalone Bismillah opener paragraph — drop on all consumer turns (L1 / OL-S03). */
export function paragraphIsBismillahOpenerOnly(paragraph: string): boolean {
  return /^\s*Bismillah(?:irahmanirrahim)?\.?\s*$/i.test(paragraph.trim());
}

/** Consumer universal voice — never open with Bismillah. */
export function stripUsersBismillahOpener(text: string): string {
  let out = text.replace(/^\uFEFF/, '');
  out = out.replace(
    /^(?:[\t \u00A0]*\r?\n)*\s*Bismillah(?:irahmanirrahim)?\.?\s*(?:\r?\n\s*)+/i,
    '',
  );
  out = out.replace(/^(\s*)Bismillah(?:irahmanirrahim)?\.?\s*(?:\r?\n\s*)+/im, '$1');
  out = out.replace(
    /^(\s*)Bismillah(?:irahmanirrahim)?\.?\s+(?=[A-ZÀ-ÿ0-9"(\[$])/im,
    '$1',
  );
  out = out.replace(
    /^(Hai\s+[^,\n]+,\s*)Bismillah(?:irahmanirrahim)?\.?\s*(?:\r?\n\s*)?/im,
    '$1',
  );
  out = out.replace(
    /^(Hai\s+[^,\n]+,\s*)Bismillah(?:irahmanirrahim)?\.?\s+(?=[A-ZÀ-ÿ])/im,
    '$1',
  );
  return out;
}

/** Post-stream pronoun sync — mirrors §1 BAHASA REGISTER (L1). */
export function sanitizeUsersForbiddenPronouns(text: string): string {
  let out = text;
  for (const [pattern, replacement] of ADDRESS_PRONOUN_PHRASE_FIXES) {
    out = out.replace(pattern, replacement);
  }
  out = out.replace(/\baku\b/gi, (match) => (match[0] === 'A' ? 'Saya' : 'saya'));
  out = out.replace(
    new RegExp(`\\b(?:${studentForbiddenPronounAlternation(false)})\\b`, 'gi'),
    '',
  );
  // Horizontal whitespace only — never collapse paragraph breaks (\n\n).
  return out
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/ +([.,!?;:])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

export function paragraphHasForbiddenStudentPronoun(paragraph: string): boolean {
  return buildStudentForbiddenPronounRegex('i').test(paragraph);
}
