/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Stripe Gateway Service
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
import { notifySubscriptionActivated } from './subscription-welcome-mail.service';
import { ENV } from '../config/environments';
import { toStripeUnitAmount, stripeSecondsToDate, validDateOrNull, computeBillingPeriodEnd, stripeResourceId } from './stripe-currency';

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
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
}

/** Stripe Checkout appearance — ADAM / Alamtologi handoff (hosted page). */
function buildCheckoutBrandingParams(): Record<string, string> {
  const logoUrl = `${appUrl()}/adam.png`;
  return {
    'branding_settings[display_name]':     'ADAM · Alamtologi',
    'branding_settings[button_color]':    '#2563eb',
    'branding_settings[background_color]': '#fafafa',
    'branding_settings[font_family]':     'inter',
    'branding_settings[logo][type]':       'url',
    'branding_settings[logo][url]':        logoUrl,
    'custom_text[submit][message]':        'Start your journey with deeper memory.',
  };
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

function tierCheckoutLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case SubscriptionTier.PELAJAR:
      return 'ADAM Premium';
    case SubscriptionTier.PROFESIONAL:
      return 'ADAM Profesional';
    default:
      return 'ADAM Subscription';
  }
}

function recurringInterval(cycle: BillingCycle): 'month' | 'year' {
  return cycle === BillingCycle.ANNUAL ? 'year' : 'month';
}

/** Build Checkout line item from subscription regional amount (all countries). */
function buildRegionalLineItemParams(sub: ISubscription): Record<string, string> {
  const currency = (sub.currency || 'USD').toLowerCase();
  const amount = sub.amountPerCycle ?? 0;
  const unitAmount = toStripeUnitAmount(amount, currency);
  if (unitAmount < 1) {
    throw new Error(`Invalid checkout amount for ${currency}: ${amount}`);
  }

  const interval = recurringInterval(sub.billingCycle);
  const label = tierCheckoutLabel(sub.tier);
  const cycleLabel = interval === 'year' ? 'Annual' : 'Monthly';

  return {
    'line_items[0][quantity]':                              '1',
    'line_items[0][price_data][currency]':                  currency,
    'line_items[0][price_data][unit_amount]':               String(unitAmount),
    'line_items[0][price_data][recurring][interval]':        interval,
    'line_items[0][price_data][recurring][interval_count]':  '1',
    'line_items[0][price_data][product_data][name]':         label,
    'line_items[0][price_data][product_data][description]': `${label} — ${cycleLabel} subscription`,
  };
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

  return {
    enabled:        ENV.STRIPE_ENABLED,
    configured:     missing.length === 0,
    publishableKey: ENV.STRIPE_PUBLISHABLE_KEY || null,
    missing,
  };
}

export function assertStripeReady(): void {
  const status = getStripeGatewayStatus();
  if (!status.enabled) {
    throw new Error(
      'Stripe is not enabled yet. Set STRIPE_ENABLED=true in backend .env when ready.',
    );
  }
  if (!ENV.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key missing. Add STRIPE_SECRET_KEY to .env.');
  }
}

export async function createStripeCheckoutSession(
  sub: ISubscription,
  customerEmail?: string,
): Promise<StripeCheckoutResult> {
  assertStripeReady();

  const mongoId = sub._id?.toString() ?? '';
  const lineItem = buildRegionalLineItemParams(sub);

  const params: Record<string, string> = {
    mode:                                 'subscription',
    ...lineItem,
    ...buildCheckoutBrandingParams(),
    'metadata[subscriptionId]':           mongoId,
    'metadata[userId]':                   sub.userId,
    'metadata[tier]':                     sub.tier,
    'metadata[billingCycle]':             sub.billingCycle,
    'metadata[region]':                   sub.region ?? '',
    'metadata[currency]':                 sub.currency ?? '',
    'metadata[amountPerCycle]':           String(sub.amountPerCycle ?? 0),
    'subscription_data[metadata][subscriptionId]': mongoId,
    'subscription_data[metadata][userId]':         sub.userId,
    'subscription_data[metadata][region]':         sub.region ?? '',
    success_url:                          `${appUrl()}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:                           `${appUrl()}/subscription/cancelled`,
    client_reference_id:                  mongoId,
    billing_address_collection:           'auto',
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

  const stripeSubId = stripeResourceId(session.subscription);
  const stripeCustomerId = stripeResourceId(session.customer);
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
  const periodStart = stripeSecondsToDate(sub.current_period_start);
  const periodEnd = stripeSecondsToDate(sub.current_period_end);
  const customerId = stripeResourceId(sub.customer);

  const update: Record<string, unknown> = {
    status:     mapped,
    provider:   PaymentProvider.STRIPE,
    providerSubId: stripeSubId,
    ...(customerId && { providerCustomerId: customerId }),
    ...(periodStart && { currentPeriodStart: periodStart }),
    ...(periodEnd && { currentPeriodEnd: periodEnd }),
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
  const stripeSubId = stripeResourceId(invoice.subscription);
  if (!stripeSubId) return;

  const periodStart = stripeSecondsToDate(invoice.period_start);
  const periodEnd = stripeSecondsToDate(invoice.period_end);

  await SubscriptionModel.findOneAndUpdate(
    { providerSubId: stripeSubId, provider: PaymentProvider.STRIPE },
    {
      $set: {
        status,
        ...(periodStart && { currentPeriodStart: periodStart }),
        ...(periodEnd && { currentPeriodEnd: periodEnd }),
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

  const wasActive = sub.status === SubscriptionStatus.ACTIVE;

  let periodStart =
    validDateOrNull(sub.currentPeriodStart)
    ?? new Date();
  let periodEnd =
    validDateOrNull(sub.currentPeriodEnd)
    ?? computeBillingPeriodEnd(periodStart, sub.billingCycle);

  const resolvedStripeSubId = stripeResourceId(stripeSubscriptionId);
  if (resolvedStripeSubId) {
    try {
      const stripeSub = await stripeGet<Record<string, unknown>>(
        `/subscriptions/${resolvedStripeSubId}`,
      );

      const parsedStart = stripeSecondsToDate(stripeSub.current_period_start);
      const parsedEnd = stripeSecondsToDate(stripeSub.current_period_end);

      if (parsedStart) periodStart = parsedStart;
      if (parsedEnd) {
        periodEnd = parsedEnd;
      } else if (parsedStart) {
        periodEnd = computeBillingPeriodEnd(parsedStart, sub.billingCycle);
      }
    } catch {
      // Keep MongoDB period estimates if Stripe fetch fails
    }
  }

  if (!validDateOrNull(periodEnd)) {
    periodEnd = computeBillingPeriodEnd(periodStart, sub.billingCycle);
  }

  await SubscriptionModel.findByIdAndUpdate(mongoSubscriptionId, {
    $set: {
      status:             SubscriptionStatus.ACTIVE,
      provider:           PaymentProvider.STRIPE,
      ...(resolvedStripeSubId && { providerSubId: resolvedStripeSubId }),
      ...(stripeResourceId(stripeCustomerId) && {
        providerCustomerId: stripeResourceId(stripeCustomerId)!,
      }),
      currentPeriodStart: periodStart,
      currentPeriodEnd:   periodEnd,
    },
  });

  if (sub.tier === SubscriptionTier.PELAJAR) {
    await convertPencarianToPelajar(sub.userId);
  }

  if (!wasActive) {
    const updated = await SubscriptionModel.findById(mongoSubscriptionId);
    if (updated) {
      void notifySubscriptionActivated(updated).catch((err) => {
        console.warn('[subscription:mail] welcome failed', err);
      });
    }
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

  await activateStripeSubscription(
    mongoId,
    stripeResourceId(session.subscription),
    stripeResourceId(session.customer),
  );

  const updated = await SubscriptionModel.findById(mongoId);
  return {
    activated: true,
    tier:        updated?.tier,
    message:     'Subscription activated. Welcome to your new plan with ADAM.',
  };
}
