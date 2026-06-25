/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Credit Wallet
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { convertTutorUsdToRegionalFee } from '../adam/tutor/adam-tutor-fee-currency.service';
import { getStripeGatewayStatus } from '../subscriptions/stripe-gateway.service';
import { SupportedRegion } from '../subscriptions/subscription.schema';
import { AdamCreditWalletModel } from './adam-freemium.schema';

export const CREDIT_PACK_ID = 'standard';
export const PREMIUM_PACK_10_ID = 'credits-10';
export const PREMIUM_PACK_50_ID = 'credits-50';
export const PREMIUM_PACK_200_ID = 'credits-200';

/** @deprecated use PREMIUM_PACK_200_ID */
export const PREMIUM_PACK_250_ID = 'credits-250';
/** @deprecated use PREMIUM_PACK_200_ID */
export const PREMIUM_PACK_1000_ID = 'credits-1000';

/** @deprecated legacy ids */
export const LEGACY_PREMIUM_PACK_50_ID = 'premium-50';
export const LEGACY_PREMIUM_PACK_100_ID = 'premium-100';

export interface CreditPackOffer {
  id:           string;
  label:        string;
  /** USD credit value added to wallet */
  creditValue:  number;
  /** USD charged at checkout */
  amount:       number;
  currency:     string;
  description:  string;
  creditCents:  number;
  /** Approximate extra messages at current per-message rate */
  extraMessages: number;
  /** @deprecated use creditValue — kept for API compat */
  credits:      number;
}

export interface CreditWalletSnapshot {
  userId:           string;
  balanceCents:     number;
  balanceUsd:       number;
  lifetimeBought:   number;
  /** @deprecated use balanceUsd */
  balance:          number;
}

export function extraMessageCostCents(): number {
  return ENV.ADAM_EXTRA_MESSAGE_COST_CENTS;
}

export function walletBalanceUsd(cents: number): number {
  return Math.round(cents) / 100;
}

export function isCreditPurchaseWired(): boolean {
  const stripe = getStripeGatewayStatus();
  return ENV.STRIPE_ENABLED && stripe.enabled && stripe.configured;
}

function packExtraMessages(creditUsd: number): number {
  const cost = extraMessageCostCents() / 100;
  if (cost <= 0) return 0;
  return Math.floor(creditUsd / cost);
}

/** Pro usage-credit bundles — low entry ($10) with bundle discounts on larger packs (USD). */
export function getPremiumCreditPacks(): CreditPackOffer[] {
  const packs = [
    {
      id:          PREMIUM_PACK_10_ID,
      label:       '$10 usage credits',
      creditValue: 10,
      amount:      10,
      currency:    'USD',
      description: 'Starter top-up — used after your daily Pro allowance.',
    },
    {
      id:          PREMIUM_PACK_50_ID,
      label:       '$50 usage credits',
      creditValue: 50,
      amount:      40,
      currency:    'USD',
      description: 'Regular overflow — ~20% bundle value vs pay-as-you-go.',
    },
    {
      id:          PREMIUM_PACK_200_ID,
      label:       '$200 usage credits',
      creditValue: 200,
      amount:      150,
      currency:    'USD',
      description: 'Heavy usage — ~25% bundle value for power users.',
    },
  ];

  return packs.map((p) => ({
    ...p,
    creditCents:   Math.round(p.creditValue * 100),
    extraMessages: packExtraMessages(p.creditValue),
    credits:       packExtraMessages(p.creditValue),
  }));
}

/** Regional display/checkout amounts for Pro usage-credit bundles. */
export function getPremiumCreditPacksForRegion(
  region: SupportedRegion = SupportedRegion.OTHER,
  myrRate?: number | null,
): CreditPackOffer[] {
  return getPremiumCreditPacks().map((pack) => {
    const amountConv  = convertTutorUsdToRegionalFee(pack.amount, region, myrRate);
    const creditConv  = convertTutorUsdToRegionalFee(pack.creditValue, region, myrRate);
    const currency    = amountConv.currency;
    const label       = currency === 'USD'
      ? pack.label
      : `${currency} ${creditConv.monthlyLocal} usage credits`;

    return {
      ...pack,
      label,
      amount:        amountConv.monthlyLocal,
      creditValue:   creditConv.monthlyLocal,
      currency,
      creditCents:   Math.round(creditConv.monthlyLocal * 100),
      extraMessages: packExtraMessages(pack.creditValue),
      credits:       packExtraMessages(pack.creditValue),
    };
  });
}

/** @deprecated Free tier cannot buy credits in consumer plan */
export function getBasicCreditPackOffer(): CreditPackOffer {
  return getPremiumCreditPacks()[0]!;
}

/** @deprecated Use getPremiumCreditPacks */
export function getCreditPackOffer(): CreditPackOffer {
  return getPremiumCreditPacks()[0]!;
}

export function creditPackSize(): number {
  return packExtraMessages(getPremiumCreditPacks()[0]?.creditValue ?? 10);
}

function normalizeCreditPackId(packId: string): string {
  if (packId === LEGACY_PREMIUM_PACK_50_ID) return PREMIUM_PACK_50_ID;
  if (packId === LEGACY_PREMIUM_PACK_100_ID) return PREMIUM_PACK_200_ID;
  if (packId === PREMIUM_PACK_250_ID || packId === 'premium-250') return PREMIUM_PACK_200_ID;
  if (packId === PREMIUM_PACK_1000_ID || packId === 'premium-1000') return PREMIUM_PACK_200_ID;
  return packId;
}

export function resolveCreditPack(packId: string): CreditPackOffer | null {
  const normalized = normalizeCreditPackId(packId);
  return getPremiumCreditPacks().find((p) => p.id === normalized) ?? null;
}

export async function getCreditBalanceCents(userId: string): Promise<number> {
  const doc = await AdamCreditWalletModel.findOne({ userId }).select({ balance: 1 }).lean();
  return doc?.balance ?? 0;
}

/** @deprecated use getCreditBalanceCents — returns USD for consumer plan, message count for legacy */
export async function getCreditBalance(userId: string): Promise<number> {
  const cents = await getCreditBalanceCents(userId);
  if (ENV.ADAM_CONSUMER_DAILY_PLAN) {
    return walletBalanceUsd(cents);
  }
  return cents;
}

export async function getCreditWalletSnapshot(userId: string): Promise<CreditWalletSnapshot> {
  const doc = await AdamCreditWalletModel.findOne({ userId }).lean();
  const purchases = doc?.purchases ?? [];
  const lifetimeBought = purchases.reduce((sum, p) => sum + p.creditsAdded, 0);
  const balanceCents = doc?.balance ?? 0;
  const balanceUsd = walletBalanceUsd(balanceCents);
  return {
    userId,
    balanceCents,
    balanceUsd,
    lifetimeBought,
    balance: balanceUsd,
  };
}

/** Atomically consume wallet for one extra message ($0.12 default). */
export async function consumeWalletForExtraMessage(
  userId: string,
): Promise<{ ok: boolean; balanceCents: number }> {
  const cost = extraMessageCostCents();
  const doc = await AdamCreditWalletModel.findOneAndUpdate(
    { userId, balance: { $gte: cost } },
    { $inc: { balance: -cost } },
    { new: true },
  ).lean();

  if (!doc) {
    const current = await getCreditBalanceCents(userId);
    return { ok: false, balanceCents: current };
  }

  return { ok: true, balanceCents: doc.balance };
}

/** Debit wallet for AI image/video generation overflow (cents). */
export async function consumeWalletForMedia(
  userId: string,
  costCents: number,
): Promise<{ ok: boolean; balanceCents: number }> {
  if (costCents <= 0) {
    const current = await getCreditBalanceCents(userId);
    return { ok: true, balanceCents: current };
  }

  const doc = await AdamCreditWalletModel.findOneAndUpdate(
    { userId, balance: { $gte: costCents } },
    { $inc: { balance: -costCents } },
    { new: true },
  ).lean();

  if (!doc) {
    const current = await getCreditBalanceCents(userId);
    return { ok: false, balanceCents: current };
  }

  return { ok: true, balanceCents: doc.balance };
}

/** @deprecated legacy rolling path — message-count wallet */
export async function consumeOneCredit(userId: string): Promise<{ ok: boolean; balance: number }> {
  if (ENV.ADAM_CONSUMER_DAILY_PLAN) {
    const result = await consumeWalletForExtraMessage(userId);
    return { ok: result.ok, balance: walletBalanceUsd(result.balanceCents) };
  }

  const doc = await AdamCreditWalletModel.findOneAndUpdate(
    { userId, balance: { $gte: 1 } },
    { $inc: { balance: -1 } },
    { new: true },
  ).lean();

  if (!doc) {
    const current = await getCreditBalance(userId);
    return { ok: false, balance: current };
  }

  return { ok: true, balance: doc.balance };
}

export async function grantWalletCredits(params: {
  userId:        string;
  creditCents:   number;
  amountPaid:    number;
  currency:      string;
  provider:      string;
  transactionId: string;
  packId?:       string;
}): Promise<CreditWalletSnapshot> {
  const existing = await AdamCreditWalletModel.findOne({
    userId: params.userId,
    'purchases.transactionId': params.transactionId,
  }).lean();

  if (existing) {
    return getCreditWalletSnapshot(params.userId);
  }

  const packId = params.packId ?? PREMIUM_PACK_50_ID;
  const purchase = {
    purchasedAt:   new Date(),
    creditsAdded:  params.creditCents,
    amountPaid:    params.amountPaid,
    currency:      params.currency,
    provider:      params.provider,
    transactionId: params.transactionId,
    packId,
  };

  await AdamCreditWalletModel.findOneAndUpdate(
    { userId: params.userId },
    {
      $inc:  { balance: params.creditCents },
      $push: { purchases: purchase },
    },
    { upsert: true, new: true },
  ).lean();

  return getCreditWalletSnapshot(params.userId);
}

/** @deprecated use grantWalletCredits */
export async function grantCredits(params: {
  userId:        string;
  credits:       number;
  amountPaid:    number;
  currency:      string;
  provider:      string;
  transactionId: string;
  packId?:       string;
}): Promise<CreditWalletSnapshot> {
  return grantWalletCredits({
    userId:        params.userId,
    creditCents:   params.credits,
    amountPaid:    params.amountPaid,
    currency:      params.currency,
    provider:      params.provider,
    transactionId: params.transactionId,
    packId:        params.packId,
  });
}
