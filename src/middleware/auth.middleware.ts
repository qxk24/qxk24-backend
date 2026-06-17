/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Auth Middleware
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
 */

import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import { ENV } from '../config/environments';
import { resolvePlatformAdminAccess } from '../platform/platform-admin.service';

export interface QXK24TokenPayload {
  userId:       string;
  role:         string;
  name?:        string;
  isFounder?:   boolean;
  accountLane?: 'umum' | 'pelajar';
  appSource?:   string;
  iat?:         number;
  exp?:          number;
}

export function getTokenUser(c: Context): QXK24TokenPayload | null {
  return c.get('qxk24User') as QXK24TokenPayload | undefined ?? null;
}

export function isFounderPayload(user: QXK24TokenPayload | null): boolean {
  if (!user) return false;
  return user.role === 'founder' || user.isFounder === true;
}

export function isStudentPayload(user: QXK24TokenPayload | null): boolean {
  if (!user) return false;
  return user.role === 'student' && !user.isFounder;
}

export function isGuruPayload(user: QXK24TokenPayload | null): boolean {
  if (!user) return false;
  return user.role === 'guru' && !user.isFounder;
}

// ── Standard JWT Auth ─────────────────────────────────────
export async function requireAuth(
  c: Context,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: 'Authorization token required.',
      kernel: 'ALAMTOLOGI'
    }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, ENV.JWT_SECRET) as QXK24TokenPayload;
    c.set('qxk24User', decoded);
    await next();
  } catch {
    return c.json({
      success: false,
      error: 'Invalid or expired token.',
      kernel: 'ALAMTOLOGI'
    }, 401);
  }
}

// ── Founder Guard ─────────────────────────────────────────
export async function requireFounder(
  c: Context,
  next: Next
): Promise<Response | void> {
  const bearer = c.req.header('Authorization')?.split(' ')[1];
  const founderKey = c.req.header('X-Founder-Key');

  if (bearer) {
    try {
      const decoded = verify(bearer, ENV.JWT_SECRET) as QXK24TokenPayload;
      if (decoded.role === 'founder' || decoded.isFounder) {
        c.set('qxk24User', decoded);
        await next();
        return;
      }
    } catch {
      // Fall through to static founder token checks
    }
  }

  const validBearer =
    bearer && bearer === ENV.QXK24_PRODUCTION_BEARER_TOKEN;
  const validFounderKey =
    founderKey && founderKey === ENV.FOUNDER_SECRET_KEY;

  if (!validBearer && !validFounderKey) {
    return c.json({
      success: false,
      error: 'Founder access required.',
      kernel: 'ALAMTOLOGI'
    }, 403);
  }

  await next();
}

/** Founder JWT/static token, or invited QIUBBX platform admin (e.g. Kod Daftar operators). */
export async function requireFounderOrPlatformAdmin(
  c: Context,
  next: Next,
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
      const access = await resolvePlatformAdminAccess({
        userId:    decoded.userId,
        isFounder: false,
      });
      if (access.isPlatformAdmin && access.canAccess) {
        await next();
        return;
      }
    } catch {
      // Fall through to static founder token checks
    }
  }

  const validBearer =
    bearer && bearer === ENV.QXK24_PRODUCTION_BEARER_TOKEN;
  const validFounderKey =
    founderKey && founderKey === ENV.FOUNDER_SECRET_KEY;

  if (!validBearer && !validFounderKey) {
    return c.json({
      success: false,
      error:   'Admin access required.',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  await next();
}

// ── ADAM participant (Founder or Alamtologi student) ───────
export async function requireAdamUser(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error:   'Authorization token required.',
      kernel:  'ALAMTOLOGI',
    }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, ENV.JWT_SECRET) as QXK24TokenPayload;
    if (decoded.role !== 'founder' && decoded.role !== 'student' && decoded.role !== 'guru') {
      return c.json({
        success: false,
        error:   'ADAM access required.',
        kernel:  'ALAMTOLOGI',
      }, 403);
    }
    c.set('qxk24User', decoded);
    await next();
  } catch {
    return c.json({
      success: false,
      error:   'Invalid or expired token.',
      kernel:  'ALAMTOLOGI',
    }, 401);
  }
}

// ── ADAMGuru (teacher account) ─────────────────────────────
export async function requireGuru(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Authorization required.', kernel: 'ALAMTOLOGI' }, 401);
  }

  try {
    const decoded = verify(authHeader.split(' ')[1], ENV.JWT_SECRET) as QXK24TokenPayload;
    if (decoded.role !== 'guru' || decoded.isFounder) {
      return c.json({ success: false, error: 'Guru access required.', kernel: 'ALAMTOLOGI' }, 403);
    }
    c.set('qxk24User', decoded);
    await next();
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token.', kernel: 'ALAMTOLOGI' }, 401);
  }
}

// ── Student only ───────────────────────────────────────────
export async function requireStudent(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Authorization required.', kernel: 'ALAMTOLOGI' }, 401);
  }

  try {
    const decoded = verify(authHeader.split(' ')[1], ENV.JWT_SECRET) as QXK24TokenPayload;
    if (decoded.role !== 'student' || decoded.isFounder) {
      return c.json({ success: false, error: 'Student access required.', kernel: 'ALAMTOLOGI' }, 403);
    }
    c.set('qxk24User', decoded);
    await next();
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token.', kernel: 'ALAMTOLOGI' }, 401);
  }
}

/** Student or ADAMGuru teacher — learning desk + kelas */
export async function requireStudentOrGuru(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Authorization required.', kernel: 'ALAMTOLOGI' }, 401);
  }

  try {
    const decoded = verify(authHeader.split(' ')[1], ENV.JWT_SECRET) as QXK24TokenPayload;
    if (decoded.isFounder) {
      return c.json({ success: false, error: 'Student or guru access required.', kernel: 'ALAMTOLOGI' }, 403);
    }
    if (decoded.role !== 'student' && decoded.role !== 'guru') {
      return c.json({ success: false, error: 'Student or guru access required.', kernel: 'ALAMTOLOGI' }, 403);
    }
    c.set('qxk24User', decoded);
    await next();
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token.', kernel: 'ALAMTOLOGI' }, 401);
  }
}

// ── Service Token Guard ───────────────────────────────────
export async function requireServiceToken(
  c: Context,
  next: Next
): Promise<Response | void> {
  const bearer = c.req.header('Authorization')?.split(' ')[1];
  const appSource = c.req.header('X-App-Source');

  if (!bearer) {
    return c.json({
      success: false,
      error: 'Service token required.',
      kernel: 'ALAMTOLOGI'
    }, 401);
  }

  if (bearer !== ENV.QXK24_SERVICE_TOKEN) {
    return c.json({
      success: false,
      error: 'Invalid service token.',
      kernel: 'ALAMTOLOGI'
    }, 403);
  }

  if (!appSource) {
    return c.json({
      success: false,
      error: 'X-App-Source header required.',
      kernel: 'ALAMTOLOGI'
    }, 400);
  }

  c.set('appSource', appSource);
  c.set('isServiceCall', true);

  await next();
}

// ── Optional Auth ─────────────────────────────────────────
export async function optionalAuth(
  c: Context,
  next: Next
): Promise<void> {
  const bearer = c.req.header('Authorization')?.split(' ')[1];

  if (bearer) {
    try {
      const decoded = verify(
        bearer, ENV.JWT_SECRET
      ) as QXK24TokenPayload;
      c.set('qxk24User', decoded);
    } catch {
      // Silent — optional auth
    }
  }

  await next();
}