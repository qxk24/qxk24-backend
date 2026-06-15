/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : LLM Client Search Parsing Test
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
  dashScopeNativeGenerationUrl,
  ingestDashScopeSearchHits,
} from '../src/llm/llm-client';

describe('dashScopeNativeGenerationUrl', () => {
  it('strips compatible-mode path for native generation endpoint', () => {
    const url = dashScopeNativeGenerationUrl();
    expect(url).toMatch(/\/api\/v1\/services\/aigc\/text-generation\/generation$/);
    expect(url).not.toMatch(/compatible-mode/);
  });
});

describe('ingestDashScopeSearchHits', () => {
  it('dedupes by URL and maps snippet/content fields', () => {
    const target: { title?: string; url?: string; snippet?: string }[] = [];
    const seen = new Set<string>();

    ingestDashScopeSearchHits([
      {
        title:   'Sejarah KPTM',
        url:     'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
        content: 'lebih 18,000 orang pelajar sepenuh masa',
      },
      {
        title: 'Sejarah KPTM duplicate',
        url:   'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
        snippet: 'should be skipped',
      },
      {
        title:   'KPTM Corporate',
        url:     'https://www.kptm.edu.my/',
        summary: '7 campuses nationwide',
      },
    ], target, seen);

    expect(target).toHaveLength(2);
    expect(target[0]?.snippet).toMatch(/18,000/);
    expect(target[1]?.snippet).toMatch(/7 campuses/);
  });
});
