/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Turn Search
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import {
  buildPrefetchedSearchContextBlock,
  runStudentSearchPrefetch,
} from './adam-search-first';
import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
import type { SSEEventType } from './adam.types';
import type { AdamTurnContextFetch } from './adam-chat-stream-turn-context';

export interface TurnSearchPrefetchResult {
  systemPrompt: string;
  searchPrefetchMs: number;
  prefetchedSearchResults: LlmSearchResult[];
  prefetchedSearchUsed: boolean;
  prefetchedSearchDropped: boolean;
}

export async function injectTurnSearchPrefetch(input: {
  systemPrompt: string;
  studentSearchFirst: boolean;
  turnContext: AdamTurnContextFetch;
  userMessage: string;
  llmMessages: LlmMessage[];
  resolvedSessionId: string;
  onEvent: (event: SSEEventType, data: string) => void;
}): Promise<TurnSearchPrefetchResult> {
  const {
    studentSearchFirst,
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
    };
  }

  const prefetchStarted = Date.now();
  const { searchPrefetchPromise } = turnContext;
  const prefetch = searchPrefetchPromise
    ? await searchPrefetchPromise
    : await runStudentSearchPrefetch({
      userMessage,
      recentUserMessages: llmMessages,
      onSearching: () => {
        onEvent(
          'adam_searching',
          JSON.stringify({ query: userMessage.slice(0, 80) || 'Mencari data sebenar…' }),
        );
      },
      onSearchDone: () => {
        onEvent('adam_search_done', JSON.stringify({ query: '' }));
      },
    });
  searchPrefetchMs = searchPrefetchPromise
    ? Date.now() - prefetchStarted
    : prefetch.prefetchMs;
  prefetchedSearchResults = prefetch.searchResults;
  prefetchedSearchUsed = prefetch.searchUsed;
  prefetchedSearchDropped = prefetch.searchDroppedByFilter;

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
    { searchDropped: prefetchedSearchDropped },
  )}`;

  console.log('[adam:search-first] prefetch complete', JSON.stringify({
    sessionId: resolvedSessionId,
    hits:      prefetchedSearchResults.length,
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
      forced:          false,
      searchFirst:     studentSearchFirst,
      technicalFollowUp: precisionFollowUp,
      guestTrial:      isGuestTrial,
      stack:           ENV.QXK24_STACK,
      llmProvider:     ENV.LLM_PROVIDER,
      ts:              new Date().toISOString(),
    }),
  );
}
