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
import {
  resolveTutorSubscriptionAccess,
  type TutorSubscriptionAccess,
} from '../adam/adam-tutor-subscription.service';
import {
  resolveCoachingSubscriptionAccess,
  type CoachingSubscriptionAccess,
} from '../adam/adam-coaching-subscription.service';
import { getAccountLane } from '../adam/adam-student-registry.service';

async function resolveStudentLane(user: { userId: string; accountLane?: string }) {
  if (user.accountLane === 'tools' || user.accountLane === 'niaga' || user.accountLane === 'pelajar' || user.accountLane === 'umum') {
    return user.accountLane;
  }
  return getAccountLane(user.userId);
}

/** Tools-lane accounts may only use ADAM Tools. */
export async function rejectToolsLaneOnly(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const user = getTokenUser(c);
  if (!user || isFounderPayload(user)) {
    await next();
    return;
  }

  const lane = await resolveStudentLane(user);
  if (lane === 'tools') {
    return c.json({
      success: false,
      error:   'This account is registered for ADAM Tools only. Open Tools › Docs.',
      code:    'TOOLS_LANE_ONLY',
      upgradeUrl: '/adam/tools/docs',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  await next();
}

/** Niaga-lane accounts may only use ADAM Niaga. */
export async function rejectNiagaLaneOnly(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const user = getTokenUser(c);
  if (!user || isFounderPayload(user)) {
    await next();
    return;
  }

  const lane = await resolveStudentLane(user);
  if (lane === 'niaga') {
    return c.json({
      success: false,
      error:   'This account is registered for ADAM Niaga only. Open Niaga.',
      code:    'NIAGA_LANE_ONLY',
      upgradeUrl: '/rd/niaga',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  await next();
}

export const TUTOR_SUBSCRIPTION_ACCESS_KEY = 'tutorSubscriptionAccess';
export const COACHING_SUBSCRIPTION_ACCESS_KEY = 'coachingSubscriptionAccess';

export const SUBSCRIPTION_ACCESS_KEY = 'subscriptionAccess';

export function getSubscriptionAccess(c: Context): SubscriptionAccess | null {
  return c.get(SUBSCRIPTION_ACCESS_KEY) as SubscriptionAccess | undefined ?? null;
}

export function getTutorSubscriptionAccess(c: Context): TutorSubscriptionAccess | null {
  return c.get(TUTOR_SUBSCRIPTION_ACCESS_KEY) as TutorSubscriptionAccess | undefined ?? null;
}

export function getCoachingSubscriptionAccess(c: Context): CoachingSubscriptionAccess | null {
  return c.get(COACHING_SUBSCRIPTION_ACCESS_KEY) as CoachingSubscriptionAccess | undefined ?? null;
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
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://qxk24.com').replace(/\/$/, '');
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

  if (access.freemium) {
    const learnAccess = await resolveSubscriptionAccess(user.userId);
    c.set(SUBSCRIPTION_ACCESS_KEY, learnAccess);
  }

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

/** ADAM Coaching lane — freemium Basic + consumer plans; separate from Tutor billing. */
export async function requireCoachingSubscription(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const user = getTokenUser(c);

  if (!user || isFounderPayload(user)) {
    await next();
    return;
  }

  const access = await resolveCoachingSubscriptionAccess(user.userId);
  c.set(COACHING_SUBSCRIPTION_ACCESS_KEY, access);

  if (access.freemium) {
    const learnAccess = await resolveSubscriptionAccess(user.userId);
    c.set(SUBSCRIPTION_ACCESS_KEY, learnAccess);
  }

  if (!access.canChat) {
    return c.json({
      success:    false,
      error:      access.message ?? 'Daily limit reached — try again tomorrow or upgrade.',
      code:       access.code ?? 'DAILY_LIMIT',
      kernel:     'ALAMTOLOGI',
    }, 402);
  }

  await next();
}
