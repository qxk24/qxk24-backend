/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : DashScope Search Test
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

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  dashScopeNativeGenerationUrlForHost,
  consumeDashScopeNativeSseStream,
  DASHSCOPE_CN_NATIVE_HOST,
  DASHSCOPE_INTL_NATIVE_HOST,
  DASHSCOPE_PREFETCH_MAX_HITS,
  extractDashScopeApiHost,
  isDashScopeIntlHost,
  isDashScopeNonStreamSearchThinkingError,
  parseDashScopeNativeSsePayload,
} from '../src/llm/dashscope-search';
import { ingestDashScopeSearchHits, resolvePrefetchSearchStrategies } from '../src/llm/llm-client';

const SAMPLE_SSE = `id:1
event:result
:HTTP_STATUS/200
data:{"output":{"choices":[{"message":{"content":"","role":"assistant"},"finish_reason":"null"}],"search_info":{"search_results":[{"site_name":"example","index":1,"title":"KPTM student enrollment history","url":"https://bangi.kptm.edu.my/sejarah-kptm-copy/"}]}},"usage":{},"request_id":"req-test-1"}

id:2
event:result
:HTTP_STATUS/200
data:{"output":{"choices":[{"message":{"content":"Ringkasan","role":"assistant"},"finish_reason":"null"}],"search_info":{"search_results":[]}},"usage":{"plugins":{"search":{"count":1}}},"request_id":"req-test-1"}
`;

describe('extractDashScopeApiHost', () => {
  it('strips compatible-mode suffix from chat base URL', () => {
    expect(extractDashScopeApiHost('https://dashscope-intl.aliyuncs.com/compatible-mode/v1'))
      .toBe('https://dashscope-intl.aliyuncs.com');
  });
});

describe('isDashScopeIntlHost', () => {
  it('detects international DashScope host', () => {
    expect(isDashScopeIntlHost('https://dashscope-intl.aliyuncs.com')).toBe(true);
    expect(isDashScopeIntlHost('https://dashscope.aliyuncs.com')).toBe(false);
  });
});

describe('dashScopeNativeGenerationUrlForHost', () => {
  it('builds native generation path', () => {
    const url = dashScopeNativeGenerationUrlForHost('https://dashscope.aliyuncs.com');
    expect(url).toBe('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation');
  });
});

describe('isDashScopeNonStreamSearchThinkingError', () => {
  it('detects thinking + non-stream search conflict from DashScope', () => {
    expect(isDashScopeNonStreamSearchThinkingError(
      'InternalError.Algo.InvalidParameter: Non-streaming mode does not support Web Search in thinking mode.',
    )).toBe(true);
  });
});

describe('resolvePrefetchSearchStrategies', () => {
  it('uses agent only on intl — max returns China-index hits', () => {
    expect(resolvePrefetchSearchStrategies(undefined, DASHSCOPE_INTL_NATIVE_HOST)).toEqual(['agent']);
    expect(resolvePrefetchSearchStrategies('agent', DASHSCOPE_INTL_NATIVE_HOST)).toEqual(['agent']);
    expect(resolvePrefetchSearchStrategies('max', DASHSCOPE_INTL_NATIVE_HOST)).toEqual(['agent']);
  });

  it('ladders agent to max on CN host', () => {
    expect(resolvePrefetchSearchStrategies(undefined, DASHSCOPE_CN_NATIVE_HOST)).toEqual(['agent', 'max']);
    expect(resolvePrefetchSearchStrategies('max', DASHSCOPE_CN_NATIVE_HOST)).toEqual(['max', 'agent']);
  });
});

describe('parseDashScopeNativeSsePayload', () => {
  it('extracts search_results from first SSE chunk only', () => {
    const target: { title?: string; url?: string }[] = [];
    const seen = new Set<string>();
    let text = '';

    const last = parseDashScopeNativeSsePayload(
      SAMPLE_SSE,
      (hits) => ingestDashScopeSearchHits(hits, target, seen),
      (chunk) => { text += chunk; },
    );

    expect(target).toHaveLength(1);
    expect(target[0]?.url).toMatch(/kptm\.edu\.my/);
    expect(text).toBe('Ringkasan');
    expect(last?.request_id).toBe('req-test-1');
  });
});

describe('ingestDashScopeSearchHits', () => {
  it('caps prefetch hits at DASHSCOPE_PREFETCH_MAX_HITS', () => {
    const target: { title?: string; url?: string }[] = [];
    const seen = new Set<string>();
    const manyHits = Array.from({ length: 20 }, (_, i) => ({
      title: `Hit ${i}`,
      url:   `https://example.com/${i}`,
    }));
    ingestDashScopeSearchHits(manyHits, target, seen);
    expect(target).toHaveLength(DASHSCOPE_PREFETCH_MAX_HITS);
  });
});

describe('consumeDashScopeNativeSseStream', () => {
  it('stops early once search hits are ingested', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(SAMPLE_SSE));
        controller.enqueue(encoder.encode('id:3\ndata:{"output":{"choices":[{"message":{"content":" should not wait","role":"assistant"}}]}}\n\n'));
        controller.close();
      },
    });
    const target: { url?: string }[] = [];
    const seen = new Set<string>();
    let text = '';

    const { abortedEarly, fullText } = await consumeDashScopeNativeSseStream(
      body,
      (parsed) => {
        const hits = parsed.output?.search_info?.search_results ?? [];
        if (hits.length > 0) ingestDashScopeSearchHits(hits, target, seen);
        if (target.length > 0) return true;
        const chunk = parsed.output?.choices?.[0]?.message?.content;
        if (chunk) text += chunk;
        return false;
      },
      5_000,
    );

    expect(target).toHaveLength(1);
    expect(abortedEarly).toBe(true);
    expect(fullText).not.toContain('should not wait');
  });
});
