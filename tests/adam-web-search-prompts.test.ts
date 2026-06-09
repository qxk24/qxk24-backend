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
    expect(countOccurrences(prompt, 'WHEN TO SEARCH:')).toBe(1);
    expect(countOccurrences(prompt, 'CITATION HONESTY')).toBe(1);
  });

  it('prefetched overlay omits when-to (search already ran)', () => {
    const prompt = buildStudentWebSearchPrompt('prefetched');
    expect(prompt).not.toContain('WHEN TO SEARCH:');
    expect(countOccurrences(prompt, 'CITATION HONESTY')).toBe(1);
    expect(prompt).toMatch(/scientist-scholar/i);
    expect(prompt).toMatch(/NOT copy-paste/i);
    expect(prompt).toMatch(/diabetes/i);
  });

  it('technical overlay keeps universal mandate', () => {
    const prompt = buildStudentWebSearchPrompt('technical_precision');
    expect(prompt).toMatch(/UNIVERSAL/);
    expect(prompt).toMatch(/every domain, every product/);
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
    expect(prompt).toMatch(/teaching absorption/);
    expect(countOccurrences(prompt, 'CITATION HONESTY')).toBe(1);
  });

  it('life substantive overlay includes pipeline and flowing prose rules', () => {
    const prompt = buildStudentWebSearchPrompt('life_substantive');
    expect(prompt).toMatch(/STUDENT REPLY PIPELINE/);
    expect(prompt).toMatch(/flowing like water/i);
    expect(prompt).not.toContain('WHEN TO SEARCH:');
  });

  it('getAdamWebSearchPrompt routes inline explanatory science turns', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      userMessage: 'Apa punca manusia mengidap diabetes?',
    });
    expect(prompt).toMatch(/EXPLANATORY SCIENCE/);
    expect(prompt).toMatch(/P\.alt teaching/i);
    expect(prompt).toMatch(/WHEN TO SEARCH/);
    expect(prompt).toMatch(/Pertama.*Kedua/i);
  });

  it('getAdamWebSearchPrompt routes prefetched explanatory science turns', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      searchPrefetched: true,
      userMessage:      'Apa punca manusia mengidap diabetes?',
    });
    expect(prompt).toMatch(/EXPLANATORY SCIENCE/);
    expect(prompt).toMatch(/P\.alt teaching/i);
    expect(prompt).not.toContain('WHEN TO SEARCH:');
  });

  it('getAdamWebSearchPrompt routes prefetched life turns', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      searchPrefetched: true,
      userMessage:      'Kenapa saya rasa cemas sebelum tidur?',
    });
    expect(prompt).toMatch(/LIFE\/EMOTION/);
    expect(prompt).toMatch(/STUDENT REPLY PIPELINE/);
  });

  it('getAdamWebSearchPrompt routes student technical turns', () => {
    const prompt = getAdamWebSearchPrompt(false, {
      userMessage: 'Berapa mg paracetamol untuk kanak-kanak 10 tahun?',
    });
    expect(prompt).toMatch(/TECHNICAL PRECISION/);
    expect(prompt).not.toMatch(/Perodua|Viva/i);
  });
});
