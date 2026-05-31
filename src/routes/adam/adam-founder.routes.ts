/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Founder Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { requireFounder } from '../../middleware/auth.middleware';
import { buildFounderPulse } from '../../adam/adam-founder-pulse.service';

const router = new Hono();

/** GET /api/adam/founder/pulse — live command board aggregate */
router.get('/pulse', requireFounder, async (c) => {
  const pulse = await buildFounderPulse();
  return c.json({
    success: true,
    pulse,
    kernel:  'QXK24',
  });
});

export default router;
