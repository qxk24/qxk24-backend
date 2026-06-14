/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Subscription Access
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
 * ============================================================
 */

import { ENV } from '../config/environments';
import { isQaUnlimitedAccount } from '../qa/qa-unlimited-account.service';
import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
} from '../subscriptions/subscription.schema';
import { getStripeGatewayStatus } from '../subscriptions/stripe-gateway.service';
import {
  getTutorPricing,
  normalizeTutorSubscriptionLevel,
  TUTOR_LEVEL_LABELS,
} from '../subscriptions/tier-access.config';
import type { TutorSubscriptionLevel } from '../subscriptions/subscription.schema';

export interface TutorSubscriptionAccess {
  canChat:      boolean;
  active:       boolean;
  status:       string;
  tier:         SubscriptionTier.TUTOR | 'NONE';
  tutorLevel?:  TutorSubscriptionLevel;
  message?:     string;
  upgradeUrl?:  string;
  code?:        'TUTOR_SUBSCRIPTION_REQUIRED' | 'TUTOR_SUBSCRIPTION_EXPIRED';
  monthlyAmount?: number;
  currency?:      string;
}

function tutorUpgradeUrl(level: TutorSubscriptionLevel = 'secondary'): string {
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
  const q = new URLSearchParams({
    tier:         'TUTOR',
    billingCycle: 'MONTHLY',
    tutorLevel:   level,
  });
  return `${base}/subscription/checkout?${q.toString()}`;
}

/** Seed QA account (adam-student.types) — tutor demo without Stripe on production. */
const TUTOR_QA_BYPASS_USER_IDS = new Set(['pelajar-test', 'sabrina']);

function isTutorQaBypass(userId: string): boolean {
  return isTutorQaBypassUser(userId);
}

export function isTutorQaBypassUser(userId: string): boolean {
  return TUTOR_QA_BYPASS_USER_IDS.has(userId.trim().toLowerCase());
}

/** Enforce paid tutor sub when Stripe is live, unless explicitly disabled. */
export function isTutorBillingEnforced(): boolean {
  if (!ENV.ADAM_TUTOR_BILLING_REQUIRED) return false;
  const stripe = getStripeGatewayStatus();
  return ENV.STRIPE_ENABLED && stripe.configured;
}

export async function resolveTutorSubscriptionAccess(
  userId: string,
  preferredLevel?: TutorSubscriptionLevel | string | null,
): Promise<TutorSubscriptionAccess> {
  const checkoutLevel = normalizeTutorSubscriptionLevel(preferredLevel);
  const checkoutPricing = getTutorPricing(checkoutLevel);

  if (isTutorQaBypass(userId) || await isQaUnlimitedAccount(userId)) {
    return {
      canChat:     true,
      active:      true,
      status:      isTutorQaBypass(userId) ? 'QA_BYPASS' : 'FOUNDER_UNLIMITED',
      tier:        'NONE',
      tutorLevel:  checkoutLevel,
      monthlyAmount: checkoutPricing.monthly,
      currency:      checkoutPricing.currency,
    };
  }

  if (!isTutorBillingEnforced()) {
    return {
      canChat:     true,
      active:      true,
      status:      'OPEN',
      tier:        'NONE',
      tutorLevel:  checkoutLevel,
      monthlyAmount: checkoutPricing.monthly,
      currency:      checkoutPricing.currency,
    };
  }

  const tutorSub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.TUTOR,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] },
  }).sort({ updatedAt: -1 });

  const subLevel = normalizeTutorSubscriptionLevel(tutorSub?.tutorLevel);
  const subPricing = getTutorPricing(subLevel);
  const levelLabel = TUTOR_LEVEL_LABELS[checkoutLevel];

  if (!tutorSub) {
    return {
      canChat:     false,
      active:      false,
      status:      'NONE',
      tier:        'NONE',
      tutorLevel:  checkoutLevel,
      code:        'TUTOR_SUBSCRIPTION_REQUIRED',
      message:     `Subscribe to ADAM Tutor (${levelLabel}) — $${checkoutPricing.monthly.toFixed(2)}/month USD, all subjects.`,
      upgradeUrl:  tutorUpgradeUrl(checkoutLevel),
      monthlyAmount: checkoutPricing.monthly,
      currency:      checkoutPricing.currency,
    };
  }

  if (tutorSub.status === SubscriptionStatus.PAUSED) {
    return {
      canChat:     false,
      active:      false,
      status:      tutorSub.status,
      tier:        SubscriptionTier.TUTOR,
      tutorLevel:  subLevel,
      code:        'TUTOR_SUBSCRIPTION_REQUIRED',
      message:     'Payment failed. Update your ADAM Tutor billing to continue.',
      upgradeUrl:  tutorUpgradeUrl(subLevel),
      monthlyAmount: subPricing.monthly,
      currency:      subPricing.currency,
    };
  }

  if (tutorSub.currentPeriodEnd && tutorSub.currentPeriodEnd < new Date()) {
    return {
      canChat:     false,
      active:      false,
      status:      SubscriptionStatus.EXPIRED,
      tier:        SubscriptionTier.TUTOR,
      tutorLevel:  subLevel,
      code:        'TUTOR_SUBSCRIPTION_EXPIRED',
      message:     'ADAM Tutor subscription expired. Renew to keep learning.',
      upgradeUrl:  tutorUpgradeUrl(subLevel),
      monthlyAmount: subPricing.monthly,
      currency:      subPricing.currency,
    };
  }

  return {
    canChat:     true,
    active:      true,
    status:      tutorSub.status,
    tier:        SubscriptionTier.TUTOR,
    tutorLevel:  subLevel,
    monthlyAmount: subPricing.monthly,
    currency:      subPricing.currency,
  };
}
