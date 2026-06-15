/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Evidence
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
  ALPHA_FALSE_NO_FIGURE_RE,
} from './adam-alpha-stat-patterns';
import {
  extractStatFigureFromHit,
  extractSubjectBoundStatFigure,
  extractSubjectTokensFromMessage,
  snippetHasGoldStandardBody,
  rankHitsForStatPageEnrich,
} from './adam-official-source-enrich';

export function figureDisplayTokens(figureRaw: string): string[] {
  const compact = figureRaw.replace(/,/g, '');
  const n = Number.parseInt(compact, 10);
  const tokens = new Set<string>([compact, figureRaw]);
  if (Number.isFinite(n)) tokens.add(n.toLocaleString('en-US'));
  return [...tokens];
}

export function numberTokenVariants(value: number): string[] {
  const variants = new Set<string>();
  variants.add(String(value));
  variants.add(String(Math.round(value)));
  variants.add(value.toLocaleString('en-US'));
  if (value >= 1000) {
    variants.add(value.toLocaleString('en-US').replace(/,/g, ''));
  }
  return [...variants];
}

export function parseStatInteger(raw: string): number | null {
  const n = Number.parseInt(raw.replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function extractUnboundStatFigure(
  evidence: LlmSearchResult[],
  extractedFacts: string,
): string | null {
  const raw = [
    extractedFacts,
    ...evidence.map((h) => `${h.title ?? ''} ${h.snippet ?? ''} ${h.url ?? ''}`),
  ].join(' ');
  const patterns = [
    /(?:lebih\s+)?(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:orang\s+)?(?:pelajar|students?|murid|full[-\s]?time\s+students?)/i,
    /(?:lebih\s+)?(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:orang|kakitangan|staff|pekerja|employees?)/i,
    /(?:sebanyak|seramai|jumlah|total|bilangan|berjumlah)[^.]{0,48}(\d{1,3}(?:,\d{3})+|\d{4,6})/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1].replace(/,/g, '');
  }
  return null;
}

/** Published stat figure grounded to the asked subject — rejects unrelated national aggregates. */
export function extractVerifiedStatFigureFromEvidence(
  evidence: LlmSearchResult[],
  extractedFacts = '',
  userMessage = '',
): string | null {
  if (userMessage.trim()) {
    const ranked = rankHitsForStatPageEnrich(evidence, userMessage);
    for (const hit of ranked) {
      const figure = extractStatFigureFromHit(hit, userMessage);
      if (figure) return figure;
    }
    for (const line of extractedFacts.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const lower = line.toLowerCase();
      const tokens = extractSubjectTokensFromMessage(userMessage);
      if (!tokens.some((token) => lower.includes(token))) continue;
      const bound = extractSubjectBoundStatFigure(line, userMessage);
      if (bound) return bound;
    }
    return null;
  }
  return extractUnboundStatFigure(evidence, extractedFacts);
}

export function extractEnrollmentFigureFromEvidence(
  evidence: LlmSearchResult[],
  extractedFacts = '',
  userMessage = '',
): string | null {
  return extractVerifiedStatFigureFromEvidence(evidence, extractedFacts, userMessage);
}

export function buildSearchEvidenceBlob(
  evidence: LlmSearchResult[],
  extractedFacts = '',
): string {
  return [
    extractedFacts,
    ...evidence.map((h) => `${h.title ?? ''} ${h.url ?? ''} ${h.snippet ?? ''}`),
  ].join(' ').toLowerCase();
}

export function statNumberInEvidence(
  value: number,
  evidence: LlmSearchResult[],
  extractedFacts = '',
): boolean {
  const blob = buildSearchEvidenceBlob(evidence, extractedFacts);
  return numberTokenVariants(value).some((token) => blob.includes(token.toLowerCase()));
}

export function alphaStatOutputContradictsEvidence(
  text: string,
  evidence: LlmSearchResult[],
  extractedFacts = '',
): boolean {
  return Boolean(extractEnrollmentFigureFromEvidence(evidence, extractedFacts))
    && (ALPHA_FALSE_NO_FIGURE_RE.test(text) || ALPHA_CONTEXT_REFUSAL_RE.test(text));
}

export function findEvidenceHitForFigure(
  figureRaw: string,
  evidence: LlmSearchResult[],
  userMessage: string,
): LlmSearchResult | null {
  const compact = figureRaw.replace(/,/g, '');
  const n = Number.parseInt(compact, 10);
  const formatted = Number.isFinite(n) ? n.toLocaleString('en-US') : figureRaw;
  const ranked = rankHitsForStatPageEnrich(evidence, userMessage);
  for (const hit of ranked) {
    const blob = `${hit.title ?? ''} ${hit.snippet ?? ''}`;
    if (!blob.includes(compact) && !blob.includes(formatted)) continue;
    if (extractStatFigureFromHit(hit, userMessage) === compact) return hit;
  }
  for (const hit of ranked) {
    if (extractStatFigureFromHit(hit, userMessage) === compact) return hit;
  }
  return null;
}

/** Hit with the longest page-fetched article — never DashScope search snippets alone. */
export function findRichestStatEvidenceHit(
  evidence: LlmSearchResult[],
  userMessage: string,
): LlmSearchResult | null {
  let best: LlmSearchResult | null = null;
  let bestLen = 0;
  for (const hit of rankHitsForStatPageEnrich(evidence, userMessage)) {
    if (!hit.pageFetched) continue;
    const snippet = hit.snippet?.trim().replace(/&nbsp;/gi, ' ') ?? '';
    if (snippet.length < 80) continue;
    const hasFigure = extractStatFigureFromHit(hit, userMessage) !== null;
    const hasArticle = snippetHasGoldStandardBody(snippet);
    if (!hasFigure && !hasArticle) continue;
    if (snippet.length > bestLen) {
      bestLen = snippet.length;
      best = hit;
    }
  }
  return best;
}

export function openingHasVerifiedEnrollmentFigure(text: string, figureRaw: string): boolean {
  const head = text.slice(0, 420);
  if (!/verified via web search/i.test(head)) return false;
  const n = Number.parseInt(figureRaw.replace(/,/g, ''), 10);
  if (!Number.isFinite(n)) return true;
  return numberTokenVariants(n).some((token) => head.includes(token));
}
