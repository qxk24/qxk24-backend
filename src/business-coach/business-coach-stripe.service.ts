/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach Stripe Checkout
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

import crypto from 'crypto';
import { ENV } from '../config/environments';
import {
  assertStripeReady,
  type StripeCheckoutResult,
} from '../subscriptions/stripe-gateway.service';
import { stripeResourceId, toStripeUnitAmount } from '../subscriptions/stripe-currency';
import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
  BillingCycle,
  PaymentProvider,
  SupportedRegion,
  FOUNDER_SUBSCRIPTION_ID,
} from '../subscriptions/subscription.schema';
import { TIER_ACCESS, getBusinessCoachPricing } from '../subscriptions/tier-access.config';
import {
  BUSINESS_COACH_CHECKOUT_TYPE,
  BUSINESS_COACH_SKU_MONTHLY,
} from './business-coach.constants';
import {
  BusinessCoachEnrollmentModel,
  BusinessCoachEnrollmentStatus,
} from './business-coach-enrollment.schema';
import { markBusinessCoachEnrollmentPaid } from './business-coach-enrollment.service';

const STRIPE_API = 'https://api.stripe.com/v1';

function appUrl(): string {
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
}

function stripeHeaders(): Record<string, string> {
  return {
    Authorization:  `Bearer ${ENV.STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

async function stripePost<T>(path: string, params: Record<string, string>): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method:  'POST',
    headers: stripeHeaders(),
    body:    new URLSearchParams(params).toString(),
  });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }
  return data;
}

async function stripeGet<T>(path: string): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}` },
  });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }
  return data;
}

function newMongoSubscriptionId(): string {
  return `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function businessCoachStripePriceId(channel: 'public' | 'pin'): string {
  return channel === 'pin'
    ? ENV.STRIPE_PRICE_ID_BUSINESS_COACH_PIN_MONTHLY
    : ENV.STRIPE_PRICE_ID_BUSINESS_COACH_PUBLIC_MONTHLY;
}

function buildBusinessCoachLineItem(
  channel: 'public' | 'pin',
  pricing: ReturnType<typeof getBusinessCoachPricing>,
): Record<string, string> {
  const stripePriceId = businessCoachStripePriceId(channel);
  if (stripePriceId) {
    return {
      'line_items[0][price]':    stripePriceId,
      'line_items[0][quantity]': '1',
    };
  }

  const unitAmount = toStripeUnitAmount(pricing.monthly, pricing.currency.toLowerCase());
  if (unitAmount < 1) {
    throw new Error('Invalid Business Coach checkout amount.');
  }

  return {
    'line_items[0][quantity]':  '1',
    'line_items[0][price_data][currency]':                 pricing.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]':              String(unitAmount),
    'line_items[0][price_data][recurring][interval]':      'month',
    'line_items[0][price_data][product_data][name]':         pricing.label,
    'line_items[0][price_data][product_data][description]': 'ADAM Business Coach — universal business advisor · monthly',
  };
}

function businessCoachMetadata(
  channel: 'public' | 'pin',
  mongoId: string,
  userId: string,
  enrollmentId?: string,
): Record<string, string> {
  const base: Record<string, string> = {
    'metadata[checkoutType]':            BUSINESS_COACH_CHECKOUT_TYPE,
    'metadata[alamtologi_checkout_type]': 'subscription',
    'metadata[alamtologi_tier]':         SubscriptionTier.BUSINESS_COACH,
    'metadata[alamtologi_sku]':          BUSINESS_COACH_SKU_MONTHLY,
    'metadata[alamtologi_channel]':      channel,
    'metadata[userId]':                  userId,
    'metadata[subscriptionId]':          mongoId,
    'metadata[businessCoachChannel]':    channel,
    'subscription_data[metadata][checkoutType]':            BUSINESS_COACH_CHECKOUT_TYPE,
    'subscription_data[metadata][alamtologi_checkout_type]':  'subscription',
    'subscription_data[metadata][alamtologi_tier]':           SubscriptionTier.BUSINESS_COACH,
    'subscription_data[metadata][alamtologi_sku]':          BUSINESS_COACH_SKU_MONTHLY,
    'subscription_data[metadata][alamtologi_channel]':      channel,
    'subscription_data[metadata][userId]':                    userId,
    'subscription_data[metadata][subscriptionId]':          mongoId,
    'subscription_data[metadata][businessCoachChannel]':    channel,
  };

  if (enrollmentId) {
    base['metadata[enrollmentId]'] = enrollmentId;
    base['subscription_data[metadata][enrollmentId]'] = enrollmentId;
  }

  return base;
}

async function resumeOpenCheckout(
  stripeSessionId: string | null | undefined,
  enrollmentId: string,
): Promise<(StripeCheckoutResult & { enrollmentId: string }) | null> {
  const sessionId = stripeSessionId?.trim();
  if (!sessionId || !ENV.STRIPE_SECRET_KEY) return null;

  const session = await stripeGet<{ id: string; status: string; url: string | null }>(
    `/checkout/sessions/${sessionId}`,
  );
  if (session.status === 'open' && session.url) {
    return {
      sessionId:    session.id,
      checkoutUrl:  session.url,
      enrollmentId,
    };
  }
  return null;
}

export async function createBusinessCoachEnrollmentCheckoutSession(input: {
  userId:         string;
  customerEmail?: string;
}): Promise<StripeCheckoutResult & { enrollmentId: string }> {
  assertStripeReady();

  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId: input.userId });
  if (!enrollment) {
    throw new Error('Start ADAM Business Coach registration first.');
  }
  if (enrollment.status !== BusinessCoachEnrollmentStatus.PROFILE_SAVED) {
    throw new Error('Complete your business profile before payment.');
  }

  const resumed = await resumeOpenCheckout(enrollment.stripeSessionId, enrollment.enrollmentId);
  if (resumed) return resumed;

  const channel = enrollment.pricingChannel === 'public' ? 'public' : 'pin';
  const pricing = getBusinessCoachPricing(channel);
  const lineItem = buildBusinessCoachLineItem(channel, pricing);

  const sub = await SubscriptionModel.create({
    userId:                    input.userId,
    founderId:                 FOUNDER_SUBSCRIPTION_ID,
    tier:                      SubscriptionTier.BUSINESS_COACH,
    status:                    SubscriptionStatus.PENDING,
    billingCycle:              BillingCycle.MONTHLY,
    region:                    SupportedRegion.OTHER,
    currency:                  pricing.currency,
    amountPerCycle:            pricing.monthly,
    provider:                  PaymentProvider.STRIPE,
    access:                    TIER_ACCESS[SubscriptionTier.BUSINESS_COACH],
    isFounderFunded:           false,
    businessCoachChannel:      channel,
    businessCoachEnrollmentId: enrollment.enrollmentId,
  });

  const mongoId = sub._id?.toString() ?? newMongoSubscriptionId();

  const params: Record<string, string> = {
    mode:                'subscription',
    ...lineItem,
    success_url:         `${appUrl()}/adam/business-coach/daftar?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:          `${appUrl()}/adam/business-coach/daftar?cancelled=1`,
    client_reference_id: mongoId,
    billing_address_collection: 'auto',
    ...businessCoachMetadata(channel, mongoId, input.userId, enrollment.enrollmentId),
  };

  if (input.customerEmail) {
    params.customer_email = input.customerEmail;
  }

  const session = await stripePost<{ id: string; url: string }>(
    '/checkout/sessions',
    params,
  );

  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $set: { providerSubId: session.id },
  });

  enrollment.subscriptionId = mongoId;
  enrollment.stripeSessionId = session.id;
  await enrollment.save();

  return {
    sessionId:    session.id,
    checkoutUrl:  session.url,
    enrollmentId: enrollment.enrollmentId,
  };
}

/** @deprecated Use createBusinessCoachEnrollmentCheckoutSession */
export const createBusinessCoachPinCheckoutSession = createBusinessCoachEnrollmentCheckoutSession;

export async function activateBusinessCoachFromStripeCheckout(
  session: Record<string, unknown>,
): Promise<boolean> {
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== BUSINESS_COACH_CHECKOUT_TYPE) return false;

  const userId = meta.userId?.trim();
  const mongoId = meta.subscriptionId?.trim();
  const enrollmentId = meta.enrollmentId?.trim();
  const paymentStatus = session.payment_status as string | undefined;

  if (!userId || !mongoId) return false;
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') return false;

  const stripeSubId = stripeResourceId(session.subscription);
  const stripeCustomerId = stripeResourceId(session.customer);
  const stripeSessionId = session.id as string | undefined;
  const channel = (meta.businessCoachChannel === 'pin' ? 'pin' : 'public') as 'public' | 'pin';

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await SubscriptionModel.findByIdAndUpdate(mongoId, {
    $set: {
      status:               SubscriptionStatus.ACTIVE,
      provider:             PaymentProvider.STRIPE,
      providerSubId:        stripeSubId,
      providerCustomerId:   stripeCustomerId,
      currentPeriodStart:   new Date(),
      currentPeriodEnd:     periodEnd,
      businessCoachChannel: channel,
    },
  });

  if (enrollmentId) {
    await markBusinessCoachEnrollmentPaid({
      userId,
      enrollmentId,
      stripeSessionId,
      subscriptionId: mongoId,
    });
  }

  return true;
}

export async function syncBusinessCoachPaymentFromSession(
  userId: string,
  sessionId: string,
): Promise<{ activated: boolean; message: string }> {
  if (!ENV.STRIPE_SECRET_KEY) {
    return { activated: false, message: 'Stripe is not configured.' };
  }

  const session = await stripeGet<Record<string, unknown>>(
    `/checkout/sessions/${sessionId}`,
  );
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.userId !== userId) {
    return { activated: false, message: 'Session does not belong to this user.' };
  }

  const ok = await activateBusinessCoachFromStripeCheckout(session);
  return ok
    ? { activated: true, message: 'ADAM Business Coach subscription active.' }
    : { activated: false, message: 'Payment not completed yet.' };
}
