/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Server Routes (Layer 2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { getTokenUser, requireAdamUser } from '../../middleware/auth.middleware';
import { detectRegionFromHeaders } from '../../subscriptions/region-detector.service';
import { LAYER1_PLATFORM, ADAM_SERVER_CATALOG } from '../../adam-servers/adam-server-pricing.config';
import {
  getUserServerStatuses,
  isLayer2Open,
} from '../../adam-servers/adam-server-access.service';
import { createAdamServerCheckoutSession } from '../../adam-servers/adam-server-stripe.service';
import { listAdamGuruStripeCatalogForDashboard } from '../../adam-servers/adam-server-stripe.config';
import { AdamServerId, AdamServerTier } from '../../adam-servers/adam-server.types';
import { getStripeGatewayStatus } from '../../subscriptions/stripe-gateway.service';
import { ENV } from '../../config/environments';
import { guestLifetimeLimit } from '../../freemium/adam-freemium-guest.service';
import { freeRollingLimit, rollingWindowHours } from '../../freemium/adam-freemium-rolling.service';

const router = new Hono();

// GET /api/adam/servers/pricing — public catalog
router.get('/pricing', (c) => {
  const region = detectRegionFromHeaders(c.req.raw.headers);
  const layer2Open = isLayer2Open();

  return c.json({
    success: true,
    region,
    layer1: {
      layer:          1,
      open:           true,
      guestLimit:     ENV.ADAM_FREEMIUM_ENABLED ? guestLifetimeLimit() : 3,
      pencarianRolling: ENV.ADAM_FREEMIUM_ENABLED ? freeRollingLimit() : 4,
      rollingWindowHours: ENV.ADAM_FREEMIUM_ENABLED ? rollingWindowHours() : 5,
      rule:           LAYER1_PLATFORM.rule,
    },
    layer2: {
      layer:       2,
      open:        layer2Open,
      enabled:     layer2Open,
      testingNote: layer2Open
        ? null
        : 'Server dalam ujian dalaman — langganan dibuka selepas ujian penuh.',
      noBundle:    true,
      currency:    'MYR',
      servers:     ADAM_SERVER_CATALOG,
    },
    checkout: {
      wired:      getStripeGatewayStatus().configured,
      comingSoon: !getStripeGatewayStatus().configured,
      guru:       listAdamGuruStripeCatalogForDashboard(),
    },
  });
});

// GET /api/adam/servers/stripe-catalog — ADAMGuru prices to create in Stripe Dashboard
router.get('/stripe-catalog', (c) => {
  const stripe = getStripeGatewayStatus();
  return c.json({
    success: true,
    currency: 'MYR',
    interval: 'month',
    stripe,
    prices: listAdamGuruStripeCatalogForDashboard(),
    docs:     'alm-backend/docs/STRIPE_ADAMGURU_PRICES.md',
  });
});

// GET /api/adam/servers/status — authenticated user server subs
router.get('/status', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const servers = await getUserServerStatuses(user.userId);

  return c.json({
    success: true,
    layer1: {
      open: true,
      chatOnly: true,
    },
    layer2: {
      open:    isLayer2Open(),
      enabled: isLayer2Open(),
      servers,
    },
  });
});

// POST /api/adam/servers/subscribe — Stripe Checkout (ADAMGuru wired)
router.post('/subscribe', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const body = await c.req.json().catch(() => ({})) as {
    serverId?: string;
    tier?:     string;
  };

  if (!isLayer2Open()) {
    return c.json({
      success: false,
      error:   'Layer 2 servers are in internal testing. Subscriptions open after full QA.',
      code:    'LAYER2_TESTING',
      plansUrl: '/plans',
    }, 503);
  }

  const serverId = body.serverId?.toUpperCase();
  if (!serverId || !Object.values(AdamServerId).includes(serverId as AdamServerId)) {
    return c.json({ success: false, error: 'serverId must be JURNAL, BUKU, KOD, or GURU.' }, 400);
  }

  if (serverId !== AdamServerId.GURU) {
    return c.json({
      success:    false,
      error:      'Stripe checkout for this server is coming soon. ADAMGuru is available first.',
      code:       'CHECKOUT_COMING_SOON',
      serverId,
      plansUrl:   '/pricing/packages',
      comingSoon: true,
    }, 503);
  }

  const tierRaw = (body.tier ?? 'STARTER').toUpperCase();
  const allowedTiers = [
    AdamServerTier.STARTER,
    AdamServerTier.PROFESSIONAL,
    AdamServerTier.INSTITUTION,
    AdamServerTier.STUDENT_KELAS,
  ];
  if (!allowedTiers.includes(tierRaw as AdamServerTier)) {
    return c.json({
      success: false,
      error:   'tier must be STARTER, PROFESSIONAL, INSTITUTION, or STUDENT_KELAS.',
    }, 400);
  }

  try {
    const checkout = await createAdamServerCheckoutSession({
      userId:   user.userId ?? '',
      serverId: AdamServerId.GURU,
      tier:     tierRaw as AdamServerTier,
    });
    return c.json({
      success:     true,
      serverId,
      tier:        tierRaw,
      checkoutUrl: checkout.checkoutUrl,
      sessionId:   checkout.sessionId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.';
    return c.json({ success: false, error: msg, code: 'STRIPE_CHECKOUT_FAILED' }, 503);
  }
});

export default router;
