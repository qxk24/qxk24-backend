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
 *
 * Agent PIN packages are band-independent: one fee schedule across
 * 4 volume tiers (silver/gold/diamond/platinum). School band no longer
 * affects the price — students all pay the same flat monthly fee, and
 * ADAM teaches at any level naturally.
 *
 * Repurchase rules (Founder, Jun 2026):
 * - Same tier may be bought unlimited times — PIN credits accumulate.
 * - Upgrade only (no downgrade). Every purchase charges full tier MYR price.
 * - No prorated / difference pricing (e.g. Silver→Gold pays RM900 full, not RM700).
 */

import { ENV } from '../../config/environments';

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

/** RM per PIN — single band-independent schedule (Founder, Jun 2026). */
const PRICE_PER_PIN_MYR: Record<TutorAgentPackageTier, number> = {
  silver:   2.0,
  gold:     1.8,
  diamond:  1.6,
  platinum: 1.4,
};

export interface TutorAgentPackageQuote {
  tier:           TutorAgentPackageTier;
  tierLabel:      string;
  pinCount:       number;
  pricePerPinMyr: number;
  totalMyr:       number;
}

export function isTutorAgentPackageTier(value: string): value is TutorAgentPackageTier {
  return (TUTOR_AGENT_PACKAGE_TIERS as readonly string[]).includes(value);
}

/** Tier seniority — silver(0) < gold(1) < diamond(2) < platinum(3). */
export function tutorAgentPackageTierRank(tier: TutorAgentPackageTier): number {
  return TUTOR_AGENT_PACKAGE_TIERS.indexOf(tier);
}

/** Upgrade only — same or higher tier allowed; never downgrade. */
export function canUpgradeTutorAgentPackage(
  current: TutorAgentPackageTier | null | undefined,
  next: TutorAgentPackageTier,
): boolean {
  if (!current) return true;
  return tutorAgentPackageTierRank(next) >= tutorAgentPackageTierRank(current);
}

export function quoteTutorAgentPackage(
  tier: TutorAgentPackageTier,
): TutorAgentPackageQuote {
  const pinCount = TIER_PIN_COUNTS[tier];
  const pricePerPinMyr = PRICE_PER_PIN_MYR[tier];
  const totalMyr = Math.round(pinCount * pricePerPinMyr * 100) / 100;

  return {
    tier,
    tierLabel: TUTOR_AGENT_PACKAGE_TIER_LABELS[tier],
    pinCount,
    pricePerPinMyr,
    totalMyr,
  };
}

/** Full catalog — 4 tiers, one fee schedule (no bands). */
export function listTutorAgentPackages(): TutorAgentPackageQuote[] {
  return TUTOR_AGENT_PACKAGE_TIERS.map((tier) => quoteTutorAgentPackage(tier));
}

const STRIPE_PRICE_ENV_KEY: Record<TutorAgentPackageTier, keyof typeof ENV> = {
  silver:   'STRIPE_PRICE_ID_TUTOR_EJEN_SILVER',
  gold:     'STRIPE_PRICE_ID_TUTOR_EJEN_GOLD',
  diamond:  'STRIPE_PRICE_ID_TUTOR_EJEN_DIAMOND',
  platinum: 'STRIPE_PRICE_ID_TUTOR_EJEN_PLATINUM',
};

export function tutorAgentPackageStripeEnvKey(tier: TutorAgentPackageTier): string {
  return STRIPE_PRICE_ENV_KEY[tier];
}

export function tutorAgentPackageStripePriceId(tier: TutorAgentPackageTier): string {
  const value = ENV[STRIPE_PRICE_ENV_KEY[tier]];
  return typeof value === 'string' ? value.trim() : '';
}

export function listMissingTutorAgentPackageStripePriceIds(): string[] {
  const missing: string[] = [];
  for (const tier of TUTOR_AGENT_PACKAGE_TIERS) {
    if (!tutorAgentPackageStripePriceId(tier)) {
      missing.push(tutorAgentPackageStripeEnvKey(tier));
    }
  }
  return missing;
}

export function assertTutorAgentPackageStripePriceIds(): void {
  const missing = listMissingTutorAgentPackageStripePriceIds();
  if (missing.length === 0) return;
  throw new Error(
    `Stripe Price ID pakej ejen belum lengkap (${missing.length}/4). Set: ${missing.join(', ')}`,
  );
}
