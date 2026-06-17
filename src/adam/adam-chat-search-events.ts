/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Search SSE Events
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
import type { AdamMediaSearchHit } from './adam-media-search';
import type { SSEEventType } from './adam.types';

export function emitAdamSearchDoneEvent(
  onEvent: (event: SSEEventType, data: string) => void,
  query: string,
  results: LlmSearchResult[],
): void {
  onEvent('adam_search_done', JSON.stringify({
    query,
    hits:    results.length,
    results: results.slice(0, 8).map((hit) => ({
      title: hit.title ?? '',
      url:   hit.url ?? '',
    })),
  }));
}

export function emitAdamMediaReadyEvent(
  onEvent: (event: SSEEventType, data: string) => void,
  hits: AdamMediaSearchHit[],
): void {
  if (hits.length === 0) return;
  onEvent('adam_media_ready', JSON.stringify({
    count: hits.length,
    items: hits.map((hit) => ({
      kind:   hit.kind,
      url:    hit.url,
      title:  hit.title,
      source: hit.source,
    })),
  }));
}
