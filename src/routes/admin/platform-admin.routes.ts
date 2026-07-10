/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Platform Admin Routes
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
 *
 * QIUBBX commercial operator console — all product models.
 * Operator: QIUBBX Technologies (M) Sdn Bhd
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getTokenUser,
  isFounderPayload,
  requireAdamUser,
  requireFounder,
} from '../../middleware/auth.middleware';
import {
  PlatformAdminRole,
  normalizePlatformAdminModules,
  type PlatformAdminModule,
} from '../../platform/platform-admin.types';
import {
  invitePlatformAdmin,
  listPlatformAdmins,
  resolvePlatformAdminAccess,
  revokePlatformAdmin,
} from '../../platform/platform-admin.service';

const router = new Hono();

const InviteSchema = z.object({
  identifier: z.string().min(3).max(160),
  role:       z.nativeEnum(PlatformAdminRole).optional(),
  modules:    z.array(z.string().min(2).max(32)).optional(),
});

function parseModuleQuery(raw: string | undefined): PlatformAdminModule | undefined {
  if (!raw?.trim()) return undefined;
  const v = raw.trim().toLowerCase();
  const allowed = ['niaga', 'subscriptions', 'commercial', 'rd_applied', 'partners'] as const;
  if ((allowed as readonly string[]).includes(v)) {
    return v as PlatformAdminModule;
  }
  return undefined;
}

// GET /api/admin/access?module=niaga
router.get('/access', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const module = parseModuleQuery(c.req.query('module'));
    const access = await resolvePlatformAdminAccess({
      userId:    user.userId,
      isFounder: isFounderPayload(user),
      module,
    });

    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      operator:  'QIUBBX Technologies (M) Sdn Bhd',
      data:      access,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/admin/platform-admins — Founder only
router.get('/platform-admins', requireFounder, async (c) => {
  try {
    const admins = await listPlatformAdmins();
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { admins, total: admins.length },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/admin/platform-admins — Founder invite QIUBBX staff
router.post(
  '/platform-admins',
  requireFounder,
  zValidator('json', InviteSchema),
  async (c) => {
    const body = c.req.valid('json');
    const founder = getTokenUser(c);
    const createdBy = founder?.userId ?? founder?.name ?? 'founder';
    try {
      const admin = await invitePlatformAdmin({
        identifier: body.identifier,
        role:       body.role,
        modules:    normalizePlatformAdminModules(body.modules),
        createdBy,
      });
      return c.json({
        success:   true,
        kernel:    'ALAMTOLOGI',
        data:      admin,
        message:   `Invited ${admin.userId} as platform admin (${admin.role}).`,
        timestamp: new Date().toISOString(),
      }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invite failed.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/admin/platform-admins/:adminId/revoke — Founder only
router.post('/platform-admins/:adminId/revoke', requireFounder, async (c) => {
  const adminId = c.req.param('adminId') ?? '';
  const founder = getTokenUser(c);
  const revokedBy = founder?.userId ?? founder?.name ?? 'founder';
  try {
    await revokePlatformAdmin(adminId, revokedBy);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      message:   'Platform admin access revoked.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Revoke failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

export default router;
