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
import { AdamServerId } from '../../adam-servers/adam-server.types';
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
      pencarianRolling: ENV.ADAM_FREEMIUM_ENABLED ? freeRollingLimit() : 6,
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
      wired:      false,
      comingSoon: true,
    },
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

// POST /api/adam/servers/subscribe — stub until Stripe wired
router.post('/subscribe', requireAdamUser, async (c) => {
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
    return c.json({ success: false, error: 'serverId must be JURNAL, BUKU, or KOD.' }, 400);
  }

  return c.json({
    success:    false,
    error:      'Server checkout is being finalised.',
    code:       'CHECKOUT_COMING_SOON',
    serverId,
    tier:       body.tier ?? 'STARTER',
    plansUrl:   '/plans',
    comingSoon: true,
  }, 503);
});

export default router;
