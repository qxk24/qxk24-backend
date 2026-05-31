/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Stripe Gateway Service
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
 *
 * Set STRIPE_ENABLED=true and add keys in .env to activate.
 * Until then all Stripe calls return a clear not-configured error.
 */

import crypto from 'crypto';
import {
  SubscriptionModel,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
  PaymentProvider,
  ISubscription,
} from './subscription.schema';
import { convertPencarianToPelajar } from './pencarian-tracker.service';
import { ENV } from '../config/environments';

const STRIPE_API = 'https://api.stripe.com/v1';

export interface StripeGatewayStatus {
  enabled:        boolean;
  configured:     boolean;
  publishableKey: string | null;
  missing:        string[];
}

export interface StripeCheckoutResult {
  sessionId:  string;
  checkoutUrl: string;
}

interface StripeApiError {
  error?: { message?: string };
}

function appUrl(): string {
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://qxk24.com').replace(/\/$/, '');
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

  const data = await response.json() as T & StripeApiError;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }
  return data;
}

async function stripeGet<T>(path: string): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}` },
  });

  const data = await response.json() as T & StripeApiError;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }
  return data;
}

export function getStripePriceId(tier: SubscriptionTier, cycle: BillingCycle): string {
  const map: Partial<Record<string, string>> = {
    [`${SubscriptionTier.PELAJAR}_${BillingCycle.MONTHLY}`]:     ENV.STRIPE_PRICE_ID_PELAJAR_MONTHLY,
    [`${SubscriptionTier.PELAJAR}_${BillingCycle.ANNUAL}`]:      ENV.STRIPE_PRICE_ID_PELAJAR_ANNUAL,
    [`${SubscriptionTier.PROFESIONAL}_${BillingCycle.MONTHLY}`]: ENV.STRIPE_PRICE_ID_PROFESIONAL_MONTHLY,
    [`${SubscriptionTier.PROFESIONAL}_${BillingCycle.ANNUAL}`]:  ENV.STRIPE_PRICE_ID_PROFESIONAL_ANNUAL,
  };
  return map[`${tier}_${cycle}`] ?? '';
}

export function getStripeGatewayStatus(): StripeGatewayStatus {
  const missing: string[] = [];

  if (!ENV.STRIPE_ENABLED) {
    return {
      enabled:        false,
      configured:     false,
      publishableKey: ENV.STRIPE_PUBLISHABLE_KEY || null,
      missing:        ['STRIPE_ENABLED'],
    };
  }

  if (!ENV.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!ENV.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');

  const priceKeys = [
    'STRIPE_PRICE_ID_PELAJAR_MONTHLY',
    'STRIPE_PRICE_ID_PELAJAR_ANNUAL',
    'STRIPE_PRICE_ID_PROFESIONAL_MONTHLY',
    'STRIPE_PRICE_ID_PROFESIONAL_ANNUAL',
  ];
  for (const key of priceKeys) {
    const val = process.env[key];
    if (!val) missing.push(key);
  }

  return {
    enabled:        ENV.STRIPE_ENABLED,
    configured:     missing.length === 0,
    publishableKey: ENV.STRIPE_PUBLISHABLE_KEY || null,
    missing,
  };
}

export function assertStripeReady(tier: SubscriptionTier, cycle: BillingCycle): void {
  const status = getStripeGatewayStatus();
  if (!status.enabled) {
    throw new Error(
      'Stripe is not enabled yet. Set STRIPE_ENABLED=true in backend .env when ready.',
    );
  }
  if (!ENV.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key missing. Add STRIPE_SECRET_KEY to .env.');
  }
  const priceId = getStripePriceId(tier, cycle);
  if (!priceId) {
    throw new Error(
      `Stripe price not configured for ${tier} ${cycle}. Add STRIPE_PRICE_ID_${tier}_${cycle} to .env.`,
    );
  }
}

export async function createStripeCheckoutSession(
  sub: ISubscription,
  customerEmail?: string,
): Promise<StripeCheckoutResult> {
  assertStripeReady(sub.tier, sub.billingCycle);

  const priceId = getStripePriceId(sub.tier, sub.billingCycle);
  const mongoId = sub._id?.toString() ?? '';

  const params: Record<string, string> = {
    mode:                                 'subscription',
    'line_items[0][price]':               priceId,
    'line_items[0][quantity]':            '1',
    'metadata[subscriptionId]':           mongoId,
    'metadata[userId]':                     sub.userId,
    'metadata[tier]':                       sub.tier,
    'metadata[billingCycle]':               sub.billingCycle,
    'subscription_data[metadata][subscriptionId]': mongoId,
    'subscription_data[metadata][userId]':         sub.userId,
    success_url:                          `${appUrl()}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:                           `${appUrl()}/subscription/cancelled`,
    client_reference_id:                  mongoId,
  };

  if (customerEmail) {
    params.customer_email = customerEmail;
  }

  const session = await stripePost<{ id: string; url: string }>(
    '/checkout/sessions',
    params,
  );

  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $set: {
      provider:      PaymentProvider.STRIPE,
      providerSubId: session.id,
    },
  });

  return { sessionId: session.id, checkoutUrl: session.url };
}

export function verifyStripeWebhookSignature(rawBody: string, sigHeader: string): boolean {
  const secret = ENV.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;

  const parts = sigHeader.split(',').map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2) ?? '';
  const signatures = parts
    .filter((p) => p.startsWith('v1='))
    .map((p) => p.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

type StripeEvent = {
  type: string;
  data: { object: Record<string, unknown> };
};

export async function processStripeWebhookEvent(event: StripeEvent): Promise<void> {
  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(obj);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(obj);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(obj);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePayment(obj, SubscriptionStatus.ACTIVE);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePayment(obj, SubscriptionStatus.PAUSED);
      break;
    default:
      break;
  }
}

async function handleCheckoutCompleted(session: Record<string, unknown>): Promise<void> {
  const mongoId =
    (session.metadata as Record<string, string> | undefined)?.subscriptionId
    ?? (session.client_reference_id as string | undefined);

  if (!mongoId) return;

  const stripeSubId = session.subscription as string | undefined;
  const stripeCustomerId = session.customer as string | undefined;
  const paymentStatus = session.payment_status as string | undefined;

  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') return;

  await activateStripeSubscription(mongoId, stripeSubId ?? null, stripeCustomerId ?? null);
}

async function handleSubscriptionUpdated(sub: Record<string, unknown>): Promise<void> {
  const stripeSubId = sub.id as string;
  const mongoId = (sub.metadata as Record<string, string> | undefined)?.subscriptionId;

  const status = sub.status as string;
  const statusMap: Record<string, SubscriptionStatus> = {
    active:            SubscriptionStatus.ACTIVE,
    trialing:          SubscriptionStatus.ACTIVE,
    past_due:          SubscriptionStatus.PAUSED,
    unpaid:            SubscriptionStatus.PAUSED,
    canceled:          SubscriptionStatus.CANCELLED,
    incomplete:        SubscriptionStatus.PENDING,
    incomplete_expired: SubscriptionStatus.EXPIRED,
    paused:            SubscriptionStatus.PAUSED,
  };

  const mapped = statusMap[status] ?? SubscriptionStatus.PENDING;
  const periodStart = sub.current_period_start as number | undefined;
  const periodEnd = sub.current_period_end as number | undefined;
  const customerId = sub.customer as string | undefined;

  const update: Record<string, unknown> = {
    status:     mapped,
    provider:   PaymentProvider.STRIPE,
    providerSubId: stripeSubId,
    ...(customerId && { providerCustomerId: customerId }),
    ...(periodStart && { currentPeriodStart: new Date(periodStart * 1000) }),
    ...(periodEnd && { currentPeriodEnd: new Date(periodEnd * 1000) }),
    ...(mapped === SubscriptionStatus.CANCELLED && { cancelledAt: new Date() }),
  };

  if (mongoId) {
    await SubscriptionModel.findByIdAndUpdate(mongoId, { $set: update });
    return;
  }

  await SubscriptionModel.findOneAndUpdate(
    { providerSubId: stripeSubId, provider: PaymentProvider.STRIPE },
    { $set: update },
  );
}

async function handleSubscriptionDeleted(sub: Record<string, unknown>): Promise<void> {
  const stripeSubId = sub.id as string;
  await SubscriptionModel.findOneAndUpdate(
    { providerSubId: stripeSubId, provider: PaymentProvider.STRIPE },
    { $set: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() } },
  );
}

async function handleInvoicePayment(
  invoice: Record<string, unknown>,
  status: SubscriptionStatus,
): Promise<void> {
  const stripeSubId = invoice.subscription as string | undefined;
  if (!stripeSubId) return;

  const periodStart = invoice.period_start as number | undefined;
  const periodEnd = invoice.period_end as number | undefined;

  await SubscriptionModel.findOneAndUpdate(
    { providerSubId: stripeSubId, provider: PaymentProvider.STRIPE },
    {
      $set: {
        status,
        ...(periodStart && { currentPeriodStart: new Date(periodStart * 1000) }),
        ...(periodEnd && { currentPeriodEnd: new Date(periodEnd * 1000) }),
      },
    },
  );
}

async function activateStripeSubscription(
  mongoSubscriptionId: string,
  stripeSubscriptionId: string | null,
  stripeCustomerId: string | null,
): Promise<void> {
  const sub = await SubscriptionModel.findById(mongoSubscriptionId);
  if (!sub) return;

  let periodStart = sub.currentPeriodStart ?? new Date();
  let periodEnd = sub.currentPeriodEnd ?? new Date();

  if (stripeSubscriptionId) {
    try {
      const stripeSub = await stripeGet<{
        current_period_start: number;
        current_period_end:   number;
      }>(`/subscriptions/${stripeSubscriptionId}`);

      periodStart = new Date(stripeSub.current_period_start * 1000);
      periodEnd   = new Date(stripeSub.current_period_end * 1000);
    } catch {
      // Keep MongoDB period estimates if Stripe fetch fails
    }
  }

  await SubscriptionModel.findByIdAndUpdate(mongoSubscriptionId, {
    $set: {
      status:             SubscriptionStatus.ACTIVE,
      provider:           PaymentProvider.STRIPE,
      ...(stripeSubscriptionId && { providerSubId: stripeSubscriptionId }),
      ...(stripeCustomerId && { providerCustomerId: stripeCustomerId }),
      currentPeriodStart: periodStart,
      currentPeriodEnd:   periodEnd,
    },
  });

  if (sub.tier === SubscriptionTier.PELAJAR) {
    await convertPencarianToPelajar(sub.userId);
  }
}

export async function confirmStripeCheckoutSession(
  checkoutSessionId: string,
  userId: string,
): Promise<{ activated: boolean; tier?: string; message: string }> {
  if (!ENV.STRIPE_ENABLED || !ENV.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not enabled yet.');
  }

  const session = await stripeGet<{
    id: string;
    payment_status: string;
    subscription: string | null;
    customer: string | null;
    metadata: Record<string, string>;
    client_reference_id: string | null;
  }>(`/checkout/sessions/${checkoutSessionId}`);

  const mongoId = session.metadata?.subscriptionId ?? session.client_reference_id;
  if (!mongoId) {
    return { activated: false, message: 'Checkout session has no subscription reference.' };
  }

  const sub = await SubscriptionModel.findById(mongoId);
  if (!sub) {
    return { activated: false, message: 'Subscription record not found.' };
  }

  if (sub.userId !== userId) {
    return { activated: false, message: 'This checkout belongs to another account.' };
  }

  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { activated: false, message: 'Payment not completed yet.' };
  }

  await activateStripeSubscription(mongoId, session.subscription, session.customer);

  const updated = await SubscriptionModel.findById(mongoId);
  return {
    activated: true,
    tier:        updated?.tier,
    message:     'Subscription activated. Welcome to your new plan with ADAM.',
  };
}
