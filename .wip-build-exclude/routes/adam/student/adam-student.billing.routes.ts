/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Billing Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getTokenUser, requireStudent } from '../../../middleware/auth.middleware';
import {
  attachSubscriptionAccess,
  getSubscriptionAccess,
} from '../../../middleware/subscription-guard.middleware';
import {
  buildFreemiumStatusPayloadForUser,
  getStudentFreemiumStatus,
} from '../../../freemium/adam-freemium-gate.service';
import {
  getCreditWalletSnapshot,
  isCreditPurchaseWired,
  extraMessageCostCents,
  resolveCreditPack,
} from '../../../freemium/adam-freemium-credit.service';
import { createAdamCreditCheckoutSession } from '../../../freemium/adam-credit-stripe.service';
import { SubscriptionTier } from '../../../subscriptions/subscription.schema';
import { creditPacksForAccess } from './adam-student.helpers';
import { BuyCreditSchema } from './adam-student.schemas';

const router = new Hono();

router.get('/freemium-status', requireStudent, attachSubscriptionAccess, async (c) => {
  const user = getTokenUser(c)!;
  const access = getSubscriptionAccess(c);
  const status = await getStudentFreemiumStatus(user.userId, access);
  const packs  = creditPacksForAccess(access);

  return c.json({
    success: true,
    freemium: await buildFreemiumStatusPayloadForUser(user.userId, status),
    credits: {
      balance:      status.creditBalance,
      packs,
      pack:         packs[0],
      paymentWired: isCreditPurchaseWired(),
    },
    tier:    access?.tier ?? 'PENCARIAN',
    payment: { comingSoon: !isCreditPurchaseWired() },
    kernel:  'Alamtologi',
  });
});

router.get('/credits', requireStudent, attachSubscriptionAccess, async (c) => {
  const user = getTokenUser(c)!;
  const access = getSubscriptionAccess(c);
  const wallet = await getCreditWalletSnapshot(user.userId);
  const packs  = creditPacksForAccess(access);

  return c.json({
    success: true,
    wallet,
    packs,
    pack:             packs[0] ?? null,
    extraMessageCost: extraMessageCostCents() / 100,
    paymentWired:     isCreditPurchaseWired(),
    kernel:           'Alamtologi',
  });
});

router.post('/credits/buy', requireStudent, attachSubscriptionAccess, zValidator('json', BuyCreditSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const access = getSubscriptionAccess(c);
  const pack = resolveCreditPack(body.packId);

  if (!pack) {
    return c.json({ success: false, error: 'Unknown credit pack.' }, 400);
  }

  const allowed = creditPacksForAccess(access);
  if (!allowed.length || !allowed.some((p) => p.id === pack.id)) {
    return c.json({
      success: false,
      error:   access?.tier === SubscriptionTier.PRO || access?.tier === SubscriptionTier.PROFESIONAL
        ? 'Credit pack not available for your plan.'
        : 'Usage credits are available on Pro only. Upgrade at /pricing.',
    }, 403);
  }

  if (!isCreditPurchaseWired()) {
    return c.json({
      success:    false,
      comingSoon: true,
      error:      'Credit checkout is opening soon.',
      pack,
      packs:      allowed,
      creditsUrl: '/adam/credits',
      kernel:     'ALAMTOLOGI',
    }, 503);
  }

  try {
    const checkout = await createAdamCreditCheckoutSession({
      userId: user.userId ?? '',
      packId: pack.id,
    });
    return c.json({
      success:     true,
      checkoutUrl: checkout.checkoutUrl,
      sessionId:   checkout.sessionId,
      pack,
      kernel:      'ALAMTOLOGI',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Credit checkout failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 503);
  }
});

export default router;
