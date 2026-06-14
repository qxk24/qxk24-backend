/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Founder Unlimited Grant Service
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Founder waqf — ENTERPRISE unlimited quota across all freemium
 * categories (Guest, Basic, Pelajar, Profesional). Includes ADAM
 * Tutor access when billing is enforced.
 */

import { ENV } from '../config/environments';
import {
  createStudentAccount,
  slugStudentUserId,
} from '../adam/adam-student-registry.service';
import {
  createQaUnlimitedAccount,
  grantQaUnlimitedAccess,
  isQaUnlimitedAccount,
  QA_UNLIMITED_NOTES,
  type QaUnlimitedCreateOptions,
} from '../qa/qa-unlimited-account.service';
import { resolveStudentForGrant } from './founder-profesional-grant.service';
import { TIER_ACCESS } from './tier-access.config';
import {
  BillingCycle,
  FOUNDER_SUBSCRIPTION_ID,
  PaymentProvider,
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
  SupportedRegion,
  type TutorSubscriptionLevel,
} from './subscription.schema';
import { normalizeTutorSubscriptionLevel } from './tier-access.config';

/** Six paid / tracked subscription tiers in ADAM today. */
export const ADAM_SUBSCRIPTION_TIER_CATEGORIES = [
  {
    tier:      SubscriptionTier.BASIC,
    label:     'Basic',
    quota:     'Rolling window (free registered)',
    envKey:    'ADAM_FREEMIUM_FREE_ROLLING',
  },
  {
    tier:      SubscriptionTier.PRO,
    label:     'Pro',
    quota:     'Monthly + daily soft pace',
    envKey:    'ADAM_FREEMIUM_PELAJAR_MONTHLY',
  },
  {
    tier:      SubscriptionTier.PROFESIONAL,
    label:     'Profesional',
    quota:     'Rolling deep-question pace',
    envKey:    'ADAM_FREEMIUM_PROFESIONAL_ROLLING',
  },
  {
    tier:      SubscriptionTier.TUTOR,
    label:     'ADAM Tutor',
    quota:     'Paid tutor lane (all subjects)',
    envKey:    null,
  },
  {
    tier:      SubscriptionTier.TESTER,
    label:     'VIP Tester cohort',
    quota:     'Fixed question pool',
    envKey:    'ADAM_TESTER_COHORT_MAX',
  },
  {
    tier:      SubscriptionTier.ENTERPRISE,
    label:     'Enterprise / Founder unlimited',
    quota:     'Unlimited — bypasses all freemium gates',
    envKey:    null,
  },
] as const;

/** Freemium quota buckets enforced at chat time (includes public guest). */
export const ADAM_FREEMIUM_QUOTA_CATEGORIES = [
  {
    mode:  'GUEST',
    label: 'Guest (no account)',
    limit: () => ENV.ADAM_FREEMIUM_GUEST_LIMIT,
    unit:  'lifetime',
  },
  {
    mode:  'FREE',
    label: 'Basic / Pencarian registered',
    limit: () => ENV.ADAM_FREEMIUM_FREE_ROLLING,
    unit:  `${ENV.ADAM_FREEMIUM_ROLLING_WINDOW_HOURS}h rolling`,
  },
  {
    mode:  'PRO',
    label: 'Pelajar Premium',
    limit: () => ENV.ADAM_FREEMIUM_PELAJAR_MONTHLY,
    unit:  'monthly',
  },
  {
    mode:  'PROFESIONAL',
    label: 'Profesional',
    limit: () => ENV.ADAM_FREEMIUM_PROFESIONAL_ROLLING,
    unit:  `${ENV.ADAM_FREEMIUM_ROLLING_WINDOW_HOURS}h rolling`,
  },
  {
    mode:  'UNLIMITED',
    label: 'Enterprise / founder grant',
    limit: () => -1,
    unit:  'unlimited',
  },
] as const;

export function listAdamAccountCategories(): {
  subscriptionTiers: typeof ADAM_SUBSCRIPTION_TIER_CATEGORIES;
  freemiumQuotas:    Array<{
    mode:  string;
    label: string;
    limit: number;
    unit:  string;
  }>;
  totalSubscriptionTiers: number;
  totalFreemiumQuotas:    number;
} {
  return {
    subscriptionTiers:      ADAM_SUBSCRIPTION_TIER_CATEGORIES,
    freemiumQuotas: ADAM_FREEMIUM_QUOTA_CATEGORIES.map((c) => ({
      mode:  c.mode,
      label: c.label,
      limit: c.limit(),
      unit:  c.unit,
    })),
    totalSubscriptionTiers: ADAM_SUBSCRIPTION_TIER_CATEGORIES.length,
    totalFreemiumQuotas:    ADAM_FREEMIUM_QUOTA_CATEGORIES.length,
  };
}

export interface FounderUnlimitedGrantResult {
  ok:             boolean;
  identifier?:    string;
  userId?:        string;
  name?:          string;
  action?:        'created' | 'already_active';
  subscriptionId?: string;
  tutorGranted?:  boolean;
  error?:         string;
}

async function ensureFounderTutorAccess(
  userId: string,
  tutorLevel: TutorSubscriptionLevel = 'university',
): Promise<boolean> {
  const level = normalizeTutorSubscriptionLevel(tutorLevel);
  const now = new Date();

  const existing = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.TUTOR,
    status: SubscriptionStatus.ACTIVE,
  }).sort({ updatedAt: -1 });

  if (existing?._id) {
    existing.tutorLevel = level;
    existing.isFounderFunded = true;
    existing.provider = PaymentProvider.FOUNDER_WAQF;
    existing.currentPeriodEnd = null;
    existing.neverDelete = true;
    await existing.save();
    return false;
  }

  await SubscriptionModel.create({
    userId,
    founderId:          FOUNDER_SUBSCRIPTION_ID,
    tier:               SubscriptionTier.TUTOR,
    tutorLevel:         level,
    status:             SubscriptionStatus.ACTIVE,
    billingCycle:       BillingCycle.MONTHLY,
    region:             SupportedRegion.MY,
    currency:           'MYR',
    amountPerCycle:     0,
    provider:           PaymentProvider.FOUNDER_WAQF,
    access:             TIER_ACCESS[SubscriptionTier.TUTOR],
    isFounderFunded:    true,
    enterpriseNotes:    'Founder unlimited — ADAM Tutor all subjects',
    currentPeriodStart: now,
    currentPeriodEnd:   null,
    pencarianUsage:     null,
    neverDelete:        true,
  });

  return true;
}

/** Grant ENTERPRISE unlimited + companion Tutor sub (all ADAM chat categories). */
export async function grantFounderUnlimitedAccess(params: {
  userId:      string;
  notes?:      string;
  tutorLevel?: TutorSubscriptionLevel;
  skipTutor?:  boolean;
}): Promise<{
  action:         'created' | 'already_active';
  subscriptionId: string;
  tutorGranted:   boolean;
}> {
  const userId = params.userId.trim().toLowerCase();
  const notes = params.notes ?? QA_UNLIMITED_NOTES;

  const grant = await grantQaUnlimitedAccess({ userId, notes });

  let tutorGranted = false;
  if (!params.skipTutor) {
    tutorGranted = await ensureFounderTutorAccess(userId, params.tutorLevel);
  }

  return {
    action:         grant.action,
    subscriptionId: grant.subscriptionId,
    tutorGranted,
  };
}

export async function grantFounderUnlimitedBatch(
  identifiers: string[],
  options?: {
    notes?:      string;
    tutorLevel?: TutorSubscriptionLevel;
    skipTutor?:  boolean;
  },
): Promise<FounderUnlimitedGrantResult[]> {
  const results: FounderUnlimitedGrantResult[] = [];
  const seen = new Set<string>();

  for (const identifier of identifiers) {
    const key = identifier.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const student = await resolveStudentForGrant(identifier);
    if (!student) {
      results.push({ ok: false, identifier, error: 'student_not_found' });
      continue;
    }

    if (seen.has(student.userId)) {
      results.push({
        ok:         true,
        identifier,
        userId:     student.userId,
        name:       student.name,
        action:     'already_active',
        error:      'duplicate_in_batch',
      });
      continue;
    }
    seen.add(student.userId);

    try {
      const grant = await grantFounderUnlimitedAccess({
        userId:      student.userId,
        notes:       options?.notes,
        tutorLevel:  options?.tutorLevel,
        skipTutor:   options?.skipTutor,
      });
      results.push({
        ok:             true,
        identifier,
        userId:         student.userId,
        name:           student.name,
        action:         grant.action,
        subscriptionId: grant.subscriptionId,
        tutorGranted:   grant.tutorGranted,
      });
    } catch (err: unknown) {
      results.push({
        ok:         false,
        identifier,
        userId:     student.userId,
        name:       student.name,
        error:      err instanceof Error ? err.message : 'grant_failed',
      });
    }
  }

  return results;
}

export async function createFounderUnlimitedAccount(
  opts: QaUnlimitedCreateOptions & {
    tutorLevel?: TutorSubscriptionLevel;
    skipTutor?:  boolean;
    accountRole?: 'student' | 'guru';
    accountLane?: 'umum' | 'pelajar';
  },
): Promise<{
  userId:       string;
  name:         string;
  action:       'created' | 'already_active';
  tutorGranted: boolean;
}> {
  const userId = opts.userId?.trim().toLowerCase() ?? slugStudentUserId(opts.name);

  if (await isQaUnlimitedAccount(userId)) {
    const grant = await grantFounderUnlimitedAccess({
      userId,
      notes:      opts.notes,
      tutorLevel: opts.tutorLevel,
      skipTutor:  opts.skipTutor,
    });
    return {
      userId,
      name:         opts.name.trim(),
      action:       grant.action,
      tutorGranted: grant.tutorGranted,
    };
  }

  await createStudentAccount({
    name:        opts.name,
    password:    opts.password,
    userId,
    email:       opts.email,
    createdBy:   'founder-unlimited',
    accountRole: opts.accountRole,
    accountLane: opts.accountLane,
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/duplicate|E11000|already exists/i.test(msg)) throw err;
  });

  const grant = await grantFounderUnlimitedAccess({
    userId,
    notes:      opts.notes,
    tutorLevel: opts.tutorLevel,
    skipTutor:  opts.skipTutor,
  });

  return {
    userId,
    name:         opts.name.trim(),
    action:       grant.action,
    tutorGranted: grant.tutorGranted,
  };
}

export async function upgradeStudentToFounderUnlimited(
  identifier: string,
  options?: { notes?: string; tutorLevel?: TutorSubscriptionLevel; skipTutor?: boolean },
): Promise<FounderUnlimitedGrantResult> {
  const student = await resolveStudentForGrant(identifier);
  if (!student) {
    return { ok: false, identifier, error: 'student_not_found' };
  }

  try {
    const grant = await grantFounderUnlimitedAccess({
      userId:      student.userId,
      notes:       options?.notes,
      tutorLevel:  options?.tutorLevel,
      skipTutor:   options?.skipTutor,
    });
    return {
      ok:             true,
      identifier,
      userId:         student.userId,
      name:           student.name,
      action:         grant.action,
      subscriptionId: grant.subscriptionId,
      tutorGranted:   grant.tutorGranted,
    };
  } catch (err: unknown) {
    return {
      ok:         false,
      identifier,
      userId:     student.userId,
      name:       student.name,
      error:      err instanceof Error ? err.message : 'grant_failed',
    };
  }
}

/** Re-export for tutor billing bypass checks. */
export { isQaUnlimitedAccount, createQaUnlimitedAccount };
