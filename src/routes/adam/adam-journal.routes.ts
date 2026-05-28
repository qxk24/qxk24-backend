// ============================================================
// QXK24 ADAM Teaching Engine — Journal Routes
// File: src/routes/adam/adam-journal.routes.ts
// Version: 1.0.0
// Author: QXK24 Constitutional Kernel
// Date: 2026-05-28
// Endpoints:
//   POST /api/adam/journal/submit     → submit journal
//   GET  /api/adam/journal            → list journals
//   GET  /api/adam/journal/:id        → get journal
//   POST /api/adam/journal/:id/approve
//   POST /api/adam/journal/:id/publish
// ============================================================

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  submitJournal,
  getJournal,
  listJournals,
  approveJournal,
  publishJournal,
} from '../../adam/adam-journal.service';
import { requireAuth, requireFounder } from '../../middleware/auth.middleware';
import type { ADAMApiResponse, AlamtologiAcademicJournal } from '../../adam/adam.types';
import { ENV } from '../../config/environments';

const router = new Hono();

// ─── POST /api/adam/journal/submit ───────────────────────────

const SubmitJournalSchema = z.object({
  title:           z.string().min(10).max(300),
  abstract:        z.string().min(100).max(3000),
  rawContent:      z.string().min(500).max(100000),
  category:        z.enum(['RESEARCH', 'APPLICATION', 'CASE_STUDY', 'THEORY', 'IMPLEMENTATION']),
  principlesFocus: z.array(z.enum(['MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG'])).min(1),
  authorName:      z.string().min(2).max(200),
  authorEmail:     z.string().email(),
  authorOrg:       z.string().max(200).optional(),
});

router.post(
  '/submit',
  requireAuth,
  zValidator('json', SubmitJournalSchema),
  async (c) => {
    const body    = c.req.valid('json');
    const journal = await submitJournal(body);

    const response: ADAMApiResponse<AlamtologiAcademicJournal> = {
      success:   true,
      kernel:    'QXK24',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      journal,
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 201);
  },
);

// ─── GET /api/adam/journal — List ────────────────────────────

router.get('/', requireAuth, async (c) => {
  const status   = c.req.query('status');
  const judgment = c.req.query('judgment');
  const limit    = parseInt(c.req.query('limit')  ?? '20');
  const skip     = parseInt(c.req.query('skip')   ?? '0');

  const { journals, total } = await listJournals({ status, judgment, limit, skip });

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { journals, total, limit, skip },
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /api/adam/journal/:id ────────────────────────────────

router.get('/:id', requireAuth, async (c) => {
  const id      = c.req.param('id')!;
  const journal = await getJournal(id);

  if (!journal) {
    return c.json({ success: false, kernel: 'QXK24', error: 'Journal not found', timestamp: new Date().toISOString() }, 404);
  }

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      journal,
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /api/adam/journal/:id/approve — Founder only ───────

router.post('/:id/approve', requireFounder, async (c) => {
  const id   = c.req.param('id')!;
  const body = await c.req.json() as { reviewNotes?: string };

  const journal = await approveJournal(id, body.reviewNotes ?? '');
  if (!journal) {
    return c.json({ success: false, kernel: 'QXK24', error: 'Journal not found or cannot be approved', timestamp: new Date().toISOString() }, 404);
  }

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      journal,
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /api/adam/journal/:id/publish — Founder only ───────

router.post('/:id/publish', requireFounder, async (c) => {
  const id      = c.req.param('id')!;
  const journal = await publishJournal(id);

  if (!journal) {
    return c.json({ success: false, kernel: 'QXK24', error: 'Journal not found or not approved', timestamp: new Date().toISOString() }, 404);
  }

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      journal,
    timestamp: new Date().toISOString(),
  });
});

export default router;
