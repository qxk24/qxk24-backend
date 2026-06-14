/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Succession Routes
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
// QXK24 ADAM Teaching Engine — Succession Routes
// File: src/routes/adam/adam-succession.routes.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// Endpoints:
//   GET  /api/adam/succession         → get record
//   POST /api/adam/succession/heir    → add/update heir
//   DELETE /api/adam/succession/heir/:position → remove heir
//   POST /api/adam/succession/seal    → seal permanently
// ============================================================

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getOrCreateSuccessionRecord,
  upsertHeir,
  removeHeir,
  sealSuccessionRecord,
  getSuccessionRecord,
} from '../../adam/adam-succession.service';
import { requireFounder } from '../../middleware/auth.middleware';
import type { ADAMApiResponse, SuccessionRecord } from '../../adam/adam.types';
import { ENV } from '../../config/environments';

const router = new Hono();

const FOUNDER_ID = 'masa-bayu-qxk24-founder';
const FOUNDER_NAME = 'Masa Bayu';

// ─── GET /api/adam/succession — Get Record ────────────────────

router.get('/', requireFounder, async (c) => {
  const includeDecrypted = c.req.query('decrypted') === 'true';
  const record = await getOrCreateSuccessionRecord(FOUNDER_NAME, FOUNDER_ID);

  // Only return decrypted fields if explicitly requested
  const finalRecord = includeDecrypted
    ? await getSuccessionRecord(FOUNDER_ID, true)
    : record;

  const response: ADAMApiResponse<SuccessionRecord> = {
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      finalRecord ?? record,
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// ─── POST /api/adam/succession/heir — Add or Update Heir ─────

const HeirSchema = z.object({
  position:           z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  fullLegalName:      z.string().min(2).max(300),
  relationship:       z.string().min(2).max(100),
  idType:             z.enum(['MyKad', 'Passport', 'National_IC', 'Other']),
  idNumber:           z.string().min(5).max(50),
  issuingCountry:     z.string().min(2).max(100),
  nationality:        z.string().min(2).max(100),
  phone:              z.string().min(5).max(30),
  email:              z.string().email(),
  cityOfResidence:    z.string().min(2).max(100),
  countryOfResidence: z.string().min(2).max(100),
  founderNote:        z.string().max(2000),
});

router.post('/heir', requireFounder, zValidator('json', HeirSchema), async (c) => {
  const body   = c.req.valid('json');
  const record = await upsertHeir(FOUNDER_ID, body);

  if (!record) {
    return c.json({
      success:   false,
      kernel:    'ALAMTOLOGI',
      error:     'Succession record is sealed or not found',
      timestamp: new Date().toISOString(),
    }, 403);
  }

  const response: ADAMApiResponse<SuccessionRecord> = {
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      record,
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// ─── DELETE /api/adam/succession/heir/:position ───────────────

router.delete('/heir/:position', requireFounder, async (c) => {
  const pos    = parseInt(c.req.param('position')!) as 1 | 2 | 3 | 4;
  const record = await removeHeir(FOUNDER_ID, pos);

  if (!record) {
    return c.json({
      success:   false,
      kernel:    'ALAMTOLOGI',
      error:     'Heir not found or record is sealed',
      timestamp: new Date().toISOString(),
    }, 404);
  }

  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      record,
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /api/adam/succession/seal — Seal Permanently ───────

router.post('/seal', requireFounder, async (c) => {
  const body = await c.req.json() as { confirm?: string };

  if (body.confirm !== 'SEAL_PERMANENTLY') {
    return c.json({
      success:   false,
      kernel:    'ALAMTOLOGI',
      error:     'Must confirm with { "confirm": "SEAL_PERMANENTLY" }',
      timestamp: new Date().toISOString(),
    }, 400);
  }

  const record = await sealSuccessionRecord(FOUNDER_ID);

  if (!record) {
    return c.json({
      success:   false,
      kernel:    'ALAMTOLOGI',
      error:     'Cannot seal — record not found or no heirs designated',
      timestamp: new Date().toISOString(),
    }, 400);
  }

  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      record,
    timestamp: new Date().toISOString(),
  });
});

export default router;
