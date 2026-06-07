/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Password Reset Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../config/environments';
import { ADAMStudentAccountModel } from './adam-student.schema';
import { ADAMPasswordResetModel } from './adam-password-reset.schema';
import { isMailConfigured, sendPasswordResetEmail } from './adam-mail.service';
import { resetStudentPasswordWithToken, changeStudentPassword } from './adam-student-registry.service';

export function isPasswordResetEnabled(): boolean {
  return ENV.ADAM_PASSWORD_RESET_ENABLED && isMailConfigured();
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildResetUrl(token: string, stack: 'lab' | 'production'): string {
  const base = ENV.ADAM_WEB_BASE_URL.replace(/\/$/, '');
  const q = new URLSearchParams({ token, stack });
  return `${base}/reset-password?${q.toString()}`;
}

/** Always returns generic success — no email enumeration. */
export async function requestStudentPasswordReset(
  email: string,
  stack: 'lab' | 'production' = 'lab',
): Promise<{ sent: boolean; message: string }> {
  const normalized = email.trim().toLowerCase();
  const generic = 'If that email is registered, a reset link has been sent.';

  if (!isPasswordResetEnabled()) {
    return {
      sent:    false,
      message: 'Password reset email is not configured. Ask P.alt to reset your password in the Students panel.',
    };
  }

  const student = await ADAMStudentAccountModel.findOne({
    email:  normalized,
    active: true,
  }).lean();

  if (!student) {
    return { sent: true, message: generic };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ENV.ADAM_PASSWORD_RESET_TTL_MINUTES * 60_000);

  await ADAMPasswordResetModel.deleteMany({ userId: student.userId, usedAt: { $exists: false } });
  await ADAMPasswordResetModel.create({
    userId:    student.userId,
    tokenHash,
    expiresAt,
  });

  const resetUrl = buildResetUrl(token, stack);
  const sent = await sendPasswordResetEmail(normalized, resetUrl, student.name);

  return sent
    ? { sent: true, message: generic }
    : {
        sent:    false,
        message: 'Could not send reset email. Try again later or ask P.alt to reset your password.',
      };
}

export async function completeStudentPasswordReset(
  token: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashToken(token.trim());
  const row = await ADAMPasswordResetModel.findOne({
    tokenHash,
    usedAt:    { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!row) {
    throw new Error('Reset link is invalid or expired.');
  }

  await resetStudentPasswordWithToken(row.userId, newPassword);
  row.usedAt = new Date();
  await row.save();
}

export { changeStudentPassword };
