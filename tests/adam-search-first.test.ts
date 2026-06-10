/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { getFastModel } from '../src/config/llm-models';
import {
  buildPrefetchedSearchContextBlock,
  buildSearchPrefetchUserPrompt,
  getStudentSearchPrefetchModel,
  shouldStudentUseSearchFirstFlow,
} from '../src/adam/adam-search-first';

describe('ADAM search-first flow', () => {
  it('uses fast tier for search-only prefetch', () => {
    expect(getStudentSearchPrefetchModel()).toBe(getFastModel());
  });

  it('never blocks on general factual_question — inline or agent search only', () => {
    expect(shouldStudentUseSearchFirstFlow(false, 'factual_question')).toBe(false);
    expect(shouldStudentUseSearchFirstFlow(true, 'factual_question')).toBe(false);
    expect(shouldStudentUseSearchFirstFlow(false, null)).toBe(false);
  });


  it('builds prefetch user prompt with recent context', () => {
    const prompt = buildSearchPrefetchUserPrompt('Exclusive pula?', ['Berapa tork varian Elite?']);
    expect(prompt).toMatch(/Recent student messages/);
    expect(prompt).toMatch(/Exclusive pula/);
    expect(prompt).toMatch(/tork varian Elite/);
  });

  it('injects mandatory ground-truth block from hits', () => {
    const block = buildPrefetchedSearchContextBlock([
      { title: 'Torque 90 Nm spec', url: 'https://example.com/spec' },
    ]);
    expect(block).toMatch(/WEB SEARCH RESULTS — MANDATORY GROUND TRUTH/);
    expect(block).toMatch(/90 Nm/);
    expect(block).toMatch(/example\.com/);
    expect(block).not.toMatch(/PERODUA|PROTON|VIVA/i);
  });

  it('marks empty and dropped prefetch honestly', () => {
    expect(buildPrefetchedSearchContextBlock([])).toMatch(/NO USABLE HITS/);
    expect(buildPrefetchedSearchContextBlock([], { searchDropped: true })).toMatch(/UNAVAILABLE/);
  });
});
