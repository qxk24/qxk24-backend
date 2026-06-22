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

/** Shown in admin/agent UI after Resend accepts the send. */
export const ADAM_MAIL_INBOX_HINT =
  'If it is not in Inbox within 2 minutes, check Spam/Promotions and search "ADAM Tutor".';

export interface SendMailResult {
  sent:   boolean;
  id?:    string;
  error?: string;
}

interface SendMailOptions {
  to:       string;
  subject:  string;
  html:     string;
  text?:    string;
  /** When set, used as-is (e.g. enterprise architect). Omit for transactional tutor mail. */
  replyTo?: string;
}

export function extractMailDomain(addressOrFrom: string): string | null {
  const match = addressOrFrom.match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
  return match?.[1]?.toLowerCase() ?? null;
}

/**
 * Reply-To must share the verified Resend FROM domain — otherwise Gmail often hides the message.
 * Production uses updates.alamtologi.com while MAIL_REPLY_TO may still point at the root domain.
 */
export function resolveMailReplyToForDomains(
  fromAddress: string,
  envReplyTo?: string,
  explicit?: string,
): string {
  const fromDomain = extractMailDomain(fromAddress);
  const candidate = explicit?.trim() || envReplyTo?.trim() || '';

  if (candidate) {
    const replyDomain = extractMailDomain(candidate);
    if (fromDomain && replyDomain && replyDomain !== fromDomain) {
      return `info@${fromDomain}`;
    }
    return candidate;
  }

  return fromDomain ? `info@${fromDomain}` : 'info@alamtologi.com';
}

export function resolveMailReplyTo(explicit?: string): string {
  return resolveMailReplyToForDomains(
    ENV.MAIL_FROM.trim(),
    ENV.MAIL_REPLY_TO?.trim(),
    explicit,
  );
}

export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const apiKey = ENV.RESEND_API_KEY.trim();
  const from = ENV.MAIL_FROM.trim();
  if (!apiKey || !from) {
    return { sent: false, error: 'RESEND_API_KEY or MAIL_FROM is not configured.' };
  }

  const replyTo = options.replyTo?.trim()
    ? options.replyTo.trim()
    : resolveMailReplyTo();

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

    const bodyText = await res.text().catch(() => '');
    if (!res.ok) {
      let detail = bodyText.slice(0, 300);
      try {
        const parsed = JSON.parse(bodyText) as { message?: string };
        if (parsed.message) detail = parsed.message;
      } catch {
        /* keep raw slice */
      }
      console.warn('[adam:mail] send failed', res.status, detail);
      return { sent: false, error: detail || `Resend HTTP ${res.status}` };
    }

    let id: string | undefined;
    try {
      const parsed = JSON.parse(bodyText) as { id?: string };
      id = parsed.id;
    } catch {
      /* non-json success body */
    }

    console.log(
      `[adam:mail] sent id=${id ?? 'unknown'} to=${options.to} replyTo=${replyTo} fromDomain=${extractMailDomain(from) ?? '?'}`,
    );
    return { sent: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[adam:mail] send error', message);
    return { sent: false, error: message };
  }
}

export async function sendEnterpriseWelcomeEmail(
  data: EnterpriseWelcomeData,
): Promise<boolean> {
  if (!isMailConfigured()) return false;

  const html = buildEnterpriseWelcomeHtml(data);
  const text = buildEnterpriseWelcomeText(data);
  const result = await sendMail({
    to:       data.email,
    subject:  `Your ADAM Enterprise deployment starts now — ${data.orgName}`,
    html,
    text,
    replyTo:  data.architectEmail,
  });

  if (result.sent) {
    console.log(`[ADAM Mail] Enterprise welcome sent → ${data.email} (${data.orgName})`);
  }
  return result.sent;
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

  const result = await sendMail({
    to,
    subject: 'Reset your ADAM Lab password',
    html,
  });
  return result.sent;
}
