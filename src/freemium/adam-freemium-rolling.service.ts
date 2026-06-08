/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Rolling Quota
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
import { AdamRollingQuotaModel, RollingQuotaBucket } from './adam-freemium.schema';
import { consumeOneCredit, getCreditBalance } from './adam-freemium-credit.service';

export interface RollingQuotaSnapshot {
  userId:              string;
  bucket:              RollingQuotaBucket;
  questionsUsed:       number;
  questionsRemaining:  number;
  limit:               number;
  windowHours:         number;
  windowStart:         Date;
  windowResetsAt:      Date;
  creditBalance:       number;
  usedFromCredits:     boolean;
  limitReached:        boolean;
}

export function rollingWindowHours(): number {
  return ENV.ADAM_FREEMIUM_ROLLING_WINDOW_HOURS;
}

export function freeRollingLimit(): number {
  return ENV.ADAM_FREEMIUM_FREE_ROLLING;
}

export function profesionalRollingLimit(): number {
  return ENV.ADAM_FREEMIUM_PROFESIONAL_ROLLING;
}

function windowMs(): number {
  return rollingWindowHours() * 60 * 60 * 1000;
}

function buildRollingSnapshot(
  userId: string,
  bucket: RollingQuotaBucket,
  used: number,
  limit: number,
  windowStart: Date,
  creditBalance: number,
  usedFromCredits = false,
): RollingQuotaSnapshot {
  const remaining = Math.max(0, limit - used);
  return {
    userId,
    bucket,
    questionsUsed:      used,
    questionsRemaining: remaining + creditBalance,
    limit,
    windowHours:        rollingWindowHours(),
    windowStart,
    windowResetsAt:     new Date(windowStart.getTime() + windowMs()),
    creditBalance,
    usedFromCredits,
    limitReached:       used >= limit && creditBalance <= 0,
  };
}

async function loadRollingDoc(userId: string, bucket: RollingQuotaBucket, now = new Date()) {
  const doc = await AdamRollingQuotaModel.findOne({ userId, bucket }).lean();
  if (!doc) {
    return { used: 0, windowStart: now, fresh: true as const };
  }

  const elapsed = now.getTime() - new Date(doc.windowStart).getTime();
  if (elapsed >= windowMs()) {
    return { used: 0, windowStart: now, fresh: true as const };
  }

  return {
    used:        doc.count,
    windowStart: new Date(doc.windowStart),
    fresh:       false as const,
  };
}

export async function getRollingQuotaSnapshot(
  userId: string,
  bucket: RollingQuotaBucket,
  limit: number,
  now = new Date(),
): Promise<RollingQuotaSnapshot> {
  const [state, creditBalance] = await Promise.all([
    loadRollingDoc(userId, bucket, now),
    bucket === RollingQuotaBucket.FREE ? getCreditBalance(userId) : Promise.resolve(0),
  ]);

  return buildRollingSnapshot(
    userId,
    bucket,
    state.used,
    limit,
    state.windowStart,
    creditBalance,
  );
}

/**
 * Reserve one question in a rolling window — allowance first, then credits (free tier only).
 */
export async function reserveRollingQuestion(
  userId: string,
  bucket: RollingQuotaBucket,
  limit: number,
  now = new Date(),
): Promise<RollingQuotaSnapshot> {
  const state = await loadRollingDoc(userId, bucket, now);
  const creditBalance = bucket === RollingQuotaBucket.FREE
    ? await getCreditBalance(userId)
    : 0;

  if (state.used < limit) {
    const nextUsed = state.used + 1;
    await AdamRollingQuotaModel.findOneAndUpdate(
      { userId, bucket },
      {
        $set: {
          count:       nextUsed,
          windowStart: state.windowStart,
        },
      },
      { upsert: true, new: true },
    ).lean();

    return buildRollingSnapshot(
      userId,
      bucket,
      nextUsed,
      limit,
      state.windowStart,
      creditBalance,
    );
  }

  if (bucket === RollingQuotaBucket.FREE) {
    const consumed = await consumeOneCredit(userId);
    if (!consumed.ok) {
      return buildRollingSnapshot(
        userId,
        bucket,
        state.used,
        limit,
        state.windowStart,
        consumed.balance,
      );
    }
    return buildRollingSnapshot(
      userId,
      bucket,
      state.used,
      limit,
      state.windowStart,
      consumed.balance,
      true,
    );
  }

  return buildRollingSnapshot(
    userId,
    bucket,
    state.used,
    limit,
    state.windowStart,
    0,
  );
}
