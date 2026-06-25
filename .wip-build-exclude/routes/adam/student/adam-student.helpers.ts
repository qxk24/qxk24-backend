/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Route Helpers
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { getPremiumCreditPacks } from '../../../freemium/adam-freemium-credit.service';
import { SubscriptionTier } from '../../../subscriptions/subscription.schema';
import type { SubscriptionAccess } from '../../../subscriptions/subscription-access.service';

export function creditPacksForAccess(access: SubscriptionAccess | null) {
  if (access?.tier === SubscriptionTier.PRO || access?.tier === SubscriptionTier.PROFESIONAL) {
    return getPremiumCreditPacks();
  }
  return [];
}
