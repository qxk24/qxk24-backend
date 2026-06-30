/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Credit Stripe Checkout
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
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
import { PaymentProvider } from '../subscriptions/subscription.schema';
import {
  getPremiumCreditPacks,
  grantWalletCredits,
  resolveCreditPack,
  type CreditPackOffer,
} from './adam-freemium-credit.service';

const STRIPE_API = 'https://api.stripe.com/v1';

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
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }
  return data;
}

function checkoutBranding(): Record<string, string> {
  const logoUrl = `${appUrl()}/adam.png`;
  return {
    'branding_settings[display_name]':     'ADAM · Alamtologi',
    'branding_settings[button_color]':    '#2563eb',
    'branding_settings[background_color]': '#fafafa',
    'branding_settings[font_family]':     'inter',
    'branding_settings[logo][type]':       'url',
    'branding_settings[logo][url]':        logoUrl,
    'custom_text[submit][message]':        'Credits apply after your daily Pro allowance.',
  };
}

function stripePriceIdForPack(packId: string): string | null {
  const map: Record<string, string> = {
    'credits-10':   ENV.STRIPE_PRICE_ID_CREDITS_10,
    'credits-50':   ENV.STRIPE_PRICE_ID_CREDITS_50,
    'credits-200':  ENV.STRIPE_PRICE_ID_CREDITS_200,
    // Legacy pack ids — map to the current $200 / $50 prices.
    'credits-250':  ENV.STRIPE_PRICE_ID_CREDITS_200,
    'credits-1000': ENV.STRIPE_PRICE_ID_CREDITS_200,
    'premium-50':   ENV.STRIPE_PRICE_ID_CREDITS_50,
    'premium-250':  ENV.STRIPE_PRICE_ID_CREDITS_200,
    'premium-1000': ENV.STRIPE_PRICE_ID_CREDITS_200,
  };
  const id = map[packId]?.trim();
  return id || null;
}

function buildLineItem(pack: CreditPackOffer): Record<string, string> {
  const priceId = stripePriceIdForPack(pack.id);
  if (priceId) {
    return {
      'line_items[0][price]':    priceId,
      'line_items[0][quantity]': '1',
    };
  }
  return {
    'line_items[0][price_data][currency]':               pack.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]':             String(Math.round(pack.amount * 100)),
    'line_items[0][price_data][product_data][name]':      pack.label,
    'line_items[0][price_data][product_data][description]': pack.description,
    'line_items[0][quantity]':                            '1',
  };
}

export async function createAdamCreditCheckoutSession(input: {
  userId:         string;
  customerEmail?: string;
  packId:         string;
}): Promise<StripeCheckoutResult> {
  assertStripeReady();

  const pack = resolveCreditPack(input.packId);
  if (!pack) {
    throw new Error('Unknown credit pack.');
  }

  const params: Record<string, string> = {
    mode:                       'payment',
    ...buildLineItem(pack),
    ...checkoutBranding(),
    success_url:                `${appUrl()}/adam/credits?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:                 `${appUrl()}/adam/credits?cancelled=1`,
    client_reference_id:        input.userId,
    billing_address_collection: 'auto',
    'metadata[checkoutType]':   'adam_credits',
    'metadata[userId]':         input.userId,
    'metadata[packId]':         pack.id,
    'metadata[creditCents]':    String(pack.creditCents),
    'metadata[amountPaid]':     String(pack.amount),
    'metadata[currency]':     pack.currency,
  };

  if (input.customerEmail) {
    params.customer_email = input.customerEmail;
  }

  const session = await stripePost<{ id: string; url: string }>(
    '/checkout/sessions',
    params,
  );

  return { sessionId: session.id, checkoutUrl: session.url };
}

export async function activateAdamCreditsFromStripeCheckout(
  session: Record<string, unknown>,
): Promise<boolean> {
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== 'adam_credits') return false;

  const paymentStatus = session.payment_status as string | undefined;
  if (paymentStatus !== 'paid') return false;

  const userId = meta.userId?.trim();
  const packId = meta.packId?.trim();
  const creditCents = Number(meta.creditCents ?? 0);
  const amountPaid = Number(meta.amountPaid ?? 0);
  const currency = meta.currency ?? 'USD';
  const sessionId = String(session.id ?? '');

  if (!userId || !packId || !sessionId || creditCents <= 0) return false;

  const pack = resolveCreditPack(packId) ?? getPremiumCreditPacks().find((p) => p.id === packId);
  const cents = pack?.creditCents ?? creditCents;

  await grantWalletCredits({
    userId,
    creditCents:   cents,
    amountPaid:    pack?.amount ?? amountPaid,
    currency:      pack?.currency ?? currency,
    provider:      PaymentProvider.STRIPE,
    transactionId: sessionId,
    packId,
  });

  return true;
}
