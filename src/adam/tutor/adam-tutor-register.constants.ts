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
