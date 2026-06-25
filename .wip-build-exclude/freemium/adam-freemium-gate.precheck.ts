/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Gate Pre-check
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

import { SubscriptionTier, normalizeSubscriptionTier } from '../subscriptions/subscription.schema';
import type { SubscriptionAccess } from '../subscriptions/subscription-access.service';
import { malaysiaDateKey } from './adam-freemium-date';
import {
  guestLifetimeLimit,
  reserveGuestQuestion,
  getGuestQuotaSnapshot,
} from './adam-freemium-guest.service';
import {
  getBasicCreditPackOffer,
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
import {
  consumerFreeBlockedMessage,
  consumerProBlockedMessage,
  getConsumerFreeSnapshot,
  getConsumerProSnapshot,
  isConsumerDailyPlan,
  reserveConsumerFreeQuestion,
  reserveConsumerProQuestion,
} from './adam-freemium-consumer.service';
import type { FreemiumCheckResult, FreemiumMode } from './adam-freemium-gate.types';

export function enterpriseTier(access: SubscriptionAccess | null): boolean {
  return access?.tier === SubscriptionTier.ENTERPRISE;
}

export function profesionalTier(access: SubscriptionAccess | null): boolean {
  return access?.tier === SubscriptionTier.PROFESIONAL;
}

export function proTier(access: SubscriptionAccess | null): boolean {
  const tier = normalizeSubscriptionTier(access?.tier ?? null);
  return tier === SubscriptionTier.PRO || tier === SubscriptionTier.PROFESIONAL;
}

export function pencarianTier(access: SubscriptionAccess | null): boolean {
  return !access?.tier || access.tier === 'NONE' || access.tier === SubscriptionTier.BASIC;
}

export function consumerDailyToResult(
  mode: FreemiumMode,
  snap: Awaited<ReturnType<typeof getConsumerProSnapshot>>,
  opts: {
    canContinue:        boolean;
    registerGate?:      boolean;
    buyCreditGate?:     boolean;
    upgradeProGate?:    boolean;
    upgradeComingSoon?: boolean;
    message?:           string | null;
  },
): FreemiumCheckResult {
  return {
    canContinue:        opts.canContinue,
    mode,
    questionsUsed:      snap.questionsUsed,
    questionsRemaining: snap.questionsRemaining,
    limit:              snap.dailyLimit,
    period:             'daily',
    dateKey:            snap.dateKey,
    creditBalance:      snap.walletBalanceUsd,
    limitReached:       snap.limitReached && !snap.usedFromCredits,
    registerGate:       opts.registerGate ?? false,
    buyCreditGate:      opts.buyCreditGate ?? false,
    upgradeComingSoon:  opts.upgradeComingSoon ?? false,
    message:            opts.message ?? null,
  };
}

export function rollingToResult(
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

export function premiumToResult(
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
    mode:               'PRO',
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

async function runConsumerFreePreCheck(userId: string): Promise<FreemiumCheckResult> {
  const before = await getConsumerFreeSnapshot(userId);
  if (before.limitReached) {
    return consumerDailyToResult('FREE', before, {
      canContinue:       false,
      upgradeProGate:    true,
      upgradeComingSoon: false,
      message:           consumerFreeBlockedMessage(before),
    });
  }
  const after = await reserveConsumerFreeQuestion(userId);
  return consumerDailyToResult('FREE', after, {
    canContinue: !after.limitReached,
  });
}

async function runConsumerProPreCheck(userId: string): Promise<FreemiumCheckResult> {
  const before = await getConsumerProSnapshot(userId);
  if (before.limitReached) {
    return consumerDailyToResult('PRO', before, {
      canContinue:       false,
      buyCreditGate:     true,
      upgradeComingSoon: !isCreditPurchaseWired(),
      message:           consumerProBlockedMessage(before),
    });
  }
  const after = await reserveConsumerProQuestion(userId);
  if (after.limitReached && !after.usedFromCredits) {
    return consumerDailyToResult('PRO', after, {
      canContinue:       false,
      buyCreditGate:     true,
      upgradeComingSoon: !isCreditPurchaseWired(),
      message:           consumerProBlockedMessage(after),
    });
  }
  return consumerDailyToResult('PRO', after, { canContinue: true });
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
    if (isConsumerDailyPlan()) return runConsumerProPreCheck(userId);
    return runProfesionalRollingPreCheck(userId);
  }

  if (proTier(access)) {
    if (isConsumerDailyPlan()) return runConsumerProPreCheck(userId);
    return runPelajarPremiumPreCheck(userId);
  }

  if (pencarianTier(access)) {
    if (isConsumerDailyPlan()) return runConsumerFreePreCheck(userId);
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
