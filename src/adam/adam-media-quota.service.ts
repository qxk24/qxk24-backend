/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Quota Service
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
 *
 * Option A — included monthly pool per tier, wallet overflow (docs/ADAM_MEDIA_GENERATION_PRICING.md).
 */

import { randomUUID } from 'crypto';
import { ENV } from '../config/environments';
import { malaysiaMonthKey } from '../freemium/adam-freemium-date';
import {
  consumeWalletForMedia,
  getCreditBalanceCents,
  walletBalanceUsd,
} from '../freemium/adam-freemium-credit.service';
import {
  AdamMediaQuotaModel,
  AdamMediaReservationModel,
} from '../freemium/adam-freemium.schema';
import {
  getMediaQuotaLimits,
  mediaImageCostCents,
  mediaMaxVideoSeconds,
  mediaVideoSecondCostCents,
  mediaWalletCostCents,
  resolveMediaQuotaTier,
  type MediaQuotaTier,
} from './adam-media-quota-tier';

export interface MediaQuotaSnapshot {
  userId:                 string;
  monthKey:               string;
  tier:                   MediaQuotaTier;
  imagesUsed:             number;
  imagesLimit:              number;
  imagesRemaining:        number;
  videoSecondsUsed:       number;
  videoSecondsLimit:      number;
  videoSecondsRemaining:  number;
  creditBalanceUsd:       number;
  imageOverflowCostUsd:   number;
  videoSecondOverflowCostUsd: number;
}

export interface MediaReservationResult {
  ok:             boolean;
  reservationId?: string;
  usedIncluded?:  boolean;
  walletCents?:   number;
  message?:       string;
  buyCreditGate?: boolean;
  registerGate?:  boolean;
  upgradeGate?:   boolean;
}

async function readQuotaCounters(userId: string, date = new Date()) {
  const monthKey = malaysiaMonthKey(date);
  const [doc, balanceCents] = await Promise.all([
    AdamMediaQuotaModel.findOne({ userId, monthKey }).lean(),
    getCreditBalanceCents(userId),
  ]);
  return {
    monthKey,
    imagesUsed:       doc?.imagesUsed ?? 0,
    videoSecondsUsed: doc?.videoSecondsUsed ?? 0,
    creditBalanceUsd: walletBalanceUsd(balanceCents),
  };
}

export async function getMediaQuotaSnapshot(input: {
  userId:     string;
  tier:       MediaQuotaTier;
  date?:      Date;
}): Promise<MediaQuotaSnapshot> {
  const limits = getMediaQuotaLimits(input.tier);
  const c = await readQuotaCounters(input.userId, input.date);
  return {
    userId:                 input.userId,
    monthKey:               c.monthKey,
    tier:                   input.tier,
    imagesUsed:             c.imagesUsed,
    imagesLimit:            limits.imagesMonthly,
    imagesRemaining:        Math.max(0, limits.imagesMonthly - c.imagesUsed),
    videoSecondsUsed:       c.videoSecondsUsed,
    videoSecondsLimit:      limits.videoSecondsMonthly,
    videoSecondsRemaining:  Math.max(0, limits.videoSecondsMonthly - c.videoSecondsUsed),
    creditBalanceUsd:       c.creditBalanceUsd,
    imageOverflowCostUsd:   mediaImageCostCents() / 100,
    videoSecondOverflowCostUsd: mediaVideoSecondCostCents() / 100,
  };
}

export function mediaQuotaBlockedMessage(
  snap: MediaQuotaSnapshot,
  kind: 'image' | 'video',
): string {
  if (snap.tier === 'guest') {
    return 'AI illustration generation is for registered members. Register free to continue with ADAM.';
  }
  if (snap.tier === 'free') {
    return 'AI illustration generation is included on Pro and ADAM Tutor. Upgrade at /pricing to generate images.';
  }
  if (kind === 'image') {
    return `Monthly AI illustration limit reached (${snap.imagesUsed}/${snap.imagesLimit}). Add wallet credits ($${snap.imageOverflowCostUsd.toFixed(2)}/image) or wait until the 1st of next month.`;
  }
  return `Monthly AI video allowance reached (${snap.videoSecondsUsed}/${snap.videoSecondsLimit} seconds). Add wallet credits ($${snap.videoSecondOverflowCostUsd.toFixed(2)}/sec) or wait until the 1st of next month.`;
}

function gateFlagsForTier(tier: MediaQuotaTier): Pick<MediaReservationResult, 'registerGate' | 'upgradeGate' | 'buyCreditGate'> {
  if (tier === 'guest') {
    return { registerGate: true, upgradeGate: false, buyCreditGate: false };
  }
  if (tier === 'free') {
    return { registerGate: false, upgradeGate: true, buyCreditGate: false };
  }
  return { registerGate: false, upgradeGate: false, buyCreditGate: true };
}

export async function reserveMediaGeneration(input: {
  userId:       string;
  tier:         MediaQuotaTier;
  kind:         'image' | 'video';
  videoSeconds?: number;
  date?:        Date;
}): Promise<MediaReservationResult> {
  const limits = getMediaQuotaLimits(input.tier);
  const seconds = input.kind === 'video'
    ? Math.min(Math.max(1, input.videoSeconds ?? 5), mediaMaxVideoSeconds())
    : 0;

  if (input.kind === 'image' && limits.imagesMonthly <= 0) {
    const snap = await getMediaQuotaSnapshot({ userId: input.userId, tier: input.tier, date: input.date });
    return {
      ok:      false,
      message: mediaQuotaBlockedMessage(snap, 'image'),
      ...gateFlagsForTier(input.tier),
    };
  }

  if (input.kind === 'video' && limits.videoSecondsMonthly <= 0) {
    const snap = await getMediaQuotaSnapshot({ userId: input.userId, tier: input.tier, date: input.date });
    return {
      ok:      false,
      message: mediaQuotaBlockedMessage(snap, 'video'),
      ...gateFlagsForTier(input.tier),
    };
  }

  const c = await readQuotaCounters(input.userId, input.date);
  const canUseIncludedImage = input.kind === 'image'
    && c.imagesUsed < limits.imagesMonthly;
  const canUseIncludedVideo = input.kind === 'video'
    && c.videoSecondsUsed + seconds <= limits.videoSecondsMonthly;

  const walletCost = mediaWalletCostCents(input.kind, seconds);
  const reservationId = randomUUID();

  if (canUseIncludedImage || canUseIncludedVideo) {
    const update = input.kind === 'image'
      ? { $inc: { imagesUsed: 1 } }
      : { $inc: { videoSecondsUsed: seconds } };

    await AdamMediaQuotaModel.findOneAndUpdate(
      { userId: input.userId, monthKey: c.monthKey },
      update,
      { upsert: true },
    );

    await AdamMediaReservationModel.create({
      reservationId,
      userId:       input.userId,
      monthKey:     c.monthKey,
      kind:         input.kind,
      videoSeconds: seconds,
      usedIncluded: true,
      walletCents:  0,
      status:       'held',
    });

    return { ok: true, reservationId, usedIncluded: true, walletCents: 0 };
  }

  const consumed = await consumeWalletForMedia(input.userId, walletCost);
  if (!consumed.ok) {
    const snap = await getMediaQuotaSnapshot({ userId: input.userId, tier: input.tier, date: input.date });
    return {
      ok:      false,
      message: mediaQuotaBlockedMessage(snap, input.kind),
      ...gateFlagsForTier(input.tier),
    };
  }

  await AdamMediaReservationModel.create({
    reservationId,
    userId:       input.userId,
    monthKey:     c.monthKey,
    kind:         input.kind,
    videoSeconds: seconds,
    usedIncluded: false,
    walletCents:  walletCost,
    status:       'held',
  });

  return {
    ok:            true,
    reservationId,
    usedIncluded:  false,
    walletCents:   walletCost,
  };
}

export async function confirmMediaReservation(reservationId: string): Promise<void> {
  await AdamMediaReservationModel.findOneAndUpdate(
    { reservationId, status: 'held' },
    { $set: { status: 'confirmed' } },
  );
}

export async function refundMediaReservation(reservationId: string): Promise<void> {
  const doc = await AdamMediaReservationModel.findOne({
    reservationId,
    status: 'held',
  }).lean();

  if (!doc) return;

  if (doc.usedIncluded) {
    if (doc.kind === 'image') {
      await AdamMediaQuotaModel.findOneAndUpdate(
        { userId: doc.userId, monthKey: doc.monthKey, imagesUsed: { $gte: 1 } },
        { $inc: { imagesUsed: -1 } },
      );
    } else {
      await AdamMediaQuotaModel.findOneAndUpdate(
        { userId: doc.userId, monthKey: doc.monthKey, videoSecondsUsed: { $gte: doc.videoSeconds } },
        { $inc: { videoSecondsUsed: -doc.videoSeconds } },
      );
    }
  } else if (doc.walletCents > 0) {
    const { AdamCreditWalletModel } = await import('../freemium/adam-freemium.schema');
    await AdamCreditWalletModel.findOneAndUpdate(
      { userId: doc.userId },
      { $inc: { balance: doc.walletCents } },
      { upsert: true },
    );
  }

  await AdamMediaReservationModel.findOneAndUpdate(
    { reservationId },
    { $set: { status: 'refunded' } },
  );
}

export function mediaQuotaStatusPayload(snap: MediaQuotaSnapshot): Record<string, unknown> {
  return {
    mediaGenerationEnabled: ENV.ADAM_MEDIA_GENERATION_ENABLED,
    mediaTier:              snap.tier,
    mediaMonthKey:          snap.monthKey,
    mediaImagesUsed:        snap.imagesUsed,
    mediaImagesLimit:       snap.imagesLimit,
    mediaImagesRemaining:   snap.imagesRemaining,
    mediaVideoSecondsUsed:  snap.videoSecondsUsed,
    mediaVideoSecondsLimit: snap.videoSecondsLimit,
    mediaVideoSecondsRemaining: snap.videoSecondsRemaining,
    mediaImageCostUsd:      snap.imageOverflowCostUsd,
    mediaVideoSecondCostUsd: snap.videoSecondOverflowCostUsd,
    mediaMaxVideoSeconds:   mediaMaxVideoSeconds(),
  };
}

export { resolveMediaQuotaTier };

export async function resolveUserMediaQuotaTier(input: {
  userId:     string;
  isFounder?: boolean;
  isGuest?:   boolean;
}): Promise<MediaQuotaTier> {
  if (input.isFounder) return 'enterprise';
  if (input.isGuest) return 'guest';

  const { resolveSubscriptionAccess } = await import('../subscriptions/subscription-access.service');
  const access = await resolveSubscriptionAccess(input.userId);
  return resolveMediaQuotaTier({ tier: access.tier });
}
