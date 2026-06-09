/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : QA Unlimited Test Account Service
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Internal QA accounts — ENTERPRISE tier, no freemium quota.
 * Not for production users or public signup.
 */

import {
  createStudentAccount,
  slugStudentUserId,
} from '../adam/adam-student-registry.service';
import { TIER_ACCESS } from '../subscriptions/tier-access.config';
import { resolveStudentForGrant } from '../subscriptions/founder-profesional-grant.service';
import {
  BillingCycle,
  FOUNDER_SUBSCRIPTION_ID,
  PaymentProvider,
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
  SupportedRegion,
} from '../subscriptions/subscription.schema';

export const QA_UNLIMITED_NOTES =
  'QA_UNLIMITED — internal testing only, no quota';

export const QA_UNLIMITED_DEFAULT_USER_ID = 'qa-unlimited';

export function isQaUnlimitedNotes(notes: string | null | undefined): boolean {
  return Boolean(notes?.includes('QA_UNLIMITED'));
}

export async function isQaUnlimitedAccount(userId: string): Promise<boolean> {
  const sub = await SubscriptionModel.findOne({
    userId: userId.trim().toLowerCase(),
    tier:   SubscriptionTier.ENTERPRISE,
    status: SubscriptionStatus.ACTIVE,
  }).sort({ updatedAt: -1 });

  return Boolean(sub && isQaUnlimitedNotes(sub.enterpriseNotes));
}

async function cancelConflictingSubscriptions(userId: string): Promise<void> {
  const now = new Date();
  await SubscriptionModel.updateMany(
    {
      userId,
      tier:   { $ne: SubscriptionTier.ENTERPRISE },
      status: SubscriptionStatus.ACTIVE,
    },
    {
      $set: {
        status:       SubscriptionStatus.CANCELLED,
        cancelledAt:  now,
        cancelReason: 'qa_unlimited_upgrade',
      },
    },
  );
}

export async function grantQaUnlimitedAccess(params: {
  userId: string;
  notes?: string;
}): Promise<{ action: 'created' | 'already_active'; subscriptionId: string }> {
  const userId = params.userId.trim().toLowerCase();
  const notes = params.notes ?? QA_UNLIMITED_NOTES;
  const now = new Date();

  const existing = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.ENTERPRISE,
    status: SubscriptionStatus.ACTIVE,
  }).sort({ updatedAt: -1 });

  if (existing?._id && isQaUnlimitedNotes(existing.enterpriseNotes)) {
    return { action: 'already_active', subscriptionId: existing._id.toString() };
  }

  await cancelConflictingSubscriptions(userId);

  if (existing?._id) {
    existing.enterpriseNotes = notes;
    existing.neverDelete = true;
    existing.isFounderFunded = true;
    existing.provider = PaymentProvider.FOUNDER_WAQF;
    existing.access = TIER_ACCESS[SubscriptionTier.ENTERPRISE];
    existing.currentPeriodEnd = null;
    await existing.save();
    return { action: 'already_active', subscriptionId: existing._id.toString() };
  }

  const sub = await SubscriptionModel.create({
    userId,
    founderId:          FOUNDER_SUBSCRIPTION_ID,
    tier:               SubscriptionTier.ENTERPRISE,
    status:             SubscriptionStatus.ACTIVE,
    billingCycle:       BillingCycle.ENTERPRISE,
    region:             SupportedRegion.OTHER,
    currency:           'MYR',
    amountPerCycle:     0,
    provider:           PaymentProvider.FOUNDER_WAQF,
    access:             TIER_ACCESS[SubscriptionTier.ENTERPRISE],
    isFounderFunded:    true,
    enterpriseNotes:    notes,
    currentPeriodStart: now,
    currentPeriodEnd:   null,
    pencarianUsage:     null,
    neverDelete:        true,
  });

  return { action: 'created', subscriptionId: sub._id.toString() };
}

export interface QaUnlimitedCreateOptions {
  name:     string;
  password: string;
  userId?:  string;
  email?:   string;
  notes?:   string;
}

export async function createQaUnlimitedAccount(
  opts: QaUnlimitedCreateOptions,
): Promise<{ userId: string; name: string; action: 'created' | 'already_active' }> {
  const userId = opts.userId?.trim().toLowerCase() ?? slugStudentUserId(opts.name);

  const existingSub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.ENTERPRISE,
    status: SubscriptionStatus.ACTIVE,
  });

  if (existingSub && isQaUnlimitedNotes(existingSub.enterpriseNotes)) {
    return { userId, name: opts.name.trim(), action: 'already_active' };
  }

  await createStudentAccount({
    name:      opts.name,
    password:  opts.password,
    userId,
    email:     opts.email,
    createdBy: 'founder-qa-unlimited',
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/duplicate|E11000|already exists/i.test(msg)) throw err;
  });

  const grant = await grantQaUnlimitedAccess({ userId, notes: opts.notes });

  return {
    userId,
    name:   opts.name.trim(),
    action: grant.action,
  };
}

export async function upgradeStudentToQaUnlimited(
  identifier: string,
  notes?: string,
): Promise<{ ok: boolean; userId?: string; name?: string; error?: string; action?: string }> {
  const student = await resolveStudentForGrant(identifier);
  if (!student) {
    return { ok: false, error: 'student_not_found' };
  }

  const grant = await grantQaUnlimitedAccess({ userId: student.userId, notes });
  return {
    ok:     true,
    userId: student.userId,
    name:   student.name,
    action: grant.action,
  };
}
