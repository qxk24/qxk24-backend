/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Terminal Responses
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
  extractStatSubjectFromMessage,
  filterOfficialSubjectStatHits,
  searchHitsIncludeSubjectToken,
} from './adam-official-source-enrich';
import { extractVerifiedStatFigureFromEvidence } from './adam-alpha-stat-evidence';
import {
  buildAlphaStatFigureLedOpener,
  buildAlphaStatFigureLedReply,
} from './adam-alpha-stat-opener';

export function buildAlphaStatHonestSearchGapOpener(userMessage: string): string {
  const subject = extractStatSubjectFromMessage(userMessage);
  return `Carian web selesai — tiada angka ${subject} yang disahkan dalam hits pada giliran ini.`;
}

function alphaStatZeroHitFollowUpLine(userMessage: string): string {
  const prefersBm = /\b(salam|berapa|maklumat|jumlah|pelajar|ramai|bilangan|bagikan)\b/i.test(userMessage);
  return prefersBm
    ? 'Tampal URL rasmi institusi, atau nyatakan kampus, sesi, atau tahun supaya carian seterusnya lebih tepat.'
    : 'Paste an official institution URL, or name a specific campus, session, or year so the next search can focus.';
}

/** @deprecated Runtime never surfaces hard terminal snippets — synthesis + Gold Standard only. */
export function buildAlphaStatZeroHitResponse(userMessage: string): string {
  return [
    buildAlphaStatHonestSearchGapOpener(userMessage),
    alphaStatZeroHitFollowUpLine(userMessage),
  ].join('\n\n');
}

/** @deprecated Runtime never surfaces hard terminal snippets — synthesis + Gold Standard only. */
export function buildAlphaStatHitsNoFigureResponse(
  userMessage: string,
  evidence: LlmSearchResult[],
): string {
  const subject = extractStatSubjectFromMessage(userMessage);
  const officialEvidence = filterOfficialSubjectStatHits(evidence, userMessage);
  const subjectInHits = officialEvidence.length > 0;

  if (!subjectInHits && evidence.length > 0) {
    const exampleDomains = evidence.slice(0, 2).map((hit) => {
      const url = hit.url?.trim();
      if (!url) return hit.title?.trim() || 'unknown';
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return hit.title?.trim() || url;
      }
    }).filter(Boolean);
    const opener = `Carian web selesai — ${evidence.length} hasil dijumpai, tetapi tiada satu pun menyebut ${subject} dalam tajuk, URL, atau snippet pada giliran ini.`;
    const exampleLine = exampleDomains.length > 0
      ? `Hasil semasa ialah sumber luar konteks (contoh: ${exampleDomains.join(', ')}).`
      : '';
    return [opener, exampleLine, alphaStatZeroHitFollowUpLine(userMessage)]
      .filter(Boolean)
      .join('\n\n');
  }

  const sources = (officialEvidence.length > 0 ? officialEvidence : evidence).slice(0, 2).map((hit) => {
    const title = hit.title?.trim() || hit.url?.trim() || 'source';
    let domain = '';
    const url = hit.url?.trim();
    if (url) {
      try {
        domain = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        domain = '';
      }
    }
    return domain ? `${title} (${domain})` : title;
  }).filter(Boolean);

  const opener = `Carian web selesai — ${evidence.length} sumber dijumpai, tetapi tiada angka ${subject} yang disahkan dalam snippets pada giliran ini.`;
  const sourceLine = sources.length > 0
    ? `Sumber teratas: ${sources.join('; ')}.`
    : '';
  return [opener, sourceLine, alphaStatZeroHitFollowUpLine(userMessage)]
    .filter(Boolean)
    .join('\n\n');
}

export function buildAlphaStatVerificationFallback(
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
): string {
  const figure = extractVerifiedStatFigureFromEvidence(evidence, extractedFacts, userMessage);
  if (figure) {
    return buildAlphaStatFigureLedOpener(userMessage, figure, evidence);
  }
  return '';
}

/**
 * Sync display helper for tests — production uses resolveGoldStandardSearchFirstReply.
 */
export function resolveAlphaStatSearchFirstDisplay(
  userMessage: string,
  evidence: LlmSearchResult[],
  extractedFacts: string,
): string | null {
  const figure = extractVerifiedStatFigureFromEvidence(evidence, extractedFacts, userMessage);
  if (figure) {
    return buildAlphaStatFigureLedReply(userMessage, figure, evidence);
  }
  if (evidence.length === 0) {
    return null;
  }
  if (!searchHitsIncludeSubjectToken(evidence, userMessage)) {
    return null;
  }
  return null;
}
