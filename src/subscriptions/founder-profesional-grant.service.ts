/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Founder Profesional Grant Service
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
 */

import { ADAMStudentAccountModel } from '../adam/adam-student.schema';
import { TIER_ACCESS } from './tier-access.config';
import {
  BillingCycle,
  FOUNDER_SUBSCRIPTION_ID,
  PaymentProvider,
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
  SupportedRegion,
} from './subscription.schema';

export interface FounderProfesionalGrantResult {
  ok:           boolean;
  identifier:   string;
  userId?:      string;
  name?:        string;
  action?:      'created' | 'extended' | 'already_active';
  subscriptionId?: string;
  error?:       string;
}

const LOGIN_ALIASES: Record<string, string[]> = {
  izwahanie:        ['izwahanie', 'intan', 'izwahani', 'izwahanie rosli'],
  suhaila:          ['suhaila', 'suhaila ghazali', 'suhailaghazali05'],
  'suhailaghazali05': ['suhailaghazali05'],
  'aziz-tamhid':    ['aziz-tamhid', 'aziz tamhid', 'abdul aziz tamhid'],
  aziz:             ['aziz', 'abdul aziz', 'abdul-aziz'],
  ahmad:            ['ahmad'],
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Resolve login id from founder input (name, alias, or userId). */
export async function resolveStudentForGrant(raw: string): Promise<{ userId: string; name: string } | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  const byExactId = await ADAMStudentAccountModel.findOne({ userId: lower, active: true }).lean();
  if (byExactId) return { userId: byExactId.userId, name: byExactId.name };

  for (const [userId, aliases] of Object.entries(LOGIN_ALIASES)) {
    if (aliases.some((a) => a === lower) || userId === lower) {
      const doc = await ADAMStudentAccountModel.findOne({ userId, active: true }).lean();
      if (doc) return { userId: doc.userId, name: doc.name };
    }
  }

  const byExactName = await ADAMStudentAccountModel.findOne({
    active: true,
    name:   new RegExp(`^${escapeRegex(trimmed)}$`, 'i'),
  }).lean();
  if (byExactName) return { userId: byExactName.userId, name: byExactName.name };

  const byPartialName = await ADAMStudentAccountModel.findOne({
    active: true,
    name:   new RegExp(escapeRegex(trimmed), 'i'),
  }).lean();
  if (byPartialName) return { userId: byPartialName.userId, name: byPartialName.name };

  return null;
}

export async function grantFounderProfesional(params: {
  userId:        string;
  notes?:        string;
  periodMonths?: number;
}): Promise<{ action: 'created' | 'extended' | 'already_active'; subscriptionId: string }> {
  const userId = params.userId.trim().toLowerCase();
  const months = params.periodMonths ?? 12;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + months);

  const existing = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.PROFESIONAL,
    status: SubscriptionStatus.ACTIVE,
  }).sort({ updatedAt: -1 });

  if (existing?._id) {
    const currentEnd = existing.currentPeriodEnd?.getTime() ?? 0;
    if (currentEnd < periodEnd.getTime()) {
      existing.currentPeriodEnd = periodEnd;
      existing.enterpriseNotes = params.notes ?? existing.enterpriseNotes;
      await existing.save();
      return { action: 'extended', subscriptionId: existing._id.toString() };
    }
    return { action: 'already_active', subscriptionId: existing._id.toString() };
  }

  await SubscriptionModel.updateMany(
    {
      userId,
      tier:   SubscriptionTier.PELAJAR,
      status: SubscriptionStatus.ACTIVE,
    },
    {
      $set: {
        status:       SubscriptionStatus.CANCELLED,
        cancelledAt:  now,
        cancelReason: 'founder_upgrade_profesional',
      },
    },
  );

  const sub = await SubscriptionModel.create({
    userId,
    founderId:          FOUNDER_SUBSCRIPTION_ID,
    tier:               SubscriptionTier.PROFESIONAL,
    status:             SubscriptionStatus.ACTIVE,
    billingCycle:       BillingCycle.ANNUAL,
    region:             SupportedRegion.MY,
    currency:           'MYR',
    amountPerCycle:     0,
    provider:           PaymentProvider.FOUNDER_WAQF,
    access:             TIER_ACCESS[SubscriptionTier.PROFESIONAL],
    isFounderFunded:    true,
    enterpriseNotes:    params.notes ?? 'Founder grant — ADAM Profesional',
    currentPeriodStart: now,
    currentPeriodEnd:   periodEnd,
    pencarianUsage:     null,
    neverDelete:        true,
  });

  return { action: 'created', subscriptionId: sub._id.toString() };
}

export async function grantFounderProfesionalBatch(
  identifiers: string[],
  options?: { notes?: string; periodMonths?: number },
): Promise<FounderProfesionalGrantResult[]> {
  const results: FounderProfesionalGrantResult[] = [];
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
      const grant = await grantFounderProfesional({
        userId:        student.userId,
        notes:         options?.notes,
        periodMonths:  options?.periodMonths,
      });
      results.push({
        ok:             true,
        identifier,
        userId:         student.userId,
        name:           student.name,
        action:         grant.action,
        subscriptionId: grant.subscriptionId,
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
