/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Parent Access Middleware (ERA_2i)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { Context, Next } from 'hono';
import { resolveParentGuardianByToken } from '../adam/tutor/adam-tutor-parent.service';
import type { ITutorParentGuardian } from '../adam/tutor/adam-tutor-parent-guardian.schema';

export function parentAccessTokenFromRequest(c: Context): string | null {
  const header = c.req.header('X-Parent-Access-Token')?.trim();
  if (header) return header;
  const auth = c.req.header('Authorization')?.trim();
  if (auth?.toLowerCase().startsWith('parent ')) {
    return auth.slice(7).trim();
  }
  const query = c.req.query('access')?.trim();
  return query || null;
}

export async function requireParentGuardian(c: Context, next: Next) {
  const token = parentAccessTokenFromRequest(c);
  const guardian = await resolveParentGuardianByToken(token);
  if (!guardian) {
    return c.json({
      success: false,
      error:   'Akses penjaga tidak sah. Gunakan pautan atau token dari pendaftaran.',
      kernel:  'ALAMTOLOGI',
    }, 401);
  }
  c.set('parentGuardian', guardian);
  await next();
}

export function getParentGuardian(c: Context): ITutorParentGuardian {
  return c.get('parentGuardian') as ITutorParentGuardian;
}
