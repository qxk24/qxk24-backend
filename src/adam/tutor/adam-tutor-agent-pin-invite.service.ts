/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent PIN Invite Service
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
import {
  TutorRegisterCodeModel,
  TutorRegisterCodeStatus,
  type ITutorRegisterCode,
} from './adam-tutor-register-code.schema';
import { TUTOR_REGISTER_BAND_LABELS_BM } from './adam-tutor-register.constants';

const BAND_LABELS_EN: Record<string, string> = {
  primary:    'Primary school',
  secondary:  'Secondary school',
  university: 'College & university',
};

function appUrl(): string {
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
}

function normalizeRegisterCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function buildTutorRegisterLoginUrl(registerCode: string): string {
  const code = normalizeRegisterCode(registerCode);
  const registerPath = `/adam/tutor/daftar?pin=${encodeURIComponent(code)}`;
  const loginPath = `/login?next=${encodeURIComponent(registerPath)}`;
  return `${appUrl()}${loginPath}`;
}

export interface TutorAgentAvailablePinRow {
  codeId:             string;
  registerCode:       string;
  band:               string;
  bandLabel:          string;
  invitedEmail:       string | null;
  invitedAt:          string | null;
  invitedStudentName: string | null;
  createdAt:          string;
}

export async function listAgentAvailableRegisterCodes(
  agentId: string,
  limit = 200,
): Promise<TutorAgentAvailablePinRow[]> {
  const docs = await TutorRegisterCodeModel.find({
    agentId,
    status: TutorRegisterCodeStatus.AVAILABLE,
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 500))
    .lean();

  return docs.map((doc) => ({
    codeId:             doc.codeId,
    registerCode:       doc.registerCode,
    band:               doc.band,
    bandLabel:          BAND_LABELS_EN[doc.band] ?? TUTOR_REGISTER_BAND_LABELS_BM[doc.band] ?? doc.band,
    invitedEmail:       doc.invitedEmail ?? null,
    invitedAt:          doc.invitedAt ? doc.invitedAt.toISOString() : null,
    invitedStudentName: doc.invitedStudentName ?? null,
    createdAt:          doc.createdAt.toISOString(),
  }));
}

function buildPinInviteHtml(input: {
  studentName:  string;
  orgName:      string;
  contactName:  string;
  registerCode: string;
  bandLabel:    string;
  registerUrl:  string;
}): string {
  const greeting = input.studentName ? `Hello ${input.studentName},` : 'Hello,';
  return `
<div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.6;">
  <p style="margin:0 0 16px;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6366f1;">
    Alamtologi · ADAM Tutor · Malaysia
  </p>
  <p style="margin:0 0 12px;">${greeting}</p>
  <p style="margin:0 0 12px;">
    <strong>${input.orgName}</strong> (${input.contactName}) has invited you to register for
    <strong>ADAM Tutor</strong> — ${input.bandLabel}.
  </p>
  <p style="margin:0 0 8px;font-weight:700;">Your registration PIN</p>
  <p style="margin:0 0 16px;font-size:1.25rem;font-family:ui-monospace,monospace;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;">
    ${input.registerCode}
  </p>
  <p style="margin:0 0 20px;color:#475569;">
    1 PIN = 1 student account · not shareable. Click below to sign in (or create an account), then complete payment.
  </p>
  <p style="margin:0 0 24px;">
    <a href="${input.registerUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">
      Register &amp; pay for ADAM Tutor
    </a>
  </p>
  <p style="margin:0 0 8px;font-size:0.875rem;color:#64748b;">
    Or copy this link:<br />
    <span style="word-break:break-all;">${input.registerUrl}</span>
  </p>
  <p style="margin:24px 0 0;font-size:0.875rem;color:#64748b;">
    — Alamtologi · ADAM Tutor
  </p>
</div>
  `.trim();
}

function buildPinInviteText(input: {
  studentName:  string;
  orgName:      string;
  contactName:  string;
  registerCode: string;
  bandLabel:    string;
  registerUrl:  string;
}): string {
  const greeting = input.studentName ? `Hello ${input.studentName},` : 'Hello,';
  return [
    greeting,
    '',
    `${input.orgName} (${input.contactName}) has invited you to register for ADAM Tutor — ${input.bandLabel}.`,
    '',
    `Your registration PIN: ${input.registerCode}`,
    '',
    '1 PIN = 1 student account · not shareable.',
    '',
    `Register & pay: ${input.registerUrl}`,
    '',
    '— Alamtologi · ADAM Tutor',
  ].join('\n');
}

export async function sendTutorAgentPinInvite(
  agent: ITutorAgent,
  input: {
    registerCode: string;
    studentEmail: string;
    studentName?: string;
  },
): Promise<{ registerCode: string; studentEmail: string; registerUrl: string }> {
  if (!isMailConfigured()) {
    throw new Error('Email is not configured on the server. Contact Alamtologi admin.');
  }

  const registerCode = normalizeRegisterCode(input.registerCode);
  const studentEmail = normalizeEmail(input.studentEmail);
  const studentName = input.studentName?.trim() || '';

  if (!registerCode || registerCode.length < 8) {
    throw new Error('Select a valid PIN.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
    throw new Error('Enter a valid student email address.');
  }

  const doc = await TutorRegisterCodeModel.findOne({ registerCode });
  if (!doc) throw new Error('PIN not found.');
  if (doc.agentId !== agent.agentId) {
    throw new Error('This PIN does not belong to your agen account.');
  }
  if (doc.status !== TutorRegisterCodeStatus.AVAILABLE) {
    throw new Error('This PIN is no longer available.');
  }

  const bandLabel = BAND_LABELS_EN[doc.band] ?? TUTOR_REGISTER_BAND_LABELS_BM[doc.band] ?? doc.band;
  const registerUrl = buildTutorRegisterLoginUrl(registerCode);

  const html = buildPinInviteHtml({
    studentName,
    orgName:      agent.orgName,
    contactName:  agent.contactName,
    registerCode,
    bandLabel,
    registerUrl,
  });
  const text = buildPinInviteText({
    studentName,
    orgName:      agent.orgName,
    contactName:  agent.contactName,
    registerCode,
    bandLabel,
    registerUrl,
  });

  const sent = await sendMail({
    to:       studentEmail,
    subject:  `Your ADAM Tutor PIN — ${agent.orgName}`,
    html,
    text,
    replyTo:  agent.email,
  });

  if (!sent) {
    throw new Error('Failed to send email. Try again or contact Alamtologi admin.');
  }

  doc.invitedEmail = studentEmail;
  doc.invitedAt = new Date();
  doc.invitedStudentName = studentName || null;
  await doc.save();

  return { registerCode, studentEmail, registerUrl };
}

export function serializeAvailablePin(doc: ITutorRegisterCode): TutorAgentAvailablePinRow {
  return {
    codeId:             doc.codeId,
    registerCode:       doc.registerCode,
    band:               doc.band,
    bandLabel:          BAND_LABELS_EN[doc.band] ?? TUTOR_REGISTER_BAND_LABELS_BM[doc.band] ?? doc.band,
    invitedEmail:       doc.invitedEmail ?? null,
    invitedAt:          doc.invitedAt ? doc.invitedAt.toISOString() : null,
    invitedStudentName: doc.invitedStudentName ?? null,
    createdAt:          doc.createdAt.toISOString(),
  };
}
