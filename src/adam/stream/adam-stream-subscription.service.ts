/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Subscription Access
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-06
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../../config/environments';
import { isFounderPayload, type QXK24TokenPayload } from '../../middleware/auth.middleware';
import { resolvePlatformAdminAccess } from '../../platform/platform-admin.service';
import type { AdamStreamHostPlanId } from './adam-stream.constants';
import {
  AdamStreamSubscriptionModel,
  AdamStreamSubscriptionStatus,
} from './adam-stream-subscription.schema';

export interface AdamStreamSubscriptionMe {
  planId:         AdamStreamHostPlanId;
  status:         string;
  active:         boolean;
  billingCycle?:  string;
  currentPeriodEnd?: string | null;
  upgradeUrl?:    string;
}

function streamHostUrl(): string {
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://www.qxk24.com').replace(/\/$/, '');
  return `${base}/adam/stream/host`;
}

const PLAN_RANK: Record<AdamStreamHostPlanId, number> = {
  percuma:           0,
  business_starter:  1,
  business_standard: 2,
  business_plus:     3,
  enterprise:        4,
};

export function isStreamPlanAtLeast(
  current: AdamStreamHostPlanId,
  required: AdamStreamHostPlanId,
): boolean {
  return PLAN_RANK[current] >= PLAN_RANK[required];
}

export async function resolveAdamStreamSubscriptionMe(
  user: QXK24TokenPayload,
): Promise<AdamStreamSubscriptionMe> {
  if (isFounderPayload(user)) {
    return { planId: 'enterprise', status: 'FOUNDER', active: true };
  }

  const admin = await resolvePlatformAdminAccess({
    userId:    user.userId,
    isFounder: false,
  }).catch(() => null);
  if (admin?.isPlatformAdmin && admin.canAccess) {
    return { planId: 'enterprise', status: 'OPERATOR', active: true };
  }

  const sub = await AdamStreamSubscriptionModel.findOne({ userId: user.userId }).lean();
  if (!sub || sub.status !== AdamStreamSubscriptionStatus.ACTIVE) {
    return {
      planId:      'percuma',
      status:      sub?.status ?? 'FREE',
      active:      true,
      upgradeUrl:  streamHostUrl(),
    };
  }

  return {
    planId:            sub.planId as AdamStreamHostPlanId,
    status:            sub.status,
    active:            true,
    billingCycle:      sub.billingCycle,
    currentPeriodEnd:  sub.currentPeriodEnd?.toISOString() ?? null,
    upgradeUrl:        streamHostUrl(),
  };
}
