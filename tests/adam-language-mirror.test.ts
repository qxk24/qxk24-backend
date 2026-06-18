/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Language Mirror Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { detectLanguage } from '../src/adam/adam-language-mirror.service';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

describe('ADAM language mirror', () => {
  it('detects Hello as English', () => {
    const result = detectLanguage('Hello');
    expect(result.detectedLocale).toBe('en');
    expect(result.replyInstruction).toMatch(/English/i);
  });

  it('detects short English questions as English', () => {
    const result = detectLanguage('What is photosynthesis?');
    expect(result.detectedLocale).toBe('en');
  });

  it('strips Bismillah opener from student output', () => {
    const out = sanitizeUsersOutputSync(
      'Bismillahirahmanirrahim.\n\nHello. What would you like to explore today?',
      'Hello',
    );
    expect(out).not.toMatch(/Bismillah/i);
    expect(out).toMatch(/Hello/i);
  });
});

describe('Simple factual turns', () => {
  it('detects language capability questions', async () => {
    const { isAdamSimpleFactualTurn } = await import('../src/adam/adam-response-generation');
    expect(isAdamSimpleFactualTurn('How many languages do you understand?')).toBe(true);
    expect(isAdamSimpleFactualTurn('Siapa presiden Indonesia sekarang?')).toBe(true);
    expect(isAdamSimpleFactualTurn('Explain photosynthesis in detail')).toBe(false);
  });

  it('triggers web search for current president questions', async () => {
    const { getWebSearchGateReason, shouldForceWebSearchForGateReason } = await import('../src/adam/adam-web-search');
    expect(
      getWebSearchGateReason('Who is the current President of Indonesia?', {
        usersFounderParity: true,
      }),
    ).toBe('current_affairs');
    expect(shouldForceWebSearchForGateReason('current_affairs')).toBe(true);
    expect(
      getWebSearchGateReason('Siapa presiden Indonesia sekarang?', {
        isFounder: true,
      }),
    ).toBe('current_affairs');
  });
});
