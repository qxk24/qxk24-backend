/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Turn Search
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

import { ENV } from '../config/environments';
import {
  buildAdamSearchDisplayQuery,
  buildPrefetchedSearchContextBlock,
  runStudentSearchPrefetch,
} from './adam-search-first';
import { shouldForceWebSearchForGateReason } from './adam-web-search';
import { emitAdamSearchDoneEvent } from './adam-chat-search-events';
import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
import type { SSEEventType } from './adam.types';
import type { AdamTurnContextFetch } from './adam-chat-stream-turn-context';

export interface TurnSearchPrefetchResult {
  systemPrompt: string;
  searchPrefetchMs: number;
  prefetchedSearchResults: LlmSearchResult[];
  prefetchedSearchUsed: boolean;
  prefetchedSearchDropped: boolean;
  extractedFacts: string;
}

export { emitAdamSearchDoneEvent } from './adam-chat-search-events';

export async function injectTurnSearchPrefetch(input: {
  systemPrompt: string;
  studentSearchFirst: boolean;
  webSearchGateReason?: string | null;
  turnContext: AdamTurnContextFetch;
  userMessage: string;
  llmMessages: LlmMessage[];
  resolvedSessionId: string;
  onEvent: (event: SSEEventType, data: string) => void;
}): Promise<TurnSearchPrefetchResult> {
  const {
    studentSearchFirst,
    webSearchGateReason,
    turnContext,
    userMessage,
    llmMessages,
    resolvedSessionId,
    onEvent,
  } = input;
  let { systemPrompt } = input;

  let searchPrefetchMs = 0;
  let prefetchedSearchResults: LlmSearchResult[] = [];
  let prefetchedSearchUsed = false;
  let prefetchedSearchDropped = false;

  if (!studentSearchFirst) {
    return {
      systemPrompt,
      searchPrefetchMs,
      prefetchedSearchResults,
      prefetchedSearchUsed,
      prefetchedSearchDropped,
      extractedFacts: '',
    };
  }

  const searchDisplayQuery = buildAdamSearchDisplayQuery(userMessage, webSearchGateReason);

  const prefetchStarted = Date.now();
  const { searchPrefetchPromise } = turnContext;
  const prefetch = searchPrefetchPromise
    ? await searchPrefetchPromise
    : await runStudentSearchPrefetch({
      userMessage,
      webSearchGateReason,
      recentUserMessages: llmMessages,
      onSearching: () => {
        onEvent(
          'adam_searching',
          JSON.stringify({ query: searchDisplayQuery }),
        );
      },
      onSearchHitsReady: (hits) => {
        emitAdamSearchDoneEvent(onEvent, searchDisplayQuery, hits);
      },
    });
  searchPrefetchMs = searchPrefetchPromise
    ? Date.now() - prefetchStarted
    : prefetch.prefetchMs;
  prefetchedSearchResults = prefetch.searchResults;
  prefetchedSearchUsed = prefetch.searchUsed;
  prefetchedSearchDropped = prefetch.searchDroppedByFilter;

  if (studentSearchFirst) {
    emitAdamSearchDoneEvent(onEvent, searchDisplayQuery, prefetchedSearchResults);
  }

  if (prefetchedSearchDropped) {
    onEvent(
      'adam_search_unavailable',
      JSON.stringify({
        sessionId: resolvedSessionId,
        reason:    'content_filter',
        message:   'Carian web tidak tersedia pada giliran ini. ADAM akan menjawab tanpa data carian.',
      }),
    );
  }

  systemPrompt = `${systemPrompt}\n\n${buildPrefetchedSearchContextBlock(
    prefetchedSearchResults,
    {
      searchDropped:  prefetchedSearchDropped,
      extractedFacts: prefetch.extractedFacts,
    },
  )}`;

  console.log('[adam:search-first] prefetch complete', JSON.stringify({
    sessionId: resolvedSessionId,
    hits:      prefetchedSearchResults.length,
    extractedFactsLines: prefetch.extractedFacts
      ? prefetch.extractedFacts.split('\n').filter(Boolean).length
      : 0,
    dropped:   prefetchedSearchDropped,
    ms:        searchPrefetchMs,
    parallel:  turnContext.searchPrefetchParallel && Boolean(searchPrefetchPromise),
    waitedMs:  searchPrefetchPromise ? Date.now() - prefetchStarted : prefetch.prefetchMs,
  }));

  return {
    systemPrompt,
    searchPrefetchMs,
    prefetchedSearchResults,
    prefetchedSearchUsed,
    prefetchedSearchDropped,
    extractedFacts: prefetch.extractedFacts,
  };
}

export function logSearchGateEnabled(input: {
  resolvedSessionId: string;
  userMessage: string;
  webSearchGateReason: string | null;
  studentSearchFirst: boolean;
  precisionFollowUp: boolean;
  isGuestTrial: boolean;
}): void {
  const {
    resolvedSessionId,
    userMessage,
    webSearchGateReason,
    studentSearchFirst,
    precisionFollowUp,
    isGuestTrial,
  } = input;

  console.log(
    '[adam:search-gate] search ENABLED',
    JSON.stringify({
      sessionId:       resolvedSessionId,
      messageLength:   userMessage.length,
      preview:         userMessage.slice(0, 80),
      reason:          webSearchGateReason,
      forced:          shouldForceWebSearchForGateReason(webSearchGateReason),
      searchFirst:     studentSearchFirst,
      technicalFollowUp: precisionFollowUp,
      guestTrial:      isGuestTrial,
      stack:           ENV.QXK24_STACK,
      llmProvider:     ENV.LLM_PROVIDER,
      ts:              new Date().toISOString(),
    }),
  );
}
