/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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
import { getFounderPassword, verifyFounderPassword } from '../../config/founder-auth';
import { requireFounder } from '../../middleware/auth.middleware';
import { getAccountLane } from '../../adam/adam-student-registry.service';
import { ADAMFounderSessionModel } from '../../adam/adam.schema';
import {
  resolveFounderTeachingSession,
  syncUndeliveredConsultsToFounder,
} from '../../adam/adam-chat.service';
import { adamSleepProtocol } from '../../qxk24brain/adam-sleep-wake.service';

const router = new Hono();

const LoginSchema = z.object({
  password: z.string().min(1),
});

// GET /api/adam/auth/login-hint — length only (helps founder verify keyboard/paste)
router.get('/login-hint', async (c) => {
  const founderPassword = getFounderPassword();
  return c.json({
    success:    true,
    configured: Boolean(founderPassword),
    passwordLength: founderPassword?.length ?? 0,
    kernel:     'Alamtologi',
  });
});

// POST /api/adam/auth/login
router.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { password } = c.req.valid('json');
  const submitted = password.trim();
  const founderPassword = getFounderPassword();

  if (!founderPassword) {
    await new Promise((r) => setTimeout(r, 1000));
    return c.json({
      success: false,
      error:   'Founder login is not configured on this server.',
      kernel:  'ALAMTOLOGI',
    }, 503);
  }

  if (!verifyFounderPassword(submitted, founderPassword)) {
    await new Promise((r) => setTimeout(r, 1000));
    const lengthMismatch = submitted.length !== founderPassword.length;
    return c.json({
      success: false,
      error:   'Access denied.',
      hint:    lengthMismatch
        ? `You entered ${submitted.length} characters; this server expects ${founderPassword.length}. Check # and * at the end.`
        : 'Characters count matches but the password is wrong — use Show password and retype (avoid autofill from student login).',
      kernel:  'ALAMTOLOGI',
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
    kernel:    'ALAMTOLOGI',
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

  const preferred = c.req.query('sessionId')?.trim();
  const sessionId = await resolveFounderTeachingSession(
    'masa-bayu',
    preferred || undefined,
  );
  return c.json({
    success:   true,
    sessionId,
    syncedConsults: 0,
    kernel:    'ALAMTOLOGI',
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
    kernel:    'ALAMTOLOGI',
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
      userId?:      string;
      name?:        string;
      kernel?:      string;
      era?:         string;
      role?:        string;
      isFounder?:   boolean;
      accountLane?: 'umum' | 'pelajar';
    };

    const isFounder = decoded.role === 'founder' || decoded.isFounder === true;
    const isStudent = decoded.role === 'student';
    const isGuru = decoded.role === 'guru';

    if (!isFounder && !isStudent && !isGuru) {
      return c.json({ success: false, valid: false }, 401);
    }

    const accountLane = isFounder
      ? undefined
      : decoded.accountLane === 'pelajar' || decoded.accountLane === 'umum'
        ? decoded.accountLane
        : decoded.userId
          ? await getAccountLane(decoded.userId)
          : 'umum';

    return c.json({
      success: true,
      valid:   true,
      role:    isFounder ? (decoded.role ?? 'founder') : (decoded.role ?? 'student'),
      userId:  decoded.userId,
      name:    decoded.name ?? (isFounder ? 'Masa Bayu' : decoded.userId),
      founder: isFounder ? (decoded.name ?? 'Masa Bayu') : undefined,
      accountLane,
      kernel:  decoded.kernel ?? ENV.QXK24_KERNEL_VERSION,
      era:     decoded.era ?? ENV.QXK24_ERA,
    });
  } catch {
    return c.json({ success: false, valid: false }, 401);
  }
});

export default router;
