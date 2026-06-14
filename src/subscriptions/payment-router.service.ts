/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Payment Router Service
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

import {
  SubscriptionModel,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
  PaymentProvider,
  SupportedRegion,
  ISubscription,
  FOUNDER_SUBSCRIPTION_ID,
} from './subscription.schema';
import {
  TIER_ACCESS,
  getPelajarPricing,
  getProfesionalPricing,
  getTutorPricing,
  normalizeTutorSubscriptionLevel,
} from './tier-access.config';
import type { TutorSubscriptionLevel } from './subscription.schema';
import { detectRegionFromHeaders } from './region-detector.service';
import { ENV } from '../config/environments';
import { isConsumerDailyPlan } from '../freemium/adam-freemium-consumer.service';
import {
  createStripeCheckoutSession,
} from './stripe-gateway.service';

export interface CreateSubscriptionInput {
  userId:       string;
  tier:         SubscriptionTier;
  billingCycle: BillingCycle;
  headers:      Headers;
  /** Required for TUTOR — primary / secondary / university pricing band */
  tutorLevel?:  TutorSubscriptionLevel | string | null;
}

export interface SubscriptionCreationResult {
  subscriptionId: string;
  checkoutUrl:    string;
  provider:       PaymentProvider;
  currency:       string;
  amount:         number;
}

function appUrl(): string {
  return ENV.APP_URL || ENV.ADAM_WEB_BASE_URL;
}

export async function routeSubscriptionCreation(
  input: CreateSubscriptionInput,
): Promise<SubscriptionCreationResult> {
  const region   = detectRegionFromHeaders(input.headers);
  const provider = PaymentProvider.STRIPE;

  if (input.tier === SubscriptionTier.PRO) {
    if (!isConsumerDailyPlan()) {
      throw new Error(
        'Pro is not open for new subscriptions on this deployment.',
      );
    }
    return createConsumerProSubscription(input, provider);
  }

  switch (input.tier) {
    case SubscriptionTier.PROFESIONAL:
      return createProfesionalSubscription(input, region, provider);
    case SubscriptionTier.TUTOR:
      return createTutorSubscription(input, provider);
    case SubscriptionTier.ENTERPRISE:
      return createEnterprisePendingSubscription(input, region);
    default:
      throw new Error(`Unsupported tier for payment routing: ${input.tier}`);
  }
}

async function createConsumerProSubscription(
  input:    CreateSubscriptionInput,
  provider: PaymentProvider,
): Promise<SubscriptionCreationResult> {
  const monthly = ENV.ADAM_PRO_MONTHLY_USD;
  const amount  = input.billingCycle === BillingCycle.ANNUAL
    ? ENV.ADAM_PRO_ANNUAL_USD
    : monthly;

  const sub = await saveSubscription({
    userId:          input.userId,
    founderId:       FOUNDER_SUBSCRIPTION_ID,
    tier:            SubscriptionTier.PRO,
    status:          SubscriptionStatus.PENDING,
    billingCycle:    input.billingCycle,
    region:          SupportedRegion.US,
    currency:        'USD',
    amountPerCycle:  amount,
    provider,
    access:          TIER_ACCESS[SubscriptionTier.PRO],
    isFounderFunded: false,
  });

  const checkoutUrl = await createProviderCheckout(sub, amount, 'USD', provider);

  return {
    subscriptionId: sub._id.toString(),
    checkoutUrl,
    provider,
    currency: 'USD',
    amount,
  };
}

async function createPelajarSubscription(
  input:    CreateSubscriptionInput,
  region:   SupportedRegion,
  provider: PaymentProvider,
): Promise<SubscriptionCreationResult> {
  const pricing = getPelajarPricing(region);
  const amount  = input.billingCycle === BillingCycle.ANNUAL
    ? pricing.annual
    : pricing.monthly;

  const sub = await saveSubscription({
    userId:          input.userId,
    founderId:       FOUNDER_SUBSCRIPTION_ID,
    tier:            SubscriptionTier.PRO,
    status:          SubscriptionStatus.PENDING,
    billingCycle:    input.billingCycle,
    region,
    currency:        pricing.currency,
    amountPerCycle:  amount,
    provider,
    access:          TIER_ACCESS[SubscriptionTier.PRO],
    isFounderFunded: false,
  });

  const checkoutUrl = await createProviderCheckout(sub, amount, pricing.currency, provider);

  return {
    subscriptionId: sub._id.toString(),
    checkoutUrl,
    provider,
    currency: pricing.currency,
    amount,
  };
}

async function createTutorSubscription(
  input:    CreateSubscriptionInput,
  provider: PaymentProvider,
): Promise<SubscriptionCreationResult> {
  if (input.billingCycle !== BillingCycle.MONTHLY) {
    throw new Error('ADAM Tutor is monthly billing only.');
  }

  const tutorLevel = normalizeTutorSubscriptionLevel(input.tutorLevel);
  const pricing = getTutorPricing(tutorLevel);
  const amount  = pricing.monthly;

  const sub = await saveSubscription({
    userId:          input.userId,
    founderId:       FOUNDER_SUBSCRIPTION_ID,
    tier:            SubscriptionTier.TUTOR,
    tutorLevel,
    status:          SubscriptionStatus.PENDING,
    billingCycle:    BillingCycle.MONTHLY,
    region:          SupportedRegion.US,
    currency:        pricing.currency,
    amountPerCycle:  amount,
    provider,
    access:          TIER_ACCESS[SubscriptionTier.TUTOR],
    isFounderFunded: false,
  });

  const checkoutUrl = await createProviderCheckout(sub, amount, pricing.currency, provider);

  return {
    subscriptionId: sub._id.toString(),
    checkoutUrl,
    provider,
    currency: pricing.currency,
    amount,
  };
}

async function createProfesionalSubscription(
  input:    CreateSubscriptionInput,
  region:   SupportedRegion,
  provider: PaymentProvider,
): Promise<SubscriptionCreationResult> {
  const consumer = isConsumerDailyPlan();
  const pricing = consumer
    ? {
        currency: 'USD',
        monthly:  ENV.ADAM_PREMIUM_MONTHLY_USD,
        annual:   ENV.ADAM_PREMIUM_ANNUAL_USD,
      }
    : getProfesionalPricing(region);
  const amount  = input.billingCycle === BillingCycle.ANNUAL
    ? pricing.annual
    : pricing.monthly;

  const sub = await saveSubscription({
    userId:          input.userId,
    founderId:       FOUNDER_SUBSCRIPTION_ID,
    tier:            SubscriptionTier.PROFESIONAL,
    status:          SubscriptionStatus.PENDING,
    billingCycle:    input.billingCycle,
    region:          consumer ? SupportedRegion.US : region,
    currency:        pricing.currency,
    amountPerCycle:  amount,
    provider,
    access:          TIER_ACCESS[SubscriptionTier.PROFESIONAL],
    isFounderFunded: false,
  });

  const checkoutUrl = await createProviderCheckout(sub, amount, pricing.currency, provider);

  return {
    subscriptionId: sub._id.toString(),
    checkoutUrl,
    provider,
    currency: pricing.currency,
    amount,
  };
}

async function createEnterprisePendingSubscription(
  input:  CreateSubscriptionInput,
  region: SupportedRegion,
): Promise<SubscriptionCreationResult> {
  const sub = await saveSubscription({
    userId:          input.userId,
    founderId:       FOUNDER_SUBSCRIPTION_ID,
    tier:            SubscriptionTier.ENTERPRISE,
    status:          SubscriptionStatus.PENDING,
    billingCycle:    BillingCycle.ENTERPRISE,
    region,
    currency:        'MYR',
    amountPerCycle:  0,
    provider:        PaymentProvider.MANUAL,
    access:          TIER_ACCESS[SubscriptionTier.ENTERPRISE],
    isFounderFunded: false,
  });

  return {
    subscriptionId: sub._id.toString(),
    checkoutUrl:    `${appUrl()}/enterprise/inquiry-received`,
    provider:       PaymentProvider.MANUAL,
    currency:       'MYR',
    amount:         0,
  };
}

async function createProviderCheckout(
  sub:      ISubscription,
  amount:   number,
  currency: string,
  provider: PaymentProvider,
): Promise<string> {
  switch (provider) {
    case PaymentProvider.RAZORPAY:
      return createRazorpaySubscription(sub, amount, currency);
    case PaymentProvider.STRIPE:
      return createStripeSubscription(sub, amount, currency);
    case PaymentProvider.XENDIT:
      return createXenditSubscription(sub, amount, currency);
    case PaymentProvider.PAYSTACK:
      return createPaystackSubscription(sub, amount, currency);
    case PaymentProvider.PADDLE:
      return createPaddleSubscription(sub, amount, currency);
    default:
      return createStripeSubscription(sub, amount, currency);
  }
}

async function createRazorpaySubscription(
  sub:      ISubscription,
  _amount:  number,
  _currency: string,
): Promise<string> {
  const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Basic ${Buffer.from(
        `${ENV.RAZORPAY_KEY_ID}:${ENV.RAZORPAY_KEY_SECRET}`,
      ).toString('base64')}`,
    },
    body: JSON.stringify({
      plan_id:     ENV.RAZORPAY_PLAN_ID_PELAJAR,
      total_count: sub.billingCycle === BillingCycle.ANNUAL ? 12 : 120,
      quantity:    1,
      notes:       { subscriptionId: sub._id?.toString(), userId: sub.userId },
    }),
  });

  const data = await response.json() as { id: string; short_url: string };
  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $set: { providerSubId: data.id },
  });

  return data.short_url;
}

async function createStripeSubscription(
  sub:      ISubscription,
  _amount:  number,
  _currency: string,
  customerEmail?: string,
): Promise<string> {
  const result = await createStripeCheckoutSession(sub, customerEmail);
  return result.checkoutUrl;
}

async function createXenditSubscription(
  sub:      ISubscription,
  amount:   number,
  currency: string,
): Promise<string> {
  const response = await fetch('https://api.xendit.co/recurring/plans', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Basic ${Buffer.from(`${ENV.XENDIT_SECRET_KEY}:`).toString('base64')}`,
    },
    body: JSON.stringify({
      reference_id:     sub._id?.toString(),
      customer_id:      sub.userId,
      recurring_action: 'PAYMENT',
      currency,
      amount,
      schedule: {
        reference_id:   `schedule_${sub._id?.toString()}`,
        interval:       'MONTH',
        interval_count: sub.billingCycle === BillingCycle.ANNUAL ? 12 : 1,
      },
      metadata:             { subscriptionId: sub._id?.toString() },
      success_return_url:   `${appUrl()}/subscription/success`,
      failure_return_url:   `${appUrl()}/subscription/cancelled`,
    }),
  });

  const data = await response.json() as { id: string; actions: Array<{ url: string }> };
  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $set: { providerSubId: data.id },
  });

  return data.actions?.[0]?.url ?? `${appUrl()}/subscription/pending`;
}

async function createPaystackSubscription(
  sub:      ISubscription,
  amount:   number,
  currency: string,
): Promise<string> {
  const amountInSmallestUnit = amount * 100;
  const planKey = `PAYSTACK_PLAN_CODE_${sub.tier}`;
  const plan    = process.env[planKey] ?? '';

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      email:        `${sub.userId}@alamtologi.com`,
      amount:       amountInSmallestUnit,
      currency,
      plan,
      metadata:     { subscriptionId: sub._id?.toString(), userId: sub.userId },
      callback_url: `${appUrl()}/subscription/success`,
    }),
  });

  const data = await response.json() as { data: { authorization_url: string; reference: string } };
  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $set: { providerSubId: data.data.reference },
  });

  return data.data.authorization_url;
}

async function createPaddleSubscription(
  sub:      ISubscription,
  _amount:  number,
  _currency: string,
): Promise<string> {
  const priceKey = `PADDLE_PRICE_ID_${sub.tier}_${sub.billingCycle}`;
  const priceId  = process.env[priceKey] ?? '';

  const response = await fetch('https://api.paddle.com/transactions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${ENV.PADDLE_API_KEY}`,
    },
    body: JSON.stringify({
      items: [{ price_id: priceId, quantity: 1 }],
      custom_data: { subscriptionId: sub._id?.toString(), userId: sub.userId },
      checkout: { url: `${appUrl()}/subscription/success` },
    }),
  });

  const data = await response.json() as { data: { id: string; checkout: { url: string } } };
  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $set: { providerSubId: data.data.id },
  });

  return data.data.checkout.url;
}

async function saveSubscription(
  payload: Partial<ISubscription>,
): Promise<ISubscription> {
  const now = new Date();
  const isAnnual = payload.billingCycle === BillingCycle.ANNUAL;

  const periodEnd = new Date(now);
  if (isAnnual) {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  return SubscriptionModel.create({
    ...payload,
    currentPeriodStart: now,
    currentPeriodEnd:   periodEnd,
    neverDelete:        true,
  });
}
