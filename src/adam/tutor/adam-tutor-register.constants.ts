/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Constants
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

/** Phase 1 — closed channel, Malaysia only. */
export const TUTOR_REGISTER_PHASE_COUNTRY = 'MY';

export const TUTOR_REGISTER_BAND_LABELS_BM: Record<TutorSubscriptionLevel, string> = {
  primary:    'Sekolah Rendah',
  secondary:  'Sekolah Menengah',
  university: 'Kolej & Universiti',
};

export const TUTOR_REGISTER_BAND_PREFIX: Record<TutorSubscriptionLevel, string> = {
  primary:    'RENDAH',
  secondary:  'MENENGAH',
  university: 'UNIV',
};

/** @deprecated Legacy PINs without band — new codes use RENDAH / MENENGAH / UNIV prefix. */
export const TUTOR_PIN_LABEL = 'Semua aras';
/** @deprecated Legacy PINs without band prefix. */
export const TUTOR_PIN_PREFIX = 'UMUM';

/** Agent license + student agent-price window length (months). */
export const TUTOR_AGENT_LICENSE_MONTHS = 12;

/** @deprecated use TUTOR_PIN_LABEL */
export const TUTOR_REGISTER_BAND_LABEL_GENERAL = TUTOR_PIN_LABEL;
/** @deprecated use TUTOR_PIN_PREFIX */
export const TUTOR_REGISTER_BAND_PREFIX_GENERAL = TUTOR_PIN_PREFIX;

/** Neutral level used only where a concrete level is structurally required (soft baseline). */
export const TUTOR_REGISTER_BAND_FALLBACK: TutorSubscriptionLevel = 'secondary';

export function tutorBandLabel(
  band: TutorSubscriptionLevel | null | undefined,
): string {
  return band ? TUTOR_REGISTER_BAND_LABELS_BM[band] : TUTOR_REGISTER_BAND_LABEL_GENERAL;
}

export function tutorBandPrefix(
  band: TutorSubscriptionLevel | null | undefined,
): string {
  return band ? TUTOR_REGISTER_BAND_PREFIX[band] : TUTOR_REGISTER_BAND_PREFIX_GENERAL;
}

export {
  tutorRegisterMonthlyUsd,
  tutorRegisterMonthlyMyr,
  listTutorRegisterPricing,
  getTutorBandPricing,
  convertUsdToMyr,
} from './adam-tutor-pricing.service';
export { getUsdMyrRate } from './adam-usd-myr-rate.service';
export type { TutorBandPricing } from './adam-tutor-pricing.service';
export type { UsdMyrRateSnapshot } from './adam-usd-myr-rate.service';
