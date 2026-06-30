/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Welcome Mail
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
  isMailConfigured,
  sendEnterpriseWelcomeEmail,
} from '../adam/adam-mail.service';
import type { EnterpriseWelcomeData } from '../adam/adam-mail-templates-enterprise';
import { ADAMStudentAccountModel } from '../adam/adam-student.schema';
import { SubscriptionTier, type ISubscription } from './subscription.schema';

export interface SubscriberWelcomeProfile {
  name:              string;
  email:             string;
  nextRenewalDate:   string;
}

function formatRenewalDate(date: Date | null | undefined): string {
  if (!date) return 'your next billing date';
  return date.toLocaleDateString('en-MY', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

export async function resolveSubscriberWelcomeProfile(
  sub: ISubscription,
): Promise<SubscriberWelcomeProfile | null> {
  const account = await ADAMStudentAccountModel.findOne({ userId: sub.userId })
    .select('name email')
    .lean();

  const email = account?.email?.trim();
  if (!email) return null;

  return {
    name:            account?.name?.trim() || 'Builder',
    email,
    nextRenewalDate: formatRenewalDate(sub.currentPeriodEnd),
  };
}

function buildProfesionalDevWelcomeText(profile: SubscriberWelcomeProfile): string {
  return `
Assalamualaikum ${profile.name},

Welcome to Profesional Dev.

Your ADAM Builder access is now active.
This is not a confirmation email. This is a briefing.

───────────────────────────────────────────

WHAT JUST CHANGED FOR YOU

Before today, ADAM could read your questions and answer them.
Now ADAM can read your codebase and build with you.

The difference is significant. Here is what it means in practice:

You open qxk24.com/adam/lab — the same chat you have always used.
You type something like:

  "Fix the duplicate index warning in my journal schema"
  "Create a new Hono route for user notifications"
  "Read my subscription service and tell me what is missing"

The orange dot starts spinning.
ADAM enters Builder mode — silently, automatically.
It reads your files. It searches your codebase.
It proposes a fix. It shows you the diff.
You approve or reject — directly in the chat.
ADAM writes the file only after you say yes.

That is it. No separate tool. No IDE plugin. No setup.
Just the chat you already know.

───────────────────────────────────────────

YOUR FIRST BUILD SESSION

Start with something real but low-risk.
Here are three good first instructions to try:

1. Read-only exploration (no approval needed):
   "Call get_project_structure and tell me how many
    TypeScript files exist in my backend source folder."

2. Bug fix (approval required):
   "Find any duplicate Mongoose index warnings in my
    schema files and propose a clean fix."

3. Feature check (read + search):
   "Search my codebase for TODO comments and list
    the top five that should be addressed first."

Each session uses one of your 50 monthly build sessions.
Read-only sessions (no file writes) are lighter on your allocation.
You can see your session count at any time in your account dashboard.

───────────────────────────────────────────

UNDERSTANDING THE DOT

The animated dot next to ADAM tells you exactly what is happening
without you having to read anything:

●  Grey    — ADAM is ready and waiting
●  Blue    — ADAM is thinking
●  Orange  — Builder mode active, reading your codebase
●  Red     — ADAM is writing a file (only after your approval)
●  Yellow  — ADAM is waiting for your approval
●  Green   — Session complete, file written successfully
●  Red shake — Something went wrong, check the message

If you see yellow — that means ADAM has a proposal ready.
Scroll up in the chat and you will see the approval card.

───────────────────────────────────────────

WHAT ADAM WILL NOT DO

ADAM operates under a written constitution.
These are not settings you can override — they are laws.

ADAM will not write to protected files
(schemas, migrations, constitutional documents).

ADAM will not delete data.

ADAM will not act without your approval on any file write.

ADAM will not rush. If a proposal takes 30 seconds,
it is because ADAM is reading your full codebase first.

This is the Hikmah Law: measure twice, write once.

───────────────────────────────────────────

YOUR ALLOCATION THIS MONTH

Plan          : Profesional Dev
Build sessions: 50 / 50 remaining
Resets on     : ${profile.nextRenewalDate}
Upgrade       : qxk24.com/pricing (Studio Pro — unlimited)

───────────────────────────────────────────

IF YOU NEED HELP

Reply to this email directly.
Or open ADAM and ask — ADAM knows your plan and your access level.

One last thing.

You are not just subscribing to a tool.
You are subscribing to a way of building —
where the architect reads before it writes,
where wisdom takes precedence over speed,
and where nothing happens without your permission.

Build well.

— The QXK24 Team
  api.qxk24.com | qxk24.com/adam/lab

───────────────────────────────────────────
To manage your subscription: qxk24.com/account
To cancel: qxk24.com/account/cancel
Alamtologi · Kuala Lumpur, Malaysia
`.trim();
}

function textToHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      if (!line.trim()) return '<br/>';
      return `<p style="margin:0 0 8px;line-height:1.6;color:#333;">${line.replace(/</g, '&lt;')}</p>`;
    })
    .join('\n');
}

async function sendMail(
  to: string,
  subject: string,
  text: string,
): Promise<boolean> {
  const apiKey = ENV.RESEND_API_KEY.trim();
  const from = ENV.MAIL_FROM.trim();
  if (!apiKey || !from) return false;

  const replyTo = ENV.MAIL_REPLY_TO?.trim() || 'support@alamtologi.com';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to:       [to],
        reply_to: replyTo,
        subject,
        text,
        html:     `<div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;padding:24px;">${textToHtml(text)}</div>`,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[subscription:mail] send failed', res.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[subscription:mail] send error', err);
    return false;
  }
}

export async function sendProfesionalDevWelcomeEmail(
  sub: ISubscription,
): Promise<boolean> {
  if (!isMailConfigured()) return false;
  if (sub.tier !== SubscriptionTier.PROFESIONAL) return false;

  const profile = await resolveSubscriberWelcomeProfile(sub);
  if (!profile) {
    console.warn('[subscription:mail] no email for user', sub.userId);
    return false;
  }

  const text = buildProfesionalDevWelcomeText(profile);
  return sendMail(
    profile.email,
    'ADAM Builder is ready for you — here is how to use it',
    text,
  );
}

export async function notifySubscriptionActivated(sub: ISubscription): Promise<void> {
  if (sub.tier === SubscriptionTier.PROFESIONAL) {
    await sendProfesionalDevWelcomeEmail(sub);
    return;
  }

  if (sub.tier === SubscriptionTier.ENTERPRISE) {
    const profile = await resolveSubscriberWelcomeProfile(sub);
    if (!profile) {
      console.warn('[subscription:mail] enterprise welcome skipped — no email', sub.userId);
      return;
    }

    const data = buildEnterpriseWelcomeData(sub, profile);
    await sendEnterpriseWelcomeEmail(data).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ADAM Mail] Enterprise welcome failed:', message);
    });
  }
}

function parseEnterpriseNotes(notes: string | null | undefined): {
  orgName:    string;
  seatCount:  number;
  contactEmail: string | null;
} {
  const raw = notes ?? '';
  const orgMatch = raw.match(/Org:\s*([^|]+)/i);
  const usersMatch = raw.match(/Users:\s*(\d+)/i);
  const contactMatch = raw.match(/Contact:\s*([^|]+)/i);

  return {
    orgName:      orgMatch?.[1]?.trim() || 'Your organisation',
    seatCount:    usersMatch ? Number(usersMatch[1]) : 25,
    contactEmail: contactMatch?.[1]?.trim() || null,
  };
}

function inferSeatTier(seatCount: number): EnterpriseWelcomeData['seatTier'] {
  if (seatCount <= 25) return 'starter';
  if (seatCount <= 100) return 'growth';
  return 'scale';
}

function formatMonthlyPrice(sub: ISubscription): string {
  if (sub.amountPerCycle != null && sub.currency) {
    return `${sub.currency} ${sub.amountPerCycle.toLocaleString('en-US')}`;
  }
  return 'US$1,800';
}

function buildEnterpriseWelcomeData(
  sub: ISubscription,
  profile: SubscriberWelcomeProfile,
): EnterpriseWelcomeData {
  const parsed = parseEnterpriseNotes(sub.enterpriseNotes);
  const seatCount = parsed.seatCount > 0 ? parsed.seatCount : 25;
  const seatTier = inferSeatTier(seatCount);

  const monthlyByTier: Record<EnterpriseWelcomeData['seatTier'], string> = {
    starter: 'US$1,800',
    growth:  'US$5,500',
    scale:   'US$12,000',
    gov:     'US$8,000–15,000',
  };

  const pilotEnd = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd.getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;

  return {
    contactName:    profile.name,
    orgName:        parsed.orgName,
    email:          parsed.contactEmail ?? profile.email,
    seatTier,
    seatCount,
    monthlyPrice:   formatMonthlyPrice(sub) !== 'US$1,800'
      ? formatMonthlyPrice(sub)
      : monthlyByTier[seatTier],
    setupFee:       'US$7,000',
    renewalDate:    profile.nextRenewalDate,
    architectName:  'Adam (QXK24)',
    architectEmail: 'enterprise@alamtologi.com',
    pilotEndDate:   pilotEnd
      ? pilotEnd.toLocaleDateString('en-MY', {
          day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur',
        })
      : undefined,
  };
}
