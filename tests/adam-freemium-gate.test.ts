/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Gate Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { malaysiaDateKey, startOfMalaysiaDay } from '../src/freemium/adam-freemium-date';
import { freemiumStatusPayload } from '../src/freemium/adam-freemium-gate.service';

describe('adam-freemium-date', () => {
  it('formats Malaysia calendar date as YYYY-MM-DD', () => {
    const key = malaysiaDateKey(new Date('2026-06-08T10:00:00+08:00'));
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('startOfMalaysiaDay aligns to +08:00 midnight', () => {
    const start = startOfMalaysiaDay(new Date('2026-06-08T15:30:00+08:00'));
    expect(start.getUTCHours()).toBe(16); // 00:00 MY = 16:00 UTC previous day... wait
    // 2026-06-08 00:00 +08 = 2026-06-07 16:00 UTC
    expect(start.toISOString()).toBe('2026-06-07T16:00:00.000Z');
  });
});

describe('freemiumStatusPayload', () => {
  it('serialises gate result for SSE', () => {
    const payload = freemiumStatusPayload({
      canContinue:        true,
      mode:               'FREE',
      questionsUsed:      2,
      questionsRemaining: 13,
      limit:              15,
      dateKey:            '2026-06-08',
      creditBalance:      5,
      limitReached:       false,
      registerGate:       false,
      buyCreditGate:      false,
      upgradeComingSoon:  false,
      message:            null,
    });

    expect(payload.mode).toBe('FREE');
    expect(payload.questionsUsed).toBe(2);
    expect(payload.limit).toBe(15);
    expect(payload.creditBalance).toBe(5);
    expect(payload.buyCreditGate).toBe(false);
  });
});
