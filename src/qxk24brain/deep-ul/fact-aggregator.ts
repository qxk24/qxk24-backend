/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Fact Aggregator
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { LlmSearchResult } from '../../llm/llm-types';

function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 2);
}

function scoreHit(query: string, hit: LlmSearchResult): number {
  const blob = `${hit.title ?? ''} ${hit.snippet ?? ''}`.toLowerCase();
  const tokens = queryTokens(query);
  let score = 0;

  for (const token of tokens) {
    if (blob.includes(token)) score += 1;
  }

  return score;
}

function formatHitLine(hit: LlmSearchResult): string {
  const title = hit.title?.trim() || 'Source';
  const snippet = hit.snippet?.trim() || '';
  const url = hit.url?.trim() || '';

  if (!snippet) return title;
  return url ? `${title}: ${snippet} (${url})` : `${title}: ${snippet}`;
}

export function aggregateSearchFacts(
  query: string,
  hits: LlmSearchResult[],
  topN = 3,
): string {
  if (hits.length === 0) return '';

  const ranked = hits
    .map((hit, index) => ({ index, score: scoreHit(query, hit), hit }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .sort((a, b) => a.index - b.index);

  const lines = ranked.length > 0
    ? ranked.map(({ hit }) => formatHitLine(hit))
    : hits.slice(0, topN).map((hit) => formatHitLine(hit));

  if (lines.length === 0) return '';
  return `[Verified context]\n${lines.join('\n')}`;
}
