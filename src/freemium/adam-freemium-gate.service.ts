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
import {
  freeDailyLimit,
  pelajarDailyLimit,
  reserveDailyQuestion,
  getDailyQuotaSnapshot,
} from './adam-freemium-daily.service';
import {
  guestLifetimeLimit,
  reserveGuestQuestion,
  getGuestQuotaSnapshot,
} from './adam-freemium-guest.service';
import { creditPackSize, getCreditPackOffer, isCreditPurchaseWired } from './adam-freemium-credit.service';
import { malaysiaDateKey } from './adam-freemium-date';

export type FreemiumMode = 'GUEST' | 'FREE' | 'PELAJAR' | 'UNLIMITED';

export interface FreemiumCheckResult {
  canContinue:         boolean;
  mode:                FreemiumMode;
  questionsUsed:       number;
  questionsRemaining:  number;
  limit:               number;
  dateKey?:            string;
  creditBalance:       number;
  limitReached:        boolean;
  registerGate:        boolean;
  buyCreditGate:       boolean;
  upgradeComingSoon:   boolean;
  message:             string | null;
}

export function isFreemiumEnabled(): boolean {
  return ENV.ADAM_FREEMIUM_ENABLED;
}

export function isPublicFreemiumEnabled(): boolean {
  return ENV.ADAM_FREEMIUM_ENABLED && ENV.ADAM_FREEMIUM_PUBLIC_ENABLED;
}

function unlimitedTier(access: SubscriptionAccess | null): boolean {
  if (!access) return false;
  return access.tier === SubscriptionTier.PROFESIONAL
    || access.tier === SubscriptionTier.ENTERPRISE;
}

function pelajarTier(access: SubscriptionAccess | null): boolean {
  return access?.tier === SubscriptionTier.PELAJAR;
}

function pencarianTier(access: SubscriptionAccess | null): boolean {
  return access?.tier === SubscriptionTier.PENCARIAN || access?.tier === 'NONE';
}

function snapshotToResult(
  mode: FreemiumMode,
  snap: Awaited<ReturnType<typeof getDailyQuotaSnapshot>>,
  opts: {
    canContinue:       boolean;
    registerGate?:     boolean;
    buyCreditGate?:    boolean;
    upgradeComingSoon?: boolean;
    message?:          string | null;
  },
): FreemiumCheckResult {
  return {
    canContinue:        opts.canContinue,
    mode,
    questionsUsed:      snap.questionsUsed,
    questionsRemaining: snap.questionsRemaining,
    limit:              snap.dailyLimit,
    dateKey:            snap.dateKey,
    creditBalance:      snap.creditBalance,
    limitReached:       snap.limitReached,
    registerGate:       opts.registerGate ?? false,
    buyCreditGate:      opts.buyCreditGate ?? false,
    upgradeComingSoon:  opts.upgradeComingSoon ?? false,
    message:            opts.message ?? null,
  };
}

function dailyLimitBlockedMessage(mode: FreemiumMode, limit: number): string {
  if (mode === 'PELAJAR') {
    return `Had harian Pelajar (${limit} soalan) tercapai. Beli kredit untuk teruskan hari ini.`;
  }
  return `Had harian (${limit} soalan) tercapai. Beli kredit untuk teruskan hari ini.`;
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
      creditBalance:      0,
      limitReached:       true,
      registerGate:       true,
      buyCreditGate:      false,
      upgradeComingSoon:  false,
      message:            'Had percubaan tamat. Daftar percuma untuk teruskan bersama ADAM.',
    };
  }

  const after = await reserveGuestQuestion(guestId, sessionId);
  return {
    canContinue:        after.questionsUsed <= limit,
    mode:               'GUEST',
    questionsUsed:      after.questionsUsed,
    questionsRemaining: Math.max(0, limit - after.questionsUsed),
    limit,
    creditBalance:      0,
    limitReached:       after.questionsUsed >= limit,
    registerGate:       after.questionsUsed >= limit,
    buyCreditGate:      false,
    upgradeComingSoon:  false,
    message:            null,
  };
}

async function runDailyFreemiumPreCheck(
  userId: string,
  mode: FreemiumMode,
  dailyLimit: number,
): Promise<FreemiumCheckResult> {
  const before = await getDailyQuotaSnapshot(userId, dailyLimit);

  if (before.limitReached) {
    const pack = getCreditPackOffer();
    return snapshotToResult(mode, before, {
      canContinue:       false,
      buyCreditGate:     true,
      upgradeComingSoon: !isCreditPurchaseWired(),
      message:           `${dailyLimitBlockedMessage(mode, dailyLimit)} Beli ${pack.credits} kredit.`,
    });
  }

  const after = await reserveDailyQuestion(userId, dailyLimit);
  const canContinue = after.usedFromCredits || after.questionsUsed <= dailyLimit;

  return snapshotToResult(mode, after, {
    canContinue,
    buyCreditGate:     false,
    upgradeComingSoon: false,
  });
}

export async function runStudentFreemiumPreCheck(
  userId: string,
  access: SubscriptionAccess | null,
): Promise<FreemiumCheckResult> {
  const dateKey = malaysiaDateKey();

  if (unlimitedTier(access)) {
    return {
      canContinue:        true,
      mode:               'UNLIMITED',
      questionsUsed:      0,
      questionsRemaining: -1,
      limit:              -1,
      dateKey,
      creditBalance:      0,
      limitReached:       false,
      registerGate:       false,
      buyCreditGate:      false,
      upgradeComingSoon:  false,
      message:            null,
    };
  }

  if (pelajarTier(access)) {
    return runDailyFreemiumPreCheck(userId, 'PELAJAR', pelajarDailyLimit());
  }

  if (pencarianTier(access)) {
    return runDailyFreemiumPreCheck(userId, 'FREE', freeDailyLimit());
  }

  return {
    canContinue:        true,
    mode:               'UNLIMITED',
    questionsUsed:      0,
    questionsRemaining: -1,
    limit:              -1,
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
  const pack = getCreditPackOffer();
  return {
    mode:               result.mode,
    questionsUsed:      result.questionsUsed,
    questionsRemaining: result.questionsRemaining,
    limit:              result.limit,
    dateKey:            result.dateKey,
    creditBalance:      result.creditBalance,
    creditPackSize:     creditPackSize(),
    creditPackAmount:   pack.amount,
    creditPackCurrency: pack.currency,
    limitReached:       result.limitReached,
    registerGate:       result.registerGate,
    buyCreditGate:      result.buyCreditGate,
    upgradeComingSoon:  result.upgradeComingSoon,
    paymentWired:       isCreditPurchaseWired(),
    message:            result.message,
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
    const pack = getCreditPackOffer();
    await s.write(
      `event: freemium_buy_credit\ndata: ${JSON.stringify({
        message:      result.message,
        creditsUrl:   '/adam/credits',
        packId:       pack.id,
        credits:      pack.credits,
        amount:       pack.amount,
        currency:     pack.currency,
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

  const closing = result.message ?? 'Had soalan tercapai.';

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

  if (unlimitedTier(access)) {
    return {
      canContinue:        true,
      mode:               'UNLIMITED',
      questionsUsed:      0,
      questionsRemaining: -1,
      limit:              -1,
      dateKey,
      creditBalance:      0,
      limitReached:       false,
      registerGate:       false,
      buyCreditGate:      false,
      upgradeComingSoon:  false,
      message:            null,
    };
  }

  const mode = pelajarTier(access) ? 'PELAJAR' : 'FREE';
  const limit = mode === 'PELAJAR' ? pelajarDailyLimit() : freeDailyLimit();
  const snap = await getDailyQuotaSnapshot(userId, limit);

  return snapshotToResult(mode, snap, {
    canContinue:       !snap.limitReached,
    buyCreditGate:     snap.limitReached,
    upgradeComingSoon: snap.limitReached && !isCreditPurchaseWired(),
    message:           snap.limitReached
      ? dailyLimitBlockedMessage(mode, limit)
      : null,
  });
}
