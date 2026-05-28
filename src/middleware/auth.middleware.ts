/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
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

export interface QXK24TokenPayload {
  userId: string;
  role: string;
  isFounder?: boolean;
  appSource?: string;
  iat?: number;
  exp?: number;
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
      kernel: 'QXK24'
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
      kernel: 'QXK24'
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
      kernel: 'QXK24'
    }, 403);
  }

  await next();
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
      kernel: 'QXK24'
    }, 401);
  }

  if (bearer !== ENV.QXK24_SERVICE_TOKEN) {
    return c.json({
      success: false,
      error: 'Invalid service token.',
      kernel: 'QXK24'
    }, 403);
  }

  if (!appSource) {
    return c.json({
      success: false,
      error: 'X-App-Source header required.',
      kernel: 'QXK24'
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