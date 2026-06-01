/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Students Management Routes
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
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ENV } from '../../config/environments';
import { getTokenUser, requireFounder } from '../../middleware/auth.middleware';
import { importFullMemoryFromProduction } from '../../adam/adam-lab-import.service';
import { importFullMemoryFromLab } from '../../adam/adam-consolidation-import.service';
import {
  createStudentAccount,
  listStudentsForFounder,
  slugStudentUserId,
  syncMissingSeedStudents,
  syncSeedStudentPasswords,
  updateStudentAccount,
} from '../../adam/adam-student-registry.service';

const router = new Hono();

const UserIdSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9-]+$/, 'Login id: lowercase letters, numbers, hyphens only.');

const CreateSchema = z.object({
  name:     z.string().min(1).max(80),
  userId:   UserIdSchema.optional(),
  email:    z.string().email().max(120).optional(),
  password: z.string().min(6).max(128),
});

const PatchSchema = z.object({
  name:     z.string().min(1).max(80).optional(),
  email:    z.string().email().max(120).optional().or(z.literal('')),
  password: z.string().min(6).max(128).optional(),
  active:   z.boolean().optional(),
}).refine(
  (d) => d.name !== undefined || d.email !== undefined || d.password !== undefined || d.active !== undefined,
  { message: 'Provide name, email, password, and/or active.' },
);

// POST /api/adam/students/sync-seed — backfill missing seed accounts from env
router.post('/sync-seed', requireFounder, async (c) => {
  const added = await syncMissingSeedStudents();
  const passwordsResynced = await syncSeedStudentPasswords(true);
  const students = await listStudentsForFounder();
  return c.json({
    success: true,
    added,
    passwordsResynced,
    students: students.map((s) => ({
      userId:            s.userId,
      name:              s.name,
      email:             s.email,
      active:            s.active,
      createdAt:         s.createdAt.toISOString(),
      passwordSource:    s.passwordSource,
      passwordUpdatedAt: s.passwordUpdatedAt?.toISOString(),
    })),
    kernel: 'QXK24',
  });
});

// GET /api/adam/students — founder list (includes inactive)
router.get('/', requireFounder, async (c) => {
  const students = await listStudentsForFounder();
  return c.json({
    success: true,
    students: students.map((s) => ({
      userId:            s.userId,
      name:              s.name,
      email:             s.email,
      active:            s.active,
      createdAt:         s.createdAt.toISOString(),
      passwordSource:    s.passwordSource,
      passwordUpdatedAt: s.passwordUpdatedAt?.toISOString(),
    })),
    kernel: 'QXK24',
  });
});

// POST /api/adam/students — founder creates account
router.post('/', requireFounder, zValidator('json', CreateSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');

  const created = await createStudentAccount({
    name:      body.name,
    userId:    body.userId ?? slugStudentUserId(body.name),
    email:     body.email,
    password:  body.password,
    createdBy: user.userId,
  });

  return c.json({
    success: true,
    student: {
      userId:    created.userId,
      name:      created.name,
      email:     created.email,
      active:    created.active,
      createdAt: created.createdAt.toISOString(),
    },
    kernel: 'QXK24',
  }, 201);
});

// POST /api/adam/students/import-lab-memory — production: merge lab brain into production (one-time)
router.post('/import-lab-memory', requireFounder, async (c) => {
  if (ENV.QXK24_STACK === 'lab') {
    return c.json({
      success: false,
      error:   'Import lab → production runs on the production API only (not /lab).',
      kernel:  'QXK24',
    }, 400);
  }

  try {
    const result = await importFullMemoryFromLab();
    return c.json({ success: true, result, kernel: 'QXK24' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Import failed.';
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, 500);
  }
});

// POST /api/adam/students/import-production-all — lab: full memory (brain + founder + all students)
router.post('/import-production-all', requireFounder, async (c) => {
  if (ENV.QXK24_STACK !== 'lab') {
    return c.json({
      success: false,
      error:   'Import from production is only available on the lab stack.',
      kernel:  'QXK24',
    }, 400);
  }

  try {
    const result = await importFullMemoryFromProduction();
    return c.json({ success: true, result, kernel: 'QXK24' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Import failed.';
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, 500);
  }
});

// POST /api/adam/students/import-full-memory — alias for full production memory sync
router.post('/import-full-memory', requireFounder, async (c) => {
  if (ENV.QXK24_STACK !== 'lab') {
    return c.json({
      success: false,
      error:   'Import from production is only available on the lab stack.',
      kernel:  'QXK24',
    }, 400);
  }

  try {
    const result = await importFullMemoryFromProduction();
    return c.json({ success: true, result, kernel: 'QXK24' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Import failed.';
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, 500);
  }
});

// POST /api/adam/students/:userId/import-production — lab: full memory sync (same as import-all)
router.post('/:userId/import-production', requireFounder, async (c) => {
  if (ENV.QXK24_STACK !== 'lab') {
    return c.json({
      success: false,
      error:   'Import from production is only available on the lab stack.',
      kernel:  'QXK24',
    }, 400);
  }

  try {
    const result = await importFullMemoryFromProduction();
    return c.json({ success: true, result, kernel: 'QXK24' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Import failed.';
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, 500);
  }
});

// PATCH /api/adam/students/:userId
router.patch('/:userId', requireFounder, zValidator('json', PatchSchema), async (c) => {
  const userId = c.req.param('userId') ?? '';
  const body = c.req.valid('json');

  const updated = await updateStudentAccount(userId, {
    ...body,
    email: body.email === '' ? '' : body.email,
  });
  if (!updated) {
    return c.json({ success: false, error: 'Student not found.', kernel: 'QXK24' }, 404);
  }

  return c.json({
    success: true,
    student: {
      userId:    updated.userId,
      name:      updated.name,
      email:     updated.email,
      active:    updated.active,
      createdAt: updated.createdAt.toISOString(),
    },
    kernel: 'QXK24',
  });
});

export default router;
