/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Journal Routes
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
 *
 * POST /api/adam/journal/submit       → submit + SUBMISSION audit
 * GET  /api/adam/journal/public      → published catalogue
 * GET  /api/adam/journal/public/:id  → published detail + audits
 * GET  /api/adam/journal/:id/audits  → audit timeline
 * POST /api/adam/journal/:id/approve → Founder + APPROVAL audit
 * POST /api/adam/journal/:id/publish → Founder + PUBLICATION audit
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  submitJournal,
  getJournal,
  listJournals,
  listPublishedJournals,
  approveJournal,
  publishJournal,
  getJournalAudits,
} from '../../adam/adam-journal.service';
import { verify } from 'jsonwebtoken';
import { requireAuth, requireFounder } from '../../middleware/auth.middleware';
import type { ADAMApiResponse, AlamtologiAcademicJournal } from '../../adam/adam.types';
import type { QXK24TokenPayload } from '../../middleware/auth.middleware';
import { ENV } from '../../config/environments';

function isFounderRequest(c: { req: { header: (n: string) => string | undefined } }): boolean {
  const bearer = c.req.header('Authorization')?.split(' ')[1];
  if (!bearer) return false;
  try {
    const decoded = verify(bearer, ENV.JWT_SECRET) as QXK24TokenPayload;
    return decoded.role === 'founder' || Boolean(decoded.isFounder);
  } catch {
    return bearer === ENV.QXK24_PRODUCTION_BEARER_TOKEN;
  }
}

const router = new Hono();

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

// ─── GET /public — Published journals (no auth) ──────────────

router.get('/public', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '24', 10), 50);
  const skip  = parseInt(c.req.query('skip') ?? '0', 10);
  const { journals, total } = await listPublishedJournals(limit, skip);

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { journals, total, limit, skip },
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /public/:id — Published journal + audits ────────────

router.get('/public/:id', async (c) => {
  const id = c.req.param('id')!;
  const journal = await getJournal(id);

  if (!journal || journal.status !== 'PUBLISHED') {
    return c.json({
      success: false,
      kernel:  'QXK24',
      error:   'Journal not found or not published.',
      timestamp: new Date().toISOString(),
    }, 404);
  }

  const audits = await getJournalAudits(id);

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { journal, audits },
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /submit — Anyone may submit ────────────────────────

router.post(
  '/submit',
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

// ─── GET / — List (auth: founder sees all via separate filters) ─

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

// ─── GET /:id/audits ───────────────────────────────────────────

router.get('/:id/audits', async (c) => {
  const id = c.req.param('id')!;
  const journal = await getJournal(id);

  if (!journal) {
    return c.json({ success: false, kernel: 'QXK24', error: 'Journal not found' }, 404);
  }

  if (journal.status !== 'PUBLISHED' && !isFounderRequest(c)) {
    return c.json({ success: false, kernel: 'QXK24', error: 'Founder access required.' }, 403);
  }

  const audits = await getJournalAudits(id);
  return c.json({
    success:   true,
    kernel:    'QXK24',
    data:      { audits, count: audits.length },
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /:id ────────────────────────────────────────────────

router.get('/:id', requireAuth, async (c) => {
  const id      = c.req.param('id')!;
  const journal = await getJournal(id);

  if (!journal) {
    return c.json({ success: false, kernel: 'QXK24', error: 'Journal not found', timestamp: new Date().toISOString() }, 404);
  }

  const audits = await getJournalAudits(id);

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { journal, audits },
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /:id/approve — Founder only ────────────────────────

router.post('/:id/approve', requireFounder, async (c) => {
  const id   = c.req.param('id')!;
  const body = await c.req.json() as { reviewNotes?: string };

  const journal = await approveJournal(id, body.reviewNotes ?? '');
  if (!journal) {
    return c.json({ success: false, kernel: 'QXK24', error: 'Journal not found or cannot be approved', timestamp: new Date().toISOString() }, 404);
  }

  const audits = await getJournalAudits(id);

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { journal, audits },
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /:id/publish — Founder only ────────────────────────

router.post('/:id/publish', requireFounder, async (c) => {
  const id      = c.req.param('id')!;
  const journal = await publishJournal(id);

  if (!journal) {
    return c.json({ success: false, kernel: 'QXK24', error: 'Journal not found or not approved', timestamp: new Date().toISOString() }, 404);
  }

  const audits = await getJournalAudits(id);

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { journal, audits },
    timestamp: new Date().toISOString(),
  });
});

export default router;
