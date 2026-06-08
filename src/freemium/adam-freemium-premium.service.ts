/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Premium Quota (monthly + daily pace)
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
import { malaysiaDateKey, malaysiaMonthKey } from './adam-freemium-date';
import { consumeOneCredit, getCreditBalance } from './adam-freemium-credit.service';
import { pelajarMonthlyLimit } from './adam-freemium-daily.service';

export type PremiumBlockReason = 'monthly' | 'daily_pace' | null;

export interface PremiumQuotaSnapshot {
  userId:              string;
  monthKey:            string;
  dayKey:              string;
  monthlyUsed:         number;
  monthlyLimit:        number;
  monthlyRemaining:    number;
  dailyPaceUsed:       number;
  dailyPaceLimit:      number;
  dailyPaceRemaining:   number;
  creditBalance:       number;
  usedFromCredits:     boolean;
  limitReached:        boolean;
  blockReason:         PremiumBlockReason;
}

export function pelajarDailySoftLimit(): number {
  return ENV.ADAM_FREEMIUM_PELAJAR_DAILY_SOFT;
}

function premiumDayKey(date = new Date()): string {
  return `premium-day:${malaysiaDateKey(date)}`;
}

function buildPremiumSnapshot(
  userId: string,
  monthKey: string,
  dayKey: string,
  monthlyUsed: number,
  dailyPaceUsed: number,
  creditBalance: number,
  usedFromCredits = false,
  blockReason: PremiumBlockReason = null,
): PremiumQuotaSnapshot {
  const monthlyLimit = pelajarMonthlyLimit();
  const dailyPaceLimit = pelajarDailySoftLimit();
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
  const dailyPaceRemaining = Math.max(0, dailyPaceLimit - dailyPaceUsed);
  const includedBlocked = monthlyUsed >= monthlyLimit || dailyPaceUsed >= dailyPaceLimit;
  const limitReached = includedBlocked && creditBalance <= 0 && !usedFromCredits;

  return {
    userId,
    monthKey,
    dayKey,
    monthlyUsed,
    monthlyLimit,
    monthlyRemaining,
    dailyPaceUsed,
    dailyPaceLimit,
    dailyPaceRemaining,
    creditBalance,
    usedFromCredits,
    limitReached,
    blockReason: limitReached ? (blockReason ?? (monthlyUsed >= monthlyLimit ? 'monthly' : 'daily_pace')) : null,
  };
}

async function readPremiumCounters(userId: string, date = new Date()) {
  const monthKey = malaysiaMonthKey(date);
  const dayKey = premiumDayKey(date);
  const [monthDoc, dayDoc, creditBalance] = await Promise.all([
    AdamDailyQuotaModel.findOne({ userId, dateKey: monthKey }).lean(),
    AdamDailyQuotaModel.findOne({ userId, dateKey: dayKey }).lean(),
    getCreditBalance(userId),
  ]);
  return {
    monthKey,
    dayKey,
    monthlyUsed:   monthDoc?.count ?? 0,
    dailyPaceUsed: dayDoc?.count ?? 0,
    creditBalance,
  };
}

export async function getPremiumQuotaSnapshot(
  userId: string,
  date = new Date(),
): Promise<PremiumQuotaSnapshot> {
  const c = await readPremiumCounters(userId, date);
  return buildPremiumSnapshot(
    userId,
    c.monthKey,
    c.dayKey,
    c.monthlyUsed,
    c.dailyPaceUsed,
    c.creditBalance,
  );
}

/** Included allowance: monthly pool + max 5/day pace. Wallet credits bypass daily pace. */
export async function reservePremiumQuestion(
  userId: string,
  date = new Date(),
): Promise<PremiumQuotaSnapshot> {
  const monthlyLimit = pelajarMonthlyLimit();
  const dailyPaceLimit = pelajarDailySoftLimit();
  const c = await readPremiumCounters(userId, date);

  const canUseIncluded = c.monthlyUsed < monthlyLimit && c.dailyPaceUsed < dailyPaceLimit;
  if (canUseIncluded) {
    await Promise.all([
      AdamDailyQuotaModel.findOneAndUpdate(
        { userId, dateKey: c.monthKey },
        { $inc: { count: 1 } },
        { upsert: true },
      ),
      AdamDailyQuotaModel.findOneAndUpdate(
        { userId, dateKey: c.dayKey },
        { $inc: { count: 1 } },
        { upsert: true },
      ),
    ]);
    return buildPremiumSnapshot(
      userId,
      c.monthKey,
      c.dayKey,
      c.monthlyUsed + 1,
      c.dailyPaceUsed + 1,
      c.creditBalance,
    );
  }

  if (c.creditBalance > 0) {
    const consumed = await consumeOneCredit(userId);
    if (consumed.ok) {
      return buildPremiumSnapshot(
        userId,
        c.monthKey,
        c.dayKey,
        c.monthlyUsed,
        c.dailyPaceUsed,
        consumed.balance,
        true,
      );
    }
  }

  const blockReason: PremiumBlockReason = c.monthlyUsed >= monthlyLimit
    ? 'monthly'
    : 'daily_pace';

  return buildPremiumSnapshot(
    userId,
    c.monthKey,
    c.dayKey,
    c.monthlyUsed,
    c.dailyPaceUsed,
    c.creditBalance,
    false,
    blockReason,
  );
}

export function premiumBlockedMessage(snap: PremiumQuotaSnapshot): string {
  if (snap.blockReason === 'daily_pace') {
    return `Daily Premium pace (${snap.dailyPaceLimit} deep questions) reached. Continue tomorrow, or add +50 (RM 35) / +100 (RM 85) to keep going today.`;
  }
  return `Your Premium monthly allowance (${snap.monthlyLimit} questions) is used up. Add +50 (RM 35) or +100 (RM 85) to continue this month.`;
}
