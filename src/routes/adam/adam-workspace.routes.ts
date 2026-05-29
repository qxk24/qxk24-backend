/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Workspace Routes (AIDIL family per book)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
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
import { getTokenUser, requireAdamUser } from '../../middleware/auth.middleware';
import {
  archiveWorkspace,
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
} from '../../adam/adam-workspace.service';
import type { WorkspacePrinciple } from '../../adam/adam-workspace.schema';

const router = new Hono();

const CreateSchema = z.object({
  title:       z.string().trim().min(1).max(200),
  description: z.string().max(8000).optional(),
  category:    z.string().max(80).optional(),
  principle:   z.enum([
    'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG', 'MULTI',
  ]).optional(),
});

function mapRole(role: string): 'founder' | 'student' | 'member' {
  if (role === 'founder') return 'founder';
  if (role === 'student') return 'student';
  return 'member';
}

// GET /api/workspaces
router.get('/', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const workspaces = await getUserWorkspaces(user.userId);
  return c.json({
    success:    true,
    workspaces,
    total:      workspaces.length,
    kernel:     'QXK24',
    timestamp:  new Date().toISOString(),
  });
});

// POST /api/workspaces
router.post(
  '/',
  requireAdamUser,
  zValidator('json', CreateSchema, (result, c) => {
    if (!result.success) {
      const first = result.error.issues[0];
      const field = first?.path?.join('.') || 'input';
      const msg = first?.message ?? 'Invalid workspace data.';
      return c.json({
        success: false,
        error:   `${field}: ${msg}`,
        kernel:  'QXK24',
      }, 400);
    }
  }),
  async (c) => {
    const user = getTokenUser(c)!;
    const body = c.req.valid('json');

    try {
      const workspace = await createWorkspace({
        userId:      user.userId,
        userName:    user.name ?? user.userId,
        role:        mapRole(user.role),
        title:       body.title,
        description: body.description?.trim(),
        category:    body.category,
        principle:   (body.principle ?? 'MULTI') as WorkspacePrinciple,
      });

      return c.json({
        success:   true,
        workspace,
        message:   `New workspace "${workspace.title}" created. ADAM treats this as a separate AIDIL family.`,
        kernel:    'QXK24',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create workspace.';
      console.error('[ADAM Workspace] create failed:', err);
      return c.json({
        success: false,
        error:   message.includes('duplicate key')
          ? 'This book could not be saved. Tap Create again.'
          : message,
        kernel:  'QXK24',
      }, 500);
    }
  },
);

// GET /api/workspaces/:workspaceId
router.get('/:workspaceId', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const workspaceId = c.req.param('workspaceId') ?? '';
  const workspace = await getWorkspace(workspaceId, user.userId);

  if (!workspace) {
    return c.json({ success: false, error: 'Workspace not found.', kernel: 'QXK24' }, 404);
  }

  return c.json({
    success: true,
    workspace,
    kernel:  'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/workspaces/:workspaceId — archive
router.delete('/:workspaceId', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const workspaceId = c.req.param('workspaceId') ?? '';
  const ok = await archiveWorkspace(workspaceId, user.userId);

  if (!ok) {
    return c.json({ success: false, error: 'Workspace not found.', kernel: 'QXK24' }, 404);
  }

  return c.json({
    success: true,
    message: 'Workspace archived.',
    kernel:  'QXK24',
    timestamp: new Date().toISOString(),
  });
});

export default router;
