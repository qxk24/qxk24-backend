/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Package Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../../config/environments';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

/** Agent wholesale package tier — one PIN = one student account (not shareable). */
export const TUTOR_AGENT_PACKAGE_TIERS = [
  'silver',
  'gold',
  'diamond',
  'platinum',
] as const;

export type TutorAgentPackageTier = (typeof TUTOR_AGENT_PACKAGE_TIERS)[number];

export enum TutorAgentPackageStatus {
  PENDING = 'pending',
  ACTIVE  = 'active',
  /** Pre-package agents — no PIN cap enforced. */
  LEGACY  = 'legacy',
}

export const TUTOR_AGENT_PACKAGE_TIER_LABELS: Record<TutorAgentPackageTier, string> = {
  silver:   'Silver',
  gold:     'Gold',
  diamond:  'Diamond',
  platinum: 'Platinum',
};

const TIER_PIN_COUNTS: Record<TutorAgentPackageTier, number> = {
  silver:   100,
  gold:     500,
  diamond:  1_000,
  platinum: 1_500,
};

/** RM per PIN — jadual rasmi pakej ejen (Founder, Jun 2026). */
const PRICE_PER_PIN_MYR: Record<
  TutorSubscriptionLevel,
  Record<TutorAgentPackageTier, number>
> = {
  primary: {
    silver:   2.0,
    gold:     1.8,
    diamond:  1.6,
    platinum: 1.4,
  },
  secondary: {
    silver:   3.0,
    gold:     2.8,
    diamond:  2.6,
    platinum: 2.4,
  },
  university: {
    silver:   4.0,
    gold:     3.8,
    diamond:  3.6,
    platinum: 3.4,
  },
};

export interface TutorAgentPackageQuote {
  tier:           TutorAgentPackageTier;
  tierLabel:      string;
  band:           TutorSubscriptionLevel;
  pinCount:       number;
  pricePerPinMyr: number;
  totalMyr:       number;
}

export function isTutorAgentPackageTier(value: string): value is TutorAgentPackageTier {
  return (TUTOR_AGENT_PACKAGE_TIERS as readonly string[]).includes(value);
}

export function quoteTutorAgentPackage(
  band: TutorSubscriptionLevel,
  tier: TutorAgentPackageTier,
): TutorAgentPackageQuote {
  const pinCount = TIER_PIN_COUNTS[tier];
  const pricePerPinMyr = PRICE_PER_PIN_MYR[band][tier];
  const totalMyr = Math.round(pinCount * pricePerPinMyr * 100) / 100;

  return {
    tier,
    tierLabel: TUTOR_AGENT_PACKAGE_TIER_LABELS[tier],
    band,
    pinCount,
    pricePerPinMyr,
    totalMyr,
  };
}

export function listTutorAgentPackagesForBand(
  band: TutorSubscriptionLevel,
): TutorAgentPackageQuote[] {
  return TUTOR_AGENT_PACKAGE_TIERS.map((tier) => quoteTutorAgentPackage(band, tier));
}

export function listTutorAgentPackageCatalog(): Record<
  TutorSubscriptionLevel,
  TutorAgentPackageQuote[]
> {
  return {
    primary:    listTutorAgentPackagesForBand('primary'),
    secondary:  listTutorAgentPackagesForBand('secondary'),
    university: listTutorAgentPackagesForBand('university'),
  };
}

const STRIPE_PRICE_ENV_KEY: Record<
  TutorSubscriptionLevel,
  Record<TutorAgentPackageTier, keyof typeof ENV>
> = {
  primary: {
    silver:   'STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_SILVER',
    gold:     'STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_GOLD',
    diamond:  'STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_DIAMOND',
    platinum: 'STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_PLATINUM',
  },
  secondary: {
    silver:   'STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_SILVER',
    gold:     'STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_GOLD',
    diamond:  'STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_DIAMOND',
    platinum: 'STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_PLATINUM',
  },
  university: {
    silver:   'STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_SILVER',
    gold:     'STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_GOLD',
    diamond:  'STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_DIAMOND',
    platinum: 'STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_PLATINUM',
  },
};

export function tutorAgentPackageStripeEnvKey(
  band: TutorSubscriptionLevel,
  tier: TutorAgentPackageTier,
): string {
  return STRIPE_PRICE_ENV_KEY[band][tier];
}

export function tutorAgentPackageStripePriceId(
  band: TutorSubscriptionLevel,
  tier: TutorAgentPackageTier,
): string {
  const key = STRIPE_PRICE_ENV_KEY[band][tier];
  const raw = ENV[key];
  return typeof raw === 'string' ? raw.trim() : '';
}

export function listMissingTutorAgentPackageStripePriceIds(): string[] {
  const missing: string[] = [];
  for (const band of ['primary', 'secondary', 'university'] as const) {
    for (const tier of TUTOR_AGENT_PACKAGE_TIERS) {
      if (!tutorAgentPackageStripePriceId(band, tier)) {
        missing.push(tutorAgentPackageStripeEnvKey(band, tier));
      }
    }
  }
  return missing;
}

export function assertTutorAgentPackageStripePriceIds(): void {
  const missing = listMissingTutorAgentPackageStripePriceIds();
  if (missing.length === 0) return;
  throw new Error(
    `Stripe Price ID pakej ejen belum lengkap (${missing.length}/12). Set: ${missing.join(', ')}`,
  );
}
