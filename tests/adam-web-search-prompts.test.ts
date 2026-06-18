/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Web Search Prompts Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
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
  ADAM_CITATION_HONESTY,
  ADAM_SEARCH_WHEN_TO,
  buildFounderWebSearchPrompt,
  buildStudentWebSearchPrompt,
} from '../src/adam/adam-web-search-prompts';
import { getAdamWebSearchPrompt } from '../src/adam/adam-web-search';

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('adam-web-search-prompts (Fasa 3)', () => {
  it('foundation strings are defined once', () => {
    expect(ADAM_SEARCH_WHEN_TO).toMatch(/WHEN TO SEARCH/);
    expect(ADAM_CITATION_HONESTY).toMatch(/CITATION HONESTY/);
  });

  it('student agent prompt includes when-to and citation once each', () => {
    const prompt = buildStudentWebSearchPrompt('agent_default');
    expect(countOccurrences(prompt, 'WHEN TO SEARCH')).toBe(1);
    expect(countOccurrences(prompt, 'CITATION HONESTY')).toBe(1);
    expect(prompt).toMatch(/same ADAM voice as with P\.alt/i);
  });

  it('prefetched overlay omits when-to (search already ran)', () => {
    const prompt = buildStudentWebSearchPrompt('prefetched');
    expect(prompt).not.toMatch(/WHEN TO SEARCH \(live web prefetch/);
    expect(countOccurrences(prompt, 'CITATION HONESTY')).toBe(1);
    expect(prompt).toMatch(/natural ADAM voice/i);
    expect(prompt).not.toMatch(/:=\s*[01]/);
  });

  it('technical overlay is compact — no universal mandate wall', () => {
    const prompt = buildStudentWebSearchPrompt('technical_precision');
    expect(prompt).toMatch(/TECHNICAL/i);
    expect(prompt).not.toMatch(/every domain, every product/);
    expect(countOccurrences(prompt, 'CITATION HONESTY')).toBe(1);
  });

  it('entity correction overlay is compact', () => {
    const prompt = buildStudentWebSearchPrompt('entity_correction');
    expect(prompt).toMatch(/ENTITY CORRECTION/);
    expect(prompt).not.toContain('WHEN TO SEARCH:');
    expect(countOccurrences(prompt, 'CITATION HONESTY')).toBe(1);
  });

  it('founder teaching absorption overlay is wired', () => {
    const prompt = buildFounderWebSearchPrompt('teaching_absorption');
    expect(prompt).toMatch(/absorption|explain-back/i);
    expect(countOccurrences(prompt, 'CITATION HONESTY')).toBe(1);
  });

  it('life substantive overlay uses natural prose rules', () => {
    const prompt = buildStudentWebSearchPrompt('life_substantive');
    expect(prompt).toMatch(/LIFE \/ EMOTION/i);
    expect(prompt).toMatch(/Flowing paragraphs/i);
    expect(prompt).not.toContain('WHEN TO SEARCH:');
    expect(prompt).not.toMatch(/STUDENT REPLY PIPELINE/);
  });

  it('getAdamWebSearchPrompt — student uses Users agent prompt when gate open', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      userMessage: 'Siapa presiden Malaysia sekarang?',
    });
    expect(prompt).toMatch(/DashScope agent mode/i);
    expect(prompt).toMatch(/WHEN TO SEARCH/);
    expect(prompt).toMatch(/Users turn/i);
    expect(prompt).not.toMatch(/EXPLANATORY SCIENCE/);
    expect(prompt).not.toMatch(/TECHNICAL PRECISION — search is MANDATORY/);
  });

  it('getAdamWebSearchPrompt — student prefetched uses student prefetched overlay', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      searchPrefetched: true,
      userMessage:      'Apa punca manusia mengidap diabetes?',
    });
    expect(prompt).toMatch(/ALREADY COMPLETED BEFORE THIS REPLY/i);
    expect(prompt).not.toMatch(/DashScope agent mode/i);
  });

  it('getAdamWebSearchPrompt — verified data stat uses mandatory institutional overlay', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      verifiedDataStat: true,
      userMessage:      'Jumlah pelajar KPTM',
    });
    expect(prompt).toMatch(/INSTITUTIONAL STATISTICS/i);
    expect(prompt).toMatch(/Disambiguate acronyms/i);
  });

  it('getAdamWebSearchPrompt — student life turn still founder-shaped', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      userMessage: 'Kenapa saya rasa cemas sebelum tidur?',
    });
    expect(prompt).toMatch(/DashScope agent mode/i);
    expect(prompt).not.toMatch(/LIFE\/EMOTION — SEARCH DONE/);
  });

  it('getAdamWebSearchPrompt — student technical turn still founder-shaped', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      userMessage: 'Berapa mg paracetamol untuk kanak-kanak 10 tahun?',
    });
    expect(prompt).toMatch(/DashScope agent mode/i);
    expect(prompt).not.toMatch(/TECHNICAL PRECISION — search is MANDATORY/);
    expect(prompt).not.toMatch(/Perodua|Viva/i);
  });
});
