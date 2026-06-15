/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : LLM Models Thinking Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { resolveQwenEnableThinking } from '../src/config/llm-models';

describe('resolveQwenEnableThinking — live stream UX', () => {
  it('disables silent thinking for User consumer turns', () => {
    expect(resolveQwenEnableThinking('deep', 'TEACHING', { isStudent: true })).toBe(false);
    expect(resolveQwenEnableThinking('deep', 'QUESTIONING', { isStudent: true })).toBe(false);
  });

  it('disables silent thinking on search-first synthesis', () => {
    expect(resolveQwenEnableThinking('deep', 'TEACHING', { searchFirstSynthesis: true })).toBe(false);
  });

  it('keeps thinking off for fast tier regardless', () => {
    expect(resolveQwenEnableThinking('fast', 'TEACHING', {})).toBe(false);
  });
});
