/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Profile Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  adamProfileAllowsBrainFirstSearchSkip,
  buildAdamAlphaGenerationLaw,
  resolveAdamAnswerProfile,
} from '../src/adam/adam-answer-profile';
import { shouldSkipSearchWhenRecallHitStableTopic } from '../src/adam/adam-web-search';

describe('ADAM Answer Profile (α / β)', () => {
  it('routes KPTM enrollment to alpha', () => {
    const msg = 'Salam Adam, Bagikan maklumat jumlah pelajar KPTM';
    expect(resolveAdamAnswerProfile({ message: msg })).toBe('alpha');
    expect(buildAdamAlphaGenerationLaw(msg)).toMatch(/FAKTA DULU/i);
    expect(buildAdamAlphaGenerationLaw(msg)).toMatch(/NOT Explain-Back 1A/i);
  });

  it('routes explain-back ilmu to beta', () => {
    const msg = 'Boleh terangkan tentang komunikasi antara manusia?';
    expect(resolveAdamAnswerProfile({ message: msg })).toBe('beta');
  });

  it('routes salam to light', () => {
    expect(resolveAdamAnswerProfile({ message: 'salam' })).toBe('light');
  });

  it('Gold Standard default — search always runs even when Brain C recall loaded on beta', () => {
    const earthQ = 'Apa bentuk bumi dan kenapa kelihatan bulat?';
    const kptm = 'Jumlah pelajar KPTM';

    expect(adamProfileAllowsBrainFirstSearchSkip(earthQ)).toBe(true);
    expect(adamProfileAllowsBrainFirstSearchSkip(kptm)).toBe(false);

    expect(shouldSkipSearchWhenRecallHitStableTopic({
      message:           earthQ,
      brainRecallLoaded: true,
    })).toBe(false);

    expect(shouldSkipSearchWhenRecallHitStableTopic({
      message:           kptm,
      brainRecallLoaded: true,
    })).toBe(false);
  });

  it('alpha law v2: proportional layers, L5 optional', () => {
    const law = buildAdamAlphaGenerationLaw('Siapa presiden Indonesia sekarang?');
    expect(law).toMatch(/L5.*optional/i);
    expect(law).toMatch(/proportional/i);
    expect(law).not.toMatch(/minimum 3 paragraphs/i);
  });

  it('beta profile header mentions L5 tamparan', () => {
    const msg = 'Apa itu fotosintesis?';
    expect(resolveAdamAnswerProfile({ message: msg })).toBe('beta');
  });
});
