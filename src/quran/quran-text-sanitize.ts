/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Quran Text Sanitize
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Translations must be AYAT only — never bracketed tafsir footnotes.
 */

/** Remove tafsir footnotes, HTML notes, and editorial brackets from translation text. */
export function sanitizeQuranTranslation(text: string): string {
  return text
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Arabic Uthmani text — preserve diacritics; trim only. */
export function sanitizeQuranArabic(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
