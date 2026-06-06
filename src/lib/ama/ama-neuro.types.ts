/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Neuro Validation Types (Langkah 6)
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

/** Langkah 6 — constitutional minimum thresholds */
export const AMA_NEURO_THRESHOLDS = {
  /** EEG F3–F4 theta-alpha coherence (Kr ↔ Kn) */
  thetaAlphaCoherence: 0.65,
  /** ECG time-domain SDNN (ms) */
  hrvSdnnMs:           55,
  /** Respiration–RR interval coupling gain */
  rsaGain:             0.42,
  /** Resting-state fMRI Kr–Kn corpus callosum Z-score */
  fmriKrKnZScore:      2.1,
  /** Tamat integration target (Langkah 4 EEG baseline) */
  tamatCoherenceEeg:   0.78,
} as const;

export type NeuroSampleMode = 'simulator' | 'device' | 'clinical';

export interface NeuroPhysioSample {
  sourceId:              string;
  subjectId:             string;
  mode:                  NeuroSampleMode;
  thetaAlphaCoherence:   number;
  hrvSdnnMs:             number;
  rsaGain:               number;
  fmriKrKnZScore?:       number;
  timestamp?:            string;
  krSnippet?:            string;
  knSnippet?:            string;
}

export type NeuroParameterKey =
  | 'thetaAlphaCoherence'
  | 'hrvSdnnMs'
  | 'rsaGain'
  | 'fmriKrKnZScore';

export interface NeuroParameterResult {
  key:       NeuroParameterKey;
  value:     number;
  threshold: number;
  passed:    boolean;
}

export interface NeuroSampleValidation {
  sample:     NeuroPhysioSample;
  parameters: NeuroParameterResult[];
  passed:     boolean;
  failedKeys: NeuroParameterKey[];
}

/** Protocol — ≥2 of 3 volunteers must pass all four parameters */
export interface NeuroValidationProtocolReport {
  protocolId:        string;
  ranAt:             string;
  mode:              NeuroSampleMode;
  volunteerCount:    number;
  volunteersPassed:  number;
  requiredVolunteers: number;
  gatePassed:        boolean;
  samples:           NeuroSampleValidation[];
  notes:             string[];
}

export interface NeuroCoherenceResult {
  score:      number;
  source:     'heuristic' | 'neuro_calibrated' | 'neuro_simulator';
  thetaAlpha: number | null;
  integrated: boolean;
}
