/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Routes
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireFounder, getTokenUser } from '../../middleware/auth.middleware';
import { buildFounderPulse } from '../../adam/adam-founder-pulse.service';
import {
  getStudentRegistrationSettings,
  setStudentSelfRegisterOpen,
} from '../../adam/adam-platform-settings.service';

const router = new Hono();

const RegistrationSchema = z.object({
  open: z.boolean(),
});

/** GET /api/adam/founder/pulse — live command board aggregate */
router.get('/pulse', requireFounder, async (c) => {
  const pulse = await buildFounderPulse();
  return c.json({
    success: true,
    pulse,
    kernel:  'ALAMTOLOGI',
  });
});

/** GET /api/adam/founder/registration — public student signup gate (founder view) */
router.get('/registration', requireFounder, (c) => {
  return c.json({
    success: true,
    ...getStudentRegistrationSettings(),
    kernel: 'ALAMTOLOGI',
  });
});

/** PATCH /api/adam/founder/registration — open/close public student signup */
router.patch('/registration', requireFounder, zValidator('json', RegistrationSchema), async (c) => {
  const user = getTokenUser(c)!;
  const { open } = c.req.valid('json');
  const result = await setStudentSelfRegisterOpen(open, user.userId);
  return c.json({
    success: true,
    open:    result.open,
    kernel:  'ALAMTOLOGI',
  });
});

export default router;
