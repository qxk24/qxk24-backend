/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Platform Admin Middleware
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import { ENV } from '../config/environments';
import {
  getTokenUser,
  isFounderPayload,
  type QXK24TokenPayload,
} from './auth.middleware';
import { platformAdminCanAccessModule } from '../platform/platform-admin.service';
import type { PlatformAdminModule } from '../platform/platform-admin.types';

async function allowPlatformAdminBearer(
  c: Context,
  next: Next,
  module?: PlatformAdminModule,
): Promise<Response | void> {
  const bearer = c.req.header('Authorization')?.split(' ')[1];
  const founderKey = c.req.header('X-Founder-Key');

  if (bearer) {
    try {
      const decoded = verify(bearer, ENV.JWT_SECRET) as QXK24TokenPayload;
      c.set('qxk24User', decoded);

      if (isFounderPayload(decoded)) {
        await next();
        return;
      }

      if (decoded.role === 'student' || decoded.role === 'guru') {
        const allowed = module
          ? await platformAdminCanAccessModule(decoded.userId, module)
          : await import('../platform/platform-admin.service').then((m) =>
              m.isActivePlatformAdmin(decoded.userId),
            );
        if (allowed) {
          await next();
          return;
        }
      }
    } catch {
      // Fall through to static founder token checks
    }
  }

  const validBearer =
    bearer && bearer === ENV.QXK24_PRODUCTION_BEARER_TOKEN;
  const validFounderKey =
    founderKey && founderKey === ENV.FOUNDER_SECRET_KEY;

  if (validBearer || validFounderKey) {
    await next();
    return;
  }

  return c.json({
    success: false,
    error:   module
      ? `QIUBBX platform admin access required for module: ${module}.`
      : 'QIUBBX platform admin access required.',
    kernel:  'ALAMTOLOGI',
  }, 403);
}

/** Hub access — any invited platform operator or Founder */
export async function requirePlatformAdmin(
  c: Context,
  next: Next,
): Promise<Response | void> {
  return allowPlatformAdminBearer(c, next);
}

/** Module-scoped console (niaga, commercial, subscriptions, …) */
export function requirePlatformAdminModule(module: PlatformAdminModule) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    return allowPlatformAdminBearer(c, next, module);
  };
}

/** @deprecated Use requirePlatformAdminModule('niaga') */
export async function requireNiagaPlatformAdmin(
  c: Context,
  next: Next,
): Promise<Response | void> {
  return allowPlatformAdminBearer(c, next, 'niaga');
}

export { getTokenUser, isFounderPayload };
