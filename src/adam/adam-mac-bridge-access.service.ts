/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Mac Bridge Access
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
} from '../subscriptions/subscription.schema';
import { isFounderPayload, type QXK24TokenPayload } from '../middleware/auth.middleware';

const ACTIVEISH = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAUSED,
  SubscriptionStatus.WAQF,
  SubscriptionStatus.PENDING,
] as const;

const BRIDGE_LEARN_TIERS = new Set<SubscriptionTier>([
  SubscriptionTier.PROFESIONAL,
  SubscriptionTier.ENTERPRISE,
]);

export function isMacBridgeLearnTier(tier: SubscriptionTier): boolean {
  return BRIDGE_LEARN_TIERS.has(tier);
}

export async function userHasMacBridgeTier(userId: string): Promise<boolean> {
  const subs = await SubscriptionModel.find({ userId })
    .select({ tier: 1, status: 1 })
    .lean();

  for (const sub of subs) {
    if (sub.tier === SubscriptionTier.TUTOR) continue;
    if (!(ACTIVEISH as readonly string[]).includes(sub.status)) continue;
    if (isMacBridgeLearnTier(sub.tier)) return true;
  }

  return false;
}

export async function canUseMacBridge(user: QXK24TokenPayload): Promise<boolean> {
  if (isFounderPayload(user)) return true;
  return userHasMacBridgeTier(user.userId);
}
