/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Niaga Stripe Config Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  NIAGA_RETAIL_MONTHLY_MYR,
  NIAGA_SKU_SEAT,
  NIAGA_SKU_SEAT_ANN,
} from '../src/niaga/niaga.constants';
import { getNiagaStripePriceDef } from '../src/niaga/niaga-stripe.config';

describe('niaga stripe config', () => {
  it('defines monthly and annual seat SKUs', () => {
    const monthly = getNiagaStripePriceDef(NIAGA_SKU_SEAT);
    const annual = getNiagaStripePriceDef(NIAGA_SKU_SEAT_ANN);
    expect(monthly?.amountMyr).toBe(NIAGA_RETAIL_MONTHLY_MYR);
    expect(annual?.amountMyr).toBe(499);
    expect(monthly?.envKey).toBe('STRIPE_PRICE_ID_NIAGA_SEAT_MONTHLY');
    expect(annual?.envKey).toBe('STRIPE_PRICE_ID_NIAGA_SEAT_ANNUAL');
  });
});
