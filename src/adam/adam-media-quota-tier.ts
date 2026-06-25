/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Quota Tier
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

import { ENV } from '../config/environments';
import {
  SubscriptionTier,
  normalizeSubscriptionTier,
} from '../subscriptions/subscription.schema';

export type MediaQuotaTier =
  | 'guest'
  | 'free'
  | 'pro'
  | 'tutor'
  | 'profesional'
  | 'enterprise';

export interface MediaQuotaLimits {
  tier:               MediaQuotaTier;
  imagesMonthly:      number;
  videoSecondsMonthly: number;
}

export function isAdamMediaGenerationEnabled(): boolean {
  return ENV.ADAM_MEDIA_GENERATION_ENABLED;
}

export function mediaImageCostCents(): number {
  return ENV.ADAM_MEDIA_IMAGE_COST_CENTS;
}

export function mediaVideoSecondCostCents(): number {
  return ENV.ADAM_MEDIA_VIDEO_SECOND_COST_CENTS;
}

export function mediaMaxVideoSeconds(): number {
  return ENV.ADAM_MEDIA_MAX_VIDEO_SECONDS;
}

function imageLimitForTier(tier: MediaQuotaTier): number {
  switch (tier) {
    case 'guest':       return ENV.ADAM_MEDIA_IMAGE_MONTHLY_GUEST;
    case 'free':        return ENV.ADAM_MEDIA_IMAGE_MONTHLY_FREE;
    case 'pro':         return ENV.ADAM_MEDIA_IMAGE_MONTHLY_PRO;
    case 'tutor':       return ENV.ADAM_MEDIA_IMAGE_MONTHLY_TUTOR;
    case 'profesional': return ENV.ADAM_MEDIA_IMAGE_MONTHLY_PROFESIONAL;
    case 'enterprise':  return ENV.ADAM_MEDIA_IMAGE_MONTHLY_ENTERPRISE;
    default:            return 0;
  }
}

function videoSecondsLimitForTier(tier: MediaQuotaTier): number {
  switch (tier) {
    case 'guest':       return ENV.ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_GUEST;
    case 'free':        return ENV.ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_FREE;
    case 'pro':         return ENV.ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_PRO;
    case 'tutor':       return ENV.ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_TUTOR;
    case 'profesional': return ENV.ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_PROFESIONAL;
    case 'enterprise':  return ENV.ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_ENTERPRISE;
    default:            return 0;
  }
}

export function resolveMediaQuotaTier(input: {
  isFounder?: boolean;
  isGuest?:   boolean;
  tier?:      string | SubscriptionTier | null;
}): MediaQuotaTier {
  if (input.isFounder) return 'enterprise';
  if (input.isGuest) return 'guest';

  const normalized = normalizeSubscriptionTier(input.tier ?? null);
  if (normalized === SubscriptionTier.ENTERPRISE) return 'enterprise';
  if (normalized === SubscriptionTier.TUTOR) return 'tutor';
  if (normalized === SubscriptionTier.PROFESIONAL) return 'profesional';
  if (normalized === SubscriptionTier.PRO) return 'pro';
  return 'free';
}

export function getMediaQuotaLimits(tier: MediaQuotaTier): MediaQuotaLimits {
  return {
    tier,
    imagesMonthly:       imageLimitForTier(tier),
    videoSecondsMonthly: videoSecondsLimitForTier(tier),
  };
}

export function mediaWalletCostCents(kind: 'image' | 'video', videoSeconds = 0): number {
  if (kind === 'image') return mediaImageCostCents();
  const seconds = Math.min(Math.max(1, videoSeconds), mediaMaxVideoSeconds());
  return seconds * mediaVideoSecondCostCents();
}
