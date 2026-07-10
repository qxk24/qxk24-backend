/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D & Applied Science Routes
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

import { Hono } from 'hono';
import { getTokenUser, requireAdamUser } from '../../middleware/auth.middleware';
import { getStripeGatewayStatus } from '../../subscriptions/stripe-gateway.service';
import { ENV } from '../../config/environments';
import { listRdStripeCatalogForApi, parseRdAppliedSku } from '../../rd-applied/rd-stripe.config';
import { createRdAppliedCheckoutSession, confirmRdStripeCheckoutSession } from '../../rd-applied/rd-stripe.service';
import { RdSubscriptionModel, type IRdSubscription } from '../../rd-applied/rd-subscription.schema';
import { RdSubscriptionStatus } from '../../rd-applied/rd-applied.types';
import type { RdCategory, RdLegalAck } from '../../rd-applied/rd-applied.types';

const router = new Hono();

router.get('/pricing', (c) => {
  const stripe = getStripeGatewayStatus();
  const paymentWired = ENV.STRIPE_ENABLED && stripe.enabled && stripe.configured;
  const plans = listRdStripeCatalogForApi();

  return c.json({
    success: true,
    productLine: 'rd_applied',
    currency:    'USD',
    interval:    'year',
    payment: {
      stripe,
      wired:      paymentWired,
      comingSoon: !paymentWired,
    },
    plans,
    pool: {
      sku:     'RD-POOL-10',
      annualUsd: 35000,
      selfServe: false,
      contact: 'enterprise@alamtologi.com',
    },
    docs: {
      commercial: '/rd/commercial',
      register:   '/rd/register',
      terms:      '/rd/terms',
    },
  });
});

router.get('/me', requireAdamUser, async (c) => {
  try {
    const userId = getTokenUser(c)!.userId;
    const subs = await RdSubscriptionModel.find({
      userId,
      status: { $in: [RdSubscriptionStatus.ACTIVE, RdSubscriptionStatus.PENDING] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<IRdSubscription[]>();

    return c.json({
      success: true,
      subscriptions: subs.map((s) => ({
        id:               s._id,
        sku:              s.sku,
        status:           s.status,
        rdCategory:       s.rdCategory,
        projectFocus:     s.projectFocus,
        packId:           s.packId,
        graduatePhase:    s.graduatePhase,
        currentPeriodEnd: s.currentPeriodEnd,
        amountUsd:        s.amountUsd,
      })),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.post('/checkout', requireAdamUser, async (c) => {
  const stripe = getStripeGatewayStatus();
  const paymentWired = ENV.STRIPE_ENABLED && stripe.enabled && stripe.configured;
  if (!paymentWired) {
    return c.json({
      success:    false,
      error:      'R&D checkout coming soon. Review plans at /rd/commercial.',
      comingSoon: true,
    }, 503);
  }

  const body = await c.req.json().catch(() => ({})) as {
    sku?:            string;
    rdCategory?:     RdCategory | string;
    projectFocus?:   string;
    packId?:         string;
    labAdminEmail?:  string;
    eduEmail?:       string;
    customerEmail?:  string;
    legalAck?:       Partial<RdLegalAck>;
  };

  const sku = parseRdAppliedSku(body.sku);
  if (!sku) {
    return c.json({
      success: false,
      error:   'sku is required — see GET /api/rd/pricing for valid IDs.',
    }, 400);
  }

  const user = getTokenUser(c)!;

  try {
    const checkout = await createRdAppliedCheckoutSession({
      userId:        user.userId,
      customerEmail: body.customerEmail,
      checkout: {
        sku,
        rdCategory:    body.rdCategory,
        projectFocus:  body.projectFocus,
        packId:        body.packId,
        labAdminEmail: body.labAdminEmail,
        eduEmail:      body.eduEmail,
        legalAck:      body.legalAck,
      },
    });

    return c.json({
      success:            true,
      sku,
      checkoutUrl:        checkout.checkoutUrl,
      sessionId:          checkout.sessionId,
      rdSubscriptionId:   checkout.rdSubscriptionId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.';
    return c.json({ success: false, error: msg, code: 'RD_STRIPE_CHECKOUT_FAILED' }, 400);
  }
});

router.get('/stripe/confirm', requireAdamUser, async (c) => {
  const sessionId = c.req.query('session_id');
  if (!sessionId) {
    return c.json({ error: 'session_id is required.' }, 400);
  }

  try {
    const result = await confirmRdStripeCheckoutSession(sessionId, getTokenUser(c)!.userId);
    return c.json(result);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

export default router;
