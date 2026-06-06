/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Feature Flags
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Dual-lane AMA brain (Kotak 2/3) */
export function isAmaBrainV2Enabled(): boolean {
  return process.env.ADAM_AMA_BRAIN_V2 === 'true';
}

/**
 * Tahap 3 — controlled OASS cross-lane merge.
 * On when AMA v2 is active unless explicitly disabled.
 */
export function isAmaTamatOassEnabled(): boolean {
  if (!isAmaBrainV2Enabled()) return false;
  return process.env.ADAM_AMA_TAMAT_OASS !== 'false';
}

/** Tahap 4 — Langkah 6 neuro validation (EEG/HRV/RSA). Off only if explicitly disabled. */
export function isAmaNeuroValidationEnabled(): boolean {
  if (!isAmaBrainV2Enabled()) return false;
  return process.env.ADAM_AMA_NEURO_VALIDATION !== 'false';
}

/** Use EEG-calibrated Tamat coherence after neuro gate passes */
export function isAmaNeuroCalibrated(): boolean {
  if (!isAmaNeuroValidationEnabled()) return false;
  return process.env.ADAM_AMA_NEURO_CALIBRATE === 'true';
}
