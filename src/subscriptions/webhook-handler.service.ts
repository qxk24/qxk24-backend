/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Webhook Handler Service
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

import crypto from 'crypto';
import type { Context } from 'hono';
import { SubscriptionModel, SubscriptionStatus, PaymentProvider } from './subscription.schema';
import { ENV } from '../config/environments';
import {
  verifyStripeWebhookSignature,
  processStripeWebhookEvent,
} from './stripe-gateway.service';

type SubscriptionEvent =
  | 'ACTIVATED'
  | 'CHARGED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'PAUSED'
  | 'RESUMED';

export async function handleRazorpayWebhook(c: Context): Promise<Response> {
  const signature = c.req.header('x-razorpay-signature') ?? '';
  const rawBody   = await c.req.text();
  const expected  = crypto
    .createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!ENV.RAZORPAY_WEBHOOK_SECRET || signature !== expected) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const body = JSON.parse(rawBody) as {
    event: string;
    payload?: { subscription?: { entity?: { id?: string } } };
  };

  const subscriptionId = body.payload?.subscription?.entity?.id;
  const eventMap: Record<string, SubscriptionEvent> = {
    'subscription.activated':      'ACTIVATED',
    'subscription.charged':        'CHARGED',
    'subscription.payment_failed': 'PAYMENT_FAILED',
    'subscription.cancelled':      'CANCELLED',
    'subscription.paused':         'PAUSED',
    'subscription.resumed':        'RESUMED',
  };

  const mapped = eventMap[body.event];
  if (mapped && subscriptionId) {
    await updateSubscriptionStatus(subscriptionId, mapped, PaymentProvider.RAZORPAY);
  }

  return c.json({ received: true });
}

export async function handleStripeWebhook(c: Context): Promise<Response> {
  if (!ENV.STRIPE_ENABLED) {
    return c.json({ error: 'Stripe gateway disabled' }, 503);
  }

  const sig     = c.req.header('stripe-signature') ?? '';
  const rawBody = await c.req.text();

  if (!ENV.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: 'Stripe webhook not configured' }, 503);
  }

  if (!verifyStripeWebhookSignature(rawBody, sig)) {
    return c.json({ error: 'Invalid Stripe signature' }, 400);
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: { object: Record<string, unknown> };
  };

  await processStripeWebhookEvent(event);

  return c.json({ received: true });
}

export async function handleXenditWebhook(c: Context): Promise<Response> {
  const token = c.req.header('x-callback-token');
  if (!ENV.XENDIT_CALLBACK_TOKEN || token !== ENV.XENDIT_CALLBACK_TOKEN) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = await c.req.json() as {
    event: string;
    data?: { plan_id?: string; reference_id?: string };
  };

  const planId = body.data?.plan_id ?? body.data?.reference_id;
  const eventMap: Record<string, SubscriptionEvent> = {
    'recurring.plan.activated':   'ACTIVATED',
    'recurring.cycle.succeeded':  'CHARGED',
    'recurring.cycle.failed':     'PAYMENT_FAILED',
    'recurring.plan.inactivated': 'CANCELLED',
    'recurring.plan.paused':      'PAUSED',
    'recurring.plan.reactivated': 'RESUMED',
  };

  const mapped = eventMap[body.event];
  if (mapped && planId) {
    await updateSubscriptionStatus(planId, mapped, PaymentProvider.XENDIT);
  }

  return c.json({ received: true });
}

export async function handlePaystackWebhook(c: Context): Promise<Response> {
  const rawBody = await c.req.text();
  const hash = crypto
    .createHmac('sha512', ENV.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  if (!ENV.PAYSTACK_SECRET_KEY || hash !== c.req.header('x-paystack-signature')) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const body = JSON.parse(rawBody) as {
    event: string;
    data?: { subscription_code?: string };
  };

  const subCode = body.data?.subscription_code;
  const eventMap: Record<string, SubscriptionEvent> = {
    'subscription.create':         'ACTIVATED',
    'charge.success':              'CHARGED',
    'invoice.payment_failed':      'PAYMENT_FAILED',
    'subscription.disable':        'CANCELLED',
    'subscription.expiring_cards': 'PAYMENT_FAILED',
  };

  const mapped = eventMap[body.event];
  if (mapped && subCode) {
    await updateSubscriptionStatus(subCode, mapped, PaymentProvider.PAYSTACK);
  }

  return c.json({ received: true });
}

async function updateSubscriptionStatus(
  providerSubId: string,
  event:         SubscriptionEvent,
  provider:      PaymentProvider,
): Promise<void> {
  const statusMap: Record<SubscriptionEvent, SubscriptionStatus> = {
    ACTIVATED:      SubscriptionStatus.ACTIVE,
    CHARGED:        SubscriptionStatus.ACTIVE,
    PAYMENT_FAILED: SubscriptionStatus.PAUSED,
    CANCELLED:      SubscriptionStatus.CANCELLED,
    PAUSED:         SubscriptionStatus.PAUSED,
    RESUMED:        SubscriptionStatus.ACTIVE,
  };

  const newStatus = statusMap[event];

  await SubscriptionModel.findOneAndUpdate(
    { providerSubId, provider },
    {
      $set: {
        status: newStatus,
        ...(newStatus === SubscriptionStatus.CANCELLED && { cancelledAt: new Date() }),
      },
    },
  );
}
