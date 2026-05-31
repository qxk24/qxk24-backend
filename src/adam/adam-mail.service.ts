/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Mail Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';

export function isMailConfigured(): boolean {
  return Boolean(ENV.RESEND_API_KEY.trim() && ENV.MAIL_FROM.trim());
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  studentName: string,
): Promise<boolean> {
  const apiKey = ENV.RESEND_API_KEY.trim();
  const from = ENV.MAIL_FROM.trim();
  if (!apiKey || !from) return false;

  const html = `
<p>Assalamualaikum ${studentName},</p>
<p>P.alt requested a password reset for your ADAM Lab account.</p>
<p><a href="${resetUrl}">Reset your password</a></p>
<p>This link expires in ${ENV.ADAM_PASSWORD_RESET_TTL_MINUTES} minutes. If you did not request this, ignore this email.</p>
<p>— QXK24 · ADAM Lab</p>
  `.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to:      [to],
        subject: 'Reset your ADAM Lab password',
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[adam:mail] password reset send failed', res.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[adam:mail] password reset send error', err);
    return false;
  }
}
