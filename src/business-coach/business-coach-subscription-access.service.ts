/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach Subscription Access
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { isFounderPayload } from '../middleware/auth.middleware';
import type { QXK24TokenPayload } from '../middleware/auth.middleware';
import { getStripeGatewayStatus } from '../subscriptions/stripe-gateway.service';
import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
} from '../subscriptions/subscription.schema';
import { getBusinessCoachPricing } from '../subscriptions/tier-access.config';
import {
  BusinessCoachEnrollmentModel,
  BusinessCoachEnrollmentStatus,
} from './business-coach-enrollment.schema';

export interface BusinessCoachSubscriptionAccess {
  canChat:          boolean;
  active:           boolean;
  status:           string;
  channel:          'public' | 'pin' | null;
  businessName:     string | null;
  registerUrl?:     string;
  checkoutUrl?:     string;
  chatUrl?:         string;
  publicMonthlyUsd?: number;
  pinMonthlyUsd?:   number;
  message?:         string;
}

function appBase(): string {
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
}

export function isBusinessCoachBillingEnforced(): boolean {
  const stripe = getStripeGatewayStatus();
  return ENV.STRIPE_ENABLED && stripe.configured;
}

export async function resolveBusinessCoachSubscriptionAccess(
  user: QXK24TokenPayload,
): Promise<BusinessCoachSubscriptionAccess> {
  const publicPricing = getBusinessCoachPricing('public');
  const pinPricing = getBusinessCoachPricing('pin');

  if (isFounderPayload(user)) {
    return {
      canChat:          true,
      active:           true,
      status:           'FOUNDER',
      channel:          null,
      businessName:     null,
      publicMonthlyUsd: publicPricing.monthly,
      pinMonthlyUsd:    pinPricing.monthly,
      chatUrl:          `${appBase()}/adam/business-coach/chat`,
    };
  }

  const activeSub = await SubscriptionModel.findOne({
    userId: user.userId,
    tier:   SubscriptionTier.BUSINESS_COACH,
    status: SubscriptionStatus.ACTIVE,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (activeSub) {
    const enrollment = await BusinessCoachEnrollmentModel.findOne({
      userId: user.userId,
    }).lean();

    return {
      canChat:          true,
      active:           true,
      status:           'ACTIVE',
      channel:          activeSub.businessCoachChannel ?? 'public',
      businessName:     enrollment?.businessName ?? null,
      publicMonthlyUsd: publicPricing.monthly,
      pinMonthlyUsd:    pinPricing.monthly,
      chatUrl:          `${appBase()}/adam/business-coach/chat`,
    };
  }

  const enrollment = await BusinessCoachEnrollmentModel.findOne({
    userId: user.userId,
  }).lean();

  if (enrollment) {
    const canChat = enrollment.status === BusinessCoachEnrollmentStatus.COMPLETE
      || enrollment.status === BusinessCoachEnrollmentStatus.PAID;

    return {
      canChat,
      active:           canChat,
      status:           enrollment.status,
      channel:          enrollment.pricingChannel ?? 'pin',
      businessName:     enrollment.businessName,
      registerUrl:      `${appBase()}/adam/business-coach/daftar`,
      checkoutUrl:      `${appBase()}/adam/business-coach/daftar`,
      publicMonthlyUsd: publicPricing.monthly,
      pinMonthlyUsd:    pinPricing.monthly,
      message:          canChat
        ? 'Subscription active — open Business Coach chat.'
        : 'Complete PIN registration and monthly checkout to unlock chat.',
    };
  }

  return {
    canChat:          false,
    active:           false,
    status:           'NONE',
    channel:          null,
    businessName:     null,
    registerUrl:      `${appBase()}/adam/business-coach/daftar`,
    checkoutUrl:      `${appBase()}/subscription/checkout?tier=BUSINESS_COACH&billingCycle=MONTHLY`,
    publicMonthlyUsd: publicPricing.monthly,
    pinMonthlyUsd:    pinPricing.monthly,
    message:          isBusinessCoachBillingEnforced()
      ? 'Subscribe publicly or redeem an ADAM Business Coach PIN.'
      : 'Checkout opening soon — register free to explore ADAM meanwhile.',
  };
}

export async function userHasBusinessCoachChatAccess(userId: string): Promise<boolean> {
  const activeSub = await SubscriptionModel.exists({
    userId,
    tier:   SubscriptionTier.BUSINESS_COACH,
    status: SubscriptionStatus.ACTIVE,
  });
  if (activeSub) return true;

  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId }).lean();
  return enrollment?.status === BusinessCoachEnrollmentStatus.COMPLETE
    || enrollment?.status === BusinessCoachEnrollmentStatus.PAID;
}
