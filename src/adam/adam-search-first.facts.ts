/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Search-First Flow (student factual turns)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */
import type { LlmSearchResult } from '../llm/llm-types';
import { isAdamPracticalAdvisoryTurn } from './adam-response-generation';
import {
  filterSearchHitsToSubjectRelevant,
  matchStatFigureClaimsInText,
  messageAsksRoleAndSkills,
} from './adam-official-source-enrich';

/** Parse EXTRACTED_FACTS block from prefetch LLM output. */
export function parseExtractedFactsFromPrefetch(text: string): string {
  const match = text.match(/EXTRACTED_FACTS:\s*([\s\S]*)/i);
  if (match?.[1]) {
    const body = match[1].trim();
    if (!/^NONE\b/i.test(body)) {
      const lines = body
        .split('\n')
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line) => line.length > 4 && !/^NONE\b/i.test(line));
      if (lines.length > 0) return lines.slice(0, 8).join('\n');
    }
  }
  // Fallback — numbered lines with pipe separators from loose model output
  const loose = text
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => /\d{1,3}(?:,\d{3})+/.test(line) && line.includes('|'));
  return loose.slice(0, 8).join('\n');
}

/**
 * Drop prefetch LLM fact lines that are not grounded in search-hit URLs/snippets.
 * When hits are empty, discard all — prevents memory hallucination with hits:0.
 */
export function groundExtractedFactsToSearchHits(
  extractedFacts: string,
  hits: LlmSearchResult[],
  userMessage = '',
): string {
  if (!extractedFacts.trim()) return '';
  if (hits.length === 0) return '';

  const scopedHits = userMessage.trim()
    ? filterSearchHitsToSubjectRelevant(hits, userMessage)
    : hits;
  if (userMessage.trim() && scopedHits.length === 0) return '';

  const hitUrls = scopedHits
    .map((h) => h.url?.trim())
    .filter((url): url is string => Boolean(url));
  const hitBlob = scopedHits
    .map((h) => `${h.title ?? ''} ${h.snippet ?? ''} ${h.url ?? ''}`)
    .join(' ')
    .toLowerCase();

  const careerAsk = messageAsksRoleAndSkills(userMessage) || isAdamPracticalAdvisoryTurn(userMessage);

  const kept = extractedFacts
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (hitUrls.some((url) => line.includes(url))) return true;
      const figures = line.match(/\d{1,3}(?:,\d{3})+|\d{4,6}/g) ?? [];
      if (figures.some((fig) => {
        const compact = fig.replace(/,/g, '');
        return hitBlob.includes(fig.toLowerCase()) || hitBlob.includes(compact);
      })) {
        return true;
      }
      if (careerAsk) {
        const tokens = line.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
        const overlap = tokens.filter((t) => hitBlob.includes(t)).length;
        if (overlap >= 3) return true;
      }
      return false;
    });

  return kept.slice(0, 8).join('\n');
}

/** Client-side figure extraction from hit titles/snippets — does not rely on prefetch LLM format. */
export function extractHeuristicFactsFromSearchHits(
  hits: LlmSearchResult[],
  userMessage = '',
): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  const scopedHits = userMessage.trim()
    ? filterSearchHitsToSubjectRelevant(hits, userMessage)
    : hits;

  for (const hit of scopedHits) {
    const title = hit.title?.trim() ?? '';
    const url = hit.url?.trim() ?? '';
    const snippet = hit.snippet?.trim() ?? '';
    const blob = `${title} ${snippet} ${url}`;

    for (const claim of matchStatFigureClaimsInText(blob)) {
      const key = claim.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`${claim} | ${title || 'source'} | ${url}`);
    }
  }

  return lines.slice(0, 8).join('\n');
}

/** Role/skill claims from search snippets — career asks without enrollment stats. */
export function extractRoleSkillFactsFromSearchHits(
  hits: LlmSearchResult[],
  userMessage = '',
): string {
  if (!messageAsksRoleAndSkills(userMessage) && !isAdamPracticalAdvisoryTurn(userMessage)) {
    return '';
  }
  const lines: string[] = [];
  const seen = new Set<string>();
  const scopedHits = userMessage.trim()
    ? filterSearchHitsToSubjectRelevant(hits, userMessage)
    : hits;
  const pool = scopedHits.length > 0 ? scopedHits : hits;

  for (const hit of pool) {
    const title = hit.title?.trim() ?? '';
    const url = hit.url?.trim() ?? '';
    const snippet = hit.snippet?.trim() ?? '';
    const blob = `${title}\n${snippet}`;
    const chunks = blob
      .split(/(?<=[.!?])\s+|\n{2,}/)
      .map((c) => c.trim())
      .filter((c) => c.length >= 40);

    for (const chunk of chunks) {
      if (!/\b(?:role|skill|responsibilit|duty|duties|peranan|kemahiran|guru|teacher|nurse|tanggungjawab|competen|qualification|membimbing|mengajar|pendidikan|kurikulum|PdPc|pentaksiran)\b/i.test(chunk)) {
        continue;
      }
      const key = chunk.toLowerCase().slice(0, 96);
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`${chunk} | ${title || 'source'} | ${url}`);
      if (lines.length >= 8) break;
    }
    if (lines.length >= 8) break;
  }

  return lines.join('\n');
}

/** Stat figures + role/skill claims — unified fact extraction for synthesis. */
export function extractFactsFromSearchHits(
  hits: LlmSearchResult[],
  userMessage = '',
): string {
  return mergeExtractedFactLines(
    extractHeuristicFactsFromSearchHits(hits, userMessage),
    extractRoleSkillFactsFromSearchHits(hits, userMessage),
  );
}

export function mergeExtractedFactLines(...blocks: Array<string | undefined>): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const block of blocks) {
    for (const line of (block ?? '').split('\n').map((l) => l.trim()).filter(Boolean)) {
      const key = line.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(line);
    }
  }
  return lines.slice(0, 8).join('\n');
}
