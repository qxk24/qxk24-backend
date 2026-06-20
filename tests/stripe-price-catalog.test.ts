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

describe('tutor agent package MYR totals (Stripe ejen)', () => {
  const expected: Record<string, Record<string, number>> = {
    primary:    { silver: 300, gold: 2700, diamond: 6000, platinum: 10500 },
    secondary:  { silver: 450, gold: 4200, diamond: 9750, platinum: 18000 },
    university: { silver: 600, gold: 5700, diamond: 13500, platinum: 25500 },
  };

  for (const band of ['primary', 'secondary', 'university'] as const) {
    for (const tier of TUTOR_AGENT_PACKAGE_TIERS) {
      it(`${band} · ${tier} = RM${expected[band][tier]}`, () => {
        const quote = quoteTutorAgentPackage(band, tier);
        expect(quote.totalMyr).toBe(expected[band][tier]);
      });
    }
  }
});

describe('ADAM Tutor student USD fees (env defaults)', () => {
  it('public/agent bands match STRIPE_ADAM_TUTOR_PRICES.md', async () => {
    const { ENV } = await import('../src/config/environments');
    expect(ENV.ADAM_TUTOR_PRIMARY_PUBLIC_MONTHLY_USD).toBe(25);
    expect(ENV.ADAM_TUTOR_SECONDARY_PUBLIC_MONTHLY_USD).toBe(33);
    expect(ENV.ADAM_TUTOR_UNIVERSITY_PUBLIC_MONTHLY_USD).toBe(45);
    expect(ENV.ADAM_TUTOR_PRIMARY_AGENT_MONTHLY_USD).toBe(19);
    expect(ENV.ADAM_TUTOR_SECONDARY_AGENT_MONTHLY_USD).toBe(23);
    expect(ENV.ADAM_TUTOR_UNIVERSITY_AGENT_MONTHLY_USD).toBe(29);
  });
});
