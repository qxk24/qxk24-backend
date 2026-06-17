/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : USD → MYR Rate Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

/// <reference types="jest" />

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  getUsdMyrRate,
  resetUsdMyrRateCacheForTests,
} from '../src/adam/tutor/adam-usd-myr-rate.service';
import {
  buildTutorBandPricing,
  convertUsdToMyr,
  tutorRegisterMonthlyUsd,
} from '../src/adam/tutor/adam-tutor-pricing.service';

const originalFetch = global.fetch;

describe('adam-usd-myr-rate.service', () => {
  beforeEach(() => {
    resetUsdMyrRateCacheForTests();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    resetUsdMyrRateCacheForTests();
  });

  it('fetches live USD/MYR from Frankfurter', async () => {
    global.fetch = jest.fn(async () => ({
      ok:   true,
      json: async () => ({ date: '2026-06-16', rates: { MYR: 4.312 } }),
    })) as unknown as typeof fetch;

    const snap = await getUsdMyrRate();
    expect(snap.rate).toBe(4.312);
    expect(snap.source).toBe('live');
    expect(snap.provider).toBe('frankfurter');
  });

  it('serves cached rate within TTL without second fetch', async () => {
    const mockFetch = jest.fn(async () => ({
      ok:   true,
      json: async () => ({ rates: { MYR: 4.25 } }),
    }));
    global.fetch = mockFetch as unknown as typeof fetch;

    await getUsdMyrRate();
    const cached = await getUsdMyrRate();
    expect(cached.source).toBe('cache');
    expect(cached.rate).toBe(4.25);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('uses stale cache when live fetch fails', async () => {
    global.fetch = jest.fn(async () => ({
      ok:   true,
      json: async () => ({ rates: { MYR: 4.33 } }),
    })) as unknown as typeof fetch;
    await getUsdMyrRate();

    global.fetch = jest.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const snap = await getUsdMyrRate(true);
    expect(snap.source).toBe('cache');
    expect(snap.rate).toBe(4.33);
  });
});

describe('adam-tutor-pricing.service', () => {
  it('canonical fees are USD per month by band', () => {
    expect(tutorRegisterMonthlyUsd('primary')).toBe(13);
    expect(tutorRegisterMonthlyUsd('secondary')).toBe(15);
    expect(tutorRegisterMonthlyUsd('university')).toBe(17);
  });

  it('converts USD to MYR using supplied live rate', () => {
    expect(convertUsdToMyr(15, 4.312)).toBe(64.68);
    const row = buildTutorBandPricing('secondary', {
      rate:      4.312,
      source:    'live',
      fetchedAt: '2026-06-16T00:00:00.000Z',
      provider:  'frankfurter',
    });
    expect(row.monthlyUsd).toBe(15);
    expect(row.monthlyMyr).toBe(64.68);
    expect(row.rateSource).toBe('live');
  });
});
