/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : DashScope Web Search (native API)
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
 *
 * Prefetch search MUST use DashScope native text-generation API.
 * OpenAI-compatible /chat/completions does not return search_info
 * (documented Alibaba limitation) — using it as a hit fallback was a
 * silent 0-results root cause.
 */

import { ENV } from '../config/environments';
import type { LlmSearchResult } from './llm-types';

export const DASHSCOPE_CN_NATIVE_HOST = 'https://dashscope.aliyuncs.com';
export const DASHSCOPE_INTL_NATIVE_HOST = 'https://dashscope-intl.aliyuncs.com';

/** UI + synthesis only need top hits — ingesting 100+ slows prefetch (full SSE wait). */
export const DASHSCOPE_PREFETCH_MAX_HITS = 12;

/** Max idle gap between SSE chunks before aborting (DashScope may stream slowly on deep models). */
export const DASHSCOPE_PREFETCH_SSE_IDLE_MS = 8_000;

/** Max wall-clock per native SSE prefetch attempt (0-hit turns). */
export const DASHSCOPE_PREFETCH_SSE_TIMEOUT_MS = 28_000;

/** Hard cap on outbound DashScope prefetch HTTP request (connect + TTFB). */
export const DASHSCOPE_PREFETCH_FETCH_TIMEOUT_MS = 22_000;

export type DashScopeSearchTransport = 'native' | 'native_sse';

export interface DashScopeSearchHitRaw {
  title?:   string;
  url?:     string;
  link?:    string;
  snippet?: string;
  content?: string;
  summary?: string;
}

export interface DashScopeSearchResponseShape {
  output?: {
    choices?: { message?: { content?: string } }[];
    search_info?: {
      search_results?: DashScopeSearchHitRaw[];
    };
  };
  code?:         string;
  message?:      string;
  request_id?:   string;
  usage?: {
    plugins?: {
      search?: { count?: number };
    };
  };
}

export interface DashScopePrefetchAttemptDiag {
  transport:       DashScopeSearchTransport;
  host:            string;
  model:           string;
  searchStrategy?: string;
  forcedSearch:    boolean;
  httpStatus:      number;
  apiCode?:        string;
  apiMessage?:     string;
  requestId?:      string;
  searchPluginCount?: number;
  rawHitCount:     number;
  parsedHitCount:  number;
  endpoint:        string;
  failed?:         boolean;
}

/** DashScope rejects non-stream + enable_search on thinking-capable models. */
export function isDashScopeNonStreamSearchThinkingError(message: string): boolean {
  return /Non-streaming mode does not support Web Search in thinking mode/i.test(message)
    || /InvalidParameter.*thinking mode/i.test(message);
}

export function extractDashScopeApiHost(apiBase: string): string {
  return apiBase.replace(/\/$/, '').replace(/\/compatible-mode\/v1.*$/i, '');
}

export function isDashScopeIntlHost(host: string): boolean {
  return /dashscope-intl\.aliyuncs\.com/i.test(host);
}

export function dashScopeNativeGenerationUrlForHost(host: string): string {
  const normalized = host.replace(/\/$/, '');
  return `${normalized}/api/v1/services/aigc/text-generation/generation`;
}

/** Primary native host — optional override for search-only calls. */
export function resolveDashScopeSearchNativeHost(): string {
  const override = ENV.QWEN_SEARCH_NATIVE_HOST.trim();
  if (override) return extractDashScopeApiHost(override);
  return extractDashScopeApiHost(ENV.QWEN_API_BASE);
}

/**
 * Hosts to try for prefetch (primary only unless explicit fallback env set).
 * Cross-region CN retry is opt-in — API keys are often region-scoped.
 */
export function resolveDashScopeSearchPrefetchHosts(): string[] {
  const primary = resolveDashScopeSearchNativeHost();
  const hosts = [primary];
  const fallback = ENV.QWEN_SEARCH_FALLBACK_NATIVE_HOST.trim();
  if (fallback) {
    const normalized = extractDashScopeApiHost(fallback);
    if (normalized !== primary) hosts.push(normalized);
  }
  return hosts;
}

export function extractSearchResultsFromDashScopeJson(
  json: DashScopeSearchResponseShape,
): DashScopeSearchHitRaw[] {
  return json.output?.search_info?.search_results ?? [];
}

export function buildDashScopePrefetchFailedAttemptDiag(input: {
  transport:       DashScopeSearchTransport;
  host:            string;
  model:           string;
  searchStrategy?: string;
  forcedSearch:    boolean;
  httpStatus?:     number;
  errorMessage:    string;
}): DashScopePrefetchAttemptDiag {
  return {
    transport:      input.transport,
    host:           input.host,
    model:          input.model,
    searchStrategy: input.searchStrategy,
    forcedSearch:   input.forcedSearch,
    httpStatus:     input.httpStatus ?? 0,
    apiMessage:     input.errorMessage,
    rawHitCount:    0,
    parsedHitCount: 0,
    endpoint:       dashScopeNativeGenerationUrlForHost(input.host),
    failed:         true,
  };
}

export function buildDashScopePrefetchAttemptDiag(input: {
  transport:       DashScopeSearchTransport;
  host:            string;
  model:           string;
  searchStrategy?: string;
  forcedSearch:    boolean;
  httpStatus:      number;
  json:            DashScopeSearchResponseShape;
  parsedHitCount:  number;
}): DashScopePrefetchAttemptDiag {
  const rawHits = extractSearchResultsFromDashScopeJson(input.json);
  return {
    transport:          input.transport,
    host:               input.host,
    model:              input.model,
    searchStrategy:     input.searchStrategy,
    forcedSearch:       input.forcedSearch,
    httpStatus:         input.httpStatus,
    apiCode:            input.json.code,
    apiMessage:         input.json.message,
    requestId:          input.json.request_id,
    searchPluginCount:  input.json.usage?.plugins?.search?.count,
    rawHitCount:        rawHits.length,
    parsedHitCount:     input.parsedHitCount,
    endpoint:           dashScopeNativeGenerationUrlForHost(input.host),
  };
}

/** Parse DashScope native SSE (X-DashScope-SSE: enable) — hits arrive in the first event. */
export function parseDashScopeNativeSsePayload(
  raw: string,
  ingest: (hits: DashScopeSearchHitRaw[]) => void,
  onTextChunk?: (text: string) => void,
): DashScopeSearchResponseShape | null {
  let lastJson: DashScopeSearchResponseShape | null = null;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;

    try {
      const parsed = JSON.parse(payload) as DashScopeSearchResponseShape;
      lastJson = parsed;
      const hits = extractSearchResultsFromDashScopeJson(parsed);
      if (hits.length > 0) ingest(hits);
      const chunk = parsed.output?.choices?.[0]?.message?.content;
      if (chunk) onTextChunk?.(chunk);
    } catch {
      // skip malformed SSE data line
    }
  }

  return lastJson;
}

/**
 * Stream native SSE — caller decides when to stop (e.g. after search hits captured).
 * Waiting for response.text() on the full stream caused 4+ minute prefetch stalls.
 */
export async function consumeDashScopeNativeSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (parsed: DashScopeSearchResponseShape) => boolean | void,
  timeoutMs = DASHSCOPE_PREFETCH_SSE_TIMEOUT_MS,
  idleMs = DASHSCOPE_PREFETCH_SSE_IDLE_MS,
): Promise<{ lastJson: DashScopeSearchResponseShape; fullText: string; abortedEarly: boolean }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let lastJson: DashScopeSearchResponseShape = {};
  let abortedEarly = false;
  const started = Date.now();

  const sleep = (ms: number) => new Promise<'idle'>((resolve) => {
    setTimeout(() => resolve('idle'), ms);
  });

  try {
    while (true) {
      if (Date.now() - started > timeoutMs) break;

      const raced = await Promise.race([
        reader.read().then((chunk) => ({ kind: 'read' as const, chunk })),
        sleep(idleMs).then(() => ({ kind: 'idle' as const })),
      ]);

      if (raced.kind === 'idle') break;

      const { done, value } = raced.chunk;
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload) as DashScopeSearchResponseShape;
          lastJson = parsed;
          const chunk = parsed.output?.choices?.[0]?.message?.content;
          if (chunk) fullText += chunk;
          if (onEvent(parsed) === true) {
            abortedEarly = true;
            break;
          }
        } catch {
          // skip malformed SSE data line
        }
      }
      if (abortedEarly) break;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // stream already closed
    }
  }

  return { lastJson, fullText, abortedEarly };
}

export function summarizePrefetchAttempts(attempts: DashScopePrefetchAttemptDiag[]): Record<string, unknown> {
  const primaryHost = resolveDashScopeSearchNativeHost();
  return {
    primaryHost,
    isIntl:           isDashScopeIntlHost(primaryHost),
    compatibleBase:   ENV.QWEN_API_BASE.replace(/\/$/, ''),
    attemptCount:     attempts.length,
    attempts,
    hint: attempts.every((a) => a.parsedHitCount === 0)
      ? (
        isDashScopeIntlHost(primaryHost)
          ? '0 hits after native ladder — verify intl search quota, or set QWEN_SEARCH_NATIVE_HOST / QWEN_SEARCH_FALLBACK_NATIVE_HOST. Compatible-mode cannot return search_info.'
          : '0 hits after native ladder — check DashScope search billing/quota and model web-search support. Compatible-mode cannot return search_info.'
      )
      : undefined,
  };
}

export type IngestDashScopeSearchHitsFn = (
  hits: DashScopeSearchHitRaw[],
  target: LlmSearchResult[],
  seen: Set<string>,
) => void;
