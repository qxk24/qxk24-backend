/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Prose Sanitize
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-05
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Applies to every ADAM long-form reply — all languages, founder + student. */
export const ADAM_PROSE_DASH_LAW = `
ADAM PROSE DASH LAW (all languages, all writing modes — journal, article, essay, student reply):
- Do NOT use em dash (—), en dash (–), or spaced hyphen (-) to splice clauses inside flowing prose or numbered lists (first/second, pertama/kedua, etc.).
- Wrong: "Oral Literature — especially Spoken Word — is…" / "dinding jujur — bahawa ilmu…"
- Right: commas, "iaitu", "that is", "because", or a new sentence.
- Semicolons between list items are fine; dash bridges are not.
- Platform auto-sanitizes violations — still write clean prose.
`.trim();

/** Em/en dash clause bridges → comma-led prose (all languages). */
export function sanitizeAdamProseDashBridges(text: string): string {
  if (!text) return '';

  let out = text.replace(/\s*[—–]\s+/g, ', ');
  out = out.replace(/,\s*,+/g, ', ');
  out = out.replace(/;\s*,/g, '; ');
  out = out.replace(/\(\s*,/g, '(');
  return out.trim();
}

/** @deprecated Use sanitizeAdamProseDashBridges */
export const sanitizeMalayJournalDashBridges = sanitizeAdamProseDashBridges;
