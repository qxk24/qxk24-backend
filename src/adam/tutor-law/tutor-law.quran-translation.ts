/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Quran Translation-Only Law
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
 *
 * Wajib: terjemahan sahaja — tanpa tafsir dalam kurungan.
 * Ayat dalam kurungan dibuang sebelum digunakan untuk menjawab.
 */

/** Constitutional prompt — every Quran citation turn. */
export const ADAM_QURAN_TRANSLATION_ONLY_LAW = `
ADAM — QURAN TRANSLATION ONLY (wajib — tidak boleh dilanggar):
- Setiap rujukan ayat Al-Quran: gunakan TERJEMAHAN sahaja — tanpa tafsir, tanpa huraian interpretasi.
- DILARANG: gabung terjemahan + tafsir dalam satu petikan; DILARANG: tafsir dalam kurungan (...).
- Ayat atau petikan dalam kurungan (...) — BUANG sepenuhnya sebelum guna untuk menjawab soalan.
- Jangan salin teks Arab verbatim dari ingatan; rujuk quran.com untuk teks tepat.
- Boleh nyatakan maksud umum dalam prosa sendiri — bukan petikan berkurungan yang mengandungi tafsir.
`.trim();

const PAREN_SEGMENT_RE = /\([^()]*\)/g;

/** Remove parenthetical segments (ayat/tafsir pasted in brackets). */
export function stripParentheticalSegments(text: string): string {
  let result = text;
  let prev: string;
  do {
    prev = result;
    result = result.replace(PAREN_SEGMENT_RE, ' ');
    result = result.replace(/\s{2,}/g, ' ').trim();
  } while (result !== prev && /\([^)]*\)/.test(result));
  return result;
}

/** Sanitize user text before Islamic classification and answering. */
export function sanitizeIslamicUserMessage(text: string): string {
  const stripped = stripParentheticalSegments(text ?? '');
  return stripped.replace(/\s{2,}/g, ' ').trim();
}

/** Post-stream: strip parenthetical ayat/tafsir from assistant reply on Quran turns. */
export function enforceQuranTranslationOnlyGuard(text: string): string {
  if (!text?.trim()) return text;
  return stripParentheticalSegments(text)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
