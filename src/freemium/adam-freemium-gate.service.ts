/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Gate
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { StreamingApi } from 'hono/utils/stream';
import { SubscriptionTier } from '../subscriptions/subscription.schema';
import type { SubscriptionAccess } from '../subscriptions/subscription-access.service';
import { ENV } from '../config/environments';
import { malaysiaDateKey } from './adam-freemium-date';
import {
  guestLifetimeLimit,
  reserveGuestQuestion,
  getGuestQuotaSnapshot,
} from './adam-freemium-guest.service';
import {
  creditPackSize,
  getBasicCreditPackOffer,
  getPremiumCreditPacks,
  isCreditPurchaseWired,
} from './adam-freemium-credit.service';
import {
  freeRollingLimit,
  getRollingQuotaSnapshot,
  profesionalRollingLimit,
  reserveRollingQuestion,
  rollingWindowHours,
} from './adam-freemium-rolling.service';
import { RollingQuotaBucket } from './adam-freemium.schema';
import {
  getPremiumQuotaSnapshot,
  premiumBlockedMessage,
  reservePremiumQuestion,
} from './adam-freemium-premium.service';

export type FreemiumMode = 'GUEST' | 'FREE' | 'PELAJAR' | 'PROFESIONAL' | 'UNLIMITED';

export interface FreemiumCheckResult {
  canContinue:         boolean;
  mode:                FreemiumMode;
  questionsUsed:       number;
  questionsRemaining:  number;
  limit:               number;
  period:              'lifetime' | 'rolling' | 'monthly' | 'unlimited';
  dateKey?:            string;
  creditBalance:       number;
  limitReached:        boolean;
  registerGate:        boolean;
  buyCreditGate:       boolean;
  upgradeComingSoon:   boolean;
  message:             string | null;
  /** Secondary pace cap — Premium daily soft limit */
  paceUsed?:           number;
  paceLimit?:          number;
  pacePeriod?:         'daily' | 'rolling';
  windowHours?:        number;
  windowResetsAt?:     string;
}

export function isFreemiumEnabled(): boolean {
  return ENV.ADAM_FREEMIUM_ENABLED;
}

export function isPublicFreemiumEnabled(): boolean {
  return ENV.ADAM_FREEMIUM_ENABLED && ENV.ADAM_FREEMIUM_PUBLIC_ENABLED;
}

function enterpriseTier(access: SubscriptionAccess | null): boolean {
  return access?.tier === SubscriptionTier.ENTERPRISE;
}

function profesionalTier(access: SubscriptionAccess | null): boolean {
  return access?.tier === SubscriptionTier.PROFESIONAL;
}

function pelajarTier(access: SubscriptionAccess | null): boolean {
  return access?.tier === SubscriptionTier.PELAJAR;
}

function pencarianTier(access: SubscriptionAccess | null): boolean {
  return access?.tier === SubscriptionTier.PENCARIAN || access?.tier === 'NONE';
}

function rollingToResult(
  mode: FreemiumMode,
  snap: Awaited<ReturnType<typeof getRollingQuotaSnapshot>>,
  opts: {
    canContinue:        boolean;
    registerGate?:      boolean;
    buyCreditGate?:     boolean;
    upgradeComingSoon?: boolean;
    message?:           string | null;
  },
): FreemiumCheckResult {
  return {
    canContinue:        opts.canContinue,
    mode,
    questionsUsed:      snap.questionsUsed,
    questionsRemaining: snap.questionsRemaining,
    limit:              snap.limit,
    period:             'rolling',
    dateKey:            snap.windowStart.toISOString(),
    creditBalance:      snap.creditBalance,
    limitReached:       snap.limitReached,
    registerGate:       opts.registerGate ?? false,
    buyCreditGate:      opts.buyCreditGate ?? false,
    upgradeComingSoon:  opts.upgradeComingSoon ?? false,
    message:            opts.message ?? null,
    windowHours:        snap.windowHours,
    windowResetsAt:     snap.windowResetsAt.toISOString(),
  };
}

function premiumToResult(
  snap: Awaited<ReturnType<typeof getPremiumQuotaSnapshot>>,
  opts: {
    canContinue:        boolean;
    buyCreditGate?:     boolean;
    upgradeComingSoon?: boolean;
    message?:           string | null;
  },
): FreemiumCheckResult {
  return {
    canContinue:        opts.canContinue,
    mode:               'PELAJAR',
    questionsUsed:      snap.monthlyUsed,
    questionsRemaining: snap.monthlyRemaining + snap.creditBalance,
    limit:              snap.monthlyLimit,
    period:             'monthly',
    dateKey:            snap.monthKey,
    creditBalance:      snap.creditBalance,
    limitReached:       snap.limitReached,
    registerGate:       false,
    buyCreditGate:      opts.buyCreditGate ?? false,
    upgradeComingSoon:  opts.upgradeComingSoon ?? false,
    message:            opts.message ?? null,
    paceUsed:           snap.dailyPaceUsed,
    paceLimit:          snap.dailyPaceLimit,
    pacePeriod:         'daily',
  };
}

async function runFreeRollingPreCheck(userId: string): Promise<FreemiumCheckResult> {
  const limit = freeRollingLimit();
  const before = await getRollingQuotaSnapshot(userId, RollingQuotaBucket.FREE, limit);

  if (before.limitReached) {
    const pack = getBasicCreditPackOffer();
    return rollingToResult('FREE', before, {
      canContinue:       false,
      buyCreditGate:     true,
      upgradeComingSoon: !isCreditPurchaseWired(),
      message:           `Rolling limit (${limit} questions per ${rollingWindowHours()} hours) reached. Buy +${pack.credits} credits or wait for the window to reset.`,
    });
  }

  const after = await reserveRollingQuestion(userId, RollingQuotaBucket.FREE, limit);
  const canContinue = after.usedFromCredits || after.questionsUsed <= limit;

  return rollingToResult('FREE', after, {
    canContinue,
    buyCreditGate:     false,
    upgradeComingSoon: false,
  });
}

async function runProfesionalRollingPreCheck(userId: string): Promise<FreemiumCheckResult> {
  const limit = profesionalRollingLimit();
  const before = await getRollingQuotaSnapshot(userId, RollingQuotaBucket.PROFESIONAL, limit);

  if (before.limitReached) {
    return rollingToResult('PROFESIONAL', before, {
      canContinue:       false,
      buyCreditGate:     false,
      upgradeComingSoon: false,
      message:           `Profesional pace limit (${limit} deep questions per ${rollingWindowHours()} hours) reached. Wait for the window to reset — your allowance refreshes automatically.`,
    });
  }

  const after = await reserveRollingQuestion(userId, RollingQuotaBucket.PROFESIONAL, limit);
  return rollingToResult('PROFESIONAL', after, {
    canContinue:       after.questionsUsed <= limit,
    buyCreditGate:     false,
    upgradeComingSoon: false,
  });
}

async function runPelajarPremiumPreCheck(userId: string): Promise<FreemiumCheckResult> {
  const before = await getPremiumQuotaSnapshot(userId);

  if (before.limitReached) {
    return premiumToResult(before, {
      canContinue:       false,
      buyCreditGate:     true,
      upgradeComingSoon: !isCreditPurchaseWired(),
      message:           premiumBlockedMessage(before),
    });
  }

  const after = await reservePremiumQuestion(userId);

  if (after.limitReached && !after.usedFromCredits) {
    return premiumToResult(after, {
      canContinue:       false,
      buyCreditGate:     true,
      upgradeComingSoon: !isCreditPurchaseWired(),
      message:           premiumBlockedMessage(after),
    });
  }

  return premiumToResult(after, {
    canContinue:       true,
    buyCreditGate:     false,
    upgradeComingSoon: false,
  });
}

export async function runGuestFreemiumPreCheck(
  guestId: string,
  sessionId?: string,
): Promise<FreemiumCheckResult> {
  const snap = await getGuestQuotaSnapshot(guestId);
  const limit = guestLifetimeLimit();

  if (snap.questionsUsed >= limit) {
    return {
      canContinue:        false,
      mode:               'GUEST',
      questionsUsed:      snap.questionsUsed,
      questionsRemaining: 0,
      limit,
      period:             'lifetime',
      creditBalance:      0,
      limitReached:       true,
      registerGate:       true,
      buyCreditGate:      false,
      upgradeComingSoon:  false,
      message:            'Guest trial ended. Register free to continue with ADAM.',
    };
  }

  const after = await reserveGuestQuestion(guestId, sessionId);
  return {
    canContinue:        after.questionsUsed <= limit,
    mode:               'GUEST',
    questionsUsed:      after.questionsUsed,
    questionsRemaining: Math.max(0, limit - after.questionsUsed),
    limit,
    period:             'lifetime',
    creditBalance:      0,
    limitReached:       after.questionsUsed >= limit,
    registerGate:       after.questionsUsed >= limit,
    buyCreditGate:      false,
    upgradeComingSoon:  false,
    message:            null,
  };
}

export async function runStudentFreemiumPreCheck(
  userId: string,
  access: SubscriptionAccess | null,
): Promise<FreemiumCheckResult> {
  const dateKey = malaysiaDateKey();

  if (enterpriseTier(access)) {
    return {
      canContinue:        true,
      mode:               'UNLIMITED',
      questionsUsed:      0,
      questionsRemaining: -1,
      limit:              -1,
      period:             'unlimited',
      dateKey,
      creditBalance:      0,
      limitReached:       false,
      registerGate:       false,
      buyCreditGate:      false,
      upgradeComingSoon:  false,
      message:            null,
    };
  }

  if (profesionalTier(access)) {
    return runProfesionalRollingPreCheck(userId);
  }

  if (pelajarTier(access)) {
    return runPelajarPremiumPreCheck(userId);
  }

  if (pencarianTier(access)) {
    return runFreeRollingPreCheck(userId);
  }

  return {
    canContinue:        true,
    mode:               'UNLIMITED',
    questionsUsed:      0,
    questionsRemaining: -1,
    limit:              -1,
    period:             'unlimited',
    dateKey,
    creditBalance:      0,
    limitReached:       false,
    registerGate:       false,
    buyCreditGate:      false,
    upgradeComingSoon:  false,
    message:            null,
  };
}

export function freemiumStatusPayload(result: FreemiumCheckResult): Record<string, unknown> {
  const isPremium = result.mode === 'PELAJAR';
  const packs = isPremium ? getPremiumCreditPacks() : [getBasicCreditPackOffer()];
  const pack = packs[0];
  return {
    mode:               result.mode,
    questionsUsed:      result.questionsUsed,
    questionsRemaining: result.questionsRemaining,
    limit:              result.limit,
    period:             result.period,
    dateKey:            result.dateKey,
    creditBalance:      result.creditBalance,
    creditPacks:        packs,
    creditPackSize:     pack?.credits ?? creditPackSize(),
    creditPackAmount:   pack?.amount ?? 0,
    creditPackCurrency: pack?.currency ?? 'MYR',
    limitReached:       result.limitReached,
    registerGate:       result.registerGate,
    buyCreditGate:      result.buyCreditGate,
    upgradeComingSoon:  result.upgradeComingSoon,
    paymentWired:       isCreditPurchaseWired(),
    message:            result.message,
    paceUsed:           result.paceUsed,
    paceLimit:          result.paceLimit,
    pacePeriod:         result.pacePeriod,
    windowHours:        result.windowHours,
    windowResetsAt:     result.windowResetsAt,
  };
}

export async function streamFreemiumBlockedTurn(
  s: StreamingApi,
  sessionId: string,
  result: FreemiumCheckResult,
): Promise<void> {
  await s.write(
    `event: freemium_status\ndata: ${JSON.stringify(freemiumStatusPayload(result))}\n\n`,
  );

  if (result.registerGate) {
    await s.write(
      `event: freemium_register_gate\ndata: ${JSON.stringify({
        message:     result.message,
        registerUrl: '/register?next=/adam/learn',
      })}\n\n`,
    );
  }

  if (result.buyCreditGate) {
    const packs = result.mode === 'PELAJAR' ? getPremiumCreditPacks() : [getBasicCreditPackOffer()];
    await s.write(
      `event: freemium_buy_credit\ndata: ${JSON.stringify({
        message:      result.message,
        creditsUrl:   '/adam/credits',
        packs,
        paymentWired: isCreditPurchaseWired(),
        comingSoon:   !isCreditPurchaseWired(),
      })}\n\n`,
    );
  }

  if (result.upgradeComingSoon && result.limitReached && !result.buyCreditGate) {
    await s.write(
      `event: freemium_upgrade_soon\ndata: ${JSON.stringify({
        message:  result.message,
        plansUrl: '/plans',
      })}\n\n`,
    );
  }

  const closing = result.message ?? 'Question limit reached.';

  await s.write(`event: adam_thinking\ndata: ${JSON.stringify({ sessionId })}\n\n`);
  await s.write(`event: adam_chunk\ndata: ${JSON.stringify({ text: closing })}\n\n`);
  await s.write(
    `event: adam_complete\ndata: ${JSON.stringify({
      sessionId,
      response:     closing,
      judgment:     'ISLAH',
      freemiumGate: true,
      limitReached: true,
    })}\n\n`,
  );
}

export async function getStudentFreemiumStatus(
  userId: string,
  access: SubscriptionAccess | null,
): Promise<FreemiumCheckResult> {
  const dateKey = malaysiaDateKey();

  if (enterpriseTier(access)) {
    return {
      canContinue:        true,
      mode:               'UNLIMITED',
      questionsUsed:      0,
      questionsRemaining: -1,
      limit:              -1,
      period:             'unlimited',
      dateKey,
      creditBalance:      0,
      limitReached:       false,
      registerGate:       false,
      buyCreditGate:      false,
      upgradeComingSoon:  false,
      message:            null,
    };
  }

  if (profesionalTier(access)) {
    const limit = profesionalRollingLimit();
    const snap = await getRollingQuotaSnapshot(userId, RollingQuotaBucket.PROFESIONAL, limit);
    return rollingToResult('PROFESIONAL', snap, {
      canContinue:   !snap.limitReached,
      buyCreditGate: false,
      message:       snap.limitReached
        ? `Profesional pace limit (${limit} per ${rollingWindowHours()} hours) reached.`
        : null,
    });
  }

  if (pelajarTier(access)) {
    const snap = await getPremiumQuotaSnapshot(userId);
    return premiumToResult(snap, {
      canContinue:       !snap.limitReached,
      buyCreditGate:     snap.limitReached,
      upgradeComingSoon: snap.limitReached && !isCreditPurchaseWired(),
      message:           snap.limitReached ? premiumBlockedMessage(snap) : null,
    });
  }

  const limit = freeRollingLimit();
  const snap = await getRollingQuotaSnapshot(userId, RollingQuotaBucket.FREE, limit);
  return rollingToResult('FREE', snap, {
    canContinue:       !snap.limitReached,
    buyCreditGate:     snap.limitReached,
    upgradeComingSoon: snap.limitReached && !isCreditPurchaseWired(),
    message:           snap.limitReached
      ? `Rolling limit (${limit} per ${rollingWindowHours()} hours) reached.`
      : null,
  });
}
