/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D & Applied Science Stripe Checkout
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import {
  assertStripeReady,
  type StripeCheckoutResult,
} from '../subscriptions/stripe-gateway.service';
import { stripeResourceId } from '../subscriptions/stripe-currency';
import {
  RdAppliedSku,
  RdGraduatePhase,
  RdSubscriptionStatus,
} from './rd-applied.types';
import {
  getRdStripePriceDef,
  getRdStripePriceId,
} from './rd-stripe.config';
import {
  validateRdCheckoutInput,
  type RdCheckoutInput,
} from './rd-checkout.validation';
import { RdSubscriptionModel } from './rd-subscription.schema';

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

function buildCheckoutBrandingParams(): Record<string, string> {
  const logoUrl = `${appUrl()}/adam.png`;
  return {
    'branding_settings[display_name]':     'Alamtologi · R&D & Applied',
    'branding_settings[button_color]':    '#2563eb',
    'branding_settings[background_color]': '#fafafa',
    'branding_settings[font_family]':     'inter',
    'branding_settings[logo][type]':       'url',
    'branding_settings[logo][url]':        logoUrl,
    'custom_text[submit][message]':        'Annual research & product subscription.',
  };
}

export async function createRdAppliedCheckoutSession(input: {
  userId:        string;
  customerEmail?: string;
  checkout:      RdCheckoutInput;
}): Promise<StripeCheckoutResult & { rdSubscriptionId: string }> {
  assertStripeReady();

  const parsed = validateRdCheckoutInput(input.checkout);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  const sku = input.checkout.sku;
  const def = getRdStripePriceDef(sku);
  if (!def) {
    throw new Error(`Unknown R&D SKU: ${sku}`);
  }

  const priceId = getRdStripePriceId(sku);
  if (!priceId) {
    throw new Error(
      `Stripe price not configured. Add ${def.envKey} to backend .env.`,
    );
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const graduatePhase = (
    sku === RdAppliedSku.RD_GRAD_SOLO || sku === RdAppliedSku.RD_GRAD_EDU
  ) ? RdGraduatePhase.PHASE_0 : null;

  const record = await RdSubscriptionModel.create({
    userId:             input.userId,
    sku,
    status:             RdSubscriptionStatus.PENDING,
    rdCategory:         parsed.rdCategory,
    projectFocus:       parsed.projectFocus,
    packId:             parsed.packId,
    labAdminEmail:      parsed.labAdminEmail,
    eduEmail:           parsed.eduEmail,
    graduatePhase,
    legalAck:           parsed.legalAck,
    amountUsd:          def.annualUsd,
    currency:           'USD',
    currentPeriodStart: now,
    currentPeriodEnd:   periodEnd,
  });

  const mongoId = record._id.toString();
  const customerEmail = input.customerEmail?.trim()
    || parsed.eduEmail
    || undefined;

  const params: Record<string, string> = {
    mode:                       'subscription',
    'line_items[0][price]':     priceId,
    'line_items[0][quantity]':  '1',
    ...buildCheckoutBrandingParams(),
    success_url:                `${appUrl()}/subscription/success?session_id={CHECKOUT_SESSION_ID}&product=rd`,
    cancel_url:                 `${appUrl()}/rd/checkout?sku=${encodeURIComponent(sku)}&cancelled=1`,
    client_reference_id:        mongoId,
    billing_address_collection: 'auto',
    'metadata[checkoutType]':   'rd_applied',
    'metadata[rdSubscriptionId]': mongoId,
    'metadata[userId]':         input.userId,
    'metadata[sku]':            sku,
    ...(parsed.rdCategory ? { 'metadata[rdCategory]': parsed.rdCategory } : {}),
    ...(parsed.packId ? { 'metadata[packId]': parsed.packId } : {}),
    'subscription_data[metadata][checkoutType]':    'rd_applied',
    'subscription_data[metadata][rdSubscriptionId]': mongoId,
    'subscription_data[metadata][userId]':          input.userId,
    'subscription_data[metadata][sku]':             sku,
  };

  if (customerEmail) {
    params.customer_email = customerEmail;
  }

  const session = await stripePost<{ id: string; url: string }>(
    '/checkout/sessions',
    params,
  );

  await RdSubscriptionModel.findByIdAndUpdate(mongoId, {
    $set: { stripeSessionId: session.id },
  });

  return {
    sessionId:          session.id,
    checkoutUrl:        session.url,
    rdSubscriptionId:   mongoId,
  };
}

export async function activateRdFromStripeCheckout(
  session: Record<string, unknown>,
): Promise<boolean> {
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== 'rd_applied') return false;

  const mongoId = meta.rdSubscriptionId?.trim();
  const userId = meta.userId?.trim();
  const paymentStatus = session.payment_status as string | undefined;

  if (!mongoId || !userId) return false;
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') return false;

  const stripeSubId = stripeResourceId(session.subscription);
  const stripeCustomerId = stripeResourceId(session.customer);

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const sub = await RdSubscriptionModel.findById(mongoId);
  const categoryPatch =
    sub
    && !sub.rdCategory
    && (
      sub.sku === RdAppliedSku.BUNDLE_IND_AS_SOLO
      || sub.sku === RdAppliedSku.BUNDLE_IND_AS_LAB
    )
      ? { rdCategory: 'industry' as const }
      : {};

  await RdSubscriptionModel.findOneAndUpdate(
    { _id: mongoId, userId },
    {
      $set: {
        status:               RdSubscriptionStatus.ACTIVE,
        ...categoryPatch,
        ...(stripeSubId && { stripeSubscriptionId: stripeSubId }),
        ...(stripeCustomerId && { stripeCustomerId: stripeCustomerId }),
        currentPeriodStart:   periodStart,
        currentPeriodEnd:     periodEnd,
      },
    },
  );

  return true;
}

export async function confirmRdStripeCheckoutSession(
  checkoutSessionId: string,
  userId: string,
): Promise<{ activated: boolean; sku?: string; message: string }> {
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

  if (session.metadata?.checkoutType !== 'rd_applied') {
    return { activated: false, message: 'Not an R&D checkout session.' };
  }

  const mongoId = session.metadata?.rdSubscriptionId ?? session.client_reference_id;
  if (!mongoId) {
    return { activated: false, message: 'Checkout session has no R&D subscription reference.' };
  }

  const sub = await RdSubscriptionModel.findById(mongoId);
  if (!sub) {
    return { activated: false, message: 'R&D subscription record not found.' };
  }

  if (sub.userId !== userId) {
    return { activated: false, message: 'This checkout belongs to another account.' };
  }

  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { activated: false, message: 'Payment not completed yet.' };
  }

  await activateRdFromStripeCheckout({
    metadata:       session.metadata,
    payment_status: session.payment_status,
    subscription:   session.subscription,
    customer:       session.customer,
  });

  const updated = await RdSubscriptionModel.findById(mongoId);
  return {
    activated: true,
    sku:       updated?.sku,
    message:   'R&D & Applied Science subscription activated. Open ADAM Research or Applied session.',
  };
}
