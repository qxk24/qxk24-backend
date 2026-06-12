/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Site Helper Rate Limit
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 40;

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(ip: string): string {
  return ip.trim() || 'unknown';
}

export function checkSiteHelperRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const key = clientKey(ip);
  const now = Date.now();
  const row = buckets.get(key);

  if (!row || now >= row.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (row.count >= MAX_PER_WINDOW) {
    return {
      allowed:       false,
      retryAfterSec: Math.ceil((row.resetAt - now) / 1000),
    };
  }

  row.count += 1;
  return { allowed: true };
}
