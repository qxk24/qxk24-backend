/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Stripe Price Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import { ENV } from '../config/environments';
import {
  NIAGA_RETAIL_ANNUAL_MYR,
  NIAGA_RETAIL_MONTHLY_MYR,
  NIAGA_SKU_SEAT,
  NIAGA_SKU_SEAT_ANN,
} from './niaga.constants';
import { NiagaBillingCycle } from './niaga-subscription.schema';

export interface NiagaStripePriceDef {
  sku:          string;
  billingCycle: NiagaBillingCycle;
  amountMyr:    number;
  envKey:       string;
  label:        string;
}

const DEFS: NiagaStripePriceDef[] = [
  {
    sku:          NIAGA_SKU_SEAT,
    billingCycle: NiagaBillingCycle.MONTHLY,
    amountMyr:    NIAGA_RETAIL_MONTHLY_MYR,
    envKey:       'STRIPE_PRICE_ID_NIAGA_SEAT_MONTHLY',
    label:        'ADAM Niaga Monthly',
  },
  {
    sku:          NIAGA_SKU_SEAT_ANN,
    billingCycle: NiagaBillingCycle.ANNUAL,
    amountMyr:    NIAGA_RETAIL_ANNUAL_MYR,
    envKey:       'STRIPE_PRICE_ID_NIAGA_SEAT_ANNUAL',
    label:        'ADAM Niaga Annual',
  },
];

export function getNiagaStripePriceDef(sku: string): NiagaStripePriceDef | null {
  return DEFS.find((d) => d.sku === sku) ?? null;
}

export function getNiagaStripePriceId(sku: string): string | null {
  const def = getNiagaStripePriceDef(sku);
  if (!def) return null;
  const value = (ENV as Record<string, string | boolean | number | undefined>)[def.envKey];
  const fromEnv = typeof value === 'string' ? value.trim() : '';
  return fromEnv || null;
}
