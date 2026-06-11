/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Account Lane Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
 * ============================================================
 */

import type { Context } from 'hono';
import { getTokenUser } from '../middleware/auth.middleware';
import { getAccountLane } from './adam-student-registry.service';
import type { AdamAccountLane } from './adam-student.types';

export async function resolveRequestAccountLane(c: Context): Promise<AdamAccountLane> {
  const user = getTokenUser(c);
  if (!user?.userId) return 'umum';
  const jwtLane = (user as { accountLane?: string }).accountLane;
  if (jwtLane === 'pelajar' || jwtLane === 'umum') return jwtLane;
  return getAccountLane(user.userId);
}

export function laneMismatchResponse(c: Context, expected: AdamAccountLane) {
  const label = expected === 'pelajar' ? 'ADAM Tutor (pelajar)' : 'ADAM Learn (umum)';
  return c.json({
    success: false,
    error:   `Akaun ini untuk ${label} sahaja. Sila gunakan pintu masuk yang betul.`,
    kernel:  'ALAMTOLOGI',
    accountLane: expected,
  }, 403);
}

/** Student-role accounts only — guru/founder bypass. */
export async function guardUmumLane(c: Context): Promise<Response | null> {
  const user = getTokenUser(c);
  if (!user || user.role !== 'student') return null;
  const lane = await resolveRequestAccountLane(c);
  if (lane !== 'umum') return laneMismatchResponse(c, 'umum');
  return null;
}

export async function guardPelajarLane(c: Context): Promise<Response | null> {
  const lane = await resolveRequestAccountLane(c);
  if (lane !== 'pelajar') return laneMismatchResponse(c, 'pelajar');
  return null;
}
