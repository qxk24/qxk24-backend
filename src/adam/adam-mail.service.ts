/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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
import {
  buildEnterpriseWelcomeHtml,
  buildEnterpriseWelcomeText,
  type EnterpriseWelcomeData,
} from './adam-mail-templates-enterprise';

export function isMailConfigured(): boolean {
  return Boolean(ENV.RESEND_API_KEY.trim() && ENV.MAIL_FROM.trim());
}

interface SendMailOptions {
  to:       string;
  subject:  string;
  html:     string;
  text?:    string;
  replyTo?: string;
}

export async function sendMail(options: SendMailOptions): Promise<boolean> {
  const apiKey = ENV.RESEND_API_KEY.trim();
  const from = ENV.MAIL_FROM.trim();
  if (!apiKey || !from) return false;

  const replyTo = options.replyTo?.trim()
    || ENV.MAIL_REPLY_TO?.trim()
    || 'enterprise@alamtologi.com';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to:       [options.to],
        reply_to: replyTo,
        subject:  options.subject,
        html:     options.html,
        ...(options.text ? { text: options.text } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[adam:mail] send failed', res.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[adam:mail] send error', err);
    return false;
  }
}

export async function sendEnterpriseWelcomeEmail(
  data: EnterpriseWelcomeData,
): Promise<boolean> {
  if (!isMailConfigured()) return false;

  const html = buildEnterpriseWelcomeHtml(data);
  const text = buildEnterpriseWelcomeText(data);
  const ok = await sendMail({
    to:       data.email,
    subject:  `Your ADAM Enterprise deployment starts now — ${data.orgName}`,
    html,
    text,
    replyTo:  data.architectEmail,
  });

  if (ok) {
    console.log(`[ADAM Mail] Enterprise welcome sent → ${data.email} (${data.orgName})`);
  }
  return ok;
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
<p>— Alamtologi · ADAM Lab</p>
  `.trim();

  try {
    return sendMail({
      to,
      subject: 'Reset your ADAM Lab password',
      html,
      replyTo: ENV.MAIL_REPLY_TO?.trim() || 'support@alamtologi.com',
    });
  } catch (err) {
    console.warn('[adam:mail] password reset send error', err);
    return false;
  }
}
