/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Malaysia BM Guard
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

import type { SupportedLocale } from './adam-language-mirror.service';

/** Injected into language-mirror block for Malay turns. */
export const MALAYSIA_BM_LANGUAGE_DIRECTIVE = `
BAHASA MELAYU MALAYSIA (DBP) — BUKAN BAHASA INDONESIA:
- Tulis Bahasa Melayu Malaysia sahaja. Jangan campur perkataan Indonesia.
- Contoh wajib: kerana (bukan karena), boleh (bukan bisa), sudah (bukan udah), perlu (bukan butuh),
  teknikal (bukan teknis), berkesan (bukan efektif), cekap (bukan efisien), praktikal (bukan praktis).
- Dilarang: enggak, nggak, banget, gimana, kayak, dong, sih, aja, deh, memberikan, mengatakan.
- Rujukan: surat khabar Malaysia, buku teks sekolah Malaysia, DBP.
`.trim();

const INDONESIAN_DRIFT_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/\bdikarenakan\b/gi, 'disebabkan'],
  [/\bkarena\b/gi, 'kerana'],
  [/\bmembutuhkan\b/gi, 'memerlukan'],
  [/\bbutuh\b/gi, 'perlu'],
  [/\bmemberikan\b/gi, 'memberi'],
  [/\bmengatakan\b/gi, 'menyebut'],
  [/\bbisa\b/gi, 'boleh'],
  [/\bgimana\b/gi, 'bagaimana'],
  [/\bbanget\b/gi, 'sangat'],
  [/\b(enggak|nggak|gak)\b/gi, 'tidak'],
  [/\budah\b/gi, 'sudah'],
  [/\bteknis\b/gi, 'teknikal'],
  [/\bpraktis\b/gi, 'praktikal'],
  [/\befektif\b/gi, 'berkesan'],
  [/\befisien\b/gi, 'cekap'],
  [/\bteologis\b/gi, 'teologi'],
  [/\bhistoris\b/gi, 'bersejarah'],
  [/\bsistematis\b/gi, 'sistematik'],
  [/\bkayak\b/gi, 'seperti'],
  [/\bpastinya\b/gi, 'sudah tentu'],
  [/\bjikalau\b/gi, 'jika'],
  [/\bdong\b/gi, ''],
  [/\bsih\b/gi, ''],
  [/\bdeh\b/gi, ''],
  [/\baja\b/gi, ''],
];

const INDONESIAN_DRIFT_MARKERS =
  /\b(karena|dikarenakan|bisa|gimana|banget|enggak|nggak|gak|udah|butuh|membutuhkan|memberikan|kayak|dong|sih|deh)\b/i;

export function isMalayReplyLocale(locale: SupportedLocale | string): boolean {
  return locale === 'ms' || locale === 'mixed-ms-en';
}

/** Sync strip/replace common Indonesian drift in Malay replies. */
export function sanitizeMalaysiaBmDrift(
  text: string,
  locale: SupportedLocale | string = 'ms',
): string {
  if (!text?.trim() || !isMalayReplyLocale(locale)) {
    return text;
  }

  let out = text;
  for (const [pattern, replacement] of INDONESIAN_DRIFT_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }

  return out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .trim();
}

export function containsIndonesianDrift(text: string): boolean {
  return INDONESIAN_DRIFT_MARKERS.test(text);
}
