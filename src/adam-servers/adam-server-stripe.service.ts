/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Server Stripe Checkout (Layer 2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
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
import { malaysiaDateKey } from '../freemium/adam-freemium-date';
import {
  getAdamGuruStripePriceDef,
  getAdamServerStripePriceId,
} from './adam-server-stripe.config';
import {
  AdamServerSubscriptionModel,
  AdamServerSubscriptionStatus,
} from './adam-server.schema';
import { AdamServerId, AdamServerTier } from './adam-server.types';
import { getServerCatalogEntry } from './adam-server-pricing.config';

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

function guruMonthlyLimit(tier: AdamServerTier): number {
  const def = getAdamGuruStripePriceDef(tier);
  if (tier === AdamServerTier.STUDENT_KELAS) return 0;
  return def?.studentSeats ?? 0;
}

export async function createAdamServerCheckoutSession(input: {
  userId:        string;
  customerEmail?: string;
  serverId:      AdamServerId;
  tier:          AdamServerTier;
}): Promise<StripeCheckoutResult> {
  assertStripeReady();

  if (input.serverId !== AdamServerId.GURU) {
    throw new Error('Stripe checkout is wired for ADAMGuru first. Other servers coming soon.');
  }

  getServerCatalogEntry(input.serverId);

  const priceId = getAdamServerStripePriceId(input.serverId, input.tier);
  if (!priceId) {
    const def = getAdamGuruStripePriceDef(input.tier);
    throw new Error(
      `Stripe price not configured. Add ${def?.envKey ?? 'STRIPE_PRICE_ID_GURU_*'} to backend .env.`,
    );
  }

  const def = getAdamGuruStripePriceDef(input.tier)!;
  const periodKey = malaysiaDateKey();

  await AdamServerSubscriptionModel.findOneAndUpdate(
    { userId: input.userId, serverId: input.serverId },
    {
      $set: {
        userId:        input.userId,
        serverId:      input.serverId,
        tier:          input.tier,
        status:        AdamServerSubscriptionStatus.PENDING,
        monthlyLimit:  guruMonthlyLimit(input.tier),
        usedThisMonth: 0,
        periodKey,
      },
    },
    { upsert: true },
  );

  const params: Record<string, string> = {
    mode:                       'subscription',
    'line_items[0][price]':     priceId,
    'line_items[0][quantity]':  '1',
    success_url:                `${appUrl()}/subscription/success?session_id={CHECKOUT_SESSION_ID}&server=guru`,
    cancel_url:                 `${appUrl()}/subscription/cancelled?server=guru`,
    client_reference_id:        `${input.userId}:${input.serverId}:${input.tier}`,
    billing_address_collection: 'auto',
    'metadata[checkoutType]':   'adam_server',
    'metadata[userId]':         input.userId,
    'metadata[serverId]':       input.serverId,
    'metadata[tier]':           input.tier,
    'metadata[sku]':            def.sku,
    'subscription_data[metadata][checkoutType]': 'adam_server',
    'subscription_data[metadata][userId]':       input.userId,
    'subscription_data[metadata][serverId]':    input.serverId,
    'subscription_data[metadata][tier]':        input.tier,
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

export async function activateAdamServerFromStripeCheckout(
  session: Record<string, unknown>,
): Promise<boolean> {
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== 'adam_server') return false;

  const userId = meta.userId?.trim();
  const serverId = meta.serverId?.trim().toUpperCase() as AdamServerId;
  const tier = meta.tier?.trim().toUpperCase() as AdamServerTier;
  const paymentStatus = session.payment_status as string | undefined;

  if (!userId || !serverId || !tier) return false;
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') return false;

  const periodKey = malaysiaDateKey();
  await AdamServerSubscriptionModel.findOneAndUpdate(
    { userId, serverId },
    {
      $set: {
        userId,
        serverId,
        tier,
        status:        AdamServerSubscriptionStatus.ACTIVE,
        monthlyLimit:  guruMonthlyLimit(tier),
        usedThisMonth: 0,
        periodKey,
      },
    },
    { upsert: true },
  );

  return true;
}
