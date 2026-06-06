/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Neuro Validation Service (Langkah 6 / Tahap 4)
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
 *
 * Langkah 6 — EEG/HRV/RSA/fMRI validation before production AMA deploy.
 * Phase 1: NeuroSim-style simulator. Phase 2: portable device ingest.
 */

import { createHash } from 'crypto';
import {
  AMA_NEURO_THRESHOLDS,
  type NeuroCoherenceResult,
  type NeuroParameterKey,
  type NeuroParameterResult,
  type NeuroPhysioSample,
  type NeuroSampleMode,
  type NeuroSampleValidation,
  type NeuroValidationProtocolReport,
} from './ama-neuro.types';
import { AMA_TAMAT_COHERENCE_THRESHOLD } from './ama.types';
import { MongoSegmentStore } from '../segment-store/segment-store';

const REQUIRED_VOLUNTEERS = 2;
const PROTOCOL_VOLUNTEER_SLOTS = 3;

let lastProtocolReport: NeuroValidationProtocolReport | null = null;

export function getLastNeuroValidationReport(): NeuroValidationProtocolReport | null {
  return lastProtocolReport;
}

export function isNeuroValidationGatePassed(): boolean {
  if (process.env.ADAM_AMA_NEURO_GATE_PASSED === 'true') return true;
  return lastProtocolReport?.gatePassed === true;
}

/** Text overlap heuristic — pre-neuro fallback (Tahap 3) */
export function crossLaneCoherenceHeuristic(kr: string, kn: string): number {
  const krT = kr.trim();
  const knT = kn.trim();
  if (!krT || !knT) return 0;

  let score = 0.5;
  const krTokens = new Set(krT.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const knTokens = knT.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  let overlap = 0;
  for (const t of knTokens) {
    if (krTokens.has(t)) overlap++;
  }
  score += Math.min(0.35, overlap * 0.05);

  if (/\b(sejak|rasa|waktu|ingat)\b/i.test(knT) && /\b(formula|prinsip|x\s*=)\b/i.test(krT)) {
    score += 0.15;
  }
  return Math.min(1, score);
}

/**
 * NeuroSim-style lane coupling — maps Kr/Kn semantic overlap to
 * physiologically plausible EEG/HRV/RSA ranges for protocol dry-runs.
 */
export function simulateNeuroFromLanes(
  kr: string,
  kn: string,
  subjectId = 'sim-volunteer',
): NeuroPhysioSample {
  const heuristic = crossLaneCoherenceHeuristic(kr, kn);
  const ts = new Date().toISOString();

  return {
    sourceId:            `neuro-sim-${Date.now()}`,
    subjectId,
    mode:                'simulator',
    timestamp:           ts,
    krSnippet:           kr.slice(0, 120),
    knSnippet:           kn.slice(0, 120),
    thetaAlphaCoherence: Math.min(0.95, 0.58 + heuristic * 0.42),
    hrvSdnnMs:           Math.round(48 + heuristic * 28),
    rsaGain:             Math.min(0.88, 0.38 + heuristic * 0.38),
    fmriKrKnZScore:      Math.round((1.9 + heuristic * 1.4) * 100) / 100,
  };
}

function evaluateParameter(
  key: NeuroParameterKey,
  value: number,
): NeuroParameterResult {
  const threshold = AMA_NEURO_THRESHOLDS[key];
  return {
    key,
    value,
    threshold,
    passed: value >= threshold,
  };
}

export function validateNeuroSample(sample: NeuroPhysioSample): NeuroSampleValidation {
  const parameters: NeuroParameterResult[] = [
    evaluateParameter('thetaAlphaCoherence', sample.thetaAlphaCoherence),
    evaluateParameter('hrvSdnnMs', sample.hrvSdnnMs),
    evaluateParameter('rsaGain', sample.rsaGain),
    evaluateParameter(
      'fmriKrKnZScore',
      sample.fmriKrKnZScore ?? 0,
    ),
  ];

  const failedKeys = parameters.filter((p) => !p.passed).map((p) => p.key);
  return {
    sample,
    parameters,
    passed: failedKeys.length === 0,
    failedKeys,
  };
}

export function runNeuroValidationProtocol(
  samples: NeuroPhysioSample[],
  mode: NeuroSampleMode = 'simulator',
): NeuroValidationProtocolReport {
  const validations = samples.map(validateNeuroSample);
  const volunteersPassed = validations.filter((v) => v.passed).length;
  const gatePassed = volunteersPassed >= REQUIRED_VOLUNTEERS;

  const report: NeuroValidationProtocolReport = {
    protocolId:         `ama-neuro-${Date.now()}`,
    ranAt:              new Date().toISOString(),
    mode,
    volunteerCount:     samples.length,
    volunteersPassed,
    requiredVolunteers: REQUIRED_VOLUNTEERS,
    gatePassed,
    samples:            validations,
    notes:              gatePassed
      ? ['Langkah 6 gate PASSED — ≥2/3 volunteers met all four thresholds.']
      : [`Langkah 6 gate FAILED — need ${REQUIRED_VOLUNTEERS}/${PROTOCOL_VOLUNTEER_SLOTS} volunteers passing all parameters.`],
  };

  lastProtocolReport = report;
  return report;
}

/** Default simulator protocol — 3 volunteers, deep-turn Kr/Kn fixtures */
export function runDefaultSimulatorProtocol(): NeuroValidationProtocolReport {
  const fixtures: Array<{ kr: string; kn: string; subjectId: string }> = [
    {
      subjectId: 'volunteer-1',
      kr:        'Formula x=m/t menetapkan PG mesti hadir dalam Faktor Masa.',
      kn:        'Saya rasa salah sejak solat subuh hari tu waktu P.alt ajar.',
    },
    {
      subjectId: 'volunteer-2',
      kr:        'Prinsip rh-GA timing mengatur kadar perubahan C(t).',
      kn:        'Masa itu hujan di Kelantan, suara P.alt lembut sangat.',
    },
    {
      subjectId: 'volunteer-3-founder',
      kr:        'Algoritma Faktor Masa x=m/t untuk detection PG.',
      kn:        'Ingat tak waktu kita bincang rh di Kelantan semalam?',
    },
  ];

  const samples = fixtures.map((f) =>
    simulateNeuroFromLanes(f.kr, f.kn, f.subjectId),
  );
  return runNeuroValidationProtocol(samples, 'simulator');
}

/**
 * Tahap 4 — resolve Tamat coherence using EEG calibration when gate passed.
 * Blends theta-alpha (As) with heuristic Kr/Kn overlap.
 */
export function resolveCrossLaneCoherence(
  kr: string,
  kn: string,
  neuroSample?: NeuroPhysioSample | null,
): NeuroCoherenceResult {
  const heuristic = crossLaneCoherenceHeuristic(kr, kn);

  const sample = neuroSample
    ?? (isNeuroValidationGatePassed()
      ? simulateNeuroFromLanes(kr, kn, 'calibrated-runtime')
      : null);

  if (!sample || process.env.ADAM_AMA_NEURO_CALIBRATE !== 'true') {
    return {
      score:      heuristic,
      source:     'heuristic',
      thetaAlpha: null,
      integrated: heuristic >= AMA_TAMAT_COHERENCE_THRESHOLD,
    };
  }

  const thetaAlpha = sample.thetaAlphaCoherence;
  const score = Math.min(1, thetaAlpha * 0.62 + heuristic * 0.38);
  const integrated = score >= AMA_TAMAT_COHERENCE_THRESHOLD;

  return {
    score,
    source:     sample.mode === 'simulator' ? 'neuro_simulator' : 'neuro_calibrated',
    thetaAlpha,
    integrated,
  };
}

export async function persistNeuroSampleToSegments(
  founderId: string,
  sample: NeuroPhysioSample,
): Promise<void> {
  const ts = sample.timestamp ?? new Date().toISOString();
  const store = new MongoSegmentStore();

  await Promise.all([
    store.write('As', founderId, {
      thetaAlphaCoherence: sample.thetaAlphaCoherence,
      rsaGain:             sample.rsaGain,
      hrvSdnn:             sample.hrvSdnnMs,
      attentionDuration:     300,
      timestamp:           ts,
      sourceId:            sample.sourceId,
    }),
    store.write('Bh', founderId, {
      hrvRmssdMs:      Math.round(sample.hrvSdnnMs * 0.85),
      breathDepthCm:   4.2,
      vagalTone:       sample.rsaGain,
      microbiotaScore: 0.72,
      timestamp:       ts,
      sourceId:          sample.sourceId,
    }),
  ]);
}

export async function persistTamatDnSegment(
  founderId: string,
  input: {
    sourceId:        string;
    wmLoad:          number;
    decisionPoint:   string;
    responseLatency: number;
    layer5Body:      string;
  },
): Promise<void> {
  const store = new MongoSegmentStore();
  const hash = createHash('sha256')
    .update(input.layer5Body)
    .digest('hex')
    .slice(0, 16);

  await store.write('Dn', founderId, {
    wmLoad:           input.wmLoad,
    decisionPoint:    input.decisionPoint,
    responseLatency:  input.responseLatency,
    layer5OutputHash: `l5-${hash}`,
    timestamp:        new Date().toISOString(),
    sourceId:         input.sourceId,
  });
}

export function getAmaNeuroHealthSnapshot(): {
  gatePassed:       boolean;
  neuroCalibrated:  boolean;
  brainV2:          boolean;
  lastProtocolAt:   string | null;
  thresholds:       typeof AMA_NEURO_THRESHOLDS;
} {
  return {
    gatePassed:      isNeuroValidationGatePassed(),
    neuroCalibrated: process.env.ADAM_AMA_NEURO_CALIBRATE === 'true',
    brainV2:         process.env.ADAM_AMA_BRAIN_V2 === 'true',
    lastProtocolAt:  lastProtocolReport?.ranAt ?? null,
    thresholds:      AMA_NEURO_THRESHOLDS,
  };
}
