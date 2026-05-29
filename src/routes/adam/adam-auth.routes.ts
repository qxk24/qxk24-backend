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
import {
  getOrCreateSession,
  syncUndeliveredConsultsToFounder,
} from '../../adam/adam-chat.service';

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
  const synced = await syncUndeliveredConsultsToFounder();
  const sessionId = await getOrCreateSession('masa-bayu');
  return c.json({
    success:   true,
    sessionId,
    syncedConsults: synced,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
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
