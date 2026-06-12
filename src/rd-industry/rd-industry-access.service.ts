/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D Industry Access Gate
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

import { RdAppliedSku } from '../rd-applied/rd-applied.types';
import { RdSubscriptionModel } from '../rd-applied/rd-subscription.schema';
import { RdSubscriptionStatus } from '../rd-applied/rd-applied.types';
import type { IRdSubscription } from '../rd-applied/rd-subscription.schema';

const INDUSTRY_SKUS = new Set<string>([
  RdAppliedSku.RD_IND_SOLO,
  RdAppliedSku.RD_LAB_5,
  RdAppliedSku.BUNDLE_IND_AS_SOLO,
  RdAppliedSku.BUNDLE_IND_AS_LAB,
]);

function subscriptionGrantsIndustry(sub: IRdSubscription): boolean {
  if (sub.rdCategory === 'industry') return true;
  if (sub.sku === RdAppliedSku.BUNDLE_IND_AS_SOLO || sub.sku === RdAppliedSku.BUNDLE_IND_AS_LAB) {
    return true;
  }
  return false;
}

export interface RdIndustryAccess {
  subscription: IRdSubscription;
  subscriptionId: string;
}

export async function getActiveRdIndustryAccess(
  userId: string,
): Promise<RdIndustryAccess | null> {
  const subs = await RdSubscriptionModel.find({
    userId,
    status: RdSubscriptionStatus.ACTIVE,
    sku:    { $in: [...INDUSTRY_SKUS] },
  }).sort({ createdAt: -1 });

  for (const sub of subs) {
    if (!INDUSTRY_SKUS.has(sub.sku)) continue;
    if (!subscriptionGrantsIndustry(sub)) continue;
    return {
      subscription:   sub,
      subscriptionId: sub._id.toString(),
    };
  }

  return null;
}

export async function assertRdIndustryAccess(userId: string): Promise<RdIndustryAccess> {
  const access = await getActiveRdIndustryAccess(userId);
  if (!access) {
    throw new Error(
      'Active R&D Eksklusif — Industry subscription required. Subscribe at /rd/checkout?sku=RD-IND-SOLO (Industri) or BUNDLE-IND-AS-SOLO.',
    );
  }
  return access;
}
