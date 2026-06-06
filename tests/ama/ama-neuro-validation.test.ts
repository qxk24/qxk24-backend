import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import {
  AMA_NEURO_THRESHOLDS,
  type NeuroPhysioSample,
} from '../../src/lib/ama/ama-neuro.types';
import {
  crossLaneCoherenceHeuristic,
  runDefaultSimulatorProtocol,
  runNeuroValidationProtocol,
  simulateNeuroFromLanes,
  validateNeuroSample,
  resolveCrossLaneCoherence,
  getLastNeuroValidationReport,
} from '../../src/lib/ama/ama-neuro-validation.service';

describe('ama-neuro-validation', () => {
  const prevGate = process.env.ADAM_AMA_NEURO_GATE_PASSED;
  const prevCal = process.env.ADAM_AMA_NEURO_CALIBRATE;

  afterEach(() => {
    if (prevGate === undefined) delete process.env.ADAM_AMA_NEURO_GATE_PASSED;
    else process.env.ADAM_AMA_NEURO_GATE_PASSED = prevGate;
    if (prevCal === undefined) delete process.env.ADAM_AMA_NEURO_CALIBRATE;
    else process.env.ADAM_AMA_NEURO_CALIBRATE = prevCal;
  });

  it('simulator produces physiologically plausible ranges', () => {
    const sample = simulateNeuroFromLanes(
      'Formula x=m/t menetapkan PG.',
      'Saya rasa salah sejak solat subuh hari tu.',
      'vol-1',
    );
    expect(sample.thetaAlphaCoherence).toBeGreaterThan(0.5);
    expect(sample.hrvSdnnMs).toBeGreaterThan(40);
    expect(sample.rsaGain).toBeGreaterThan(0.3);
    expect(sample.fmriKrKnZScore).toBeDefined();
  });

  it('validateNeuroSample enforces Langkah 6 thresholds', () => {
    const pass: NeuroPhysioSample = {
      sourceId:            't1',
      subjectId:           'v1',
      mode:                'simulator',
      thetaAlphaCoherence: 0.72,
      hrvSdnnMs:           60,
      rsaGain:             0.55,
      fmriKrKnZScore:      2.3,
    };
    expect(validateNeuroSample(pass).passed).toBe(true);

    const fail: NeuroPhysioSample = {
      ...pass,
      sourceId:          't2',
      hrvSdnnMs:         40,
      fmriKrKnZScore:    1.5,
    };
    const result = validateNeuroSample(fail);
    expect(result.passed).toBe(false);
    expect(result.failedKeys).toContain('hrvSdnnMs');
    expect(result.failedKeys).toContain('fmriKrKnZScore');
  });

  it('default simulator protocol passes ≥2/3 volunteers (Tahap 4 gate)', () => {
    const report = runDefaultSimulatorProtocol();
    expect(report.volunteerCount).toBe(3);
    expect(report.volunteersPassed).toBeGreaterThanOrEqual(2);
    expect(report.gatePassed).toBe(true);
    expect(getLastNeuroValidationReport()?.gatePassed).toBe(true);
  });

  it('protocol fails when fewer than 2 volunteers pass', () => {
    const bad: NeuroPhysioSample = {
      sourceId:            'bad',
      subjectId:           'x',
      mode:                'device',
      thetaAlphaCoherence: 0.5,
      hrvSdnnMs:           30,
      rsaGain:             0.2,
      fmriKrKnZScore:      1.0,
    };
    const report = runNeuroValidationProtocol([bad, bad, bad], 'device');
    expect(report.gatePassed).toBe(false);
  });

  describe('resolveCrossLaneCoherence', () => {
    beforeEach(() => {
      delete process.env.ADAM_AMA_NEURO_GATE_PASSED;
      delete process.env.ADAM_AMA_NEURO_CALIBRATE;
    });

    it('uses heuristic when neuro calibrate off', () => {
      const kr = 'Formula x=m/t prinsip PG.';
      const kn = 'Rasa salah sejak solat subuh.';
      const out = resolveCrossLaneCoherence(kr, kn);
      expect(out.source).toBe('heuristic');
      expect(out.score).toBe(crossLaneCoherenceHeuristic(kr, kn));
    });

    it('uses neuro blend when calibrate on and gate passed', () => {
      process.env.ADAM_AMA_NEURO_GATE_PASSED = 'true';
      process.env.ADAM_AMA_NEURO_CALIBRATE = 'true';
      const kr = 'Formula x=m/t prinsip PG.';
      const kn = 'Rasa salah sejak solat subuh hari tu.';
      const out = resolveCrossLaneCoherence(kr, kn);
      expect(out.source).toMatch(/neuro_/);
      expect(out.thetaAlpha).not.toBeNull();
      expect(out.score).toBeGreaterThan(0);
    });
  });

  it('documents constitutional thresholds', () => {
    expect(AMA_NEURO_THRESHOLDS.thetaAlphaCoherence).toBe(0.65);
    expect(AMA_NEURO_THRESHOLDS.hrvSdnnMs).toBe(55);
    expect(AMA_NEURO_THRESHOLDS.rsaGain).toBe(0.42);
    expect(AMA_NEURO_THRESHOLDS.fmriKrKnZScore).toBe(2.1);
  });
});
