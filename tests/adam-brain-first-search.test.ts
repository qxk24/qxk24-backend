/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Brain-First Search Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  getWebSearchGateReason,
  isExplicitFreshnessRequest,
  shouldSkipSearchWhenRecallHitStableTopic,
} from '../src/adam/adam-web-search';

describe('brain-first search (P2)', () => {
  const earthQ = 'Apa bentuk bumi dan kenapa kelihatan bulat?';

  it('skips search when stable Brain C recall loaded', () => {
    expect(shouldSkipSearchWhenRecallHitStableTopic({
      message:           earthQ,
      brainRecallLoaded: true,
    })).toBe(true);
    expect(getWebSearchGateReason(earthQ, {
      studentFounderParity: true,
      brainRecallLoaded:    true,
    })).toBeNull();
  });

  it('still searches on current affairs despite recall', () => {
    const msg = 'Siapa presiden Malaysia sekarang?';
    expect(shouldSkipSearchWhenRecallHitStableTopic({
      message:           msg,
      brainRecallLoaded: true,
    })).toBe(false);
    expect(getWebSearchGateReason(msg, {
      studentFounderParity: true,
      brainRecallLoaded:    true,
    })).toBe('current_affairs');
  });

  it('still searches when user asks for latest study', () => {
    const msg = 'Apa kajian terbaru tentang bentuk bumi?';
    expect(isExplicitFreshnessRequest(msg)).toBe(true);
    expect(getWebSearchGateReason(msg, {
      studentFounderParity: true,
      brainRecallLoaded:    true,
    })).not.toBeNull();
  });

  it('searches when no recall (first encounter)', () => {
    expect(getWebSearchGateReason(earthQ, {
      studentFounderParity: true,
      brainRecallLoaded:    false,
    })).toBe('substantive_conventional');
  });

  it('still searches institutional stats despite Brain C recall', () => {
    const kptm = 'Salam Adam, Bagikan maklumat jumlah pelajar KPTM';
    expect(shouldSkipSearchWhenRecallHitStableTopic({
      message:           kptm,
      brainRecallLoaded: true,
    })).toBe(false);
    expect(getWebSearchGateReason(kptm, {
      studentFounderParity: true,
      brainRecallLoaded:    true,
    })).toBe('verified_data_stat');
  });
});
