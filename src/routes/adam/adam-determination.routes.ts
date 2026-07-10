/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Determination Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

// ============================================================
// QXK24 ADAM Teaching Engine — Determination Routes
// File: src/routes/adam/adam-determination.routes.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// Endpoints:
//   POST /api/adam/determination        → run determination
//   GET  /api/adam/determination/audit  → get audit history
// ============================================================

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { runADAMDetermination } from '../../adam/adam-determination.service';
import { getAuditHistory } from '../../adam/adam-audit.service';
import { requireFounder, requireServiceToken } from '../../middleware/auth.middleware';
import type { ADAMApiResponse, ADAMDeterminationResult } from '../../adam/adam.types';
import { ENV } from '../../config/environments';

const router = new Hono();

// ─── POST /api/adam/determination — Run Determination ────────

const DeterminationSchema = z.object({
  question:          z.string().min(10).max(5000),
  context:           z.string().max(5000).optional(),
  principle:         z.enum(['MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG']).optional(),
  determinationType: z.enum(['CAPABILITY', 'CONSTITUTIONAL', 'RESOURCE', 'ALIGNMENT']),
});

router.post(
  '/',
  requireFounder,
  zValidator('json', DeterminationSchema),
  async (c) => {
    try {
      const body   = c.req.valid('json');
      const result = await runADAMDetermination(body);

      const response: ADAMApiResponse<ADAMDeterminationResult> = {
        success:   result.judgment !== 'WAQF',
        kernel:    'ALAMTOLOGI',
        version:   ENV.QXK24_KERNEL_VERSION,
        era:       ENV.QXK24_ERA,
        data:      result,
        auditId:   result.auditId,
        timestamp: new Date().toISOString(),
      };

      const statusCode = result.judgment === 'WAQF' ? 422 : 200;
      return c.json(response, statusCode);
  
    } catch (err) {
      console.error(err);
      throw err;
    }},
);

// ─── POST /api/adam/determination/service — Service Token ────

router.post(
  '/service',
  requireServiceToken,
  zValidator('json', DeterminationSchema),
  async (c) => {
    try {
      const body   = c.req.valid('json');
      const result = await runADAMDetermination(body);

      return c.json({
        success:   result.canProceed,
        kernel:    'ALAMTOLOGI',
        version:   ENV.QXK24_KERNEL_VERSION,
        era:       ENV.QXK24_ERA,
        data:      result,
        auditId:   result.auditId,
        timestamp: new Date().toISOString(),
      });
  
    } catch (err) {
      console.error(err);
      throw err;
    }},
);

// ─── GET /api/adam/determination/audit/:targetId ─────────────

router.get('/audit/:targetId', requireFounder, async (c) => {
  try {
    const targetId   = c.req.param('targetId')!;
    const targetType = c.req.query('type') ?? 'SESSION';
    const history    = await getAuditHistory(targetId, targetType);

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      { history, count: history.length },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;
