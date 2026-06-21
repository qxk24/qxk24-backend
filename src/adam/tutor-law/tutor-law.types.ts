/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Types & Language Utils
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

export type AdamTutorLevel = 'primary' | 'secondary' | 'university';

export type AdamTutorCurriculum =
  | 'national'
  | 'international'
  | 'us'
  | 'uk'
  | 'other';

export type AdamTutorLanguage =
  | 'english'
  | 'malay'
  | 'arabic'
  | 'mandarin'
  | 'tamil'
  | 'indonesian'
  | 'spanish'
  | 'french'
  | 'other';

export interface AdamTutorProfile {
  level:       AdamTutorLevel;
  curriculum:  AdamTutorCurriculum | string;
  language?:   AdamTutorLanguage | string;
  /** e.g. "Year 10", "Grade 8", "Tingkatan 4" */
  yearLabel?:   string;
  /** ISO 3166-1 alpha-2 — e.g. MY, SG */
  countryCode?: string;
  /** Exam board or syllabus detail */
  localeNote?:  string;
}

export function normalizeTutorLanguage(raw: unknown): AdamTutorLanguage {
  const allowed: AdamTutorLanguage[] = [
    'english', 'malay', 'arabic', 'mandarin', 'tamil',
    'indonesian', 'spanish', 'french', 'other',
  ];
  if (typeof raw === 'string' && (allowed as string[]).includes(raw)) {
    return raw as AdamTutorLanguage;
  }
  return 'english';
}

/** Classroom title — Cikgu (Malay), Teacher (English), etc. */
export function tutorTeacherTitle(language: AdamTutorLanguage): string {
  switch (language) {
    case 'malay':      return 'Cikgu';
    case 'arabic':     return 'Ustaz';
    case 'indonesian': return 'Guru';
    case 'french':     return 'Professeur';
    case 'spanish':    return 'Profesor';
    default:           return 'Teacher';
  }
}

export function tutorLanguageInstruction(language: AdamTutorLanguage): string {
  switch (language) {
    case 'malay':
      return 'Reply in Malay (Bahasa Malaysia). Use Malaysian vocabulary, not Indonesian.';
    case 'arabic':
      return 'Reply in Modern Standard Arabic unless the student uses a dialect — then match gently.';
    case 'mandarin':
      return 'Reply in Mandarin Chinese (Simplified or Traditional — match the student).';
    case 'tamil':
      return 'Reply in Tamil.';
    case 'indonesian':
      return 'Reply in Indonesian (Bahasa Indonesia).';
    case 'spanish':
      return 'Reply in Spanish.';
    case 'french':
      return 'Reply in French.';
    case 'other':
      return 'Reply in the same language the student writes in — detect from their messages.';
    default:
      return 'Reply in English unless the student clearly prefers another language.';
  }
}

export function inferTutorLanguageFromText(
  text: string,
  profile?: AdamTutorProfile,
): AdamTutorLanguage {
  const profileLang = normalizeTutorLanguage(profile?.language);
  if (profileLang !== 'english') return profileLang;

  const sample = text.slice(0, 1200);
  const malayHints = [
    /\b(?:yang|dengan|untuk|adalah|tidak|soalan|cuba|tulis|jawapan|pelajar|bila|apakah|ialah|maka|betul|jika|langkah|akhirnya|cikgu|kamu|kita|kenapa|operasi|persamaan|tolak|tambah)\b/gi,
  ];
  let malayScore = 0;
  for (const re of malayHints) {
    const hits = sample.match(re);
    malayScore += hits?.length ?? 0;
  }
  if (malayScore >= 3) return 'malay';
  return profileLang;
}
