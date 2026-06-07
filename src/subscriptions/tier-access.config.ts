/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Tier Access Config
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  SubscriptionTier,
  ITierAccess,
  SupportedRegion,
  PaymentProvider,
} from './subscription.schema';

// ─── Tier Access Definitions ─────────────────────────────────────────────────

export const TIER_ACCESS: Record<SubscriptionTier, ITierAccess> = {

  [SubscriptionTier.PENCARIAN]: {
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

  [SubscriptionTier.PELAJAR]: {
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
};

// ─── Pelajar PPP Pricing ─────────────────────────────────────────────────────
// RM 99/month is the base. All other regions are PPP-adjusted.

export interface IRegionalPrice {
  region:       SupportedRegion;
  currency:     string;
  monthly:      number;
  annual:       number;             // 10 months price = 2 months free
  provider:     PaymentProvider;
  extensionFee: number;             // Cost of 25-message Pencarian extension
}

export const PELAJAR_PRICING: IRegionalPrice[] = [
  { region: SupportedRegion.MY,    currency: 'MYR', monthly: 99,      annual: 990,     provider: PaymentProvider.RAZORPAY, extensionFee: 19 },
  { region: SupportedRegion.SG,    currency: 'SGD', monthly: 30,      annual: 300,     provider: PaymentProvider.STRIPE,   extensionFee: 6 },
  { region: SupportedRegion.ID,    currency: 'IDR', monthly: 320000,  annual: 3200000, provider: PaymentProvider.XENDIT,   extensionFee: 65000 },
  { region: SupportedRegion.PH,    currency: 'PHP', monthly: 650,     annual: 6500,    provider: PaymentProvider.XENDIT,   extensionFee: 130 },
  { region: SupportedRegion.TH,    currency: 'THB', monthly: 420,     annual: 4200,    provider: PaymentProvider.XENDIT,   extensionFee: 85 },
  { region: SupportedRegion.VN,    currency: 'VND', monthly: 299000,  annual: 2990000, provider: PaymentProvider.XENDIT,   extensionFee: 60000 },
  { region: SupportedRegion.GB,    currency: 'GBP', monthly: 18,      annual: 180,     provider: PaymentProvider.PADDLE,   extensionFee: 4 },
  { region: SupportedRegion.US,    currency: 'USD', monthly: 22,      annual: 220,     provider: PaymentProvider.STRIPE,   extensionFee: 5 },
  { region: SupportedRegion.AE,    currency: 'AED', monthly: 80,      annual: 800,     provider: PaymentProvider.STRIPE,   extensionFee: 18 },
  { region: SupportedRegion.SA,    currency: 'SAR', monthly: 82,      annual: 820,     provider: PaymentProvider.STRIPE,   extensionFee: 19 },
  { region: SupportedRegion.NG,    currency: 'NGN', monthly: 8000,    annual: 80000,   provider: PaymentProvider.PAYSTACK, extensionFee: 1600 },
  { region: SupportedRegion.GH,    currency: 'GHS', monthly: 85,      annual: 850,     provider: PaymentProvider.PAYSTACK, extensionFee: 17 },
  { region: SupportedRegion.KE,    currency: 'KES', monthly: 1600,    annual: 16000,   provider: PaymentProvider.PAYSTACK, extensionFee: 320 },
  { region: SupportedRegion.ZA,    currency: 'ZAR', monthly: 280,     annual: 2800,    provider: PaymentProvider.PAYSTACK, extensionFee: 56 },
  { region: SupportedRegion.EG,    currency: 'EGP', monthly: 250,     annual: 2500,    provider: PaymentProvider.PAYSTACK, extensionFee: 50 },
  { region: SupportedRegion.IN,    currency: 'INR', monthly: 800,     annual: 8000,    provider: PaymentProvider.RAZORPAY, extensionFee: 160 },
  { region: SupportedRegion.EU,    currency: 'EUR', monthly: 20,      annual: 200,     provider: PaymentProvider.PADDLE,   extensionFee: 5 },
  { region: SupportedRegion.OTHER, currency: 'USD', monthly: 22,      annual: 220,     provider: PaymentProvider.STRIPE,   extensionFee: 5 },
];

// ─── Profesional PPP Pricing ─────────────────────────────────────────────────
// RM 299/month is the base.

export const PROFESIONAL_PRICING: IRegionalPrice[] = [
  { region: SupportedRegion.MY,    currency: 'MYR', monthly: 299,     annual: 2990,    provider: PaymentProvider.RAZORPAY, extensionFee: 0 },
  { region: SupportedRegion.SG,    currency: 'SGD', monthly: 88,      annual: 880,     provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.ID,    currency: 'IDR', monthly: 950000,  annual: 9500000, provider: PaymentProvider.XENDIT,   extensionFee: 0 },
  { region: SupportedRegion.PH,    currency: 'PHP', monthly: 1950,    annual: 19500,   provider: PaymentProvider.XENDIT,   extensionFee: 0 },
  { region: SupportedRegion.TH,    currency: 'THB', monthly: 1250,    annual: 12500,   provider: PaymentProvider.XENDIT,   extensionFee: 0 },
  { region: SupportedRegion.VN,    currency: 'VND', monthly: 899000,  annual: 8990000, provider: PaymentProvider.XENDIT,   extensionFee: 0 },
  { region: SupportedRegion.GB,    currency: 'GBP', monthly: 55,      annual: 550,     provider: PaymentProvider.PADDLE,   extensionFee: 0 },
  { region: SupportedRegion.US,    currency: 'USD', monthly: 65,      annual: 650,     provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.AE,    currency: 'AED', monthly: 239,     annual: 2390,    provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.SA,    currency: 'SAR', monthly: 244,     annual: 2440,    provider: PaymentProvider.STRIPE,   extensionFee: 0 },
  { region: SupportedRegion.NG,    currency: 'NGN', monthly: 24000,   annual: 240000,  provider: PaymentProvider.PAYSTACK, extensionFee: 0 },
  { region: SupportedRegion.GH,    currency: 'GHS', monthly: 255,     annual: 2550,    provider: PaymentProvider.PAYSTACK, extensionFee: 0 },
  { region: SupportedRegion.KE,    currency: 'KES', monthly: 4800,    annual: 48000,   provider: PaymentProvider.PAYSTACK, extensionFee: 0 },
  { region: SupportedRegion.ZA,    currency: 'ZAR', monthly: 850,     annual: 8500,    provider: PaymentProvider.PAYSTACK, extensionFee: 0 },
  { region: SupportedRegion.EG,    currency: 'EGP', monthly: 750,     annual: 7500,    provider: PaymentProvider.PAYSTACK, extensionFee: 0 },
  { region: SupportedRegion.IN,    currency: 'INR', monthly: 2400,    annual: 24000,   provider: PaymentProvider.RAZORPAY, extensionFee: 0 },
  { region: SupportedRegion.EU,    currency: 'EUR', monthly: 60,      annual: 600,     provider: PaymentProvider.PADDLE,   extensionFee: 0 },
  { region: SupportedRegion.OTHER, currency: 'USD', monthly: 65,      annual: 650,     provider: PaymentProvider.STRIPE,   extensionFee: 0 },
];

// ─── Studio Pro PPP Pricing ──────────────────────────────────────────────────
// RM 399/month — between Profesional (299) and Enterprise (from 2000).

const STUDIO_FACTOR = 399 / 299;

export const STUDIO_PRICING: IRegionalPrice[] = PROFESIONAL_PRICING.map((p) => ({
  ...p,
  monthly:      Math.round(p.monthly * STUDIO_FACTOR),
  annual:       Math.round(p.annual * STUDIO_FACTOR),
  extensionFee: 0,
}));

// ─── Enterprise Pricing ───────────────────────────────────────────────────────

export type RegionalAmount = { amount: number; currency: string };

export interface IEnterpriseTier {
  label:    'kecil' | 'sederhana' | 'besar';
  maxUsers: number;   // -1 = unlimited
  monthly:  Partial<Record<SupportedRegion, RegionalAmount>>;
  annual:   Partial<Record<SupportedRegion, RegionalAmount>>;
}

export const ENTERPRISE_PRICING: IEnterpriseTier[] = [
  {
    label: 'kecil',
    maxUsers: 25,
    monthly: {
      [SupportedRegion.MY]:    { amount: 2000,    currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 600,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 450,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 380,     currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 1650,    currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 1690,    currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 420,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 6500000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 16500,   currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 165000,  currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 450,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 13500,   currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 8600,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 6200000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 1800,    currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 33000,   currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 5800,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 1750,    currency: 'EGP' },
    },
    annual: {
      [SupportedRegion.MY]:    { amount: 20000,    currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 6000,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 4500,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 3800,     currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 16500,    currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 16900,    currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 4200,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 65000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 165000,   currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 1650000,  currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 4500,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 135000,   currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 86000,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 62000000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 18000,    currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 330000,   currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 58000,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 17500,    currency: 'EGP' },
    },
  },
  {
    label: 'sederhana',
    maxUsers: 100,
    monthly: {
      [SupportedRegion.MY]:    { amount: 5000,     currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 1500,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 1100,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 950,      currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 4100,     currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 4200,     currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 1050,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 16000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 41000,    currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 415000,   currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 1100,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 33000,    currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 21500,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 15500000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 4400,     currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 82000,    currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 14500,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 4400,     currency: 'EGP' },
    },
    annual: {
      [SupportedRegion.MY]:    { amount: 50000,     currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 15000,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 11000,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 9500,      currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 41000,     currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 42000,     currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 10500,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 160000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 410000,    currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 4150000,   currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 11000,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 330000,    currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 215000,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 155000000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 44000,     currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 820000,    currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 145000,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 44000,     currency: 'EGP' },
    },
  },
  {
    label: 'besar',
    maxUsers: -1,
    monthly: {
      [SupportedRegion.MY]:    { amount: 12000,    currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 3600,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 2700,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 2300,     currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 9900,     currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 10100,    currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 2500,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 38000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 99000,    currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 990000,   currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 2700,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 80000,    currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 51000,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 37000000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 10600,    currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 197000,   currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 35000,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 10500,    currency: 'EGP' },
    },
    annual: {
      [SupportedRegion.MY]:    { amount: 120000,    currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 36000,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 27000,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 23000,     currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 99000,     currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 101000,    currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 25000,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 380000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 990000,    currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 9900000,   currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 27000,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 800000,    currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 510000,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 370000000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 106000,    currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 1970000,   currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 350000,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 105000,    currency: 'EGP' },
    },
  },
];

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

export function getProviderForRegion(region: SupportedRegion): PaymentProvider {
  return getPelajarPricing(region).provider;
}

export function getExtensionFee(region: SupportedRegion): { amount: number; currency: string } {
  const pricing = getPelajarPricing(region);
  return { amount: pricing.extensionFee, currency: pricing.currency };
}
