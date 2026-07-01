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
  TUTOR_AGENT_PACKAGE_BANDS,
  TUTOR_AGENT_PACKAGE_TIERS,
  quoteTutorAgentPackage,
} from '../src/adam/tutor/adam-tutor-agent-package.config';

const expectedWholesaleMyr = 200;

describe('tutor agent package MYR totals (Stripe ejen — band-based)', () => {
  for (const band of TUTOR_AGENT_PACKAGE_BANDS) {
    for (const tier of TUTOR_AGENT_PACKAGE_TIERS) {
      it(`${band} ${tier} = RM${expectedWholesaleMyr}`, () => {
        const quote = quoteTutorAgentPackage(band, tier);
        expect(quote.totalMyr).toBe(expectedWholesaleMyr);
      });
    }
  }
});

describe('ADAM Tutor student USD fee (env defaults)', () => {
  it('band-priced public and agent channels', async () => {
    const { ENV } = await import('../src/config/environments');
    const { tutorMonthlyUsdByLevel } = await import('../src/subscriptions/tier-access.config');
    expect(ENV.ADAM_TUTOR_PUBLIC_SCHOOL_USD).toBe(19);
    expect(ENV.ADAM_TUTOR_AGENT_SCHOOL_USD).toBe(17);
    expect(tutorMonthlyUsdByLevel('university', 'public')).toBe(25);
    expect(tutorMonthlyUsdByLevel('primary', 'agent')).toBe(17);
  });
});

describe('getStripePriceId — Premium (PROFESIONAL checkout tier)', () => {
  it('maps PROFESIONAL monthly/annual to premium env keys', async () => {
    const { getStripePriceId } = await import('../src/subscriptions/stripe-gateway.service');
    const { SubscriptionTier, BillingCycle } = await import('../src/subscriptions/subscription.schema');
    const { ENV } = await import('../src/config/environments');
    expect(getStripePriceId(SubscriptionTier.PROFESIONAL, BillingCycle.MONTHLY))
      .toBe(ENV.STRIPE_PRICE_ID_PREMIUM_MONTHLY);
    expect(getStripePriceId(SubscriptionTier.PROFESIONAL, BillingCycle.ANNUAL))
      .toBe(ENV.STRIPE_PRICE_ID_PREMIUM_ANNUAL);
  });
});
