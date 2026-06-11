/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Subscription Summary (Founder)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  isTutorBillingEnforced,
  isTutorQaBypassUser,
} from './adam-tutor-subscription.service';
import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
  type TutorSubscriptionLevel,
} from '../subscriptions/subscription.schema';
import { TUTOR_LEVEL_LABELS } from '../subscriptions/tier-access.config';
import type { AdamAccountLane } from './adam-student.types';

const ACTIVEISH = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAUSED,
  SubscriptionStatus.WAQF,
  SubscriptionStatus.PENDING,
] as const;

const LEARN_TIER_PRIORITY: Record<string, number> = {
  [SubscriptionTier.ENTERPRISE]:  5,
  [SubscriptionTier.PROFESIONAL]: 4,
  [SubscriptionTier.PELAJAR]:     3,
  [SubscriptionTier.TESTER]:      2,
  [SubscriptionTier.PENCARIAN]:   1,
};

type LeanSub = {
  userId:            string;
  tier:              SubscriptionTier;
  status:            SubscriptionStatus;
  tutorLevel?:       TutorSubscriptionLevel | null;
  billingCycle?:     string;
  isFounderFunded?:  boolean;
  provider?:         string;
  currentPeriodEnd?: Date | null;
};

export interface FounderStudentSubscriptionSummary {
  learnLine: string;
  tutorLine?: string;
}

function formatStatus(status: SubscriptionStatus): string {
  switch (status) {
    case SubscriptionStatus.ACTIVE:    return 'active';
    case SubscriptionStatus.PAUSED:    return 'paused';
    case SubscriptionStatus.WAQF:        return 'waqf';
    case SubscriptionStatus.PENDING:   return 'pending';
    case SubscriptionStatus.CANCELLED: return 'cancelled';
    case SubscriptionStatus.EXPIRED:   return 'expired';
    default:                           return String(status).toLowerCase();
  }
}

function formatLearnTierName(tier: SubscriptionTier): string {
  switch (tier) {
    case SubscriptionTier.PROFESIONAL: return 'Profesional';
    case SubscriptionTier.PELAJAR:     return 'Pelajar';
    case SubscriptionTier.ENTERPRISE:  return 'Enterprise';
    case SubscriptionTier.TESTER:      return 'Tester';
    case SubscriptionTier.PENCARIAN:   return 'Pencarian (free)';
    default:                           return tier;
  }
}

function formatLearnSubscriptionLine(sub: LeanSub | null): string {
  if (!sub) {
    return 'Pencarian (free waqf walk — no paid Learn subscription)';
  }

  const parts = [
    formatLearnTierName(sub.tier),
    formatStatus(sub.status),
  ];

  if (sub.billingCycle) {
    parts.push(sub.billingCycle.toLowerCase());
  }
  if (sub.isFounderFunded) {
    parts.push('founder grant');
  } else if (sub.provider) {
    parts.push(sub.provider.toLowerCase().replace(/_/g, ' '));
  }
  if (sub.currentPeriodEnd) {
    parts.push(`until ${sub.currentPeriodEnd.toISOString().slice(0, 10)}`);
  }

  return parts.join(' · ');
}

function formatTutorSubscriptionLine(
  userId: string,
  tutorSub: LeanSub | null,
): string {
  if (isTutorQaBypassUser(userId)) {
    return 'QA bypass (demo — no Stripe required)';
  }
  if (!isTutorBillingEnforced()) {
    return 'open access (Tutor billing not enforced on server)';
  }
  if (!tutorSub) {
    return 'none — paid Tutor subscription required';
  }

  const level = tutorSub.tutorLevel ?? 'secondary';
  const levelLabel = TUTOR_LEVEL_LABELS[level] ?? level;
  const parts = [
    levelLabel,
    formatStatus(tutorSub.status),
  ];

  if (tutorSub.billingCycle) {
    parts.push(tutorSub.billingCycle.toLowerCase());
  }
  if (tutorSub.isFounderFunded) {
    parts.push('founder grant');
  } else if (tutorSub.provider) {
    parts.push(tutorSub.provider.toLowerCase().replace(/_/g, ' '));
  }

  return parts.join(' · ');
}

function pickBestLearnSub(subs: LeanSub[]): LeanSub | null {
  const learn = subs.filter((s) => s.tier !== SubscriptionTier.TUTOR);
  if (learn.length === 0) return null;

  const activeish = learn.filter((s) => (ACTIVEISH as readonly string[]).includes(s.status));
  const pool = activeish.length > 0 ? activeish : learn;

  return pool.sort((a, b) => {
    const pa = LEARN_TIER_PRIORITY[a.tier] ?? 0;
    const pb = LEARN_TIER_PRIORITY[b.tier] ?? 0;
    return pb - pa;
  })[0] ?? null;
}

function summarizeUserSubscriptions(
  userId: string,
  subs: LeanSub[],
): FounderStudentSubscriptionSummary {
  const tutorSub = subs.find((s) => s.tier === SubscriptionTier.TUTOR) ?? null;
  const learnSub = pickBestLearnSub(subs);

  return {
    learnLine: formatLearnSubscriptionLine(learnSub),
    tutorLine: formatTutorSubscriptionLine(userId, tutorSub),
  };
}

export async function getStudentSubscriptionSummariesForFounder(
  userIds: readonly string[],
): Promise<Map<string, FounderStudentSubscriptionSummary>> {
  const map = new Map<string, FounderStudentSubscriptionSummary>();
  if (userIds.length === 0) return map;

  const docs = await SubscriptionModel.find({ userId: { $in: [...userIds] } })
    .select({
      userId: 1,
      tier: 1,
      status: 1,
      tutorLevel: 1,
      billingCycle: 1,
      isFounderFunded: 1,
      provider: 1,
      currentPeriodEnd: 1,
    })
    .sort({ updatedAt: -1 })
    .lean();

  const byUser = new Map<string, LeanSub[]>();
  for (const doc of docs) {
    const list = byUser.get(doc.userId) ?? [];
    list.push(doc as LeanSub);
    byUser.set(doc.userId, list);
  }

  for (const userId of userIds) {
    map.set(userId, summarizeUserSubscriptions(userId, byUser.get(userId) ?? []));
  }

  return map;
}

export function founderSubscriptionLinesForStudent(
  summary: FounderStudentSubscriptionSummary,
  accountLane?: AdamAccountLane,
): string[] {
  const lines = [`Subscription (Learn): ${summary.learnLine}`];
  if (accountLane === 'pelajar') {
    lines.push(`Subscription (Tutor): ${summary.tutorLine ?? 'none'}`);
  }
  return lines;
}

/** Compact suffix for founder roster one-liners. */
export function founderSubscriptionRosterSuffix(
  summary: FounderStudentSubscriptionSummary,
  accountLane?: AdamAccountLane,
): string {
  if (accountLane === 'pelajar') {
    return ` · Tutor sub: ${summary.tutorLine ?? 'none'}`;
  }

  const learn = summary.learnLine.split(' · ')[0] ?? summary.learnLine;
  return ` · ${learn}`;
}
