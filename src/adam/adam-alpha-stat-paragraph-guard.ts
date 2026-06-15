/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Paragraph Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { LlmSearchResult } from '../llm/llm-types';
import {
  ALPHA_CONTEXT_REFUSAL_RE,
  ALPHA_DEFERRED_SEARCH_OFFER_RE,
  ALPHA_PORTAL_CATALOG_RE,
  ALPHA_STAT_PHILOSOPHY_SENTENCE_RE,
  GROWTH_PERCENT_ORPHAN_RE,
} from './adam-alpha-stat-patterns';
import { buildSearchEvidenceBlob } from './adam-alpha-stat-evidence';

/** Model offers to search later — forbidden on α stat turns where search already ran. */
export function paragraphIsAlphaDeferredSearchOffer(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  return ALPHA_DEFERRED_SEARCH_OFFER_RE.test(t);
}

/** Memory-law leakage on α stat turns after web search — forbidden opener. */
export function paragraphIsAlphaStatContextRefusal(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  const hasSearchGap = /\b(?:carian web pada giliran ini|tidak menemui angka rasmi)\b/i.test(t);
  if (hasSearchGap) return false;
  if (ALPHA_CONTEXT_REFUSAL_RE.test(t)) return true;
  if (/^Maklumat\s+jumlah/i.test(t) && /\bkonteks\s+semasa\b/i.test(t)) return true;
  return false;
}

/** Meta preamble — not Blok 1 direct answer (ADAM-α). */
export function paragraphIsAlphaStatMetaPreamble(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Soalan\s+anda\s+berkaitan\b/i.test(t)) return true;
  if (/\bSoalan\s+anda\s+berkaitan\b/i.test(t) && /\bSaya\s+telah\s+menjalankan\s+carian\b/i.test(t)) {
    return true;
  }
  if (/^Saya\s+telah\s+menjalankan\s+carian\b/i.test(t) && !/\b\d{1,3}(?:,\d{3})+\b/.test(t)) return true;
  return false;
}

/** Sentence fragment left after guard strip or stream cut — e.g. "2% berbanding sesi…". */
export function paragraphIsOrphanStatFragment(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (GROWTH_PERCENT_ORPHAN_RE.test(t)) return true;
  if (/^berbanding\s+sesi\b/i.test(t)) return true;
  if (/^,\s*(?:satu|menunjukkan|tanda)\b/i.test(t)) return true;
  if (/^(?:my|edu\.my)\)\.\s/i.test(t)) return true;
  if (/^\w{1,4}\)\.\s+[A-Z]/i.test(t) && !/verified via web search/i.test(t)) return true;
  if (/\bmy\)\s*,?\s*atau\b/i.test(t)) return true;
  if (/^Unit\s+Pengurusan\b/i.test(t) && t.length < 120) return true;
  return false;
}

export function paragraphIsAlphaStatPortalCatalog(
  paragraph: string,
  evidence: LlmSearchResult[],
): boolean {
  const t = paragraph.trim();
  if (!t || !ALPHA_PORTAL_CATALOG_RE.test(t)) return false;
  const blob = buildSearchEvidenceBlob(evidence);
  if (!blob.trim()) return true;
  const orgTokens = t.match(/\b[A-Z]{2,10}\b/g) ?? [];
  if (orgTokens.length === 0) return ALPHA_PORTAL_CATALOG_RE.test(t);
  return orgTokens.some((token) => token.length >= 3 && !blob.includes(token.toLowerCase()));
}

/** Factual stat line — keep even when a philosophy tail follows the figure. */
export function sentenceHasVerifiedStatFigure(sentence: string): boolean {
  const t = sentence.trim();
  if (!t) return false;
  return /\b\d{1,3}(?:,\d{3})+\s*(?:orang\s+)?(?:graduan|pelajar)\b/i.test(t)
    || /\b(?:meluluskan|menghasilkan|mempunyai|melayani)\b[^.]{0,120}\b\d{1,3}(?:,\d{3})+\b/i.test(t)
    || /\b(?:lebih\s+(?:daripada|kurang)\s+)?\d{1,3}(?:,\d{3})+\s+(?:orang\s+)?(?:pelajar|graduan)\b/i.test(t);
}

export function sentenceIsAlphaStatPhilosophyPadding(sentence: string): boolean {
  const t = sentence.trim();
  if (!t) return false;
  if (sentenceHasVerifiedStatFigure(t)) return false;
  return ALPHA_STAT_PHILOSOPHY_SENTENCE_RE.test(t)
    || paragraphIsAlphaDeferredSearchOffer(t);
}

export function paragraphIsAlphaStatPhilosophyPadding(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/verified via web search/i.test(t) && t.length < 220) return false;
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return ALPHA_STAT_PHILOSOPHY_SENTENCE_RE.test(t);
  return sentences.every(sentenceIsAlphaStatPhilosophyPadding);
}

/** Remove philosophy / offer sentences from a mixed paragraph — keep factual lines. */
export function filterPhilosophySentencesFromParagraph(paragraph: string): string {
  const sentences = paragraph.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const kept = sentences.filter(
    (s) => !sentenceIsAlphaStatPhilosophyPadding(s) && !paragraphIsAlphaDeferredSearchOffer(s),
  );
  return kept.join(' ').trim();
}

export function paragraphIsUnverifiedStatEstimate(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\(tiada angka disahkan dalam carian\)/.test(t)) return true;
  if (/\bdianggarkan berada dalam lingkungan\b/i.test(t)) return true;
  if (/\bkapasiti pengambilan tahunan sekitar\b/i.test(t) && !/verified via web search/i.test(t)) return true;
  return false;
}
