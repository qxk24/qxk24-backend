/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Region Detector Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { detectRegionFromHeaders } from '../src/subscriptions/region-detector.service';
import { SupportedRegion } from '../src/subscriptions/subscription.schema';

function headersFrom(values: Record<string, string>): Headers {
  return new Headers(values);
}

describe('detectRegionFromHeaders', () => {
  it('prefers cf-ipcountry over Accept-Language en-US', () => {
    const region = detectRegionFromHeaders(headersFrom({
      'cf-ipcountry':    'MY',
      'accept-language': 'en-US,en;q=0.9',
    }));
    expect(region).toBe(SupportedRegion.MY);
  });

  it('uses x-pricing-country when geo header is missing', () => {
    const region = detectRegionFromHeaders(headersFrom({
      'x-pricing-country': 'MY',
      'accept-language':   'en-US,en;q=0.9',
    }));
    expect(region).toBe(SupportedRegion.MY);
  });

  it('defaults to MY for en-US iPhone locale without geo headers', () => {
    const region = detectRegionFromHeaders(headersFrom({
      'accept-language': 'en-US,en;q=0.9',
    }));
    expect(region).toBe(SupportedRegion.MY);
  });

  it('maps cf-ipcountry US to USD region', () => {
    const region = detectRegionFromHeaders(headersFrom({
      'cf-ipcountry':    'US',
      'accept-language': 'en-US,en;q=0.9',
    }));
    expect(region).toBe(SupportedRegion.US);
  });
});
