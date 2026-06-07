/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Tester Account Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  SubscriptionModel,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
  PaymentProvider,
  SupportedRegion,
  PencarianStage,
  FOUNDER_SUBSCRIPTION_ID,
} from '../subscriptions/subscription.schema';
import { TIER_ACCESS } from '../subscriptions/tier-access.config';
import {
  createStudentAccount,
  slugStudentUserId,
} from '../adam/adam-student-registry.service';
import { issueAdamToken } from '../adam/adam-student.service';
import { ENV } from '../config/environments';
import { sendMail } from '../adam/adam-mail.service';

export const TESTER_QUESTION_LIMIT = 50;
export const TESTER_VIP_QUESTION_LIMIT = 100;

export function getTesterCohortMax(): number {
  return ENV.ADAM_TESTER_COHORT_MAX;
}

export async function countActiveTesters(): Promise<number> {
  return SubscriptionModel.countDocuments({
    tier:   SubscriptionTier.TESTER,
    status: SubscriptionStatus.ACTIVE,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textToHtml(text: string): string {
  return `<div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;padding:24px;line-height:1.6;color:#111;">
${text
  .split('\n')
  .map((line) => {
    if (!line.trim()) return '<br/>';
    return `<p style="margin:0 0 10px;">${escapeHtml(line)}</p>`;
  })
  .join('')}
</div>`;
}

function buildTesterWelcomeEmailText(params: {
  testerName: string;
  loginId: string;
  password: string;
  limit: number;
}): string {
  const { testerName, loginId, password, limit } = params;
  return `
Assalamualaikum ${testerName},

Welcome to the Alamtologi ADAM Tester program.
Thank you for helping us improve ADAM with real feedback.

────────────────────────────────────────
YOUR ADAM TESTER LOGIN
────────────────────────────────────────
Login ID: ${loginId}
Temporary password: ${password}
Tester question limit: ${limit} questions

How to start:
1) Open https://alamtologi.com/adam/chat (or tap ADAM in the menu)
2) Sign in with your Login ID + password
3) Choose your language (ADAM will greet you automatically)
4) Send your first question (each question counts toward your limit)

────────────────────────────────────────
DISCLAMER (PLEASE READ)
────────────────────────────────────────
This is a testing account. ADAM may occasionally give incomplete or imperfect answers while we learn from real usage.
Your feedback matters — please share what worked, what felt confusing, and any mistakes.

If you reach your question limit, contact the Alamtologi team to extend your access.

Telegram feedback group:
https://t.me/+8SLiE1xqk9c3YWQ9

Reply to this email for help and extensions.

— Alamtologi · QXK24 Team
  `.trim();
}

export interface TesterCreateOptions {
  name:       string;
  email?:     string;
  userId?:    string;
  password:   string;
  isVip?:     boolean;
  notes?:     string;
}

export interface TesterCheckResult {
  canContinue:        boolean;
  questionsUsed:      number;
  questionsRemaining: number;
  totalLimit:         number;
  limitReached:       boolean;
  showWarning:        boolean;
}

function testerUsageSnapshot(
  used: number,
  limit: number,
  warningShownAt: Date | null,
): Omit<TesterCheckResult, 'canContinue'> & { canContinue: boolean } {
  const remaining    = Math.max(0, limit - used);
  const limitReached = used >= limit;
  const WARNING_AT   = Math.floor(limit * 0.8);
  const showWarning  = used >= WARNING_AT && !warningShownAt;

  return {
    canContinue:        !limitReached,
    questionsUsed:      used,
    questionsRemaining: remaining,
    totalLimit:         limit,
    limitReached,
    showWarning,
  };
}

// ── Create tester account + subscription ─────────────────────
export async function createTesterAccount(opts: TesterCreateOptions): Promise<{
  userId:    string;
  name:      string;
  token:     string;
  limit:     number;
}> {
  const cohortMax = getTesterCohortMax();
  const active    = await countActiveTesters();
  if (active >= cohortMax) {
    throw new Error(`Tester cohort full (${cohortMax} active accounts). Revoke or wait before creating.`);
  }

  const userId = opts.userId ?? slugStudentUserId(opts.name);
  const limit  = opts.isVip ? TESTER_VIP_QUESTION_LIMIT : TESTER_QUESTION_LIMIT;

  const account = await createStudentAccount({
    name:      opts.name,
    password:  opts.password,
    userId,
    email:     opts.email,
    createdBy: 'founder-tester',
  });

  await SubscriptionModel.create({
    userId:         account.userId,
    founderId:      FOUNDER_SUBSCRIPTION_ID,
    tier:           SubscriptionTier.TESTER,
    status:         SubscriptionStatus.ACTIVE,
    billingCycle:   BillingCycle.ONE_TIME,
    region:         SupportedRegion.OTHER,
    currency:       'MYR',
    amountPerCycle: 0,
    provider:       PaymentProvider.FOUNDER_WAQF,
    access:         TIER_ACCESS[SubscriptionTier.PELAJAR],
    isFounderFunded: true,
    enterpriseNotes: opts.notes ?? null,
    pencarianUsage: {
      totalMessagesUsed:      0,
      totalMessagesLimit:     limit,
      extensionsPurchased:    0,
      extensionMessagesAdded: 0,
      currentStage:           PencarianStage.KNOW,
      stageDetectedAt:        { know: new Date(), closer: null, bonding: null },
      warningShownAt:         null,
      limitReachedAt:         null,
      limitReachedSession:    null,
      invitationShownAt:      null,
      convertedToPelajar:     false,
      convertedAt:            null,
      extensionHistory:       [],
    },
    neverDelete: true,
  });

  const token = issueAdamToken({
    userId:    account.userId,
    role:      'student',
    name:      account.name,
    isFounder: false,
  });

  // Optional: email credentials to the tester
  if (account.email && opts.password) {
    const testerName = account.name ?? account.userId;
    const emailText = buildTesterWelcomeEmailText({
      testerName,
      loginId: userId,
      password: opts.password,
      limit,
    });

    const ok = await sendMail({
      to:       account.email,
      subject:  `Your ADAM Tester login — ${limit} questions`,
      text:     emailText,
      html:     textToHtml(emailText),
      replyTo:  ENV.MAIL_REPLY_TO?.trim(),
    }).catch(() => false);

    if (!ok) {
      console.warn('[tester:mail] tester welcome skipped (mail not configured or send failed)', {
        to: account.email,
      });
    }
  }

  return { userId: account.userId, name: account.name, token, limit };
}

// ── Read-only tester status (no counter increment) ───────────
export async function getTesterStatus(userId: string): Promise<TesterCheckResult> {
  const sub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.TESTER,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!sub?.pencarianUsage) {
    return {
      canContinue:        true,
      questionsUsed:      0,
      questionsRemaining: 999,
      totalLimit:         999,
      limitReached:       false,
      showWarning:        false,
    };
  }

  const usage          = sub.pencarianUsage;
  const effectiveLimit = usage.totalMessagesLimit + usage.extensionMessagesAdded;

  return testerUsageSnapshot(
    usage.totalMessagesUsed,
    effectiveLimit,
    usage.warningShownAt,
  );
}

// ── Check + increment tester question counter ─────────────────
export async function checkTesterLimit(
  userId:    string,
  sessionId: string,
): Promise<TesterCheckResult> {
  const sub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.TESTER,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!sub?.pencarianUsage) {
    return {
      canContinue:        true,
      questionsUsed:      0,
      questionsRemaining: 999,
      totalLimit:         999,
      limitReached:       false,
      showWarning:        false,
    };
  }

  const usage          = sub.pencarianUsage;
  const effectiveLimit = usage.totalMessagesLimit + usage.extensionMessagesAdded;

  if (usage.totalMessagesUsed >= effectiveLimit) {
    return {
      canContinue:        false,
      questionsUsed:      usage.totalMessagesUsed,
      questionsRemaining: 0,
      totalLimit:         effectiveLimit,
      limitReached:       true,
      showWarning:        false,
    };
  }

  const updatedUsed  = usage.totalMessagesUsed + 1;
  const remaining    = effectiveLimit - updatedUsed;
  const limitReached = updatedUsed >= effectiveLimit;
  const WARNING_AT   = Math.floor(effectiveLimit * 0.8);
  const showWarning  = updatedUsed >= WARNING_AT && !usage.warningShownAt;

  const updatePayload: Record<string, unknown> = {
    'pencarianUsage.totalMessagesUsed': updatedUsed,
  };

  if (showWarning) {
    updatePayload['pencarianUsage.warningShownAt'] = new Date();
  }

  if (limitReached) {
    updatePayload['pencarianUsage.limitReachedAt']      = new Date();
    updatePayload['pencarianUsage.limitReachedSession'] = sessionId;
  }

  await SubscriptionModel.findByIdAndUpdate(sub._id, { $set: updatePayload });

  return {
    canContinue:        true,
    questionsUsed:      updatedUsed,
    questionsRemaining: remaining,
    totalLimit:         effectiveLimit,
    limitReached,
    showWarning,
  };
}

// ── Check if user is a tester ─────────────────────────────────
export async function isTesterAccount(userId: string): Promise<boolean> {
  const sub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.TESTER,
    status: SubscriptionStatus.ACTIVE,
  });
  return Boolean(sub);
}

// ── List all testers (founder dashboard) ─────────────────────
export async function listTesters(): Promise<Array<{
  userId:       string;
  used:         number;
  limit:        number;
  remaining:    number;
  limitReached: boolean;
  createdAt:    Date;
  notes:        string | null;
}>> {
  const subs = await SubscriptionModel.find({
    tier: SubscriptionTier.TESTER,
  }).sort({ createdAt: -1 });

  return subs.map((s) => {
    const used  = s.pencarianUsage?.totalMessagesUsed ?? 0;
    const limit = (s.pencarianUsage?.totalMessagesLimit ?? TESTER_QUESTION_LIMIT)
                + (s.pencarianUsage?.extensionMessagesAdded ?? 0);
    return {
      userId:       s.userId,
      used,
      limit,
      remaining:    Math.max(0, limit - used),
      limitReached: used >= limit,
      createdAt:    s.createdAt,
      notes:        s.enterpriseNotes ?? null,
    };
  });
}

// ── Revoke tester (founder only) ──────────────────────────────
export async function revokeTester(userId: string): Promise<boolean> {
  const result = await SubscriptionModel.findOneAndUpdate(
    { userId, tier: SubscriptionTier.TESTER },
    { $set: { status: SubscriptionStatus.CANCELLED } },
  );
  return Boolean(result);
}

// ── Add more questions to a tester ───────────────────────────
export async function extendTesterLimit(
  userId:         string,
  extraQuestions: number,
): Promise<{ newLimit: number }> {
  const sub = await SubscriptionModel.findOne({
    userId,
    tier: SubscriptionTier.TESTER,
  });

  if (!sub?.pencarianUsage) throw new Error('Tester subscription not found.');

  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $inc: { 'pencarianUsage.extensionMessagesAdded': extraQuestions },
    $set: { status: SubscriptionStatus.ACTIVE },
  });

  const newLimit =
    sub.pencarianUsage.totalMessagesLimit +
    sub.pencarianUsage.extensionMessagesAdded +
    extraQuestions;

  return { newLimit };
}

// ── Monitor stats for founder command board ───────────────────
export async function getTesterMonitorStats(): Promise<{
  total:         number;
  active:        number;
  limitReached:  number;
  revoked:       number;
  questionsUsed: number;
}> {
  const subs = await SubscriptionModel.find({ tier: SubscriptionTier.TESTER })
    .select('status pencarianUsage')
    .lean();

  let active = 0;
  let limitReached = 0;
  let revoked = 0;
  let questionsUsed = 0;

  for (const s of subs) {
    const used  = s.pencarianUsage?.totalMessagesUsed ?? 0;
    const limit = (s.pencarianUsage?.totalMessagesLimit ?? TESTER_QUESTION_LIMIT)
                + (s.pencarianUsage?.extensionMessagesAdded ?? 0);
    questionsUsed += used;

    if (s.status === SubscriptionStatus.CANCELLED) {
      revoked++;
    } else if (used >= limit) {
      limitReached++;
    } else {
      active++;
    }
  }

  return {
    total:         subs.length,
    active,
    limitReached,
    revoked,
    questionsUsed,
  };
}
export async function setTesterLanguage(
  userId:   string,
  language: string,
): Promise<void> {
  await SubscriptionModel.findOneAndUpdate(
    { userId, tier: SubscriptionTier.TESTER },
    { $set: { preferredLanguage: language } },
  );
}

// ── Get tester preferred language ────────────────────────────
export async function getTesterLanguage(
  userId: string,
): Promise<string | null> {
  const sub = await SubscriptionModel.findOne({
    userId,
    tier: SubscriptionTier.TESTER,
  });
  return sub?.preferredLanguage ?? null;
}

// ── Check if tester has selected language ────────────────────
export async function testerHasLanguage(
  userId: string,
): Promise<boolean> {
  const lang = await getTesterLanguage(userId);
  return Boolean(lang);
}

// ── Build language instruction for ADAM system prompt ────────
export function buildLanguageInstruction(language: string | null): string {
  if (!language) return '';
  return [
    'LANGUAGE INSTRUCTION:',
    `The user's preferred language is: ${language}.`,
    `Always respond in ${language} by default.`,
    'If the user writes in a different language, automatically switch',
    'to respond in that language instead.',
    'Never explain the language switch — just do it naturally.',
  ].join('\n');
}

// ── Build tester greeting in their language ──────────────────
export function buildTesterGreeting(
  name:          string,
  language:      string,
  languageName:  string,
  questionLimit: number,
): string {
  return [
    'TESTER GREETING INSTRUCTION:',
    `This is the very first message from a tester named ${name}.`,
    `Their selected language is: ${languageName} (${language}).`,
    `Write the greeting entirely in ${languageName}.`,
    '',
    'The greeting must include:',
    '1. A warm welcome addressing them by name',
    '2. A brief introduction — you are ADAM, an AI built on 31 years',
    '   of Alamtologi knowledge spanning 659 topics',
    `3. Their question limit: they have ${questionLimit} questions`,
    '   to explore freely',
    '4. Encouragement to ask about any topic — science, philosophy,',
    '   natural systems, human understanding, or anything they are curious about',
    '5. A gentle disclaimer that you are still learning and may',
    '   sometimes give incomplete answers — their feedback helps you grow',
    '6. An invitation to join the Telegram group for feedback:',
    '   https://t.me/+8SLiE1xqk9c3YWQ9',
    '7. Close with a warm, open question — ask what they would like',
    '   to explore first',
    '',
    'Tone: warm, intelligent, humble, and curious.',
    'Do not include any English unless the selected language is English.',
  ].join('\n');
}
