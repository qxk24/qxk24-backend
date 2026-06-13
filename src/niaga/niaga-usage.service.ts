/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Usage Caps
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import {
  NIAGA_MESSAGES_DAILY_SOFT,
  NIAGA_MESSAGES_MONTHLY_CAP,
  NIAGA_SNAPSHOTS_PER_QUARTER,
} from './niaga.constants';
import { NiagaSubscriptionModel } from './niaga-subscription.schema';

export interface NiagaUsageSnapshot {
  messagesUsedMonth:    number;
  messagesMonthlyCap:   number;
  messagesUsedToday:    number;
  messagesDailySoft:      number;
  dailySoftExceeded:    boolean;
  monthlyLimitReached:  boolean;
  snapshotsUsedQuarter: number;
  snapshotsPerQuarter:  number;
  usageMonthKey:        string;
  usageQuarterKey:      string;
}

function malaysiaMonthKey(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year:     'numeric',
    month:    '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${y}-${m}`;
}

function malaysiaDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(d);
}

function malaysiaQuarterKey(d = new Date()): string {
  const month = parseInt(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', month: 'numeric' }).format(d),
    10,
  );
  const year = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year:     'numeric',
  }).format(d);
  const q = Math.ceil(month / 3);
  return `${year}-Q${q}`;
}

/** In-memory daily counter — resets per MY date (lightweight soft-cap tracking). */
const dailyMessageCounts = new Map<string, number>();

function dailyCountKey(userId: string): string {
  return `${userId}:${malaysiaDateKey()}`;
}

export async function getNiagaUsageSnapshot(
  userId: string,
  subscriptionId: string | null,
): Promise<NiagaUsageSnapshot> {
  const usageMonthKey = malaysiaMonthKey();
  const usageQuarterKey = malaysiaQuarterKey();
  let messagesUsedMonth = 0;
  let snapshotsUsedQuarter = 0;

  if (subscriptionId) {
    const sub = await NiagaSubscriptionModel.findOne({ subscriptionId }).lean();
    if (sub) {
      messagesUsedMonth = sub.usageMonthKey === usageMonthKey ? sub.messagesUsedMonth : 0;
      snapshotsUsedQuarter = sub.usageQuarterKey === usageQuarterKey ? sub.snapshotsUsedQuarter : 0;
    }
  }

  const messagesUsedToday = dailyMessageCounts.get(dailyCountKey(userId)) ?? 0;

  return {
    messagesUsedMonth,
    messagesMonthlyCap:  NIAGA_MESSAGES_MONTHLY_CAP,
    messagesUsedToday,
    messagesDailySoft:   NIAGA_MESSAGES_DAILY_SOFT,
    dailySoftExceeded: messagesUsedToday >= NIAGA_MESSAGES_DAILY_SOFT,
    monthlyLimitReached: messagesUsedMonth >= NIAGA_MESSAGES_MONTHLY_CAP,
    snapshotsUsedQuarter,
    snapshotsPerQuarter: NIAGA_SNAPSHOTS_PER_QUARTER,
    usageMonthKey,
    usageQuarterKey,
  };
}

export async function recordNiagaChatMessage(userId: string, subscriptionId: string): Promise<NiagaUsageSnapshot> {
  const usageMonthKey = malaysiaMonthKey();
  const sub = await NiagaSubscriptionModel.findOne({ subscriptionId });
  if (!sub) {
    return getNiagaUsageSnapshot(userId, subscriptionId);
  }

  if (sub.usageMonthKey !== usageMonthKey) {
    sub.messagesUsedMonth = 0;
    sub.usageMonthKey = usageMonthKey;
  }
  sub.messagesUsedMonth += 1;
  await sub.save();

  const dk = dailyCountKey(userId);
  dailyMessageCounts.set(dk, (dailyMessageCounts.get(dk) ?? 0) + 1);

  return getNiagaUsageSnapshot(userId, subscriptionId);
}

export async function canGenerateNiagaSnapshot(subscriptionId: string): Promise<boolean> {
  const usage = await getNiagaUsageSnapshot('', subscriptionId);
  return usage.snapshotsUsedQuarter < NIAGA_SNAPSHOTS_PER_QUARTER;
}

export async function recordNiagaSnapshot(subscriptionId: string): Promise<void> {
  const usageQuarterKey = malaysiaQuarterKey();
  const sub = await NiagaSubscriptionModel.findOne({ subscriptionId });
  if (!sub) return;

  if (sub.usageQuarterKey !== usageQuarterKey) {
    sub.snapshotsUsedQuarter = 0;
    sub.usageQuarterKey = usageQuarterKey;
  }
  sub.snapshotsUsedQuarter += 1;
  await sub.save();
}
