/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Stripe Price Catalog Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  TUTOR_AGENT_PACKAGE_TIERS,
  quoteTutorAgentPackage,
} from '../src/adam/tutor/adam-tutor-agent-package.config';

describe('tutor agent package MYR totals (Stripe ejen — band-independent)', () => {
  const expected: Record<string, number> = {
    silver: 200, gold: 900, diamond: 1600, platinum: 2100,
  };

  for (const tier of TUTOR_AGENT_PACKAGE_TIERS) {
    it(`${tier} = RM${expected[tier]}`, () => {
      const quote = quoteTutorAgentPackage(tier);
      expect(quote.totalMyr).toBe(expected[tier]);
    });
  }
});

describe('ADAM Tutor student USD fee (env defaults)', () => {
  it('flat agent channel fee', async () => {
    const { ENV } = await import('../src/config/environments');
    expect(ENV.ADAM_TUTOR_AGENT_MONTHLY_USD).toBe(15.9);
  });
});
