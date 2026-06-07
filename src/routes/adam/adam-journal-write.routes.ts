/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Write Routes (V2)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * All routes require Founder authentication.
 *
 * POST /api/adam/journal/write/initiate
 * POST /api/adam/journal/write/:journalNumber/title
 * GET  /api/adam/journal/write/:journalNumber
 * POST /api/adam/journal/write/:journalNumber/section/:sectionKey/save
 * POST /api/adam/journal/write/:journalNumber/section/:sectionKey/approve
 * POST /api/adam/journal/write/:journalNumber/seal
 * POST /api/adam/journal/write/:journalNumber/publish
 * GET  /api/adam/journal/write/list
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireFounder } from '../../middleware/auth.middleware';
import { ENV } from '../../config/environments';
import { FOUNDER_USER_ID } from '../../adam/adam-student.types';
import { initiateJournal } from '../../adam/journal/adam-journal-initiate.service';
import {
  saveJournalSection,
  approveJournalSection,
} from '../../adam/journal/adam-journal-section.service';
import { sealJournal } from '../../adam/journal/adam-journal-seal.service';
import { publishJournalV2 } from '../../adam/journal/adam-journal-publish.service';
import {
  JournalV2Model,
  JOURNAL_SECTION_KEYS,
  type JournalSectionKey,
} from '../../adam/journal/adam-journal-v2.schema';
import { loadUniversityKnowledgeTopics } from '../../adam/adam-university-knowledge';

const router = new Hono();

function ok(c: Context, data: unknown, status: 200 | 201 = 200) {
  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data,
    timestamp: new Date().toISOString(),
  }, status);
}

function fail(c: Context, message: string, status: 400 | 404 | 500 = 400) {
  return c.json({
    success:   false,
    kernel:    'ALAMTOLOGI',
    error:     message,
    timestamp: new Date().toISOString(),
  }, status);
}

const InitiateSchema = z.object({
  topicId:         z.string().min(1),
  majorId:         z.string().min(1),
  disciplineId:    z.string().min(1),
  disciplineLabel: z.string().default(''),
  subfield:        z.string().default(''),
});

const TitleSchema = z.object({
  title:    z.string().min(10).max(400),
  subtitle: z.string().max(400).optional(),
});

const SectionSaveSchema = z.object({
  content: z.string().min(1),
});

router.post(
  '/initiate',
  requireFounder,
  zValidator('json', InitiateSchema),
  async (c) => {
    try {
      const body   = c.req.valid('json');
      const result = await initiateJournal({
        ...body,
        founderUserId: FOUNDER_USER_ID,
      });
      return ok(c, result, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return fail(c, msg, 500);
    }
  },
);

router.get('/topics', requireFounder, async (c) => {
  try {
    const topics = loadUniversityKnowledgeTopics().map((t) => ({
      topicId:         t.topicId,
      majorId:         t.majorId,
      disciplineId:    t.disciplineId,
      disciplineLabel: t.disciplineName,
      subfield:        t.subfield,
      label:           t.label,
    }));
    return ok(c, { topics });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(c, msg, 500);
  }
});

router.get('/public/:journalNumber', async (c) => {
  try {
    const { journalNumber } = c.req.param();
    const journal = await JournalV2Model.findOne({
      journalNumber,
      status: 'PUBLISHED',
    }).lean();
    if (!journal) return fail(c, `Journal not found: ${journalNumber}`, 404);
    return ok(c, { journal });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(c, msg, 500);
  }
});

router.get('/list', requireFounder, async (c) => {
  try {
    const journals = await JournalV2Model
      .find({})
      .sort({ createdAt: -1 })
      .select({
        journalNumber: 1, title: 1, topicId: 1, majorId: 1,
        disciplineLabel: 1, subfield: 1, status: 1,
        totalWords: 1, approvedSections: 1,
        createdAt: 1, publishedAt: 1,
      })
      .lean();
    return ok(c, { journals, total: journals.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(c, msg, 500);
  }
});

router.post(
  '/:journalNumber/title',
  requireFounder,
  zValidator('json', TitleSchema),
  async (c) => {
    try {
      const { journalNumber } = c.req.param();
      const { title, subtitle } = c.req.valid('json');

      const journal = await JournalV2Model.findOne({ journalNumber });
      if (!journal) return fail(c, `Journal not found: ${journalNumber}`, 404);

      journal.title           = title;
      journal.subtitle        = subtitle ?? '';
      journal.status          = 'TITLE_APPROVED';
      journal.titleApprovedAt = new Date();
      await journal.save();

      return ok(c, {
        journalNumber,
        title,
        subtitle: subtitle ?? '',
        status: 'TITLE_APPROVED',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return fail(c, msg, 500);
    }
  },
);

router.get('/:journalNumber', requireFounder, async (c) => {
  try {
    const { journalNumber } = c.req.param();
    const journal = await JournalV2Model.findOne({ journalNumber }).lean();
    if (!journal) return fail(c, `Journal not found: ${journalNumber}`, 404);
    return ok(c, { journal });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(c, msg, 500);
  }
});

router.post(
  '/:journalNumber/section/:sectionKey/save',
  requireFounder,
  zValidator('json', SectionSaveSchema),
  async (c) => {
    try {
      const { journalNumber, sectionKey } = c.req.param();

      if (!JOURNAL_SECTION_KEYS.includes(sectionKey as JournalSectionKey)) {
        return fail(c, `Invalid sectionKey: "${sectionKey}". ` +
          `Valid keys: ${JOURNAL_SECTION_KEYS.join(', ')}`, 400);
      }

      const { content } = c.req.valid('json');
      const result = await saveJournalSection(
        journalNumber,
        sectionKey as JournalSectionKey,
        content,
      );

      return ok(c, { journalNumber, sectionKey, ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return fail(c, msg, 400);
    }
  },
);

router.post(
  '/:journalNumber/section/:sectionKey/approve',
  requireFounder,
  async (c) => {
    try {
      const { journalNumber, sectionKey } = c.req.param();

      if (!JOURNAL_SECTION_KEYS.includes(sectionKey as JournalSectionKey)) {
        return fail(c, `Invalid sectionKey: "${sectionKey}"`, 400);
      }

      const result = await approveJournalSection(
        journalNumber,
        sectionKey as JournalSectionKey,
      );

      return ok(c, { journalNumber, sectionKey, ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return fail(c, msg, 400);
    }
  },
);

router.post('/:journalNumber/seal', requireFounder, async (c) => {
  try {
    const { journalNumber } = c.req.param();
    const result = await sealJournal(journalNumber);
    return ok(c, { journalNumber, status: 'PENDING_REVIEW', ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(c, msg, 400);
  }
});

router.post('/:journalNumber/publish', requireFounder, async (c) => {
  try {
    const { journalNumber } = c.req.param();
    const result = await publishJournalV2(journalNumber);
    return ok(c, { journalNumber, status: 'PUBLISHED', ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(c, msg, 400);
  }
});

export default router;
