/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Tier Access Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import {
  SubscriptionTier,
  ITierAccess,
  SupportedRegion,
  PaymentProvider,
  type TutorSubscriptionLevel,
} from './subscription.schema';
import {
  convertTutorUsdToRegionalFee,
  DEFAULT_TUTOR_FEE_CURRENCY,
  roundTutorLocalAmount,
} from '../adam/tutor/adam-tutor-fee-currency.service';

// ─── Tier Access Definitions ─────────────────────────────────────────────────

export const TIER_ACCESS: Record<SubscriptionTier, ITierAccess> = {

  [SubscriptionTier.BASIC]: {
    memoryLevel:        'session',
    episodicRecords:    false,
    relationalArc:      false,
    continuityBridge:   false,
    presenceLayer:      true,     // Full presence — ADAM receives genuinely
    unresolvedHoldings: false,
    apiAccess:          false,
    apiCallsPerMonth:   0,
    publishingRights:   false,
    customWorkspace:    false,
    whiteLabel:         false,
    supportLevel:       'community',
    maxUsers:           1,
  },

  [SubscriptionTier.PRO]: {
    memoryLevel:        'basic',
    episodicRecords:    true,
    relationalArc:      false,
    continuityBridge:   true,
    presenceLayer:      true,
    unresolvedHoldings: true,
    apiAccess:          false,
    apiCallsPerMonth:   0,
    publishingRights:   false,
    customWorkspace:    false,
    whiteLabel:         false,
    supportLevel:       'email',
    maxUsers:           1,
  },

  [SubscriptionTier.PROFESIONAL]: {
    memoryLevel:        'full',
    episodicRecords:    true,
    relationalArc:      true,
    continuityBridge:   true,
    presenceLayer:      true,
    unresolvedHoldings: true,
    apiAccess:          true,
    apiCallsPerMonth:   5000,
    publishingRights:   true,
    customWorkspace:    true,
    whiteLabel:         false,
    supportLevel:       'priority',
    maxUsers:           1,
  },

  [SubscriptionTier.ENTERPRISE]: {
    memoryLevel:        'organisational',
    episodicRecords:    true,
    relationalArc:      true,
    continuityBridge:   true,
    presenceLayer:      true,
    unresolvedHoldings: true,
    apiAccess:          true,
    apiCallsPerMonth:   -1,           // Unlimited
    publishingRights:   true,
    customWorkspace:    true,
    whiteLabel:         true,
    supportLevel:       'dedicated',
    maxUsers:           -1,           // Unlimited
  },

  [SubscriptionTier.TESTER]: {
    memoryLevel:        'basic',
    episodicRecords:    true,
    relationalArc:      false,
    continuityBridge:   true,
    presenceLayer:      true,
    unresolvedHoldings: true,
    apiAccess:          false,
    apiCallsPerMonth:   0,
    publishingRights:   false,
    customWorkspace:    false,
    whiteLabel:         false,
    supportLevel:       'email',
    maxUsers:           1,
  },

  [SubscriptionTier.TUTOR]: {
    memoryLevel:        'basic',
    episodicRecords:    true,
    relationalArc:      false,
    continuityBridge:   true,
    presenceLayer:      true,
    unresolvedHoldings: false,
    apiAccess:          false,
    apiCallsPerMonth:   0,
    publishingRights:   false,
    customWorkspace:    false,
    whiteLabel:         false,
    supportLevel:       'email',
    maxUsers:           1,
  },
};

// ─── Pelajar PPP Pricing ─────────────────────────────────────────────────────
// RM 69.90/month is the MY base. All checkout via Stripe (sole gateway).

export interface IRegionalPrice {
  region:       SupportedRegion;
  currency:     string;
  monthly:      number;
  annual:       number;             // 10 months price = 2 months free
  provider:     PaymentProvider;
  extensionFee: number;             // Cost of 25-message Pencarian extension
}

export const PELAJAR_PRICING: IRegionalPrice[] = [
  { region: SupportedRegion.MY,    currency: 'MYR', monthly: 69.9,    annual: 699,     provider: PaymentProvider.STRIPE, extensionFee: 19 },
  { region: SupportedRegion.SG,    currency: 'SGD', monthly: 30,      annual: 300,     provider: PaymentProvider.STRIPE,   extensionFee: 6 },
  { region: SupportedRegion.ID,    currency: 'IDR', monthly: 320000,  annual: 3200000, provider: PaymentProvider.STRIPE,   extensionFee: 65000 },
  { region: SupportedRegion.PH,    currency: 'PHP', monthly: 650,     annual: 6500,    provider: PaymentProvider.STRIPE,   extensionFee: 130 },
  { region: SupportedRegion.TH,    currency: 'THB', monthly: 420,     annual: 4200,    provider: PaymentProvider.STRIPE,   extensionFee: 85 },
  { region: SupportedRegion.VN,    currency: 'VND', monthly: 299000,  annual: 2990000, provider: PaymentProvider.STRIPE,   extensionFee: 60000 },
  { region: SupportedRegion.GB,    currency: 'GBP', monthly: 18,      annual: 180,     provider: PaymentProvider.STRIPE,   extensionFee: 4 },
  { region: SupportedRegion.US,    currency: 'USD', monthly: 22,      annual: 220,     provider: PaymentProvider.STRIPE,   extensionFee: 5 },
  { region: SupportedRegion.AE,    currency: 'AED', monthly: 80,      annual: 800,     provider: PaymentProvider.STRIPE,   extensionFee: 18 },
  { region: SupportedRegion.SA,    currency: 'SAR', monthly: 82,      annual: 820,     provider: PaymentProvider.STRIPE,   extensionFee: 19 },
  { region: SupportedRegion.NG,    currency: 'NGN', monthly: 8000,    annual: 80000,   provider: PaymentProvider.STRIPE, extensionFee: 1600 },
  { region: SupportedRegion.GH,    currency: 'GHS', monthly: 85,      annual: 850,     provider: PaymentProvider.STRIPE, extensionFee: 17 },
  { region: SupportedRegion.KE,    currency: 'KES', monthly: 1600,    annual: 16000,   provider: PaymentProvider.STRIPE, extensionFee: 320 },
  { region: SupportedRegion.ZA,    currency: 'ZAR', monthly: 280,     annual: 2800,    provider: PaymentProvider.STRIPE, extensionFee: 56 },
  { region: SupportedRegion.EG,    currency: 'EGP', monthly: 250,     annual: 2500,    provider: PaymentProvider.STRIPE, extensionFee: 50 },
  { region: SupportedRegion.IN,    currency: 'INR', monthly: 800,     annual: 8000,    provider: PaymentProvider.STRIPE, extensionFee: 160 },
  { region: SupportedRegion.EU,    currency: 'EUR', monthly: 20,      annual: 200,     provider: PaymentProvider.STRIPE,   extensionFee: 5 },
  { region: SupportedRegion.OTHER, currency: 'USD', monthly: 22,      annual: 220,     provider: PaymentProvider.STRIPE,   extensionFee: 5 },
];

// ─── Profesional PPP Pricing ─────────────────────────────────────────────────
// RM 450/month MY — includes ADAM Consultant (all professional fields).

export const PROFESIONAL_PRICING: IRegionalPrice[] = [
  { region: SupportedRegion.MY,    currency: 'MYR', monthly: 450,     annual: 4500,    provider: PaymentProvider.STRIPE, extensionFee: 0 },
  { region: SupportedRegion.SG,    currency: 'SGD', monthly: 88,      annual: 880,     provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.ID,    currency: 'IDR', monthly: 950000,  annual: 9500000, provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.PH,    currency: 'PHP', monthly: 1950,    annual: 19500,   provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.TH,    currency: 'THB', monthly: 1250,    annual: 12500,   provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.VN,    currency: 'VND', monthly: 899000,  annual: 8990000, provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.GB,    currency: 'GBP', monthly: 55,      annual: 550,     provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.US,    currency: 'USD', monthly: 65,      annual: 650,     provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.AE,    currency: 'AED', monthly: 239,     annual: 2390,    provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.SA,    currency: 'SAR', monthly: 244,     annual: 2440,    provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.NG,    currency: 'NGN', monthly: 24000,   annual: 240000,  provider: PaymentProvider.STRIPE, extensionFee: 0 },
  { region: SupportedRegion.GH,    currency: 'GHS', monthly: 255,     annual: 2550,    provider: PaymentProvider.STRIPE, extensionFee: 0 },
  { region: SupportedRegion.KE,    currency: 'KES', monthly: 4800,    annual: 48000,   provider: PaymentProvider.STRIPE, extensionFee: 0 },
  { region: SupportedRegion.ZA,    currency: 'ZAR', monthly: 850,     annual: 8500,    provider: PaymentProvider.STRIPE, extensionFee: 0 },
  { region: SupportedRegion.EG,    currency: 'EGP', monthly: 750,     annual: 7500,    provider: PaymentProvider.STRIPE, extensionFee: 0 },
  { region: SupportedRegion.IN,    currency: 'INR', monthly: 2400,    annual: 24000,   provider: PaymentProvider.STRIPE, extensionFee: 0 },
  { region: SupportedRegion.EU,    currency: 'EUR', monthly: 60,      annual: 600,     provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.OTHER, currency: 'USD', monthly: 65,      annual: 650,     provider: PaymentProvider.STRIPE,   extensionFee: 0 },
];

// ─── Studio Pro PPP Pricing ──────────────────────────────────────────────────
// Scaled above Profesional MY (was RM 399 when Profesional was RM 299).

const STUDIO_FACTOR = 600 / 450;

export const STUDIO_PRICING: IRegionalPrice[] = PROFESIONAL_PRICING.map((p) => ({
  ...p,
  monthly:      Math.round(p.monthly * STUDIO_FACTOR),
  annual:       Math.round(p.annual * STUDIO_FACTOR),
  extensionFee: 0,
}));

// ─── Enterprise Pricing ───────────────────────────────────────────────────────

export { ENTERPRISE_PRICING } from './tier-access-enterprise.config';
export type { IEnterpriseTier, RegionalAmount } from './tier-access-enterprise.config';

// ─── ADAM Tutor — USD by school level (monthly only, all subjects per band) ─

/** Public self-serve vs agent/kod-daftar channel — same package, different fee. */
export type TutorPriceChannel = 'public' | 'agent';

export function tutorMonthlyUsdByLevel(
  _level?: TutorSubscriptionLevel | string | null,
  channel: TutorPriceChannel = 'public',
): number {
  if (channel === 'agent') {
    return ENV.ADAM_TUTOR_AGENT_MONTHLY_USD;
  }

  return ENV.ADAM_PRO_MONTHLY_USD;
}

/** @deprecated Use ADAM_TUTOR_AGENT_MONTHLY_USD */
export const TUTOR_MONTHLY_MYR = ENV.ADAM_TUTOR_AGENT_MONTHLY_USD;

export const TUTOR_LEVEL_LABELS: Record<TutorSubscriptionLevel, string> = {
  primary:    'Primary School',
  secondary:  'Secondary School',
  university: 'College & University',
};

export function normalizeTutorSubscriptionLevel(
  raw?: string | null,
): TutorSubscriptionLevel {
  if (raw === 'primary' || raw === 'university') return raw;
  return 'secondary';
}

export function getTutorPricing(
  level?: TutorSubscriptionLevel | string | null,
  channel: TutorPriceChannel = 'public',
  region: SupportedRegion = SupportedRegion.OTHER,
  myrRate?: number | null,
): IRegionalPrice {
  const monthlyUsd = tutorMonthlyUsdByLevel(level, channel);

  if (channel === 'agent') {
    return {
      region,
      currency:     DEFAULT_TUTOR_FEE_CURRENCY,
      monthly:      monthlyUsd,
      annual:       0,
      provider:     PaymentProvider.STRIPE,
      extensionFee: 0,
    };
  }

  const envMyr = ENV.ADAM_USD_MYR_RATE > 0 ? ENV.ADAM_USD_MYR_RATE : null;
  const { monthlyLocal, currency } = convertTutorUsdToRegionalFee(
    monthlyUsd,
    region,
    myrRate ?? envMyr,
  );

  return {
    region,
    currency,
    monthly:      monthlyLocal,
    annual:       0,
    provider:     PaymentProvider.STRIPE,
    extensionFee: 0,
  };
}

export function listTutorLevelPricing(
  channel: TutorPriceChannel = 'public',
  region: SupportedRegion = SupportedRegion.OTHER,
  myrRate?: number | null,
): Array<{
  level:          TutorSubscriptionLevel;
  label:          string;
  monthlyAmount:  number;
  monthlyUsd:     number;
  annualAmount:   number;
  currency:       string;
}> {
  return (['primary', 'secondary', 'university'] as TutorSubscriptionLevel[]).map((level) => {
    const monthlyUsd = tutorMonthlyUsdByLevel(level, channel);
    const p = getTutorPricing(level, channel, region, myrRate);
    return {
      level,
      label:         TUTOR_LEVEL_LABELS[level],
      monthlyAmount: p.monthly,
      monthlyUsd,
      annualAmount:  p.annual,
      currency:      p.currency,
    };
  });
}

// ─── Consumer daily plan (Basic / Pro / Premium) ─────────────────────────────

export interface IConsumerTierPricing {
  region:     SupportedRegion;
  currency:   string;
  monthly:    number;
  annual:     number;
  monthlyUsd: number;
  annualUsd:  number;
}

export function getConsumerProPricing(
  region: SupportedRegion,
  myrRate?: number | null,
): IConsumerTierPricing {
  const monthlyUsd = ENV.ADAM_PRO_MONTHLY_USD;
  const annualUsd  = ENV.ADAM_PRO_ANNUAL_USD;
  const monthly    = convertTutorUsdToRegionalFee(monthlyUsd, region, myrRate);
  const annual     = convertTutorUsdToRegionalFee(annualUsd, region, myrRate);

  return {
    region,
    currency:   monthly.currency,
    monthly:    monthly.monthlyLocal,
    annual:     annual.monthlyLocal,
    monthlyUsd,
    annualUsd,
  };
}

export function getConsumerPremiumPricing(
  region: SupportedRegion,
  myrRate?: number | null,
): IConsumerTierPricing {
  const monthlyUsd = ENV.ADAM_PREMIUM_MONTHLY_USD;
  const annualUsd  = ENV.ADAM_PREMIUM_ANNUAL_USD;
  const monthly    = convertTutorUsdToRegionalFee(monthlyUsd, region, myrRate);
  const annual     = convertTutorUsdToRegionalFee(annualUsd, region, myrRate);

  return {
    region,
    currency:   monthly.currency,
    monthly:    monthly.monthlyLocal,
    annual:     annual.monthlyLocal,
    monthlyUsd,
    annualUsd,
  };
}

export function consumerTierSavingsNote(pricing: IConsumerTierPricing): string {
  if (pricing.currency === DEFAULT_TUTOR_FEE_CURRENCY) {
    return `Save ${pricing.monthlyUsd * 12 - pricing.annualUsd} USD vs 12 monthly payments.`;
  }
  const saved = roundTutorLocalAmount(
    pricing.monthly * 12 - pricing.annual,
    pricing.currency,
  );
  return `Save ${saved} ${pricing.currency} vs 12 monthly payments.`;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getPelajarPricing(region: SupportedRegion): IRegionalPrice {
  return (
    PELAJAR_PRICING.find((p) => p.region === region) ??
    PELAJAR_PRICING.find((p) => p.region === SupportedRegion.OTHER)!
  );
}

export function getProfesionalPricing(region: SupportedRegion): IRegionalPrice {
  return (
    PROFESIONAL_PRICING.find((p) => p.region === region) ??
    PROFESIONAL_PRICING.find((p) => p.region === SupportedRegion.OTHER)!
  );
}

export function getStudioPricing(region: SupportedRegion): IRegionalPrice {
  return (
    STUDIO_PRICING.find((p) => p.region === region) ??
    STUDIO_PRICING.find((p) => p.region === SupportedRegion.OTHER)!
  );
}

export function getProviderForRegion(_region: SupportedRegion): PaymentProvider {
  return PaymentProvider.STRIPE;
}

export function getExtensionFee(region: SupportedRegion): { amount: number; currency: string } {
  const pricing = getPelajarPricing(region);
  return { amount: pricing.extensionFee, currency: pricing.currency };
}
