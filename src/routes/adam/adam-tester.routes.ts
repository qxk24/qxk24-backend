/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Tester Management Routes (Founder only)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireFounder, requireAuth, getTokenUser } from '../../middleware/auth.middleware';
import {
  createTesterAccount,
  listTesters,
  revokeTester,
  extendTesterLimit,
  getTesterStatus,
  isTesterAccount,
  setTesterLanguage,
  getTesterLanguage,
} from '../../tester/alm-tester.service';
import {
  submitTesterApplication,
  listTesterApplications,
  approveTesterApplication,
  rejectTesterApplication,
  getTesterCohortStatus,
  isTesterApplyEnabled,
} from '../../tester/tester-application.service';
import { TesterApplicationStatus } from '../../tester/tester-application.schema';

const router = new Hono();

const CreateTesterSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email().max(120).optional(),
  userId:   z.string().min(2).max(32).regex(/^[a-z0-9-]+$/).optional(),
  password: z.string().min(6).max(128),
  isVip:    z.boolean().optional(),
  notes:    z.string().max(500).optional(),
});

const ExtendSchema = z.object({
  extraQuestions: z.number().int().min(1).max(500),
});

const ApplySchema = z.object({
  name:              z.string().min(2).max(80),
  email:             z.string().email().max(120),
  roleTitle:         z.string().max(120).optional(),
  motivation:        z.string().min(20).max(2000),
  preferredLanguage: z.string().min(2).max(10).optional(),
});

const RejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

const ApproveSchema = z.object({
  password: z.string().min(6).max(128).optional(),
  notes:    z.string().max(500).optional(),
});

// GET /api/adam/tester/apply/slots — public cohort availability
router.get('/apply/slots', async (c) => {
  try {
    const status = await getTesterCohortStatus();
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      status,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/tester/apply — public application submit
router.post('/apply', zValidator('json', ApplySchema), async (c) => {
  if (!isTesterApplyEnabled()) {
    return c.json({
      success: false,
      error:   'Tester applications are not open yet.',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  const body = c.req.valid('json');
  try {
    const result = await submitTesterApplication(body);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      result,
      message:   'Application received. The Founder will review it shortly.',
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Application failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/tester/applications — list pending/reviewed applications
router.get('/applications', requireFounder, async (c) => {
  try {
    const statusParam = c.req.query('status');
    const status = statusParam && Object.values(TesterApplicationStatus).includes(statusParam as TesterApplicationStatus)
      ? (statusParam as TesterApplicationStatus)
      : undefined;

    const [applications, cohort] = await Promise.all([
      listTesterApplications(status),
      getTesterCohortStatus(),
    ]);

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { applications, cohort },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/tester/applications/:applicationId/approve
router.post('/applications/:applicationId/approve', requireFounder, zValidator('json', ApproveSchema), async (c) => {
  const applicationId = c.req.param('applicationId') ?? '';
  const body = c.req.valid('json');
  try {
    const result = await approveTesterApplication(applicationId, body);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      result,
      message:   `Approved. Tester ${result.userId} created with ${result.limit} questions.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Approval failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tester/applications/:applicationId/reject
router.post('/applications/:applicationId/reject', requireFounder, zValidator('json', RejectSchema), async (c) => {
  const applicationId = c.req.param('applicationId') ?? '';
  const { reason } = c.req.valid('json');
  try {
    await rejectTesterApplication(applicationId, reason);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      message:   'Application rejected.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Reject failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/tester/cohort — founder cohort summary
router.get('/cohort', requireFounder, async (c) => {
  try {
    const cohort = await getTesterCohortStatus();
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      cohort,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/tester/create — create tester account
router.post('/create', requireFounder, zValidator('json', CreateTesterSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await createTesterAccount(body);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      result,
      message:   `Tester account created. Limit: ${result.limit} questions.`,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create tester account.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/tester/list — list all testers
router.get('/list', requireFounder, async (c) => {
  try {
    const [testers, cohort] = await Promise.all([
      listTesters(),
      getTesterCohortStatus(),
    ]);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { testers, total: testers.length, cohort },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// PATCH /api/adam/tester/language — tester sets own language
router.patch('/language', requireAuth, zValidator('json',
  z.object({
    language:     z.string().min(2).max(10),
    languageName: z.string().min(2).max(60),
  }),
), async (c) => {
  try {
    const user = getTokenUser(c)!;
    const { language, languageName } = c.req.valid('json');

    const isTester = await isTesterAccount(user.userId);
    if (!isTester) {
      return c.json({
        success: false,
        error:   'Tester account required.',
        kernel:  'ALAMTOLOGI',
      }, 403);
    }

    await setTesterLanguage(user.userId, language);

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { language, languageName },
      message:   `Language set to ${languageName}.`,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/tester/language — tester gets own language
router.get('/language', requireAuth, async (c) => {
  try {
    const user     = getTokenUser(c)!;
    const isTester = await isTesterAccount(user.userId);
    if (!isTester) {
      return c.json({
        success: false,
        error:   'Not a tester account.',
        kernel:  'ALAMTOLOGI',
      }, 404);
    }

    const language = await getTesterLanguage(user.userId);
    const hasLang  = Boolean(language);

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { language, hasLanguage: hasLang },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// DELETE /api/adam/tester/:userId — revoke tester
router.delete('/:userId', requireFounder, async (c) => {
  try {
    const userId  = c.req.param('userId') ?? '';
    const revoked = await revokeTester(userId);
    if (!revoked) {
      return c.json({ success: false, error: 'Tester not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      message:   `Tester ${userId} revoked.`,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// PATCH /api/adam/tester/:userId/extend — add more questions
router.patch('/:userId/extend', requireFounder, zValidator('json', ExtendSchema), async (c) => {
  const userId = c.req.param('userId') ?? '';
  const { extraQuestions } = c.req.valid('json');
  try {
    const result = await extendTesterLimit(userId, extraQuestions);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      result,
      message:   `Added ${extraQuestions} questions. New limit: ${result.newLimit}.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Extend failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/tester/status/:userId — get tester question status (read-only)
router.get('/status/:userId', requireFounder, async (c) => {
  try {
    const userId   = c.req.param('userId') ?? '';
    const isTester = await isTesterAccount(userId);
    if (!isTester) {
      return c.json({ success: false, error: 'Not a tester account.', kernel: 'ALAMTOLOGI' }, 404);
    }
    const status = await getTesterStatus(userId);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      status,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;
