/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Student Auth Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

import { sign } from 'jsonwebtoken';
import { ENV } from '../config/environments';
import type { AdamAuthUser } from './adam-student.types';
import {
  FOUNDER_USER_ID,
  STUDENT_ACCOUNTS,
  type StudentUserId,
} from './adam-student.types';

function parseStudentPasswords(): Record<string, string> {
  const raw = process.env.STUDENT_PASSWORDS ?? '';
  const map: Record<string, string> = {};

  if (raw.trim().startsWith('{')) {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return map;
    }
  }

  for (const part of raw.split(',')) {
    const [id, pass] = part.split(':').map((s) => s.trim());
    if (id && pass) map[id] = pass;
  }

  for (const s of STUDENT_ACCOUNTS) {
    const envKey = `STUDENT_PASSWORD_${s.userId.toUpperCase().replace(/-/g, '_')}`;
    const single = process.env[envKey];
    if (single) map[s.userId] = single;
  }

  return map;
}

export function getStudentAccount(userId: string) {
  return STUDENT_ACCOUNTS.find((s) => s.userId === userId);
}

export function verifyStudentPassword(userId: string, password: string): boolean {
  const map = parseStudentPasswords();
  const expected = map[userId];
  return Boolean(expected && password === expected);
}

export function issueAdamToken(user: AdamAuthUser): string {
  return sign(
    {
      userId:    user.userId,
      role:      user.role,
      isFounder: user.isFounder,
      name:      user.name,
      kernel:    ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
    },
    ENV.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

export function studentIds(): StudentUserId[] {
  return STUDENT_ACCOUNTS.map((s) => s.userId);
}

export function isFounderUserId(userId: string): boolean {
  return userId === FOUNDER_USER_ID;
}
