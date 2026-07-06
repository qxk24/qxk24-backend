/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Routes
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

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getTokenUser, requireAdamUser } from '../../middleware/auth.middleware';
import { getStripeGatewayStatus } from '../../subscriptions/stripe-gateway.service';
import { ADAM_STREAM_PAID_PLANS } from '../../adam/stream/adam-stream.constants';
import { listAdamStreamStripeCatalogForDashboard } from '../../adam/stream/adam-stream-stripe.config';
import {
  createAdamStreamHostCheckoutSession,
  syncAdamStreamPaymentFromSession,
} from '../../adam/stream/adam-stream-stripe.service';
import { resolveAdamStreamSubscriptionMe } from '../../adam/stream/adam-stream-subscription.service';

const router = new Hono();

const CheckoutSchema = z.object({
  planId: z.enum(ADAM_STREAM_PAID_PLANS),
  billingCycle: z.enum(['monthly', 'annual']).default('annual'),
});

router.get('/pricing', (c) => {
  const stripe = getStripeGatewayStatus();
  return c.json({
    product:    'ADAM_STREAM',
    currency:   'USD',
    plans:      listAdamStreamStripeCatalogForDashboard(),
    stripe:     {
      enabled:    stripe.enabled,
      configured: stripe.configured,
    },
    enterprise: {
      planId:  'enterprise',
      contact: 'hello@qxk24.com',
      label:   'Contact ADAM sales — up to 1,000 participants',
    },
    free: {
      planId: 'percuma',
      label:  'Percuma — up to 100 participants · 60 min group meetings',
    },
  });
});

router.get('/subscription/me', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const me = await resolveAdamStreamSubscriptionMe(user);
  return c.json(me);
});

router.post('/checkout', requireAdamUser, zValidator('json', CheckoutSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');

  const result = await createAdamStreamHostCheckoutSession({
    userId:        user.userId,
    planId:        body.planId,
    billingCycle:  body.billingCycle,
  });

  return c.json({
    success:        true,
    checkoutUrl:    result.checkoutUrl,
    sessionId:      result.sessionId,
    subscriptionId: result.subscriptionId,
  });
});

router.post('/checkout/confirm', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const body = await c.req.json().catch(() => ({})) as { sessionId?: string };
  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return c.json({ success: false, message: 'sessionId is required.' }, 400);
  }

  const result = await syncAdamStreamPaymentFromSession(user.userId, sessionId);
  return c.json({ success: result.activated, ...result });
});

export default router;
