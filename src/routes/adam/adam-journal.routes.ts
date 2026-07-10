/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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
  getJournalReviewChain,
  bulkApproveJournals,
} from '../../adam/adam-journal.service';
import { getJournalCoverageByMajor } from '../../adam/adam-journal-coverage.service';
import { verify } from 'jsonwebtoken';
import { requireAuth, requireFounder } from '../../middleware/auth.middleware';
import type { ADAMApiResponse, AlamtologiAcademicJournal } from '../../adam/adam.types';
import type { QXK24TokenPayload } from '../../middleware/auth.middleware';
import { ENV } from '../../config/environments';
import { getDailyJournalSegmentStatus } from '../../adam/adam-journal-daily-segment';
import { runJournalBatch } from '../../adam/adam-journal-batch.service';
import { getJournalBatchSchedulerStatus } from '../../adam/adam-journal-batch.scheduler';
import { resolveJournalLocale } from '../../adam/journal-locale';
import { getJournalTranslation } from '../../adam/journal-translation.service';
import { finaliseJournal } from '../../adam/adam-journal-finalise';
import {
  getUniversityKnowledgeTopicCount,
  listKnowledgeMajorNames,
  searchUniversityKnowledgeTopics,
} from '../../adam/adam-university-knowledge';

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

// ─── GET /daily-segment — Today's knowledge segment (Founder) ─

router.get('/daily-segment', requireFounder, async (c) => {
  try {
    const topicId = c.req.query('topicId');
    const status = await getDailyJournalSegmentStatus(
      new Date(),
      topicId?.trim() || undefined,
    );
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      status,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── GET /batch/status — Quota + scheduler (Founder) ─────────

router.get('/batch/status', requireFounder, async (c) => {
  try {
    const quota = await getDailyJournalSegmentStatus();
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      {
        quota,
        scheduler: getJournalBatchSchedulerStatus(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── POST /batch/run — Seal N pending subfields now (Founder) ─

router.post('/batch/run', requireFounder, async (c) => {
  const body = await c.req.json().catch(() => ({})) as { count?: number };
  const count = typeof body.count === 'number' ? body.count : 1;

  try {
    const result = await runJournalBatch(count);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({
      success: false,
      kernel:  'ALAMTOLOGI',
      error:   msg,
      timestamp: new Date().toISOString(),
    }, 409);
  }
});

// ─── GET /public/knowledge-map — Browse 664-map topics (no auth) ─

router.get('/public/knowledge-map', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '24', 10), 100);
  const skip  = Math.max(parseInt(c.req.query('skip') ?? '0', 10), 0);
  const { topics, total } = searchUniversityKnowledgeTopics({
    q:     c.req.query('q') ?? undefined,
    major: c.req.query('major') ?? undefined,
    limit,
    skip,
  });

  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      {
      mapVersion:  '664',
      topicCount:  getUniversityKnowledgeTopicCount(),
      majors:      listKnowledgeMajorNames(),
      topics:      topics.map((t) => ({
        topicId:    t.topicId,
        label:      t.label,
        major:      t.majorName,
        discipline: t.disciplineName,
        subfield:   t.subfield,
        lens:       t.alamtologiLens,
        breadcrumb: `${t.majorName} › ${t.disciplineName} › ${t.subfield}`,
      })),
      total,
      limit,
      skip,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /public — Published journals (no auth) ──────────────

router.get('/public', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') ?? '24', 10), 60);
    const skip  = Math.max(parseInt(c.req.query('skip') ?? '0', 10), 0);
    const { journals, total } = await listPublishedJournals(limit, skip, {
      summary:         true,
      q:               c.req.query('q') ?? undefined,
      knowledgeMajor:  c.req.query('major') ?? undefined,
      knowledgeTopicId: c.req.query('topicId') ?? undefined,
      publishedMonth:  c.req.query('month') ?? undefined,
      date:            c.req.query('date') ?? undefined,
    });

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      { journals, total, limit, skip },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── GET /public/:id — Published journal + audits ────────────

router.get('/public/:id', async (c) => {
  try {
    const id = c.req.param('id')!;
    const journal = await getJournal(id);

    if (!journal || journal.status !== 'PUBLISHED') {
      return c.json({
        success: false,
        kernel:  'ALAMTOLOGI',
        error:   'Journal not found or not published.',
        timestamp: new Date().toISOString(),
      }, 404);
    }

    const audits = await getJournalAudits(id);
    const locale = resolveJournalLocale(c.req.query('lang'));

    let payload = journal;
    if (locale !== (journal.sourceLanguage ?? 'en')) {
      const translated = await getJournalTranslation(id, locale);
      if (translated) {
        payload = {
          ...journal,
          title:    translated.title,
          abstract: translated.abstract,
          content:  translated.content,
        };
      }
    }

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      {
        journal:        payload,
        audits,
        locale,
        sourceLanguage: journal.sourceLanguage ?? 'en',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── GET /public/:id/translation/:locale — Fetch or generate translation ─

router.get('/public/:id/translation/:locale', async (c) => {
  const id = c.req.param('id')!;
  const locale = resolveJournalLocale(c.req.param('locale'));
  const journal = await getJournal(id);

  if (!journal || journal.status !== 'PUBLISHED') {
    return c.json({
      success: false,
      kernel:  'ALAMTOLOGI',
      error:   'Journal not found or not published.',
      timestamp: new Date().toISOString(),
    }, 404);
  }

  try {
    const translation = await getJournalTranslation(id, locale);
    if (!translation) {
      return c.json({
        success: false,
        kernel:  'ALAMTOLOGI',
        error:   'Translation unavailable.',
        timestamp: new Date().toISOString(),
      }, 404);
    }

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      translation,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({
      success: false,
      kernel:  'ALAMTOLOGI',
      error:   msg,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// ─── POST /submit — Founder + ADAM only (public submit disabled) ─

router.post(
  '/submit',
  requireFounder,
  zValidator('json', SubmitJournalSchema),
  async (c) => {
    try {
      const body    = c.req.valid('json');
      const journal = await submitJournal(body);

      const response: ADAMApiResponse<AlamtologiAcademicJournal> = {
        success:   true,
        kernel:    'ALAMTOLOGI',
        version:   ENV.QXK24_KERNEL_VERSION,
        era:       ENV.QXK24_ERA,
        data:      journal,
        timestamp: new Date().toISOString(),
      };

      return c.json(response, 201);
  
    } catch (err) {
      console.error(err);
      throw err;
    }},
);

// ─── GET / — List (auth: founder sees all via separate filters) ─

router.get('/', requireAuth, async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') ?? '40', 10), 100);
    const skip  = Math.max(parseInt(c.req.query('skip') ?? '0', 10), 0);

    const { journals, total } = await listJournals({
      status:           c.req.query('status') ?? undefined,
      judgment:         c.req.query('judgment') ?? undefined,
      q:                c.req.query('q') ?? undefined,
      date:             c.req.query('date') ?? undefined,
      knowledgeMajor:   c.req.query('major') ?? undefined,
      knowledgeTopicId: c.req.query('topicId') ?? undefined,
      limit,
      skip,
      summary:          c.req.query('summary') !== 'false',
    });

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      { journals, total, limit, skip },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── GET /coverage — Daily coverage by major (Founder) ─────────

router.get('/coverage', requireFounder, async (c) => {
  try {
    const dateStr = c.req.query('date');
    const date = dateStr
      ? new Date(`${dateStr.trim()}T12:00:00+08:00`)
      : new Date();
    const report = await getJournalCoverageByMajor(date);

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      report,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── GET /review-chain — Ordered ids for prev/next (Founder) ───

router.get('/review-chain', requireFounder, async (c) => {
  try {
    const { ids, total } = await getJournalReviewChain({
      status:           c.req.query('status') ?? undefined,
      judgment:         c.req.query('judgment') ?? undefined,
      q:                c.req.query('q') ?? undefined,
      date:             c.req.query('date') ?? undefined,
      knowledgeMajor:   c.req.query('major') ?? undefined,
      knowledgeTopicId: c.req.query('topicId') ?? undefined,
    });

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      { ids, total, currentId: c.req.query('currentId') ?? undefined },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── POST /bulk/approve — Bulk approve + publish (Founder) ───

router.post('/bulk/approve', requireFounder, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as {
      date?:        string;
      status?:      string;
      major?:       string;
      q?:           string;
      ids?:         string[];
      reviewNotes?: string;
      publish?:     boolean;
      limit?:       number;
    };

    const result = await bulkApproveJournals({
      date:           body.date,
      status:         body.status,
      knowledgeMajor: body.major,
      q:              body.q,
      ids:            body.ids,
      reviewNotes:    body.reviewNotes,
      publish:        body.publish,
      limit:          body.limit,
    });

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      result,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

const FinaliseJournalSchema = z.object({
  journalNumber: z.string().min(8).max(40),
  topicId:       z.string().min(3).max(120),
  source:        z.enum(['public_submit', 'founder_adam', 'founder_teaching']),
  status:        z.literal('PENDING_REVIEW'),
  copyright:     z.string().min(40).max(4000),
  journalId:     z.string().optional(),
  sessionId:     z.string().optional(),
});

// ─── POST /finalise — Constitutional legal seal (Founder) ─────

router.post('/finalise', requireFounder, zValidator('json', FinaliseJournalSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const result = await finaliseJournal(body);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, kernel: 'ALAMTOLOGI', error: msg, timestamp: new Date().toISOString() }, 400);
  }
});

// ─── GET /:id/audits ───────────────────────────────────────────

router.get('/:id/audits', async (c) => {
  try {
    const id = c.req.param('id')!;
    const journal = await getJournal(id);

    if (!journal) {
      return c.json({ success: false, kernel: 'ALAMTOLOGI', error: 'Journal not found' }, 404);
    }

    if (journal.status !== 'PUBLISHED' && !isFounderRequest(c)) {
      return c.json({ success: false, kernel: 'ALAMTOLOGI', error: 'Founder access required.' }, 403);
    }

    const audits = await getJournalAudits(id);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { audits, count: audits.length },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── GET /:id/translation/:locale — Founder/review translation ─

router.get('/:id/translation/:locale', requireAuth, async (c) => {
  const id = c.req.param('id')!;
  const locale = resolveJournalLocale(c.req.param('locale'));
  const journal = await getJournal(id);

  if (!journal) {
    return c.json({ success: false, kernel: 'ALAMTOLOGI', error: 'Journal not found', timestamp: new Date().toISOString() }, 404);
  }

  if (journal.status === 'DRAFT' && !isFounderRequest(c)) {
    return c.json({ success: false, kernel: 'ALAMTOLOGI', error: 'Forbidden', timestamp: new Date().toISOString() }, 403);
  }

  try {
    const translation = await getJournalTranslation(id, locale);
    if (!translation) {
      return c.json({ success: false, kernel: 'ALAMTOLOGI', error: 'Translation unavailable', timestamp: new Date().toISOString() }, 404);
    }

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      translation,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, kernel: 'ALAMTOLOGI', error: msg, timestamp: new Date().toISOString() }, 500);
  }
});

// ─── GET /:id ────────────────────────────────────────────────

router.get('/:id', requireAuth, async (c) => {
  try {
    const id      = c.req.param('id')!;
    const journal = await getJournal(id);

    if (!journal) {
      return c.json({ success: false, kernel: 'ALAMTOLOGI', error: 'Journal not found', timestamp: new Date().toISOString() }, 404);
    }

    const audits = await getJournalAudits(id);

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      { journal, audits },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── POST /:id/approve — Founder only ────────────────────────

router.post('/:id/approve', requireFounder, async (c) => {
  try {
    const id   = c.req.param('id')!;
    const body = await c.req.json() as { reviewNotes?: string; publish?: boolean };

    const journal = await approveJournal(
      id,
      body.reviewNotes ?? '',
      { publish: body.publish !== false },
    );
    if (!journal) {
      return c.json({ success: false, kernel: 'ALAMTOLOGI', error: 'Journal not found or cannot be approved', timestamp: new Date().toISOString() }, 404);
    }

    const audits = await getJournalAudits(id);

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      { journal, audits },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── POST /:id/publish — Founder only ────────────────────────

router.post('/:id/publish', requireFounder, async (c) => {
  try {
    const id      = c.req.param('id')!;
    const journal = await publishJournal(id);

    if (!journal) {
      return c.json({ success: false, kernel: 'ALAMTOLOGI', error: 'Journal not found or not approved', timestamp: new Date().toISOString() }, 404);
    }

    const audits = await getJournalAudits(id);

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data:      { journal, audits },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;
