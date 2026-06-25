/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Gate Status & SSE
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

import type { StreamingApi } from 'hono/utils/stream';
import { ENV } from '../config/environments';
import type { SubscriptionAccess } from '../subscriptions/subscription-access.service';
import {
  getMediaQuotaSnapshot,
  mediaQuotaStatusPayload,
  resolveUserMediaQuotaTier,
} from '../adam/adam-media-quota.service';
import { malaysiaDateKey } from './adam-freemium-date';
import {
  creditPackSize,
  extraMessageCostCents,
  getPremiumCreditPacks,
  isCreditPurchaseWired,
} from './adam-freemium-credit.service';
import {
  freeRollingLimit,
  getRollingQuotaSnapshot,
  profesionalRollingLimit,
  rollingWindowHours,
} from './adam-freemium-rolling.service';
import { RollingQuotaBucket } from './adam-freemium.schema';
import {
  getPremiumQuotaSnapshot,
  premiumBlockedMessage,
} from './adam-freemium-premium.service';
import {
  consumerFreeBlockedMessage,
  consumerProBlockedMessage,
  getConsumerFreeSnapshot,
  getConsumerProSnapshot,
  isConsumerDailyPlan,
} from './adam-freemium-consumer.service';
import type { FreemiumCheckResult } from './adam-freemium-gate.types';
import {
  consumerDailyToResult,
  enterpriseTier,
  premiumToResult,
  profesionalTier,
  proTier,
  rollingToResult,
} from './adam-freemium-gate.precheck';

export function freemiumStatusPayload(
  result: FreemiumCheckResult,
  mediaExtras?: Record<string, unknown>,
): Record<string, unknown> {
  const isPro = result.mode === 'PRO' || result.mode === 'PROFESIONAL';
  const packs = isPro ? getPremiumCreditPacks() : [];
  const pack = packs[0];
  return {
    mode:               result.mode,
    questionsUsed:      result.questionsUsed,
    questionsRemaining: result.questionsRemaining,
    limit:              result.limit,
    period:             result.period,
    dateKey:            result.dateKey,
    creditBalance:      result.creditBalance,
    creditBalanceUsd:   result.creditBalance,
    creditPacks:        packs,
    creditPackSize:     pack?.extraMessages ?? creditPackSize(),
    creditPackAmount:   pack?.amount ?? 0,
    creditPackCurrency: pack?.currency ?? 'USD',
    limitReached:       result.limitReached,
    registerGate:       result.registerGate,
    buyCreditGate:      result.buyCreditGate,
    upgradeComingSoon:  result.upgradeComingSoon,
    paymentWired:       isCreditPurchaseWired(),
    message:            result.message,
    extraMessageCost:   extraMessageCostCents() / 100,
    paceUsed:           result.paceUsed,
    paceLimit:          result.paceLimit,
    pacePeriod:         result.pacePeriod,
    windowHours:        result.windowHours,
    windowResetsAt:     result.windowResetsAt,
    ...mediaExtras,
  };
}

export async function buildFreemiumStatusPayloadForUser(
  userId: string,
  result: FreemiumCheckResult,
): Promise<Record<string, unknown>> {
  const mediaTier = await resolveUserMediaQuotaTier({ userId });
  const mediaSnap = await getMediaQuotaSnapshot({ userId, tier: mediaTier });
  return freemiumStatusPayload(result, mediaQuotaStatusPayload(mediaSnap));
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
    const packs = result.mode === 'PRO' || result.mode === 'PROFESIONAL'
      ? getPremiumCreditPacks()
      : [];
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

  if (result.limitReached && result.mode === 'FREE' && isConsumerDailyPlan()) {
    await s.write(
      `event: freemium_upgrade_pro\ndata: ${JSON.stringify({
        message:    result.message,
        pricingUrl: '/pricing',
        proPrice:   ENV.ADAM_PRO_MONTHLY_USD,
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
    if (isConsumerDailyPlan()) {
      const snap = await getConsumerProSnapshot(userId);
      return consumerDailyToResult('PRO', snap, {
        canContinue:       !snap.limitReached,
        buyCreditGate:     snap.limitReached,
        upgradeComingSoon: snap.limitReached && !isCreditPurchaseWired(),
        message:           snap.limitReached ? consumerProBlockedMessage(snap) : null,
      });
    }
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

  if (proTier(access)) {
    if (isConsumerDailyPlan()) {
      const snap = await getConsumerProSnapshot(userId);
      return consumerDailyToResult('PRO', snap, {
        canContinue:       !snap.limitReached,
        buyCreditGate:     snap.limitReached,
        upgradeComingSoon: snap.limitReached && !isCreditPurchaseWired(),
        message:           snap.limitReached ? consumerProBlockedMessage(snap) : null,
      });
    }
    const snap = await getPremiumQuotaSnapshot(userId);
    return premiumToResult(snap, {
      canContinue:       !snap.limitReached,
      buyCreditGate:     snap.limitReached,
      upgradeComingSoon: snap.limitReached && !isCreditPurchaseWired(),
      message:           snap.limitReached ? premiumBlockedMessage(snap) : null,
    });
  }

  if (isConsumerDailyPlan()) {
    const snap = await getConsumerFreeSnapshot(userId);
    return consumerDailyToResult('FREE', snap, {
      canContinue:    !snap.limitReached,
      buyCreditGate:  false,
      message:        snap.limitReached ? consumerFreeBlockedMessage(snap) : null,
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
