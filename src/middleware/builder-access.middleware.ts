/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Builder Access Middleware
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { Context, Next } from 'hono';
import { SubscriptionTier } from '../subscriptions/subscription.schema';
import { resolveSubscriptionAccess } from '../subscriptions/subscription-access.service';
import type { ChatParticipant } from '../adam/adam-student.types';
import { getTokenUser, isFounderPayload } from './auth.middleware';

const BUILDER_TIERS = new Set<SubscriptionTier>([
  SubscriptionTier.PROFESIONAL,
  SubscriptionTier.ENTERPRISE,
]);

export interface BuilderAccessResult {
  hasAccess:    boolean;
  tier:         string;
  isFounder:    boolean;
  monthlyLimit: number | null;
}

export function getBuilderAccessFromTier(
  tier: string,
  isFounder: boolean,
): BuilderAccessResult {
  if (isFounder) {
    return { hasAccess: true, tier: 'founder', isFounder: true, monthlyLimit: null };
  }

  if (!BUILDER_TIERS.has(tier as SubscriptionTier)) {
    return { hasAccess: false, tier, isFounder: false, monthlyLimit: 0 };
  }

  const limits: Partial<Record<SubscriptionTier, number | null>> = {
    [SubscriptionTier.PROFESIONAL]: 50,
    [SubscriptionTier.ENTERPRISE]:  null,
  };

  return {
    hasAccess:    true,
    tier,
    isFounder:    false,
    monthlyLimit: limits[tier as SubscriptionTier] ?? null,
  };
}

export async function resolveBuilderAccess(
  participant: ChatParticipant,
): Promise<BuilderAccessResult> {
  if (participant.role === 'founder') {
    return getBuilderAccessFromTier('founder', true);
  }

  const access = await resolveSubscriptionAccess(participant.userId);
  return getBuilderAccessFromTier(access.tier, false);
}

export async function builderAccessMiddleware(c: Context, next: Next): Promise<Response | void> {
  const user = getTokenUser(c);
  const access = user
    ? getBuilderAccessFromTier(user.role, isFounderPayload(user))
    : { hasAccess: false, tier: 'none', isFounder: false, monthlyLimit: 0 };

  if (!access.hasAccess && user && !isFounderPayload(user)) {
    const subAccess = await resolveSubscriptionAccess(user.userId);
    const tierAccess = getBuilderAccessFromTier(subAccess.tier, false);
    if (!tierAccess.hasAccess) {
      return c.json(
        {
          error:      'builder_access_denied',
          message:    'Builder mode requires Profesional or Enterprise subscription.',
          upgradeUrl: '/pricing',
        },
        403,
      );
    }
    c.set('builderAccess', tierAccess);
    await next();
    return;
  }

  if (!access.hasAccess) {
    return c.json(
      {
        error:      'builder_access_denied',
        message:    'Builder mode requires Profesional or Enterprise subscription.',
        upgradeUrl: '/pricing',
      },
      403,
    );
  }

  c.set('builderAccess', access);
  await next();
}
