/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Fee Currency (Regional)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Canonical fee amounts live in USD (env defaults).
 * Display and subscription records use the visitor's regional currency;
 * USD remains the fallback when no regional mapping applies.
 */

import { SupportedRegion } from '../../subscriptions/subscription.schema';
import { getPelajarPricing as pelajarPricingForRegion } from '../../subscriptions/tier-access.config';

export const DEFAULT_TUTOR_FEE_CURRENCY = 'USD';

const ZERO_DECIMAL_CURRENCIES = new Set(['IDR', 'VND', 'NGN', 'KES']);

export function roundTutorLocalAmount(amount: number, currency: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

/** Regional checkout/display currency — aligned with Pelajar PPP table. */
export function tutorFeeCurrencyForRegion(region: SupportedRegion): string {
  return pelajarPricingForRegion(region).currency;
}

/**
 * Convert canonical USD fee to regional amount.
 * MY prefers live USD/MYR when `myrRate` is supplied; other regions use Pelajar PPP ratio.
 */
export function convertTutorUsdToRegionalFee(
  monthlyUsd: number,
  region: SupportedRegion,
  myrRate?: number | null,
): { monthlyLocal: number; currency: string } {
  const currency = tutorFeeCurrencyForRegion(region);

  if (currency === DEFAULT_TUTOR_FEE_CURRENCY) {
    return { monthlyLocal: monthlyUsd, currency: DEFAULT_TUTOR_FEE_CURRENCY };
  }

  if (region === SupportedRegion.MY && myrRate && myrRate > 0) {
    return {
      monthlyLocal: roundTutorLocalAmount(monthlyUsd * myrRate, 'MYR'),
      currency:     'MYR',
    };
  }

  const regional = pelajarPricingForRegion(region);
  const usPelajar = pelajarPricingForRegion(SupportedRegion.US);
  const pppFactor = regional.monthly / usPelajar.monthly;

  return {
    monthlyLocal: roundTutorLocalAmount(monthlyUsd * pppFactor, currency),
    currency,
  };
}
