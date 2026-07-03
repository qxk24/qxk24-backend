/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : LLM Provider Client (Qwen / DashScope)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Same A (constitutional prompts + context) — Qwen engine (DashScope compatible-mode).
 */

import { ENV } from '../config/environments';
import { buildQwenSearchOptions } from '../adam/adam-web-search';
import { extractLlmErrorText } from '../adam/adam-context-budget';
import {
  buildDashScopePrefetchAttemptDiag,
  buildDashScopePrefetchFailedAttemptDiag,
  consumeDashScopeNativeSseStream,
  DASHSCOPE_PREFETCH_FETCH_TIMEOUT_MS,
  DASHSCOPE_PREFETCH_MAX_HITS,
  DASHSCOPE_PREFETCH_SSE_IDLE_MS,
  DASHSCOPE_PREFETCH_SSE_TIMEOUT_MS,
  dashScopeNativeGenerationUrlForHost,
  extractSearchResultsFromDashScopeJson,
  isDashScopeIntlHost,
  isDashScopeNonStreamSearchThinkingError,
  resolveDashScopeSearchNativeHost,
  resolveDashScopeSearchPrefetchHosts,
  summarizePrefetchAttempts,
  type DashScopePrefetchAttemptDiag,
  type DashScopeSearchHitRaw,
  type DashScopeSearchResponseShape,
} from './dashscope-search';
import type {
  LlmCompleteParams,
  LlmMessage,
  LlmProvider,
  LlmSearchResult,
  LlmStreamParams,
  LlmStreamResult,
} from './llm-types';

export { toLlmMessages } from './llm-types';
export type { LlmMessage, LlmProvider };

export function getLlmProvider(): LlmProvider {
  return 'qwen';
}

export function isQwenProvider(): boolean {
  return true;
}

export function friendlyLlmError(err: unknown): string {
  const msg = extractLlmErrorText(err);

  if (/context|token|too long|request size|maximum|alternat/i.test(msg)) {
    return (
      'This turn is too large for ADAM to process at once. ' +
      'Send a shorter message, attach fewer or smaller files, or split the teaching across multiple messages.'
    );
  }
  if (/timeout|timed out|ETIMEDOUT|aborted/i.test(msg)) {
    return 'ADAM timed out — often caused by very long text or large images. Try again with less content.';
  }
  if (/overloaded|529|rate/i.test(msg)) {
    return 'ADAM is temporarily overloaded. Please wait a moment and try again.';
  }
  if (/credit balance|purchase credits|billing|insufficient.*credit|quota|balance/i.test(msg)) {
    return (
      'ADAM is paused — teaching capacity on the server needs renewal. ' +
      'Please try again later or contact the Alamtologi team.'
    );
  }
  if (/internal server error|api_error|502|503/i.test(msg)) {
    return (
      'ADAM hit a temporary server error. Wait a few seconds and send again — ' +
      'your message is already saved.'
    );
  }
  if (/invalid api key|authentication|unauthorized|401/i.test(msg)) {
    return 'ADAM engine authentication failed — check DashScope API key on the server.';
  }
  if (/DataInspectionFailed|data_inspection_failed|inappropriate content/i.test(msg)) {
    return (
      'QXK24 (Qwen) blocked this turn — Alibaba\'s content safety filter flagged the input. ' +
      'This often happens on turns with web search plus constitutional or metaphorical language (e.g. raja/KING). ' +
      'Try again without asking ADAM to search the web, or rephrase slightly. ' +
      'If this keeps happening, the Founder can request a DashScope content-filter whitelist for the API key.'
    );
  }
  return msg.length > 280 ? `${msg.slice(0, 280)}…` : msg;
}

export function isQwenDataInspectionError(err: unknown): boolean {
  const msg = extractLlmErrorText(err);
  return /DataInspectionFailed|data_inspection_failed|inappropriate content/i.test(msg);
}

interface NativePrefetchAttemptResult {
  text:           string;
  searchResults:  LlmSearchResult[];
  diagnostic:     DashScopePrefetchAttemptDiag;
}

/** Native DashScope text-generation endpoint — returns search_info (compatible-mode does not). */
export function dashScopeNativeGenerationUrl(): string {
  return dashScopeNativeGenerationUrlForHost(resolveDashScopeSearchNativeHost());
}

export function ingestDashScopeSearchHits(
  hits: DashScopeSearchHitRaw[],
  target: LlmSearchResult[],
  seen: Set<string>,
  maxHits = DASHSCOPE_PREFETCH_MAX_HITS,
): void {
  for (const hit of hits) {
    if (target.length >= maxHits) return;
    const url = hit.url?.trim() ?? hit.link?.trim() ?? '';
    const key = url || hit.title?.trim() || '';
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const snippet = hit.snippet?.trim()
      || hit.content?.trim()
      || hit.summary?.trim()
      || undefined;
    target.push({
      title:   hit.title?.trim(),
      url:     url || undefined,
      snippet: snippet || undefined,
      pageFetched: false,
    });
  }
}

function buildNativePrefetchBody(params: LlmStreamParams, searchStrategy?: string) {
  const searchOptions = buildQwenSearchOptions(params.forceWebSearch === true, {
    assignedSites:  params.searchAssignedSites,
    searchStrategy: searchStrategy ?? params.searchStrategy,
  });
  return {
    model: params.model,
    input: {
      messages: [
        { role: 'system', content: params.system },
        ...params.messages,
      ],
    },
    parameters: {
      enable_search:   true,
      search_options:  searchOptions,
      result_format:   'message',
      max_tokens:      params.maxTokens,
      enable_thinking: false,
    },
  };
}

/** Prefetch — DashScope native non-stream generation. */
async function qwenNativePrefetchWithSearch(
  params: LlmStreamParams,
  host: string,
  searchStrategy?: string,
): Promise<NativePrefetchAttemptResult> {
  const searchResults: LlmSearchResult[] = [];
  const seenSearchUrls = new Set<string>();
  const body = buildNativePrefetchBody(params, searchStrategy);
  const endpoint = dashScopeNativeGenerationUrlForHost(host);

  const response = await fetch(endpoint, {
    method:  'POST',
    headers: dashScopeHeaders(),
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(DASHSCOPE_PREFETCH_FETCH_TIMEOUT_MS),
  });

  const json = await response.json() as DashScopeSearchResponseShape;
  if (!response.ok) {
    throw new Error(json.message ?? `DashScope native generation error ${response.status}`);
  }
  if (json.code && json.code !== 'Success' && json.code !== '200') {
    throw new Error(json.message ?? `DashScope native generation failed: ${json.code}`);
  }

  ingestDashScopeSearchHits(
    json.output?.search_info?.search_results ?? [],
    searchResults,
    seenSearchUrls,
  );

  const text = json.output?.choices?.[0]?.message?.content?.trim() ?? '';
  const strategy = searchStrategy ?? params.searchStrategy;
  return {
    text,
    searchResults,
    diagnostic: buildDashScopePrefetchAttemptDiag({
      transport:      'native',
      host,
      model:          params.model,
      searchStrategy: strategy,
      forcedSearch:   params.forceWebSearch === true,
      httpStatus:     response.status,
      json,
      parsedHitCount: searchResults.length,
    }),
  };
}

/** Prefetch fallback — native SSE returns search_results in the first chunk (Alibaba documented path). */
async function qwenNativeSsePrefetchWithSearch(
  params: LlmStreamParams,
  host: string,
  searchStrategy?: string,
): Promise<NativePrefetchAttemptResult> {
  const searchResults: LlmSearchResult[] = [];
  const seenSearchUrls = new Set<string>();
  const strategy = searchStrategy ?? params.searchStrategy;
  const searchOptions = buildQwenSearchOptions(params.forceWebSearch === true, {
    assignedSites:  params.searchAssignedSites,
    searchStrategy: strategy,
  });
  const endpoint = dashScopeNativeGenerationUrlForHost(host);

  const body = {
    model: params.model,
    input: {
      messages: [
        { role: 'system', content: params.system },
        ...params.messages,
      ],
    },
    parameters: {
      enable_search:      true,
      search_options:     searchOptions,
      result_format:      'message',
      max_tokens:         params.maxTokens,
      incremental_output: true,
      enable_thinking:    false,
    },
  };

  console.log('[llm:prefetch-search] native SSE requesting', JSON.stringify({
    host,
    model: params.model,
    strategy,
    endpoint,
  }));

  const response = await fetch(endpoint, {
    method:  'POST',
    headers: {
      ...dashScopeHeaders(),
      'X-DashScope-SSE': 'enable',
      Accept:            'text/event-stream',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(DASHSCOPE_PREFETCH_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    let errJson: DashScopeSearchResponseShape = {};
    try {
      errJson = JSON.parse(errText) as DashScopeSearchResponseShape;
    } catch {
      // non-JSON error body
    }
    throw new Error(errJson.message ?? `DashScope native SSE error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('DashScope native SSE returned an empty body.');
  }

  let rawHitCount = 0;
  const { lastJson, fullText, abortedEarly } = await consumeDashScopeNativeSseStream(
    response.body,
    (parsed) => {
      const hits = extractSearchResultsFromDashScopeJson(parsed);
      if (hits.length > 0) {
        rawHitCount += hits.length;
        ingestDashScopeSearchHits(hits, searchResults, seenSearchUrls);
      }
      if (searchResults.length > 0) return true;
      const finishReason = (parsed.output?.choices?.[0] as { finish_reason?: string } | undefined)
        ?.finish_reason;
      return finishReason === 'stop';
    },
    DASHSCOPE_PREFETCH_SSE_TIMEOUT_MS,
    DASHSCOPE_PREFETCH_SSE_IDLE_MS,
  );

  if (abortedEarly && searchResults.length > 0) {
    console.log('[llm:prefetch-search] native SSE early stop after hits', JSON.stringify({
      hits: searchResults.length,
      rawHitCount,
    }));
  }

  if (lastJson.code && lastJson.code !== 'Success' && lastJson.code !== '200') {
    throw new Error(lastJson.message ?? `DashScope native SSE failed: ${lastJson.code}`);
  }

  return {
    text: fullText.trim(),
    searchResults,
    diagnostic: buildDashScopePrefetchAttemptDiag({
      transport:      'native_sse',
      host,
      model:          params.model,
      searchStrategy: strategy,
      forcedSearch:   params.forceWebSearch === true,
      httpStatus:     response.status,
      json:           lastJson,
      parsedHitCount: searchResults.length,
    }),
  };
}

/**
 * Prefetch strategy ladder — region-aware.
 * On intl DashScope, legacy search_strategy "max" returns China-index hits (Baidu/WeChat/Youdao).
 */
export function resolvePrefetchSearchStrategies(
  requested?: string,
  nativeHost?: string,
): string[] {
  const primary = requested?.trim() || ENV.QWEN_SEARCH_STRATEGY;
  const host = nativeHost?.trim() || resolveDashScopeSearchNativeHost();
  const intl = isDashScopeIntlHost(host);

  if (intl) {
    if (!primary || primary === 'agent' || primary === 'max') return ['agent'];
    if (primary === 'agent_max') return ['agent_max', 'agent'];
    return [primary];
  }

  if (!primary || primary === 'agent') return ['agent', 'max'];
  if (primary === 'max') return ['max', 'agent'];
  return [primary, 'max', 'agent'].filter((s, i, a) => a.indexOf(s) === i);
}

function prefetchSearchStrategies(requested?: string, nativeHost?: string): string[] {
  return resolvePrefetchSearchStrategies(requested, nativeHost);
}

function dashScopeHeaders(): Record<string, string> {
  if (!ENV.DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY is not configured.');
  }
  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    Authorization:   `Bearer ${ENV.DASHSCOPE_API_KEY}`,
  };
  const inspection = ENV.QWEN_DATA_INSPECTION.trim();
  if (inspection) {
    headers['X-DashScope-DataInspection'] = inspection;
  }
  return headers;
}

async function qwenComplete(params: LlmCompleteParams & { enableThinking?: boolean }): Promise<string> {
  const body: Record<string, unknown> = {
    model:            params.model,
    max_tokens:       params.maxTokens,
    enable_thinking:  params.enableThinking ?? false,
    messages:         [
      { role: 'system', content: params.system },
      ...params.messages,
    ],
    stream: false,
  };

  const response = await dashScopeFetch(body);
  const json = await response.json() as {
    choices?: { message?: { content?: string } }[];
    error?:    { message?: string };
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? `DashScope error ${response.status}`);
  }

  return json.choices?.[0]?.message?.content ?? '';
}

async function qwenStream(params: LlmStreamParams): Promise<LlmStreamResult> {
  const body: Record<string, unknown> = {
    model:            params.model,
    max_tokens:       params.maxTokens,
    enable_thinking:  params.enableThinking ?? false,
    messages:         [
      { role: 'system', content: params.system },
      ...params.messages,
    ],
    stream: true,
  };

  if (params.enableWebSearch) {
    body.enable_search = true;
    body.search_options = buildQwenSearchOptions(params.forceWebSearch === true, {
      assignedSites:   params.searchAssignedSites,
      searchStrategy:  params.searchStrategy,
    });
  }

  const response = await dashScopeFetch(body);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(errJson.error?.message ?? `DashScope stream error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('DashScope returned an empty stream body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let searchAnnounced = false;
  let searchDone = false;
  const searchResults: LlmSearchResult[] = [];
  const seenSearchUrls = new Set<string>();
  const searchQueryLabel = params.searchDisplayQuery?.trim() || 'Mencari data sebenar…';

  const emitSearchDone = (hitCount?: number) => {
    if (!searchAnnounced || searchDone) return;
    params.onEvent?.('adam_search_done', JSON.stringify({
      query:   searchQueryLabel,
      hits:    hitCount ?? searchResults.length,
      results: searchResults.slice(0, 8).map((hit) => ({
        title: hit.title ?? '',
        url:   hit.url ?? '',
      })),
    }));
    searchDone = true;
  };

  if (params.enableWebSearch) {
    searchAnnounced = true;
    params.onEvent?.('adam_searching', JSON.stringify({ query: searchQueryLabel }));
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
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
          const parsed = JSON.parse(payload) as {
            choices?: { delta?: { content?: string; reasoning_content?: string } }[];
            output?: {
              search_info?: {
                search_results?: DashScopeSearchHitRaw[];
              };
            };
            search_info?: {
              search_results?: DashScopeSearchHitRaw[];
            };
          };

          const results = parsed.search_info?.search_results
            ?? parsed.output?.search_info?.search_results;
          if (params.enableWebSearch && results?.length) {
            ingestDashScopeSearchHits(results, searchResults, seenSearchUrls);
            if (!searchAnnounced) {
              searchAnnounced = true;
              params.onEvent?.(
                'adam_searching',
                JSON.stringify({ query: searchQueryLabel }),
              );
            }
          }

          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            emitSearchDone();
            fullText += chunk;
            params.onEvent?.('adam_chunk', JSON.stringify({ text: chunk }));
          }
        } catch {
          // skip malformed SSE line
        }
      }
    }
  } finally {
    if (params.enableWebSearch) {
      emitSearchDone();
    }
  }

  return { text: fullText, searchResults };
}

async function dashScopeFetch(body: Record<string, unknown>): Promise<Response> {
  const base = ENV.QWEN_API_BASE.replace(/\/$/, '');
  return fetch(`${base}/chat/completions`, {
    method:  'POST',
    headers: dashScopeHeaders(),
    body: JSON.stringify(body),
  });
}

export async function llmComplete(params: LlmCompleteParams): Promise<string> {
  return qwenComplete(params);
}

export async function llmStream(params: LlmStreamParams): Promise<LlmStreamResult> {
  return qwenStream(params);
}

/**
 * Phase-1 prefetch search — native DashScope SSE only.
 * Non-stream + enable_search fails on thinking-capable models (InvalidParameter).
 * Compatible-mode /chat/completions does NOT return search_info.
 */
export async function llmPrefetchWebSearch(
  params: LlmStreamParams,
): Promise<LlmStreamResult> {
  const baseParams: LlmStreamParams = {
    ...params,
    enableWebSearch: true,
    forceWebSearch:  true,
    enableThinking:  false,
  };
  const hosts = resolveDashScopeSearchPrefetchHosts();
  const attempts: DashScopePrefetchAttemptDiag[] = [];
  let lastText = '';
  let lastResults: LlmSearchResult[] = [];

  for (const host of hosts) {
    const strategies = prefetchSearchStrategies(params.searchStrategy, host);
    for (const strategy of strategies) {
      try {
        try {
          const native = await qwenNativePrefetchWithSearch(baseParams, host, strategy);
          attempts.push(native.diagnostic);
          lastText = native.text || lastText;
          lastResults = native.searchResults;
          if (native.searchResults.length > 0) {
            console.log('[llm:prefetch-search] native non-stream hit', JSON.stringify({
              host,
              strategy,
              model: baseParams.model,
              hits: native.searchResults.length,
              requestId: native.diagnostic.requestId,
            }));
            return { text: native.text, searchResults: native.searchResults };
          }
        } catch (nativeErr: unknown) {
          const nativeMsg = extractLlmErrorText(nativeErr);
          if (!isDashScopeNonStreamSearchThinkingError(nativeMsg)) {
            console.warn('[llm:prefetch-search] native non-stream failed', JSON.stringify({
              host,
              strategy,
              model: baseParams.model,
              error: nativeMsg,
            }));
          }
        }

        const sse = await qwenNativeSsePrefetchWithSearch(baseParams, host, strategy);
        attempts.push(sse.diagnostic);
        lastText = sse.text || lastText;
        lastResults = sse.searchResults;
        if (sse.searchResults.length > 0) {
          console.log('[llm:prefetch-search] native SSE hit', JSON.stringify({
            host,
            strategy,
            hits: sse.searchResults.length,
            requestId: sse.diagnostic.requestId,
          }));
          return { text: sse.text, searchResults: sse.searchResults };
        }

        console.warn('[llm:prefetch-search] native SSE 0 hits', JSON.stringify({
          host,
          strategy,
          requestId: sse.diagnostic.requestId,
          searchPluginCount: sse.diagnostic.searchPluginCount,
          rawHitCount: sse.diagnostic.rawHitCount,
        }));
      } catch (err: unknown) {
        const errorMessage = extractLlmErrorText(err);
        attempts.push(buildDashScopePrefetchFailedAttemptDiag({
          transport:      'native_sse',
          host,
          model:          baseParams.model,
          searchStrategy: strategy,
          forcedSearch:   true,
          errorMessage,
        }));
        console.warn('[llm:prefetch-search] native SSE failed', JSON.stringify({
          host,
          strategy,
          error: errorMessage,
        }));
      }
    }
  }

  console.error(
    '[llm:prefetch-search] exhausted native SSE search ladder — 0 hits',
    JSON.stringify(summarizePrefetchAttempts(attempts)),
  );
  return { text: lastText, searchResults: lastResults };
}

export async function llmCompleteUserPrompt(
  system: string,
  userPrompt: string,
  model: string,
  maxTokens = 1500,
): Promise<string> {
  const messages: LlmMessage[] = [{ role: 'user', content: userPrompt }];
  return llmComplete({ system, messages, model, maxTokens });
}

/** Vision — image buffer to teaching text (Qwen-VL). */
export async function llmDescribeImage(params: {
  buffer:       Buffer;
  mediaType:    string;
  fileName:     string;
  prompt:       string;
  model:        string;
  maxTokens?:   number;
}): Promise<string> {
  const { buffer, mediaType, fileName, prompt, model, maxTokens = 4096 } = params;
  const dataUrl = `data:${mediaType};base64,${buffer.toString('base64')}`;

  if (!ENV.DASHSCOPE_API_KEY) {
    throw new Error('Image reading requires DASHSCOPE_API_KEY on the server.');
  }
  const base = ENV.QWEN_API_BASE.replace(/\/$/, '');
  const response = await fetch(`${base}/chat/completions`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${ENV.DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{
        role:    'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });
  const json = await response.json() as {
    choices?: { message?: { content?: string } }[];
    error?:   { message?: string };
  };
  if (!response.ok) {
    throw new Error(json.error?.message ?? `DashScope vision error ${response.status}`);
  }
  const text = json.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) {
    throw new Error(`Could not read image "${fileName}". Try a clearer JPG or PNG.`);
  }
  return text;
}

export function assertLlmConfigured(): void {
  if (!ENV.DASHSCOPE_API_KEY) {
    console.warn('[QXK24] Qwen stack but DASHSCOPE_API_KEY is missing.');
  }
}

export function isLlmConfigured(): boolean {
  return Boolean(ENV.DASHSCOPE_API_KEY);
}
