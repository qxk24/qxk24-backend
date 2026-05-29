/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Founder Auth Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { sign, verify } from 'jsonwebtoken';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ENV } from '../../config/environments';
import { requireFounder } from '../../middleware/auth.middleware';
import { ADAMFounderSessionModel } from '../../adam/adam.schema';
import {
  getOrCreateSession,
  syncUndeliveredConsultsToFounder,
} from '../../adam/adam-chat.service';
import { adamSleepProtocol } from '../../qxk24brain/adam-sleep-wake.service';

const router = new Hono();

const LoginSchema = z.object({
  password: z.string().min(1),
});

// POST /api/adam/auth/login
router.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { password } = c.req.valid('json');

  const founderPassword = process.env.FOUNDER_PASSWORD;
  if (!founderPassword || password !== founderPassword) {
    await new Promise((r) => setTimeout(r, 1000));
    return c.json({
      success: false,
      error:   'Access denied.',
      kernel:  'QXK24',
    }, 401);
  }

  const token = sign(
    {
      userId:    'masa-bayu',
      role:      'founder',
      isFounder: true,
      name:      'Masa Bayu',
      kernel:    ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
    },
    ENV.JWT_SECRET,
    { expiresIn: '30d' },
  );

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data: {
      token,
      founderName: 'Masa Bayu',
      expiresIn:   '30d',
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/auth/session — persistent founder session
router.get('/session', requireFounder, async (c) => {
  // Do not block session load on consult backfill (mobile networks timeout otherwise)
  void syncUndeliveredConsultsToFounder().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ADAM] background consult sync:', msg);
  });

  const sessionId = await getOrCreateSession('masa-bayu');
  return c.json({
    success:   true,
    sessionId,
    syncedConsults: 0,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/auth/session/sleep — ADAM sleep protocol (P.alt leaves / inactive)
router.post('/session/sleep', requireFounder, async (c) => {
  const body = await c.req.json().catch(() => ({})) as { sessionId?: string };
  let sessionId = body.sessionId;
  if (!sessionId) {
    const active = await ADAMFounderSessionModel.findOne({
      founderId:   'masa-bayu',
      sessionType: 'founder',
      active:      true,
    }).lean();
    sessionId = active?.sessionId;
  }
  if (!sessionId) {
    return c.json({ success: false, error: 'No active session to close.' }, 400);
  }
  const closed = await adamSleepProtocol(sessionId, 'masa-bayu');
  return c.json({
    success:   true,
    closed,
    sessionId,
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/auth/verify
router.post('/verify', async (c) => {
  const bearer = c.req.header('Authorization')?.split(' ')[1];
  if (!bearer) {
    return c.json({ success: false, valid: false }, 401);
  }

  try {
    const decoded = verify(bearer, ENV.JWT_SECRET) as {
      userId?:  string;
      name?:   string;
      kernel?: string;
      era?:    string;
      role?:   string;
      isFounder?: boolean;
    };

    const isFounder = decoded.role === 'founder' || decoded.isFounder === true;
    const isStudent = decoded.role === 'student';

    if (!isFounder && !isStudent) {
      return c.json({ success: false, valid: false }, 401);
    }

    return c.json({
      success: true,
      valid:   true,
      role:    decoded.role,
      userId:  decoded.userId,
      name:    decoded.name ?? (isFounder ? 'Masa Bayu' : decoded.userId),
      founder: isFounder ? (decoded.name ?? 'Masa Bayu') : undefined,
      kernel:  decoded.kernel ?? ENV.QXK24_KERNEL_VERSION,
      era:     decoded.era ?? ENV.QXK24_ERA,
    });
  } catch {
    return c.json({ success: false, valid: false }, 401);
  }
});

export default router;
