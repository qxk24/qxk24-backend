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
 * Commercial agent wholesale — flat 100-PIN packs (MYR one-time).
 * School · University only — no silver/gold/diamond tiers.
 */

import { ENV } from '../../config/environments';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

/** Active wholesale SKU stored on new agents. */
export const TUTOR_AGENT_WHOLESALE_PACK = 'wholesale' as const;

/** Legacy DB values — read-only; no new purchases. */
export const TUTOR_AGENT_LEGACY_PACKAGE_TIERS = [
  'silver',
  'gold',
  'diamond',
  'platinum',
] as const;

export type TutorAgentLegacyPackageTier = (typeof TUTOR_AGENT_LEGACY_PACKAGE_TIERS)[number];

export type TutorAgentPackageTier =
  | typeof TUTOR_AGENT_WHOLESALE_PACK
  | TutorAgentLegacyPackageTier;

export const TUTOR_AGENT_WHOLESALE_PACK_LABEL = '100 PIN pack';

/** API / form validation — wholesale only (`silver` legacy alias). */
export const TUTOR_AGENT_PACKAGE_TIERS = [
  TUTOR_AGENT_WHOLESALE_PACK,
  'silver',
] as const;

export const TUTOR_AGENT_PACKAGE_BANDS = [
  'secondary',
  'university',
] as const satisfies readonly TutorSubscriptionLevel[];

export enum TutorAgentPackageStatus {
  PENDING = 'pending',
  ACTIVE  = 'active',
  /** Pre-package agents — no PIN cap enforced. */
  LEGACY  = 'legacy',
}

export const WHOLESALE_PIN_COUNT = 100;

/** Flat MYR — 100 PIN wholesale (School and University). */
export const WHOLESALE_FLAT_MYR_AMOUNT = 200;

export const WHOLESALE_FLAT_MYR: Record<'school' | 'university', number> = {
  school:     WHOLESALE_FLAT_MYR_AMOUNT,
  university: WHOLESALE_FLAT_MYR_AMOUNT,
};

const LEGACY_TIER_PIN_COUNTS: Record<Exclude<TutorAgentLegacyPackageTier, 'silver'>, number> = {
  gold:     500,
  diamond:  1_000,
  platinum: 1_500,
};

const LEGACY_PRICE_PER_PIN_MYR: Record<
  TutorSubscriptionLevel,
  Record<Exclude<TutorAgentLegacyPackageTier, 'silver'>, number>
> = {
  primary: {
    gold:     1.8,
    diamond:  1.6,
    platinum: 1.4,
  },
  secondary: {
    gold:     2.8,
    diamond:  2.6,
    platinum: 2.4,
  },
  university: {
    gold:     3.8,
    diamond:  3.6,
    platinum: 3.4,
  },
};

export interface TutorAgentPackageQuote {
  pack:           TutorAgentPackageTier;
  packLabel:      string;
  /** @deprecated Use pack */
  tier:           TutorAgentPackageTier;
  /** @deprecated Use packLabel */
  tierLabel:      string;
  band:           TutorSubscriptionLevel;
  pinCount:       number;
  pricePerPinMyr: number;
  totalMyr:       number;
}

export function isSchoolWholesaleBand(band: TutorSubscriptionLevel): boolean {
  return band === 'primary' || band === 'secondary';
}

/** Stripe + checkout band — school maps to secondary internally. */
export function normalizeWholesaleBand(
  band: TutorSubscriptionLevel,
): 'secondary' | 'university' {
  return band === 'university' ? 'university' : 'secondary';
}

export function wholesaleBillingBand(
  band: TutorSubscriptionLevel,
): 'school' | 'university' {
  return band === 'university' ? 'university' : 'school';
}

export function isTutorAgentPackageTier(value: string): value is TutorAgentPackageTier {
  return value === TUTOR_AGENT_WHOLESALE_PACK
    || (TUTOR_AGENT_LEGACY_PACKAGE_TIERS as readonly string[]).includes(value);
}

export function normalizeWholesalePackTier(
  tier?: TutorAgentPackageTier | string | null,
): TutorAgentPackageTier {
  if (!tier || tier === 'silver') return TUTOR_AGENT_WHOLESALE_PACK;
  return tier as TutorAgentPackageTier;
}

export function isActiveWholesalePack(tier: string): boolean {
  return tier === TUTOR_AGENT_WHOLESALE_PACK || tier === 'silver';
}

export function canPurchaseWholesalePack(
  current: TutorAgentPackageTier | null | undefined,
): boolean {
  if (!current) return true;
  return isActiveWholesalePack(current);
}

export function packageTierDisplayLabel(tier: TutorAgentPackageTier | null | undefined): string | null {
  if (!tier) return null;
  if (isActiveWholesalePack(tier)) return TUTOR_AGENT_WHOLESALE_PACK_LABEL;
  return `${tier} (legacy)`;
}

export function quoteTutorAgentPackage(
  band: TutorSubscriptionLevel,
  tier?: TutorAgentPackageTier | string | null,
): TutorAgentPackageQuote {
  const normalizedBand = normalizeWholesaleBand(band);
  const pack = normalizeWholesalePackTier(tier);

  if (isActiveWholesalePack(pack)) {
    const billing = wholesaleBillingBand(band);
    const totalMyr = WHOLESALE_FLAT_MYR[billing];
    return {
      pack:      TUTOR_AGENT_WHOLESALE_PACK,
      packLabel: TUTOR_AGENT_WHOLESALE_PACK_LABEL,
      tier:      TUTOR_AGENT_WHOLESALE_PACK,
      tierLabel: TUTOR_AGENT_WHOLESALE_PACK_LABEL,
      band:      normalizedBand,
      pinCount:  WHOLESALE_PIN_COUNT,
      pricePerPinMyr: Math.round((totalMyr / WHOLESALE_PIN_COUNT) * 100) / 100,
      totalMyr,
    };
  }

  const legacyTier = pack as Exclude<TutorAgentLegacyPackageTier, 'silver'>;
  const pinCount = LEGACY_TIER_PIN_COUNTS[legacyTier];
  const pricePerPinMyr = LEGACY_PRICE_PER_PIN_MYR[normalizedBand][legacyTier];
  const totalMyr = Math.round(pinCount * pricePerPinMyr * 100) / 100;
  const packLabel = `${pack} (legacy)`;

  return {
    pack,
    packLabel,
    tier:      pack,
    tierLabel: packLabel,
    band:      normalizedBand,
    pinCount,
    pricePerPinMyr,
    totalMyr,
  };
}

export function listTutorAgentPackagesForBand(
  band: TutorSubscriptionLevel,
): TutorAgentPackageQuote[] {
  return [quoteTutorAgentPackage(band)];
}

export function listTutorAgentPackageCatalog(): Record<
  TutorSubscriptionLevel,
  TutorAgentPackageQuote[]
> {
  return {
    primary:    listTutorAgentPackagesForBand('secondary'),
    secondary:  listTutorAgentPackagesForBand('secondary'),
    university: listTutorAgentPackagesForBand('university'),
  };
}

function resolveWholesaleStripePriceId(billing: 'school' | 'university'): string {
  if (billing === 'school') {
    return (
      ENV.STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_SCHOOL.trim()
      || ENV.STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_SILVER.trim()
    );
  }
  return (
    ENV.STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_UNIVERSITY.trim()
    || ENV.STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_SILVER.trim()
  );
}

export function tutorAgentWholesaleStripeEnvKey(
  band: TutorSubscriptionLevel,
): string {
  const billing = wholesaleBillingBand(band);
  return billing === 'university'
    ? 'STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_UNIVERSITY'
    : 'STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_SCHOOL';
}

export function tutorAgentPackageStripeEnvKey(
  band: TutorSubscriptionLevel,
  tier?: TutorAgentPackageTier | string | null,
): string {
  const pack = normalizeWholesalePackTier(tier);
  if (!isActiveWholesalePack(pack)) {
    throw new Error('Legacy wholesale packs are no longer sold — use 100 PIN school/university pack.');
  }
  return tutorAgentWholesaleStripeEnvKey(band);
}

export function tutorAgentPackageStripePriceId(
  band: TutorSubscriptionLevel,
  tier?: TutorAgentPackageTier | string | null,
): string {
  const pack = normalizeWholesalePackTier(tier);
  if (!isActiveWholesalePack(pack)) return '';
  return resolveWholesaleStripePriceId(wholesaleBillingBand(band));
}

export function listMissingTutorAgentPackageStripePriceIds(): string[] {
  const missing: string[] = [];
  for (const band of TUTOR_AGENT_PACKAGE_BANDS) {
    if (!tutorAgentPackageStripePriceId(band)) {
      missing.push(tutorAgentWholesaleStripeEnvKey(band));
    }
  }
  return missing;
}

export function assertTutorAgentPackageStripePriceIds(): void {
  const missing = listMissingTutorAgentPackageStripePriceIds();
  if (missing.length === 0) return;
  throw new Error(
    `Stripe Price ID pakej ejen belum lengkap (${missing.length}/2). Set: ${missing.join(', ')}`,
  );
}

/** @deprecated Use TUTOR_AGENT_WHOLESALE_PACK */
export const TUTOR_AGENT_WHOLESALE_TIER = TUTOR_AGENT_WHOLESALE_PACK;

/** @deprecated Use isActiveWholesalePack */
export function isActiveWholesaleTier(tier: string): boolean {
  return isActiveWholesalePack(tier);
}

/** @deprecated Use canPurchaseWholesalePack */
export function canUpgradeTutorAgentPackage(
  current: TutorAgentPackageTier | null | undefined,
  next: TutorAgentPackageTier,
): boolean {
  return isActiveWholesalePack(next) && canPurchaseWholesalePack(current);
}

/** @deprecated Use packageTierDisplayLabel */
export const TUTOR_AGENT_PACKAGE_TIER_LABELS: Record<string, string> = {
  wholesale: TUTOR_AGENT_WHOLESALE_PACK_LABEL,
  silver:    TUTOR_AGENT_WHOLESALE_PACK_LABEL,
};
