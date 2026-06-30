/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Access Service
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

import {
  SubscriptionModel,
  SubscriptionTier,
  SubscriptionStatus,
  PencarianStage,
  BASIC_TIER_DB_IN,
  LEGACY_SUBSCRIPTION_TIER_PENCARIAN,
  PRO_TIER_DB_IN,
  normalizeSubscriptionTier,
} from '../subscriptions/subscription.schema';
import { ENV } from '../config/environments';
import { pelajarMonthlyLimit } from '../freemium/adam-freemium-daily.service';
import {
  getPremiumQuotaSnapshot,
  premiumBlockedMessage,
} from '../freemium/adam-freemium-premium.service';
import {
  freeRollingLimit,
  getRollingQuotaSnapshot,
  profesionalRollingLimit,
  rollingWindowHours,
} from '../freemium/adam-freemium-rolling.service';
import { RollingQuotaBucket } from '../freemium/adam-freemium.schema';
import {
  consumerFreeBlockedMessage,
  consumerProBlockedMessage,
  consumerFreeDailyLimit,
  consumerProDailyLimit,
  getConsumerFreeSnapshot,
  getConsumerProSnapshot,
  isConsumerDailyPlan,
} from '../freemium/adam-freemium-consumer.service';

export type SubscriptionAccessCode =
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_PAUSED'
  | 'PENCARIAN_LIMIT'
  | 'DAILY_LIMIT';

export interface PencarianAccessSnapshot {
  messagesUsed:      number;
  messagesRemaining: number;
  totalLimit:        number;
  currentStage:      PencarianStage | string;
  dateKey?:          string;
  dailyLimit?:       boolean;
}

export interface SubscriptionAccess {
  canChat:     boolean;
  tier:        SubscriptionTier | 'NONE';
  status:      string;
  code?:       SubscriptionAccessCode;
  message?:    string;
  upgradeUrl?: string;
  pencarian?:  PencarianAccessSnapshot;
}

function upgradeUrl(path = '/plans'): string {
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://qxk24.com').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function pencarianSnapshot(
  used: number,
  limit: number,
  stage: PencarianStage | string,
): PencarianAccessSnapshot {
  return {
    messagesUsed:      used,
    messagesRemaining: Math.max(0, limit - used),
    totalLimit:        limit,
    currentStage:      stage,
  };
}

export async function resolveSubscriptionAccess(userId: string): Promise<SubscriptionAccess> {
  const paidSub = await SubscriptionModel.findOne({
    userId,
    tier:   { $in: [...PRO_TIER_DB_IN, SubscriptionTier.PROFESIONAL, SubscriptionTier.ENTERPRISE] },
    status: SubscriptionStatus.ACTIVE,
  }).sort({ updatedAt: -1 });

  if (paidSub) {
    if (paidSub.currentPeriodEnd && paidSub.currentPeriodEnd < new Date()) {
      return {
        canChat:     false,
        tier:        paidSub.tier,
        status:      paidSub.status,
        code:        'SUBSCRIPTION_EXPIRED',
        message:     'Langganan tamat tempoh. Perbaharui untuk terus bersama ADAM.',
        upgradeUrl:  upgradeUrl('/plans'),
      };
    }

    if (ENV.ADAM_FREEMIUM_ENABLED && isConsumerDailyPlan()
        && (normalizeSubscriptionTier(paidSub.tier) === SubscriptionTier.PRO
          || paidSub.tier === SubscriptionTier.PROFESIONAL)) {
      const snap = await getConsumerProSnapshot(userId);
      const pencarianSnap = pencarianSnapshot(snap.questionsUsed, snap.dailyLimit, PencarianStage.KNOW);
      pencarianSnap.dateKey = snap.dateKey;
      pencarianSnap.dailyLimit = true;

      if (snap.limitReached) {
        return {
          canChat:     false,
          tier:        paidSub.tier,
          status:      paidSub.status,
          code:        'DAILY_LIMIT',
          message:     consumerProBlockedMessage(snap),
          upgradeUrl:  upgradeUrl('/adam/credits'),
          pencarian:   pencarianSnap,
        };
      }

      return {
        canChat:   true,
        tier:      paidSub.tier,
        status:    paidSub.status,
        pencarian: pencarianSnap,
      };
    }

    if (ENV.ADAM_FREEMIUM_ENABLED && normalizeSubscriptionTier(paidSub.tier) === SubscriptionTier.PRO) {
      const snap = await getPremiumQuotaSnapshot(userId);
      const pencarianSnap = pencarianSnapshot(snap.monthlyUsed, snap.monthlyLimit, PencarianStage.KNOW);
      pencarianSnap.dateKey = snap.monthKey;
      pencarianSnap.dailyLimit = false;

      if (snap.limitReached) {
        return {
          canChat:     false,
          tier:        paidSub.tier,
          status:      paidSub.status,
          code:        'DAILY_LIMIT',
          message:     premiumBlockedMessage(snap),
          upgradeUrl:  upgradeUrl('/adam/credits'),
          pencarian:   pencarianSnap,
        };
      }

      return {
        canChat:   true,
        tier:      paidSub.tier,
        status:    paidSub.status,
        pencarian: pencarianSnap,
      };
    }

    if (ENV.ADAM_FREEMIUM_ENABLED && paidSub.tier === SubscriptionTier.PROFESIONAL) {
      const limit = profesionalRollingLimit();
      const rolling = await getRollingQuotaSnapshot(userId, RollingQuotaBucket.PROFESIONAL, limit);
      const pencarianSnap = pencarianSnapshot(rolling.questionsUsed, limit, PencarianStage.KNOW);
      pencarianSnap.dateKey = rolling.windowStart.toISOString();

      if (rolling.limitReached) {
        return {
          canChat:     false,
          tier:        paidSub.tier,
          status:      paidSub.status,
          code:        'DAILY_LIMIT',
          message:     `Profesional pace limit (${limit} per ${rollingWindowHours()} hours) reached. Wait for the window to reset.`,
          upgradeUrl:  upgradeUrl('/plans'),
          pencarian:   pencarianSnap,
        };
      }

      return {
        canChat:   true,
        tier:      paidSub.tier,
        status:    paidSub.status,
        pencarian: pencarianSnap,
      };
    }

    return { canChat: true, tier: paidSub.tier, status: paidSub.status };
  }

  const testerSub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.TESTER,
    status: SubscriptionStatus.ACTIVE,
  });

  if (testerSub?.pencarianUsage) {
    const usage = testerSub.pencarianUsage;
    const limit = usage.totalMessagesLimit + usage.extensionMessagesAdded;
    return {
      canChat:   true,
      tier:      SubscriptionTier.TESTER,
      status:    testerSub.status,
      pencarian: pencarianSnapshot(usage.totalMessagesUsed, limit, usage.currentStage),
    };
  }

  const revokedTester = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.TESTER,
    status: SubscriptionStatus.CANCELLED,
  });

  if (revokedTester) {
    return {
      canChat:    false,
      tier:       SubscriptionTier.TESTER,
      status:     revokedTester.status,
      message:    'Tester access has been revoked. Contact the Alamtologi team.',
      upgradeUrl: upgradeUrl('/plans'),
    };
  }

  const pausedSub = await SubscriptionModel.findOne({
    userId,
    tier:   { $nin: [...BASIC_TIER_DB_IN] },
    status: SubscriptionStatus.PAUSED,
  }).sort({ updatedAt: -1 });

  if (pausedSub) {
    return {
      canChat:     false,
      tier:        pausedSub.tier,
      status:      pausedSub.status,
      code:        'SUBSCRIPTION_PAUSED',
      message:     'Pembayaran gagal. Kemas kini bil anda untuk meneruskan.',
      upgradeUrl:  upgradeUrl('/plans'),
    };
  }

  const pencarianSub = await SubscriptionModel.findOne({
    userId,
    tier:   { $in: [...BASIC_TIER_DB_IN] },
    status: SubscriptionStatus.WAQF,
  });

  if (ENV.ADAM_FREEMIUM_ENABLED && isConsumerDailyPlan()) {
    const limit = consumerFreeDailyLimit();
    const snap = await getConsumerFreeSnapshot(userId);
      const stage = pencarianSub?.pencarianUsage?.currentStage ?? PencarianStage.KNOW;
      const accessSnap = pencarianSnapshot(snap.questionsUsed, limit, stage);
      accessSnap.dateKey = snap.dateKey;
      accessSnap.dailyLimit = true;

      if (snap.limitReached) {
        return {
          canChat:     false,
          tier:        SubscriptionTier.BASIC,
          status:      SubscriptionStatus.WAQF,
          code:        'DAILY_LIMIT',
          message:     consumerFreeBlockedMessage(snap),
          upgradeUrl:  upgradeUrl('/pricing'),
          pencarian:   accessSnap,
        };
      }

      return {
        canChat:   true,
        tier:      SubscriptionTier.BASIC,
        status:    SubscriptionStatus.WAQF,
        pencarian: accessSnap,
      };
  }

  if (ENV.ADAM_FREEMIUM_ENABLED) {
    const limit = freeRollingLimit();
    const rolling = await getRollingQuotaSnapshot(userId, RollingQuotaBucket.FREE, limit);
    const stage = pencarianSub?.pencarianUsage?.currentStage ?? PencarianStage.KNOW;
    const snap  = pencarianSnapshot(rolling.questionsUsed, limit, stage);
    snap.dateKey = rolling.windowStart.toISOString();
    snap.dailyLimit = false;

    if (rolling.limitReached) {
      return {
        canChat:     false,
        tier:        SubscriptionTier.BASIC,
        status:      SubscriptionStatus.WAQF,
        code:        'DAILY_LIMIT',
        message:     `Basic rolling limit (${limit} per ${rollingWindowHours()} hours) reached. Buy credits or wait for reset.`,
        upgradeUrl:  upgradeUrl('/adam/credits'),
        pencarian:   snap,
      };
    }

    return {
      canChat:   true,
      tier:      SubscriptionTier.BASIC,
      status:    SubscriptionStatus.WAQF,
      pencarian: snap,
    };
  }

  if (pencarianSub?.pencarianUsage) {
    const usage = pencarianSub.pencarianUsage;
    const limit = usage.totalMessagesLimit + usage.extensionMessagesAdded;
    const snap  = pencarianSnapshot(usage.totalMessagesUsed, limit, usage.currentStage);

    if (usage.totalMessagesUsed >= limit) {
      return {
        canChat:     false,
        tier:        SubscriptionTier.BASIC,
        status:      SubscriptionStatus.WAQF,
        code:        'PENCARIAN_LIMIT',
        message:     'Perjalanan Pencarian kamu telah mencapai had semula jadi.',
        upgradeUrl:  upgradeUrl('/plans'),
        pencarian:   snap,
      };
    }

    return {
      canChat:  true,
      tier:     SubscriptionTier.BASIC,
      status:   SubscriptionStatus.WAQF,
      pencarian: snap,
    };
  }

  return {
    canChat:  true,
    tier:     SubscriptionTier.BASIC,
    status:   SubscriptionStatus.WAQF,
    pencarian: {
      ...pencarianSnapshot(0, freeRollingLimit(), PencarianStage.KNOW),
      dailyLimit:  false,
    },
  };
}

export function isPencarianTier(access: SubscriptionAccess): boolean {
  return access.tier === SubscriptionTier.BASIC;
}
