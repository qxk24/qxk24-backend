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
 * Canonical Tutor fees: USD/month by school band (Stripe).
 * RM display uses live USD/MYR from adam-usd-myr-rate.service.
 */

import { tutorMonthlyUsdByLevel, type TutorPriceChannel } from '../../subscriptions/tier-access.config';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import { TUTOR_REGISTER_BAND_LABELS_BM } from './adam-tutor-register.constants';
import {
  getUsdMyrRate,
  type UsdMyrRateSnapshot,
} from './adam-usd-myr-rate.service';

export function convertUsdToMyr(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}

export function tutorRegisterMonthlyUsd(level: TutorSubscriptionLevel): number {
  return tutorMonthlyUsdByLevel(level, 'agent');
}

export function tutorPublicMonthlyUsd(level: TutorSubscriptionLevel): number {
  return tutorMonthlyUsdByLevel(level, 'public');
}

export interface TutorBandPricing {
  level:          TutorSubscriptionLevel;
  bandLabel:      string;
  monthlyUsd:     number;
  monthlyMyr:     number;
  usdMyrRate:     number;
  rateSource:     UsdMyrRateSnapshot['source'];
  rateFetchedAt:  string;
  rateProvider:   string;
  currency:       'USD';
}

export function buildTutorBandPricing(
  level: TutorSubscriptionLevel,
  fx: UsdMyrRateSnapshot,
  channel: TutorPriceChannel = 'agent',
): TutorBandPricing {
  const monthlyUsd = tutorMonthlyUsdByLevel(level, channel);
  return {
    level,
    bandLabel:     TUTOR_REGISTER_BAND_LABELS_BM[level],
    monthlyUsd,
    monthlyMyr:    convertUsdToMyr(monthlyUsd, fx.rate),
    usdMyrRate:    fx.rate,
    rateSource:    fx.source,
    rateFetchedAt: fx.fetchedAt,
    rateProvider:  fx.provider,
    currency:      'USD',
  };
}

export async function getTutorBandPricing(
  level: TutorSubscriptionLevel,
  channel: TutorPriceChannel = 'agent',
): Promise<TutorBandPricing> {
  const fx = await getUsdMyrRate();
  return buildTutorBandPricing(level, fx, channel);
}

export async function listTutorRegisterPricing(): Promise<TutorBandPricing[]> {
  const fx = await getUsdMyrRate();
  return (['primary', 'secondary', 'university'] as TutorSubscriptionLevel[]).map(
    (level) => buildTutorBandPricing(level, fx, 'agent'),
  );
}

export async function listTutorPublicPricing(): Promise<TutorBandPricing[]> {
  const fx = await getUsdMyrRate();
  return (['primary', 'secondary', 'university'] as TutorSubscriptionLevel[]).map(
    (level) => buildTutorBandPricing(level, fx, 'public'),
  );
}

export async function tutorRegisterMonthlyMyr(
  level: TutorSubscriptionLevel,
): Promise<number> {
  const row = await getTutorBandPricing(level);
  return row.monthlyMyr;
}
