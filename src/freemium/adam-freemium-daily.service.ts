/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Daily Quota
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

import { ENV } from '../config/environments';
import { AdamDailyQuotaModel } from './adam-freemium.schema';
import { malaysiaDateKey } from './adam-freemium-date';
import { consumeOneCredit, getCreditBalance } from './adam-freemium-credit.service';

export interface DailyQuotaSnapshot {
  userId:              string;
  dateKey:             string;
  questionsUsed:       number;
  questionsRemaining:  number;
  dailyLimit:          number;
  creditBalance:       number;
  usedFromCredits:     boolean;
  limitReached:        boolean;
}

export function freeDailyLimit(): number {
  return ENV.ADAM_FREEMIUM_FREE_DAILY;
}

export function pelajarDailyLimit(): number {
  return ENV.ADAM_FREEMIUM_PELAJAR_DAILY;
}

function buildSnapshot(
  userId: string,
  dateKey: string,
  used: number,
  dailyLimit: number,
  creditBalance: number,
  usedFromCredits = false,
): DailyQuotaSnapshot {
  const dailyRemaining = Math.max(0, dailyLimit - used);
  const totalRemaining = dailyRemaining + creditBalance;
  return {
    userId,
    dateKey,
    questionsUsed:      used,
    questionsRemaining: totalRemaining,
    dailyLimit,
    creditBalance,
    usedFromCredits,
    limitReached:       used >= dailyLimit && creditBalance <= 0,
  };
}

export async function getDailyQuotaSnapshot(
  userId: string,
  dailyLimit: number,
  date = new Date(),
): Promise<DailyQuotaSnapshot> {
  const dateKey = malaysiaDateKey(date);
  const [doc, creditBalance] = await Promise.all([
    AdamDailyQuotaModel.findOne({ userId, dateKey }).lean(),
    getCreditBalance(userId),
  ]);
  const used = doc?.count ?? 0;
  return buildSnapshot(userId, dateKey, used, dailyLimit, creditBalance);
}

/**
 * Reserve one question — daily allowance first, then purchased credits.
 */
export async function reserveDailyQuestion(
  userId: string,
  dailyLimit: number,
  date = new Date(),
): Promise<DailyQuotaSnapshot> {
  const dateKey = malaysiaDateKey(date);
  const existing = await AdamDailyQuotaModel.findOne({ userId, dateKey }).lean();
  const used = existing?.count ?? 0;

  if (used < dailyLimit) {
    const doc = await AdamDailyQuotaModel.findOneAndUpdate(
      { userId, dateKey },
      { $inc: { count: 1 } },
      { upsert: true, new: true },
    ).lean();
    const nextUsed = doc?.count ?? used + 1;
    const creditBalance = await getCreditBalance(userId);
    return buildSnapshot(userId, dateKey, nextUsed, dailyLimit, creditBalance);
  }

  const consumed = await consumeOneCredit(userId);
  if (!consumed.ok) {
    return buildSnapshot(userId, dateKey, used, dailyLimit, consumed.balance);
  }

  return buildSnapshot(userId, dateKey, used, dailyLimit, consumed.balance, true);
}

/** Read-only check — does not increment. */
export async function canAskDailyQuestion(
  userId: string,
  dailyLimit: number,
  date = new Date(),
): Promise<boolean> {
  const snap = await getDailyQuotaSnapshot(userId, dailyLimit, date);
  return !snap.limitReached;
}
