/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Access Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  SubscriptionModel,
  SubscriptionTier,
  SubscriptionStatus,
  PencarianStage,
} from '../subscriptions/subscription.schema';
import { ENV } from '../config/environments';
import {
  freeDailyLimit,
  pelajarDailyLimit,
  getDailyQuotaSnapshot,
} from '../freemium/adam-freemium-daily.service';
import { malaysiaDateKey } from '../freemium/adam-freemium-date';

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
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
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
    tier:   { $in: [SubscriptionTier.PELAJAR, SubscriptionTier.PROFESIONAL, SubscriptionTier.ENTERPRISE] },
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

    if (ENV.ADAM_FREEMIUM_ENABLED && paidSub.tier === SubscriptionTier.PELAJAR) {
      const limit = pelajarDailyLimit();
      const snap  = await getDailyQuotaSnapshot(userId, limit);
      const pencarianSnap = pencarianSnapshot(snap.questionsUsed, limit, PencarianStage.KNOW);
      pencarianSnap.dateKey = snap.dateKey;
      pencarianSnap.dailyLimit = true;

      if (snap.limitReached) {
        return {
          canChat:     false,
          tier:        paidSub.tier,
          status:      paidSub.status,
          code:        'DAILY_LIMIT',
          message:     `Had harian Pelajar (${limit} soalan) tercapai. Beli kredit untuk teruskan.`,
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
    tier:   { $nin: [SubscriptionTier.PENCARIAN] },
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
    tier:   SubscriptionTier.PENCARIAN,
    status: SubscriptionStatus.WAQF,
  });

  if (ENV.ADAM_FREEMIUM_ENABLED) {
    const limit = freeDailyLimit();
    const daily = await getDailyQuotaSnapshot(userId, limit);
    const stage = pencarianSub?.pencarianUsage?.currentStage ?? PencarianStage.KNOW;
    const snap  = pencarianSnapshot(daily.questionsUsed, limit, stage);
    snap.dateKey = daily.dateKey;
    snap.dailyLimit = true;

    if (daily.limitReached) {
      return {
        canChat:     false,
        tier:        SubscriptionTier.PENCARIAN,
        status:      SubscriptionStatus.WAQF,
        code:        'DAILY_LIMIT',
        message:     `Had harian percuma (${limit} soalan) tercapai. Beli kredit untuk teruskan.`,
        upgradeUrl:  upgradeUrl('/adam/credits'),
        pencarian:   snap,
      };
    }

    return {
      canChat:   true,
      tier:      SubscriptionTier.PENCARIAN,
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
        tier:        SubscriptionTier.PENCARIAN,
        status:      SubscriptionStatus.WAQF,
        code:        'PENCARIAN_LIMIT',
        message:     'Perjalanan Pencarian kamu telah mencapai had semula jadi.',
        upgradeUrl:  upgradeUrl('/plans'),
        pencarian:   snap,
      };
    }

    return {
      canChat:  true,
      tier:     SubscriptionTier.PENCARIAN,
      status:   SubscriptionStatus.WAQF,
      pencarian: snap,
    };
  }

  return {
    canChat:  true,
    tier:     SubscriptionTier.PENCARIAN,
    status:   SubscriptionStatus.WAQF,
    pencarian: {
      ...pencarianSnapshot(0, freeDailyLimit(), PencarianStage.KNOW),
      dateKey:     malaysiaDateKey(),
      dailyLimit:  true,
    },
  };
}

export function isPencarianTier(access: SubscriptionAccess): boolean {
  return access.tier === SubscriptionTier.PENCARIAN;
}
