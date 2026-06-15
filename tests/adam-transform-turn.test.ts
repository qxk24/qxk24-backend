/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Transform Turn Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  inquiryQuestionFingerprint,
  shouldTransformTurn,
  resolveTransformASource,
  transformEpisodeFingerprint,
  shouldSkipTransformDedupe,
  shouldFounderTransformTurn,
  MIN_TRANSFORM_EPISODE_CHARS,
  MIN_TRANSFORM_EPISODE_CHARS_WITH_SEARCH,
} from '../src/adam/adam-transform-turn.gate';
import { detectContextRecallLoaded } from '../src/adam/adam-universal-recall-router';

const LONG_REPLY = 'x'.repeat(MIN_TRANSFORM_EPISODE_CHARS + 20);
const SEARCH_REPLY = 'x'.repeat(MIN_TRANSFORM_EPISODE_CHARS_WITH_SEARCH + 10);

describe('adam-transform-turn gate', () => {
  it('allows substantive inquiry with sufficient reply', () => {
    expect(shouldTransformTurn({
      userMessage:   'Apa bentuk bumi dan kenapa kelihatan bulat?',
      finalResponse: LONG_REPLY,
      isFounder:     false,
    })).toBe(true);
  });

  it('allows substantive turn with web search at lower char floor', () => {
    expect(shouldTransformTurn({
      userMessage:   'Apa bentuk bumi?',
      finalResponse: SEARCH_REPLY,
      webSearchUsed: true,
      recallLoaded:  false,
      isFounder:     false,
    })).toBe(true);
  });

  it('skips light chat even with long reply', () => {
    expect(shouldTransformTurn({
      userMessage:   'thanks',
      finalResponse: LONG_REPLY,
    })).toBe(false);
  });

  it('skips founder path', () => {
    expect(shouldTransformTurn({
      userMessage:   'Explain earth shape',
      finalResponse: LONG_REPLY,
      isFounder:     true,
    })).toBe(false);
  });

  it('skips guest trial', () => {
    expect(shouldTransformTurn({
      userMessage:   'Apa bentuk bumi?',
      finalResponse: LONG_REPLY,
      isGuestTrial:  true,
    })).toBe(false);
  });

  it('resolveTransformASource — inquiry vs conventional', () => {
    expect(resolveTransformASource({
      userMessage: 'Apa bentuk bumi?',
    })).toBe('inquiry');
    expect(resolveTransformASource({
      userMessage:   'Apa bentuk bumi?',
      webSearchUsed: true,
      recallLoaded:  false,
    })).toBe('conventional');
  });

  it('fresh conventional fingerprint differs from recall-hit', () => {
    const q = 'Apa bentuk bumi?';
    const base = inquiryQuestionFingerprint(q);
    expect(transformEpisodeFingerprint(q, true, false)).toBe(`${base}-conv`);
    expect(transformEpisodeFingerprint(q, true, true)).toBe(base);
  });

  it('dedupe bypass when fresh conventional A', () => {
    expect(shouldSkipTransformDedupe(true, true, false)).toBe(false);
    expect(shouldSkipTransformDedupe(true, false, false)).toBe(true);
  });

  it('founder transform gate — skips light chat and episodic skip', () => {
    expect(shouldFounderTransformTurn({ userMessage: 'Explain earth shape' })).toBe(true);
    expect(shouldFounderTransformTurn({ userMessage: 'thanks' })).toBe(false);
    expect(shouldFounderTransformTurn({
      userMessage:        'Explain earth shape',
      skipEpisodicAppend: true,
    })).toBe(false);
  });

  it('stable question fingerprint', () => {
    const a = inquiryQuestionFingerprint('Apa bentuk Bumi?');
    const b = inquiryQuestionFingerprint('apa  bentuk  bumi?');
    expect(a).toBe(b);
    expect(a.length).toBe(24);
  });
});

describe('detectContextRecallLoaded', () => {
  it('detects universal teaching recall block', () => {
    expect(detectContextRecallLoaded([
      { content: '[UNIVERSAL TEACHING RECALL — episod P.alt relevan]' },
    ])).toBe(true);
  });

  it('false when no recall blocks', () => {
    expect(detectContextRecallLoaded([
      { content: 'Session history only' },
    ])).toBe(false);
  });
});
