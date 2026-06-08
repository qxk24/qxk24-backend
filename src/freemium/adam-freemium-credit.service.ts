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
import { getPelajarPricing } from '../subscriptions/tier-access.config';
import { SupportedRegion } from '../subscriptions/subscription.schema';
import { getStripeGatewayStatus } from '../subscriptions/stripe-gateway.service';
import { AdamCreditWalletModel } from './adam-freemium.schema';

export const CREDIT_PACK_ID = 'standard';
export const PREMIUM_PACK_50_ID = 'premium-50';
export const PREMIUM_PACK_100_ID = 'premium-100';

export interface CreditPackOffer {
  id:           string;
  label:        string;
  credits:      number;
  amount:       number;
  currency:     string;
  description:  string;
}

export interface CreditWalletSnapshot {
  userId:         string;
  balance:        number;
  lifetimeBought: number;
}

export function creditPackSize(): number {
  return ENV.ADAM_FREEMIUM_CREDIT_PACK_SIZE;
}

export function isCreditPurchaseWired(): boolean {
  const stripe = getStripeGatewayStatus();
  return ENV.STRIPE_ENABLED && stripe.enabled && stripe.configured;
}

/** Basic (free) tier — small extension pack after daily limit. */
export function getBasicCreditPackOffer(region = SupportedRegion.MY): CreditPackOffer {
  const pricing = getPelajarPricing(region);
  const credits = creditPackSize();
  return {
    id:          CREDIT_PACK_ID,
    label:       `+${credits} questions`,
    credits,
    amount:      pricing.extensionFee,
    currency:    pricing.currency,
    description: `Add ${credits} questions after your daily free allowance.`,
  };
}

/** Premium top-up packs (MYR) — after monthly 50 included questions. */
export function getPremiumCreditPacks(region = SupportedRegion.MY): CreditPackOffer[] {
  const currency = getPelajarPricing(region).currency;
  if (region !== SupportedRegion.MY) {
    return [
      {
        id:          PREMIUM_PACK_50_ID,
        label:       '+50 questions',
        credits:     50,
        amount:      35,
        currency,
        description: 'Fifty extra questions — used after your monthly Premium allowance.',
      },
      {
        id:          PREMIUM_PACK_100_ID,
        label:       '+100 questions',
        credits:     100,
        amount:      85,
        currency,
        description: 'One hundred extra questions — best value after monthly Premium allowance.',
      },
    ];
  }
  return [
    {
      id:          PREMIUM_PACK_50_ID,
      label:       '+50 questions',
      credits:     50,
      amount:      35,
      currency:    'MYR',
      description: 'Fifty extra questions — used after your monthly Premium allowance.',
    },
    {
      id:          PREMIUM_PACK_100_ID,
      label:       '+100 questions',
      credits:     100,
      amount:      85,
      currency:    'MYR',
      description: 'One hundred extra questions — best value after monthly Premium allowance.',
    },
  ];
}

/** @deprecated Use getBasicCreditPackOffer or getPremiumCreditPacks */
export function getCreditPackOffer(region = SupportedRegion.MY): CreditPackOffer {
  return getBasicCreditPackOffer(region);
}

export function resolveCreditPack(
  packId: string,
  region = SupportedRegion.MY,
): CreditPackOffer | null {
  if (packId === CREDIT_PACK_ID) return getBasicCreditPackOffer(region);
  return getPremiumCreditPacks(region).find((p) => p.id === packId) ?? null;
}

export async function getCreditBalance(userId: string): Promise<number> {
  const doc = await AdamCreditWalletModel.findOne({ userId }).select({ balance: 1 }).lean();
  return doc?.balance ?? 0;
}

export async function getCreditWalletSnapshot(userId: string): Promise<CreditWalletSnapshot> {
  const doc = await AdamCreditWalletModel.findOne({ userId }).lean();
  const purchases = doc?.purchases ?? [];
  const lifetimeBought = purchases.reduce((sum, p) => sum + p.creditsAdded, 0);
  return {
    userId,
    balance:        doc?.balance ?? 0,
    lifetimeBought,
  };
}

/** Atomically consume one credit when allowance is exhausted. */
export async function consumeOneCredit(userId: string): Promise<{ ok: boolean; balance: number }> {
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

/** Grant credits after verified payment (or founder manual grant). */
export async function grantCredits(params: {
  userId:        string;
  credits:       number;
  amountPaid:    number;
  currency:      string;
  provider:      string;
  transactionId: string;
  packId?:       string;
}): Promise<CreditWalletSnapshot> {
  const packId = params.packId ?? CREDIT_PACK_ID;
  const purchase = {
    purchasedAt:   new Date(),
    creditsAdded:  params.credits,
    amountPaid:    params.amountPaid,
    currency:      params.currency,
    provider:      params.provider,
    transactionId: params.transactionId,
    packId,
  };

  const doc = await AdamCreditWalletModel.findOneAndUpdate(
    { userId: params.userId },
    {
      $inc:  { balance: params.credits },
      $push: { purchases: purchase },
    },
    { upsert: true, new: true },
  ).lean();

  const purchases = doc?.purchases ?? [];
  return {
    userId:         params.userId,
    balance:        doc?.balance ?? params.credits,
    lifetimeBought: purchases.reduce((sum, p) => sum + p.creditsAdded, 0),
  };
}
