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
import { ADAM_BM_VOICE_IDENTITY } from './adam-language-prompts';
import type { SupportedLocale } from './adam-language-mirror.service';
import {
  restoreAdamVisualDrawBlocks,
  stashAdamVisualDrawBlocks,
} from './adam-visual-draw-guard';
import {
  restoreAdamTechnicalDiagramBlocks,
  stashAdamTechnicalDiagramBlocks,
} from './adam-technical-diagram-guard';
import {
  restoreAdamChatMediaBlocks,
  stashAdamChatMediaBlocks,
} from './adam-media-guard';

/** Injected into language-mirror block for Malay turns. */
export const MALAYSIA_BM_LANGUAGE_DIRECTIVE = `
BAHASA MELAYU MALAYSIA — BUKAN BAHASA INDONESIA:
${ADAM_BM_VOICE_IDENTITY}
- Elak drift Indonesia: kerana (bukan karena), boleh (bukan bisa), sudah (bukan udah), perlu (bukan butuh),
  keperluan (bukan kebutuhan), pelbagai (bukan berbagai),
  teknikal (bukan teknis), berkesan (bukan efektif), cekap (bukan efisien), praktikal (bukan praktis).
- Dilarang: enggak, nggak, banget, gimana, kayak, dong, sih, aja, deh, memberikan, mengatakan.
- Ejaan Malaysia: semak reduplikasi — beramai-ramai (bukan berramai-ramai); jangan gandakan konsonan tidak perlu.
- SUSUNAN: perenggan mengalir — boleh pendek atau panjang ikut nada soalan; bukan skeleton Pertama/Kedua/Ketiga.
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
  [/\bkebutuhan\b/gi, 'keperluan'],
  [/\bberbagai\b/gi, 'pelbagai'],
  [/\bteknis\b/gi, 'teknikal'],
  [/\bpraktis\b/gi, 'praktikal'],
  [/\befektif\b/gi, 'berkesan'],
  [/\befisien\b/gi, 'cekap'],
  [/\bsisa perut\b/gi, 'najis'],
  [/\bmemberikan\b/gi, 'memberi'],
  [/\bmengatakan\b/gi, 'berkata'],
];

const FALLBACK_INDONESIAN_DRIFT_MARKERS =
  /\b(karena|dikarenakan|bisa|gimana|banget|enggak|nggak|gak|udah|butuh|kebutuhan|berbagai|teknis|praktis|efektif|efisien|memberikan|mengatakan)\b/i;

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

  let out = text;
  if (isBmLexiconLoaded()) {
    out = applyBmLexiconReplacements(out);
  }
  for (const [pattern, replacement] of FALLBACK_INDONESIAN_DRIFT_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  out = fixBmBerPrefixReduplicationSpelling(out);

  const drawVault = stashAdamVisualDrawBlocks(out);
  const diagramVault = stashAdamTechnicalDiagramBlocks(drawVault.prose);
  const mediaVault = stashAdamChatMediaBlocks(diagramVault.prose);
  out = mediaVault.prose
    .replace(/[ \t\u00A0]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/([(\[])[ \t]+/g, '$1')
    .trim();
  out = restoreAdamTechnicalDiagramBlocks(out, diagramVault.blocks);
  out = restoreAdamChatMediaBlocks(out, mediaVault.blocks);
  return restoreAdamVisualDrawBlocks(out, drawVault.blocks);
}

export function containsIndonesianDrift(text: string): boolean {
  const lexiconPattern = getBmLexiconDriftMarkerPattern();
  if (lexiconPattern) return lexiconPattern.test(text);
  return FALLBACK_INDONESIAN_DRIFT_MARKERS.test(text);
}
