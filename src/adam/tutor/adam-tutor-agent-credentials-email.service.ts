/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Credentials Email
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../../config/environments';
import { isMailConfigured, sendMail } from '../adam-mail.service';
import type { ITutorAgent } from './adam-tutor-agent.schema';
import { newTutorAgentPortalToken } from './adam-tutor-agent.service';

function appUrl(): string {
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://www.qxk24.com').replace(/\/$/, '');
}

function agentPortalUrl(): string {
  return `${appUrl()}/adam/tutor/agen`;
}

function buildCredentialsHtml(input: {
  contactName: string;
  orgName:      string;
  agentCode:    string;
  portalToken:  string;
  portalUrl:    string;
  rotated:      boolean;
}): string {
  const intro = input.rotated
    ? 'Your agen portal token has been reset. Use the credentials below to sign in.'
    : 'Your ADAM Tutor agen account is active. Use the credentials below to sign in to the agen portal.';
  return `
<div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.6;">
  <p style="margin:0 0 16px;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6366f1;">
    Alamtologi · ADAM Tutor · Malaysia
  </p>
  <p style="margin:0 0 12px;">Hello ${input.contactName},</p>
  <p style="margin:0 0 12px;">${intro}</p>
  <p style="margin:0 0 16px;padding:12px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-size:0.875rem;color:#92400e;">
    <strong>For agen only.</strong> This email does <strong>not</strong> contain student registration PINs.
    To invite a student, open the agen portal → <strong>Send PIN to student</strong> (or ask Alamtologi admin).
  </p>
  <p style="margin:0 0 8px;font-weight:700;">Agen code</p>
  <p style="margin:0 0 16px;font-family:ui-monospace,monospace;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;">
    ${input.agentCode}
  </p>
  <p style="margin:0 0 8px;font-weight:700;">Portal token</p>
  <p style="margin:0 0 16px;font-family:ui-monospace,monospace;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;word-break:break-all;">
    ${input.portalToken}
  </p>
  <p style="margin:0 0 20px;color:#475569;">
    Keep your portal token private — like a password. Alamtologi admin generates student PINs from your package credits.
  </p>
  <p style="margin:0 0 24px;">
    <a href="${input.portalUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">
      Open agen portal
    </a>
  </p>
  <p style="margin:0 0 8px;font-size:0.875rem;color:#64748b;">
    Portal URL: <span style="word-break:break-all;">${input.portalUrl}</span>
  </p>
  <p style="margin:24px 0 0;font-size:0.875rem;color:#64748b;">
    — Alamtologi · ADAM Tutor · info@alamtologi.com
  </p>
</div>
  `.trim();
}

function buildCredentialsText(input: {
  contactName: string;
  orgName:      string;
  agentCode:    string;
  portalToken:  string;
  portalUrl:    string;
  rotated:      boolean;
}): string {
  const intro = input.rotated
    ? 'Your agen portal token has been reset.'
    : 'Your ADAM Tutor agen account is active.';
  return [
    `Hello ${input.contactName},`,
    '',
    intro,
    '',
    'FOR AGEN ONLY — this email does NOT contain student registration PINs.',
    'To invite a student: agen portal → Send PIN to student.',
    '',
    `Organisation: ${input.orgName}`,
    `Agen code: ${input.agentCode}`,
    `Portal token: ${input.portalToken}`,
    '',
    `Agen portal: ${input.portalUrl}`,
    '',
    'Keep your portal token private. Alamtologi admin generates student PINs from your package credits.',
    '',
    '— Alamtologi · ADAM Tutor',
  ].join('\n');
}

export async function sendTutorAgentPortalCredentialsEmail(
  agent: ITutorAgent,
  options: { rotated?: boolean } = {},
): Promise<{ sent: boolean; email: string }> {
  const email = agent.email.trim().toLowerCase();
  if (!isMailConfigured()) {
    return { sent: false, email };
  }

  const html = buildCredentialsHtml({
    contactName: agent.contactName,
    orgName:     agent.orgName,
    agentCode:   agent.agentCode,
    portalToken: agent.portalToken,
    portalUrl:   agentPortalUrl(),
    rotated:     options.rotated === true,
  });
  const text = buildCredentialsText({
    contactName: agent.contactName,
    orgName:     agent.orgName,
    agentCode:   agent.agentCode,
    portalToken: agent.portalToken,
    portalUrl:   agentPortalUrl(),
    rotated:     options.rotated === true,
  });

  const result = await sendMail({
    to:      email,
    subject: `ADAM Tutor agen portal — ${agent.orgName}`,
    html,
    text,
  });

  return { sent: result.sent, email };
}

export async function rotateAndEmailTutorAgentPortalCredentials(
  agent: ITutorAgent,
): Promise<{ agent: ITutorAgent; sent: boolean; email: string }> {
  agent.portalToken = newTutorAgentPortalToken();
  await agent.save();

  const { sent, email } = await sendTutorAgentPortalCredentialsEmail(agent, { rotated: true });
  if (!sent) {
    throw new Error('Email is not configured or failed to send. Token was reset — contact Alamtologi admin.');
  }

  return { agent, sent, email };
}
