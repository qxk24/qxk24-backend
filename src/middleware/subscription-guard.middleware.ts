/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Guard Middleware
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Context, Next } from 'hono';
import { getTokenUser, isFounderPayload } from './auth.middleware';
import {
  resolveSubscriptionAccess,
  type SubscriptionAccess,
} from '../subscriptions/subscription-access.service';
import { ENV } from '../config/environments';
import { resolveTutorSubscriptionAccess } from '../adam/adam-tutor-subscription.service';

export const TUTOR_SUBSCRIPTION_ACCESS_KEY = 'tutorSubscriptionAccess';

export const SUBSCRIPTION_ACCESS_KEY = 'subscriptionAccess';

export function getSubscriptionAccess(c: Context): SubscriptionAccess | null {
  return c.get(SUBSCRIPTION_ACCESS_KEY) as SubscriptionAccess | undefined ?? null;
}

/**
 * Blocks ADAM chat when subscription is expired, paused, or Pencarian limit reached.
 * Returns HTTP 402 with upgradeUrl. Founders bypass entirely.
 */
export async function requireActiveSubscription(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const user = getTokenUser(c);

  if (!user || isFounderPayload(user)) {
    await next();
    return;
  }

  const access = await resolveSubscriptionAccess(user.userId);
  c.set(SUBSCRIPTION_ACCESS_KEY, access);

  if (!access.canChat) {
    return c.json({
      success:    false,
      error:      access.message ?? 'Subscription required to continue.',
      code:       access.code,
      tier:       access.tier,
      status:     access.status,
      upgradeUrl: access.upgradeUrl,
      pencarian:  access.pencarian,
      kernel:     'Alamtologi',
    }, 402);
  }

  await next();
}

/**
 * Lightweight check for read-only endpoints (usage display). Never returns 402.
 */
export async function attachSubscriptionAccess(
  c: Context,
  next: Next,
): Promise<void> {
  const user = getTokenUser(c);
  if (user && !isFounderPayload(user)) {
    const access = await resolveSubscriptionAccess(user.userId);
    c.set(SUBSCRIPTION_ACCESS_KEY, access);
  }
  await next();
}

export function subscriptionUpgradeUrl(): string {
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
  return `${base}/plans`;
}

/** ADAM Tutor lane — requires active TUTOR subscription when billing is enforced. */
export async function requireTutorSubscription(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const user = getTokenUser(c);

  if (!user || isFounderPayload(user)) {
    await next();
    return;
  }

  const access = await resolveTutorSubscriptionAccess(user.userId);
  c.set(TUTOR_SUBSCRIPTION_ACCESS_KEY, access);

  if (!access.canChat) {
    return c.json({
      success:    false,
      error:      access.message ?? 'ADAM Tutor subscription required.',
      code:       access.code ?? 'TUTOR_SUBSCRIPTION_REQUIRED',
      upgradeUrl: access.upgradeUrl,
      monthlyAmount: access.monthlyAmount,
      currency:      access.currency,
      kernel:     'ALAMTOLOGI',
    }, 402);
  }

  await next();
}
