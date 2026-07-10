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
  runUsersSearchPrefetch,
} from './adam-search-first';
import { extractRecentUserTurns, extractRecentAssistantTurns } from './adam-factual-grounding';
import { shouldForceWebSearchForGateReason } from './adam-web-search';
import { emitAdamSearchDoneEvent, emitAdamMediaReadyEvent } from './adam-chat-search-events';
import {
  buildPrefetchedMediaContextBlock,
  isAdamMediaSearchTurn,
  runAdamMediaSearch,
} from './adam-media-search';
import { isAdamMediaGenerationTurn } from './adam-media-generation';
import {
  buildMediaQuotaBlockedContextBlock,
  buildPrefetchedGeneratedMediaContextBlock,
  runAdamMediaGeneration,
} from './adam-media-generation.service';
import {
  getMediaQuotaSnapshot,
  mediaQuotaStatusPayload,
  resolveUserMediaQuotaTier,
} from './adam-media-quota.service';
import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
import type { AdamMediaSearchHit } from './adam-media-search';
import type { SSEEventType } from './adam.types';
import type { AdamTurnContextFetch } from './adam-chat-stream-turn-context';

export interface TurnSearchPrefetchResult {
  systemPrompt: string;
  searchPrefetchMs: number;
  prefetchedSearchResults: LlmSearchResult[];
  prefetchedSearchUsed: boolean;
  prefetchedSearchDropped: boolean;
  extractedFacts: string;
  mediaHits: AdamMediaSearchHit[];
}

export { emitAdamSearchDoneEvent, emitAdamMediaReadyEvent } from './adam-chat-search-events';

export async function injectTurnSearchPrefetch(input: {
  systemPrompt: string;
  usersSearchFirst: boolean;
  webSearchGateReason?: string | null;
  turnContext: AdamTurnContextFetch;
  userMessage: string;
  llmMessages: LlmMessage[];
  resolvedSessionId: string;
  isFounder?: boolean;
  userId?: string;
  isGuest?: boolean;
  onEvent: (event: SSEEventType, data: string) => void;
}): Promise<TurnSearchPrefetchResult> {
  const {
    usersSearchFirst,
    webSearchGateReason,
    turnContext,
    userMessage,
    llmMessages,
    resolvedSessionId,
    isFounder = false,
    userId,
    isGuest = false,
    onEvent,
  } = input;
  let { systemPrompt } = input;

  let searchPrefetchMs = 0;
  let prefetchedSearchResults: LlmSearchResult[] = [];
  let prefetchedSearchUsed = false;
  let prefetchedSearchDropped = false;

  if (!usersSearchFirst) {
    return {
      systemPrompt,
      searchPrefetchMs,
      prefetchedSearchResults,
      prefetchedSearchUsed,
      prefetchedSearchDropped,
      extractedFacts: '',
      mediaHits: [],
    };
  }

  const recentUserTurns = extractRecentUserTurns(llmMessages);
  const recentAssistantTurns = extractRecentAssistantTurns(llmMessages);
  const gateDomain = turnContext.river.gate.eq.lane === 'users'
    ? turnContext.river.gate.iq.groundingFacet
    : undefined;
  const searchDisplayQuery = buildAdamSearchDisplayQuery(
    userMessage,
    webSearchGateReason,
    { recentUserMessages: recentUserTurns, recentAssistantMessages: recentAssistantTurns },
    gateDomain,
  );

  const emitSearchStart = () => {
    onEvent(
      'adam_searching',
      JSON.stringify({ query: searchDisplayQuery }),
    );
  };

  const prefetchStarted = Date.now();
  const { searchPrefetchPromise } = turnContext;
  const prefetch = searchPrefetchPromise
    ? await (emitSearchStart(), searchPrefetchPromise)
    : await runUsersSearchPrefetch({
      userMessage,
      webSearchGateReason,
      recentUserMessages: llmMessages,
      gateDomain,
      onSearching: emitSearchStart,
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

  if (usersSearchFirst) {
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
      userMessage,
      isFounder,
      gateGroundingFacet: turnContext.river.gate.iq.groundingFacet,
    },
  )}`;

  let mediaHits: AdamMediaSearchHit[] = [];

  if (isAdamMediaGenerationTurn(userMessage, isFounder) && userId) {
    const mediaTier = await resolveUserMediaQuotaTier({
      userId,
      isFounder,
      isGuest,
    });
    const gen = await runAdamMediaGeneration({
      userMessage,
      sessionId: resolvedSessionId,
      userId,
      tier:      mediaTier,
      isFounder,
      onEvent,
    });

    if (gen.quotaBlocked) {
      const snap = gen.quotaSnapshot
        ?? await getMediaQuotaSnapshot({ userId, tier: mediaTier });
      onEvent(
        'adam_media_quota_blocked',
        JSON.stringify({
          message:       gen.blockMessage,
          registerGate:  gen.registerGate,
          buyCreditGate: gen.buyCreditGate,
          upgradeGate:   gen.upgradeGate,
          ...mediaQuotaStatusPayload(snap),
        }),
      );
      systemPrompt = `${systemPrompt}\n\n${buildMediaQuotaBlockedContextBlock(
        gen.blockMessage ?? 'AI media limit reached.',
      )}`;
    } else if (gen.hits.length > 0) {
      mediaHits = gen.hits;
      systemPrompt = `${systemPrompt}\n\n${buildPrefetchedGeneratedMediaContextBlock(mediaHits)}`;
      emitAdamMediaReadyEvent(onEvent, mediaHits);
    } else if (gen.blockMessage) {
      onEvent(
        'adam_search_unavailable',
        JSON.stringify({
          sessionId: resolvedSessionId,
          reason:    'media_generation_unconfigured',
          message:   gen.blockMessage,
        }),
      );
    }
  } else if (isAdamMediaSearchTurn(userMessage, isFounder)) {
    mediaHits = await runAdamMediaSearch({
      userMessage,
      searchHits: prefetchedSearchResults,
    });
    if (mediaHits.length > 0) {
      systemPrompt = `${systemPrompt}\n\n${buildPrefetchedMediaContextBlock(mediaHits)}`;
      emitAdamMediaReadyEvent(onEvent, mediaHits);
    }
  }

  return {
    systemPrompt,
    searchPrefetchMs,
    prefetchedSearchResults,
    prefetchedSearchUsed,
    prefetchedSearchDropped,
    extractedFacts: prefetch.extractedFacts,
    mediaHits,
  };
}

export function logSearchGateEnabled(input: {
  resolvedSessionId: string;
  userMessage: string;
  webSearchGateReason: string | null;
  usersSearchFirst: boolean;
  precisionFollowUp: boolean;
  isGuestTrial: boolean;
}): void {
  const {
    resolvedSessionId,
    userMessage,
    webSearchGateReason,
    usersSearchFirst,
    precisionFollowUp,
    isGuestTrial,
  } = input;

}
