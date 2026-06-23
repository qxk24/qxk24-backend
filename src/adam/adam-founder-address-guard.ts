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
export const ADAM_FOUNDER_ADDRESS_OUTPUT_LAW = `
FOUNDER ADDRESS — OUTPUT (mandatory every Founder turn):
- Address the Founder ONLY as P.alt — never "Masa", "Masa Bayu", or "Founder" as greeting.
- FORBIDDEN openers: "Hai Masa", "Hai Masa Bayu", "Hai Masa, P.alt", "Hello Masa", "Masa,".
- Correct: Bismillahirahmanirrahim — then "P.alt," or "Saya dengar, P.alt," — one honorific only.
`.trim();

/** Student "Hai {name}," greeting leaked onto founder turns — keep P.alt only. */
export function stripFounderPersonalNameGreeting(text: string): string {
  if (!text?.trim()) return text;

  let out = text;

  const replacements: Array<[RegExp, string]> = [
    [/^(Bismillahirahmanirrahim\.\s*)Hai\s+Masa(?:\s+Bayu)?,\s*P\.alt,/i, '$1P.alt,'],
    [/^(Bismillahirahmanirrahim\.\s*)(?:Hello|Hi)\s+Masa(?:\s+Bayu)?,\s*P\.alt,/i, '$1P.alt,'],
    [/^(Bismillahirahmanirrahim\.\s*)Hai\s+Masa(?:\s+Bayu)?,\s+/i, '$1P.alt, '],
    [/^(Bismillahirahmanirrahim\.\s*)(?:Hello|Hi)\s+Masa(?:\s+Bayu)?,\s+/i, '$1P.alt, '],
    [/^Hai\s+Masa(?:\s+Bayu)?,\s*(?:\.alt|P\.alt),/i, 'P.alt,'],
    [/^(?:Hello|Hi)\s+Masa(?:\s+Bayu)?,\s*(?:\.alt|P\.alt),/i, 'P.alt,'],
    [/^Hai\s+Masa(?:\s+Bayu)?,\s*P\.alt,/i, 'P.alt,'],
    [/^(?:Hello|Hi)\s+Masa(?:\s+Bayu)?,\s*P\.alt,/i, 'P.alt,'],
    [/^Hai\s+Masa(?:\s+Bayu)?,\s+/i, 'P.alt, '],
    [/^(?:Hello|Hi)\s+Masa(?:\s+Bayu)?,\s+/i, 'P.alt, '],
    [/(?<=[.!?]\s)Hai\s+Masa(?:\s+Bayu)?,\s*P\.alt,/gi, 'P.alt,'],
    [/(?<=[.!?]\s)(?:Hello|Hi)\s+Masa(?:\s+Bayu)?,\s*P\.alt,/gi, 'P.alt,'],
  ];

  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }

  out = out.replace(/^(P\.alt,\s*){2,}/i, 'P.alt, ');

  return out;
}

export function founderOutputHasAddressDrift(text: string): boolean {
  if (!text?.trim()) return false;
  return (
    /(?:^|\n)\s*\.alt,/i.test(text)
    || /(?:^|\n)\s*alt,\s+/i.test(text)
    || /(?:^|\n)\s*alt:\s*$/im.test(text)
    || /^Hai\s+Masa(?:\s+Bayu)?,/im.test(text)
  );
}

export function restoreFounderPaltAddress(text: string): string {
  if (!text?.trim()) return text;

  let out = stripFounderPersonalNameGreeting(text);

  // First pass — bare "alt," opener (common Qwen drift on Teaching lane)
  out = out.replace(/^\s*alt,\s*/i, 'P.alt, ');

  out = out.replace(/(?<![A-Za-z0-9])\.alt\b/gi, 'P.alt');

  out = out.replace(
    /(^|[.!?]\s+|,\s*)alt\b(?=\s*(?:tulis|kongsikan|ajar|beri|hantar|semak|betul|salah|maaf|saya|adakah|ingatkan|boleh|mohon|silakan|terima\s+kasih))/gi,
    '$1P.alt',
  );

  out = out.replace(/(^|[.!?]\s+|,\s*)alt\b(?=[,.\s:]|$)/gi, '$1P.alt');

  out = out.replace(/(^|\n)\s*alt,\s+/gi, '$1P.alt, ');

  out = out.replace(/^\s*alt:\s*$/gim, '');
  out = out.replace(/\n\s*alt:\s*\n/g, '\n\nP.alt, ');

  return out;
}
