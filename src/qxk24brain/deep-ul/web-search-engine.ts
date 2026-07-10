/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Web Search Engine
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
import {
  buildFactualAuthoritativeProbeUrls,
  probeFactualAuthoritativeEvidence,
} from '../../adam/adam-official-source-enrich';
import { aggregateSearchFacts } from './fact-aggregator';

export interface DeterministicSearchPrefetchResult {
  text:           string;
  searchResults:  LlmSearchResult[];
  extractedFacts: string;
}

export async function deterministicSearchPrefetch(input: {
  userMessage:        string;
  searchDisplayQuery?: string;
}): Promise<DeterministicSearchPrefetchResult> {
  const query = input.searchDisplayQuery?.trim() || input.userMessage.trim();
  if (!query) {
    return { text: '', searchResults: [], extractedFacts: '' };
  }

  const probeUrls = buildFactualAuthoritativeProbeUrls(query);
  let hits: LlmSearchResult[] = [];

  if (probeUrls.length > 0) {
    const probed = await probeFactualAuthoritativeEvidence(query, {
      maxUrls:   Math.min(4, probeUrls.length),
      timeoutMs: 8_000,
    });
    hits = probed.hits;
  }

  const extractedFacts = aggregateSearchFacts(query, hits);
  return { text: extractedFacts, searchResults: hits, extractedFacts };
}
