/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Science Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildScienceClassifierInput,
  classifyScienceIntent,
  isTutorScienceDomainMessage,
} from '../src/adam/tutor-law/tutor-law.science-intent-classifier';
import { ScienceIntent, ScienceSubject } from '../src/adam/tutor-law/tutor-law.science-intent.types';
import { tutorQuestionIsScienceFactual } from '../src/adam/tutor-law/tutor-law.science-routing';

const sunlightQ =
  'Berapa masa yang diambil oleh cahaya matahari untuk sampai ke bumi?';

describe('tutor science intent classifier', () => {
  it('V-SI-01: sunlight factual — not calculation', () => {
    const out = classifyScienceIntent(buildScienceClassifierInput({
      userMessage: sunlightQ,
    }));
    expect(out.intent).toBe(ScienceIntent.F_FACTUAL);
    expect(out.subject).toBe(ScienceSubject.PHYSICS);
    expect(out.depthQuestion).toBeTruthy();
  });

  it('V-SI-02: E=mc² computation routes to calculation', () => {
    const out = classifyScienceIntent(buildScienceClassifierInput({
      userMessage: 'Kira tenaga jisim 1g menggunakan E=mc²',
    }));
    expect(out.intent).toBe(ScienceIntent.C_CALCULATION);
  });

  it('V-SI-03: mitosis concept factual', () => {
    const out = classifyScienceIntent(buildScienceClassifierInput({
      userMessage: 'Apa maksud mitosis?',
    }));
    expect(out.intent).toBe(ScienceIntent.F_FACTUAL);
    expect(out.subject).toBe(ScienceSubject.BIOLOGY);
  });

  it('V-SI-04: experiment with variable probe', () => {
    const out = classifyScienceIntent(buildScienceClassifierInput({
      userMessage: 'Hipotesis saya ialah tumbuhan akan lebih tinggi dengan lebih banyak cahaya.',
    }));
    expect(out.intent).toBe(ScienceIntent.E_EXPERIMENT);
    expect(out.variableProbe).toBeTruthy();
  });

  it('V-SI-05: exam direct redirect', () => {
    const out = classifyScienceIntent(buildScienceClassifierInput({
      userMessage: 'Tolong jawab soalan SPM ini: terangkan fotosintesis secara lengkap.',
    }));
    expect(out.intent).toBe(ScienceIntent.EXAM_DIRECT);
    expect(out.redirectScript).toBeTruthy();
  });

  it('V-SI-06: ambiguous energy-only probe', () => {
    const out = classifyScienceIntent(buildScienceClassifierInput({
      userMessage: 'Tenaga',
    }));
    expect(out.intent).toBe(ScienceIntent.AMBIGUOUS);
    expect(out.probeQuestion).toBeTruthy();
  });

  it('V-SI-07: guli word problem is not science domain factual', () => {
    const msg = 'Ali ada 2,385 biji guli. Dia beli lagi 1,427.';
    expect(isTutorScienceDomainMessage(msg)).toBe(false);
    expect(tutorQuestionIsScienceFactual(msg)).toBe(false);
  });

  it('tutorQuestionIsScienceFactual delegates to F_FACTUAL', () => {
    expect(tutorQuestionIsScienceFactual(sunlightQ)).toBe(true);
  });
});
