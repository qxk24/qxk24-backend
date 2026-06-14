/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Teaching Upload Rate Limit
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

import type { Context, Next } from 'hono';
import { getTokenUser } from './auth.middleware';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

const hitsByKey = new Map<string, number[]>();

function pruneOld(timestamps: number[], now: number): number[] {
  const cutoff = now - WINDOW_MS;
  return timestamps.filter((t) => t > cutoff);
}

function clientKey(c: Context): string {
  const user = getTokenUser(c);
  if (user?.userId) return `user:${user.userId}`;
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return `ip:${forwarded}`;
  return `ip:${c.req.header('x-real-ip') ?? 'unknown'}`;
}

/** Limits parse-heavy uploads — single PM2 instance; in-memory window per user/IP. */
export async function uploadRateLimit(c: Context, next: Next): Promise<Response | void> {
  const key = clientKey(c);
  const now = Date.now();
  const prev = hitsByKey.get(key) ?? [];
  const recent = pruneOld(prev, now);

  if (recent.length >= MAX_PER_WINDOW) {
    return c.json({
      success: false,
      error:   'Too many uploads in a short period. Wait a minute and try again.',
      kernel:  'ALAMTOLOGI',
      limit:   { windowMs: WINDOW_MS, max: MAX_PER_WINDOW },
      timestamp: new Date().toISOString(),
    }, 429);
  }

  recent.push(now);
  hitsByKey.set(key, recent);
  await next();
}
