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

import {
  applyBmLexiconReplacements,
  getBmLexiconDriftMarkerPattern,
  isBmLexiconLoaded,
} from '../malay-malaysia/bm-lexicon.service';
import type { SupportedLocale } from './adam-language-mirror.service';

/** Injected into language-mirror block for Malay turns. */
export const MALAYSIA_BM_LANGUAGE_DIRECTIVE = `
BAHASA MELAYU MALAYSIA (DBP) — BUKAN BAHASA INDONESIA:
- Tulis Bahasa Melayu Malaysia sahaja. Jangan campur perkataan Indonesia.
- Contoh wajib: kerana (bukan karena), boleh (bukan bisa), sudah (bukan udah), perlu (bukan butuh),
  teknikal (bukan teknis), berkesan (bukan efektif), cekap (bukan efisien), praktikal (bukan praktis).
- Dilarang: enggak, nggak, banget, gimana, kayak, dong, sih, aja, deh, memberikan, mengatakan.
- Ejaan DBP: semak reduplikasi — beramai-ramai (bukan berramai-ramai); jangan gandakan konsonan tidak perlu.
- Rujukan: surat khabar Malaysia, buku teks sekolah Malaysia, DBP.
- SUSUNAN: 1–4 perenggan pendek (sama kemas seperti jawapan English) — bukan senarai bullet, bernombor, atau esei Pertama/Kedua/Ketiga.
`.trim();

/** Fallback when lexicon file is unavailable — core Indonesian drift only. */
const FALLBACK_INDONESIAN_DRIFT_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/\bdikarenakan\b/gi, 'disebabkan'],
  [/\bkarena\b/gi, 'kerana'],
  [/\bbisa\b/gi, 'boleh'],
  [/\bgimana\b/gi, 'bagaimana'],
  [/\bbanget\b/gi, 'sangat'],
  [/\b(enggak|nggak|gak)\b/gi, 'tidak'],
  [/\budah\b/gi, 'sudah'],
  [/\bbutuh\b/gi, 'perlu'],
];

const FALLBACK_INDONESIAN_DRIFT_MARKERS =
  /\b(karena|dikarenakan|bisa|gimana|banget|enggak|nggak|gak|udah|butuh)\b/i;

export function isMalayReplyLocale(locale: SupportedLocale | string): boolean {
  return locale === 'ms' || locale === 'mixed-ms-en';
}

/**
 * Fixes extra "r" after ber- in reduplicated words: berramai-ramai → beramai-ramai.
 * Catches forms not listed explicitly in BM_SPELLING_CORRECTIONS.
 */
export function fixBmBerPrefixReduplicationSpelling(text: string): string {
  return text
    .replace(/\bberr([a-z]{2,})-\1\b/gi, 'ber$1-$1')
    .replace(/\bberr([aeiou][a-z]{2,})\b/gi, 'ber$1');
}

/** Sync strip/replace common Indonesian drift in Malay replies. */
export function sanitizeMalaysiaBmDrift(
  text: string,
  locale: SupportedLocale | string = 'ms',
): string {
  if (!text?.trim() || !isMalayReplyLocale(locale)) {
    return text;
  }

  let out = isBmLexiconLoaded()
    ? applyBmLexiconReplacements(text)
    : text;
  if (!isBmLexiconLoaded()) {
    for (const [pattern, replacement] of FALLBACK_INDONESIAN_DRIFT_REPLACEMENTS) {
      out = out.replace(pattern, replacement);
    }
  }
  out = fixBmBerPrefixReduplicationSpelling(out);

  return out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .trim();
}

export function containsIndonesianDrift(text: string): boolean {
  const lexiconPattern = getBmLexiconDriftMarkerPattern();
  if (lexiconPattern) return lexiconPattern.test(text);
  return FALLBACK_INDONESIAN_DRIFT_MARKERS.test(text);
}
