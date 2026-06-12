/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Founder Address Guard
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Common Qwen drift: P.alt → .alt or bare "alt" when addressing the Founder. */
export function restoreFounderPaltAddress(text: string): string {
  if (!text?.trim()) return text;

  let out = text;

  out = out.replace(/(?<![A-Za-z0-9])\.alt\b/gi, 'P.alt');

  out = out.replace(
    /(^|[.!?]\s+|,\s*)alt\b(?=\s*(?:tulis|kongsikan|ajar|beri|hantar|semak|betul|salah|maaf|saya|adakah|ingatkan|boleh|mohon|silakan|terima\s+kasih))/gi,
    '$1P.alt',
  );

  out = out.replace(/(^|[.!?]\s+|,\s*)alt\b(?=[,.\s:]|$)/gi, '$1P.alt');

  return out;
}
