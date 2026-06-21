/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pricing Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Canonical Tutor fees: USD/month by school band (env defaults).
 * Regional display/checkout uses country currency; USD is the global default.
 */

import { ENV } from '../../config/environments';
import { tutorMonthlyUsdByLevel, type TutorPriceChannel } from '../../subscriptions/tier-access.config';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import { SupportedRegion } from '../../subscriptions/subscription.schema';
import { TUTOR_REGISTER_BAND_LABELS_BM, TUTOR_REGISTER_PHASE_COUNTRY } from './adam-tutor-register.constants';
import {
  convertTutorUsdToRegionalFee,
  DEFAULT_TUTOR_FEE_CURRENCY,
  tutorFeeCurrencyForRegion,
} from './adam-tutor-fee-currency.service';
import {
  getUsdMyrRate,
  type UsdMyrRateSnapshot,
} from './adam-usd-myr-rate.service';

export { DEFAULT_TUTOR_FEE_CURRENCY };

export function convertUsdToMyr(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}

export function tutorRegisterMonthlyUsd(level: TutorSubscriptionLevel): number {
  return tutorMonthlyUsdByLevel(level, 'agent');
}

export function tutorPublicMonthlyUsd(level: TutorSubscriptionLevel): number {
  return tutorMonthlyUsdByLevel(level, 'public');
}

export function tutorRegisterRegion(): SupportedRegion {
  if (TUTOR_REGISTER_PHASE_COUNTRY === 'MY') return SupportedRegion.MY;
  return SupportedRegion.OTHER;
}

export interface TutorBandPricing {
  level:          TutorSubscriptionLevel;
  bandLabel:      string;
  /** Canonical default base amount (USD). */
  monthlyUsd:     number;
  /** Regional fee — country currency. */
  monthlyAmount:  number;
  currency:       string;
  /** @deprecated Use monthlyAmount when currency is MYR. */
  monthlyMyr:     number;
  usdMyrRate?:    number;
  rateSource?:    UsdMyrRateSnapshot['source'];
  rateFetchedAt?: string;
  rateProvider?:  string;
}

export function buildTutorBandPricing(
  level: TutorSubscriptionLevel,
  channel: TutorPriceChannel = 'agent',
  region: SupportedRegion = tutorRegisterRegion(),
  fx?: UsdMyrRateSnapshot | null,
): TutorBandPricing {
  const monthlyUsd = tutorMonthlyUsdByLevel(level, channel);
  const myrRate = region === SupportedRegion.MY
    ? (fx?.rate ?? (ENV.ADAM_USD_MYR_RATE > 0 ? ENV.ADAM_USD_MYR_RATE : null))
    : null;

  /** Student kod-daftar / agent channel — Stripe charge USD; wallet komisen guna MYR rujukan. */
  if (channel === 'agent') {
    const monthlyMyr = myrRate && myrRate > 0
      ? convertUsdToMyr(monthlyUsd, myrRate)
      : 0;
    return {
      level,
      bandLabel:     TUTOR_REGISTER_BAND_LABELS_BM[level],
      monthlyUsd,
      monthlyAmount: monthlyUsd,
      currency:      DEFAULT_TUTOR_FEE_CURRENCY,
      monthlyMyr,
      usdMyrRate:    myrRate ?? undefined,
      rateSource:    fx?.source,
      rateFetchedAt: fx?.fetchedAt,
      rateProvider:  fx?.provider,
    };
  }

  const regional = convertTutorUsdToRegionalFee(monthlyUsd, region, myrRate);

  const myrEquivalent = myrRate && myrRate > 0
    ? convertUsdToMyr(monthlyUsd, myrRate)
    : regional.currency === 'MYR'
      ? regional.monthlyLocal
      : 0;

  return {
    level,
    bandLabel:     TUTOR_REGISTER_BAND_LABELS_BM[level],
    monthlyUsd,
    monthlyAmount: regional.monthlyLocal,
    currency:      regional.currency,
    monthlyMyr:    myrEquivalent,
    usdMyrRate:    myrRate ?? undefined,
    rateSource:    fx?.source,
    rateFetchedAt: fx?.fetchedAt,
    rateProvider:  fx?.provider,
  };
}

export async function getTutorBandPricing(
  level: TutorSubscriptionLevel,
  channel: TutorPriceChannel = 'agent',
  region: SupportedRegion = tutorRegisterRegion(),
): Promise<TutorBandPricing> {
  const fx = region === SupportedRegion.MY ? await getUsdMyrRate() : null;
  return buildTutorBandPricing(level, channel, region, fx);
}

export async function listTutorRegisterPricing(
  region: SupportedRegion = tutorRegisterRegion(),
): Promise<TutorBandPricing[]> {
  const fx = region === SupportedRegion.MY ? await getUsdMyrRate() : null;
  return (['primary', 'secondary', 'university'] as TutorSubscriptionLevel[]).map(
    (level) => buildTutorBandPricing(level, 'agent', region, fx),
  );
}

export async function listTutorPublicPricing(
  region: SupportedRegion = SupportedRegion.OTHER,
): Promise<TutorBandPricing[]> {
  const fx = region === SupportedRegion.MY ? await getUsdMyrRate() : null;
  return (['primary', 'secondary', 'university'] as TutorSubscriptionLevel[]).map(
    (level) => buildTutorBandPricing(level, 'public', region, fx),
  );
}

export async function tutorRegisterMonthlyMyr(
  level: TutorSubscriptionLevel,
): Promise<number> {
  const row = await getTutorBandPricing(level);
  return row.currency === 'MYR' ? row.monthlyAmount : row.monthlyMyr;
}

export function tutorFeeCurrencyLabel(region: SupportedRegion): string {
  return tutorFeeCurrencyForRegion(region);
}
