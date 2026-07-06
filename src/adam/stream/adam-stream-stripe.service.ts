/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Stripe Checkout
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-06
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../../config/environments';
import {
  assertStripeReady,
  type StripeCheckoutResult,
} from '../../subscriptions/stripe-gateway.service';
import { stripeResourceId, toStripeUnitAmount } from '../../subscriptions/stripe-currency';
import { ADAM_STREAM_CHECKOUT_TYPE, type AdamStreamBillingCycle, type AdamStreamPaidPlanId } from './adam-stream.constants';
import {
  AdamStreamSubscriptionModel,
  AdamStreamSubscriptionStatus,
} from './adam-stream-subscription.schema';
import {
  getAdamStreamStripePriceDef,
  getAdamStreamStripePriceId,
  streamStripeMetadata,
} from './adam-stream-stripe.config';

const STRIPE_API = 'https://api.stripe.com/v1';

function appUrl(): string {
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://www.qxk24.com').replace(/\/$/, '');
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

function newStreamSubscriptionId(): string {
  return `STREAM-SUB-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function buildStreamLineItem(
  planId: AdamStreamPaidPlanId,
  billingCycle: AdamStreamBillingCycle,
): Record<string, string> {
  const def = getAdamStreamStripePriceDef(planId, billingCycle);
  if (!def) throw new Error(`Unknown ADAM Stream plan: ${planId}`);

  const priceId = getAdamStreamStripePriceId(planId, billingCycle);
  if (priceId) {
    return {
      'line_items[0][price]':    priceId,
      'line_items[0][quantity]': '1',
    };
  }

  const unitAmount = toStripeUnitAmount(def.amountUsd, def.currency);
  if (unitAmount < 1) throw new Error('Invalid ADAM Stream checkout amount.');

  return {
    'line_items[0][quantity]':                              '1',
    'line_items[0][price_data][currency]':                  def.currency,
    'line_items[0][price_data][unit_amount]':               String(unitAmount),
    'line_items[0][price_data][recurring][interval]':        def.interval,
    'line_items[0][price_data][product_data][name]':         def.productName,
    'line_items[0][price_data][product_data][description]':   def.description,
  };
}

function streamCheckoutMetadata(
  planId: AdamStreamPaidPlanId,
  billingCycle: AdamStreamBillingCycle,
  subscriptionId: string,
  userId: string,
): Record<string, string> {
  const def = getAdamStreamStripePriceDef(planId, billingCycle)!;
  const meta = streamStripeMetadata(planId, def.sku, billingCycle);
  const base: Record<string, string> = {
    'metadata[checkoutType]':            ADAM_STREAM_CHECKOUT_TYPE,
    'metadata[userId]':                  userId,
    'metadata[subscriptionId]':          subscriptionId,
    'metadata[streamPlanId]':            planId,
    'metadata[billingCycle]':            billingCycle,
    'subscription_data[metadata][checkoutType]':   ADAM_STREAM_CHECKOUT_TYPE,
    'subscription_data[metadata][userId]':       userId,
    'subscription_data[metadata][subscriptionId]': subscriptionId,
    'subscription_data[metadata][streamPlanId]':   planId,
    'subscription_data[metadata][billingCycle]':   billingCycle,
  };

  for (const [key, value] of Object.entries(meta)) {
    base[`metadata[${key}]`] = value;
    base[`subscription_data[metadata][${key}]`] = value;
  }

  return base;
}

async function resumeOpenCheckout(
  stripeSessionId: string | null | undefined,
  subscriptionId: string,
): Promise<(StripeCheckoutResult & { subscriptionId: string }) | null> {
  const sessionId = stripeSessionId?.trim();
  if (!sessionId || !ENV.STRIPE_SECRET_KEY) return null;

  const session = await stripeGet<{ id: string; status: string; url: string | null }>(
    `/checkout/sessions/${sessionId}`,
  );
  if (session.status === 'open' && session.url) {
    return {
      sessionId:      session.id,
      checkoutUrl:    session.url,
      subscriptionId,
    };
  }
  return null;
}

export async function createAdamStreamHostCheckoutSession(input: {
  userId:         string;
  customerEmail?: string;
  planId:         AdamStreamPaidPlanId;
  billingCycle?:  AdamStreamBillingCycle;
}): Promise<StripeCheckoutResult & { subscriptionId: string }> {
  assertStripeReady();

  const billingCycle = input.billingCycle ?? 'annual';
  const def = getAdamStreamStripePriceDef(input.planId, billingCycle);
  if (!def) throw new Error(`Unknown ADAM Stream plan: ${input.planId}`);

  const existing = await AdamStreamSubscriptionModel.findOne({ userId: input.userId });
  if (existing?.status === AdamStreamSubscriptionStatus.ACTIVE) {
    throw new Error('You already have an active ADAM Stream host plan. Contact support to change tiers.');
  }

  const subscriptionId = existing?.subscriptionId ?? newStreamSubscriptionId();

  const resumed = await resumeOpenCheckout(existing?.stripeSessionId, subscriptionId);
  if (resumed) return resumed;

  const lineItem = buildStreamLineItem(input.planId, billingCycle);

  await AdamStreamSubscriptionModel.findOneAndUpdate(
    { userId: input.userId },
    {
      $set: {
        subscriptionId,
        userId:               input.userId,
        planId:               input.planId,
        sku:                  def.sku,
        billingCycle,
        amountUsd:            def.amountUsd,
        status:               AdamStreamSubscriptionStatus.PENDING,
        stripeSessionId:      null,
        stripeSubscriptionId: null,
      },
    },
    { upsert: true, new: true },
  );

  const params: Record<string, string> = {
    mode:                'subscription',
    ...lineItem,
    success_url:         `${appUrl()}/adam/stream/host?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:          `${appUrl()}/adam/stream/host?cancelled=1`,
    client_reference_id: subscriptionId,
    billing_address_collection: 'auto',
    ...streamCheckoutMetadata(input.planId, billingCycle, subscriptionId, input.userId),
  };

  if (input.customerEmail) {
    params.customer_email = input.customerEmail;
  }

  const session = await stripePost<{ id: string; url: string }>(
    '/checkout/sessions',
    params,
  );

  await AdamStreamSubscriptionModel.findOneAndUpdate(
    { userId: input.userId },
    { $set: { stripeSessionId: session.id } },
  );

  return {
    sessionId:      session.id,
    checkoutUrl:    session.url,
    subscriptionId,
  };
}

export async function activateAdamStreamFromStripeCheckout(
  session: Record<string, unknown>,
): Promise<boolean> {
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== ADAM_STREAM_CHECKOUT_TYPE) return false;

  const userId = meta.userId?.trim();
  const subscriptionId = meta.subscriptionId?.trim();
  const planId = meta.streamPlanId?.trim() as AdamStreamPaidPlanId | undefined;
  const paymentStatus = session.payment_status as string | undefined;

  if (!userId || !subscriptionId || !planId) return false;
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') return false;

  const stripeSubId = stripeResourceId(session.subscription);
  const stripeCustomerId = stripeResourceId(session.customer);
  const billingCycle = (meta.billingCycle === 'monthly' ? 'monthly' : 'annual') as AdamStreamBillingCycle;

  const periodEnd = new Date();
  if (billingCycle === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  await AdamStreamSubscriptionModel.findOneAndUpdate(
    { subscriptionId },
    {
      $set: {
        userId,
        planId,
        status:               AdamStreamSubscriptionStatus.ACTIVE,
        billingCycle,
        stripeSessionId:      session.id as string,
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId,
        currentPeriodStart:   new Date(),
        currentPeriodEnd:     periodEnd,
      },
    },
    { upsert: true },
  );

  return true;
}

export async function syncAdamStreamPaymentFromSession(
  userId: string,
  sessionId: string,
): Promise<{ activated: boolean; message: string; planId?: string }> {
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

  const ok = await activateAdamStreamFromStripeCheckout(session);
  const sub = await AdamStreamSubscriptionModel.findOne({ userId }).lean();
  return ok
    ? {
        activated: true,
        planId:    sub?.planId,
        message:   'ADAM Stream host plan active.',
      }
    : { activated: false, message: 'Payment not completed yet.' };
}
