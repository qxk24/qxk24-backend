/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Founder Auth Helpers
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';

/** Trim BOM/whitespace; unwrap stray quotes if dotenv did not parse them. */
export function normalizeEnvSecret(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  let value = raw.replace(/^\uFEFF/, '').trim();
  if (!value) return undefined;
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

export function getFounderPassword(): string | undefined {
  return normalizeEnvSecret(process.env.FOUNDER_PASSWORD);
}

export function verifyFounderPassword(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
