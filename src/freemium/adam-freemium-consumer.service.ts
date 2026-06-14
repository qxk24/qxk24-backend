/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Consumer Plan (Free daily + Pro daily + wallet)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { malaysiaDateKey } from './adam-freemium-date';
import {
  getDailyQuotaSnapshot,
  reserveDailyQuestion,
  type DailyQuotaSnapshot,
} from './adam-freemium-daily.service';
import {
  consumeWalletForExtraMessage,
  extraMessageCostCents,
  getCreditBalanceCents,
  walletBalanceUsd,
} from './adam-freemium-credit.service';

export function isConsumerDailyPlan(): boolean {
  return ENV.ADAM_CONSUMER_DAILY_PLAN;
}

export function consumerFreeDailyLimit(): number {
  return ENV.ADAM_FREEMIUM_FREE_DAILY;
}

export function consumerProDailyLimit(): number {
  return ENV.ADAM_FREEMIUM_PRO_DAILY;
}

export interface ConsumerQuotaSnapshot extends DailyQuotaSnapshot {
  walletBalanceCents: number;
  walletBalanceUsd:   number;
  extraMessageCost:   number;
}

function enrichSnapshot(snap: DailyQuotaSnapshot): ConsumerQuotaSnapshot {
  const walletBalanceCents = snap.creditBalance;
  return {
    ...snap,
    walletBalanceCents,
    walletBalanceUsd:   walletBalanceUsd(walletBalanceCents),
    extraMessageCost:   extraMessageCostCents() / 100,
  };
}

export async function getConsumerFreeSnapshot(
  userId: string,
  date = new Date(),
): Promise<ConsumerQuotaSnapshot> {
  const limit = consumerFreeDailyLimit();
  const snap = await getDailyQuotaSnapshot(userId, limit, date);
  const walletCents = await getCreditBalanceCents(userId);
  const used = snap.questionsUsed;
  return {
    ...snap,
    questionsRemaining: Math.max(0, limit - used),
    creditBalance:      walletCents,
    walletBalanceCents: walletCents,
    walletBalanceUsd:   walletBalanceUsd(walletCents),
    extraMessageCost:   extraMessageCostCents() / 100,
    limitReached:       used >= limit,
    usedFromCredits:    false,
  };
}

export async function getConsumerProSnapshot(
  userId: string,
  date = new Date(),
): Promise<ConsumerQuotaSnapshot> {
  const limit = consumerProDailyLimit();
  const snap = await getDailyQuotaSnapshot(userId, limit, date);
  const walletCents = await getCreditBalanceCents(userId);
  return enrichSnapshot({ ...snap, creditBalance: walletCents });
}

/** Free registered — daily allowance only; no wallet spend. */
export async function reserveConsumerFreeQuestion(
  userId: string,
  date = new Date(),
): Promise<ConsumerQuotaSnapshot> {
  const limit = consumerFreeDailyLimit();
  const dateKey = malaysiaDateKey(date);
  const existing = await getDailyQuotaSnapshot(userId, limit, date);
  if (existing.questionsUsed >= limit) {
    return enrichSnapshot(existing);
  }

  const snap = await reserveDailyQuestion(userId, limit, date);
  const walletCents = await getCreditBalanceCents(userId);
  return enrichSnapshot({ ...snap, creditBalance: walletCents, usedFromCredits: false });
}

/** Pro — daily included allowance, then wallet at $0.12/message. */
export async function reserveConsumerProQuestion(
  userId: string,
  date = new Date(),
): Promise<ConsumerQuotaSnapshot> {
  const limit = consumerProDailyLimit();
  const before = await getDailyQuotaSnapshot(userId, limit, date);

  if (before.questionsUsed < limit) {
    const snap = await reserveDailyQuestion(userId, limit, date);
    const walletCents = await getCreditBalanceCents(userId);
    return enrichSnapshot({ ...snap, creditBalance: walletCents });
  }

  const consumed = await consumeWalletForExtraMessage(userId);
  if (consumed.ok) {
    return enrichSnapshot({
      ...before,
      creditBalance:   consumed.balanceCents,
      usedFromCredits: true,
      limitReached:    false,
    });
  }

  return enrichSnapshot({
    ...before,
    creditBalance: consumed.balanceCents,
    limitReached:  true,
  });
}

export function consumerFreeBlockedMessage(snap: ConsumerQuotaSnapshot): string {
  return `Free daily limit (${snap.dailyLimit} messages) reached. Upgrade to Pro for 100/day, or wait until tomorrow (Malaysia time).`;
}

export function consumerProBlockedMessage(snap: ConsumerQuotaSnapshot): string {
  const cost = extraMessageCostCents() / 100;
  return `Pro daily limit (${snap.dailyLimit} messages) reached and wallet is empty. Add usage credits ($${cost.toFixed(2)}/extra message) or wait until tomorrow.`;
}
