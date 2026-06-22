/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Intent Rule 61 Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  canAutoClose,
  classifyMathIntent,
  isEscalationPermitted,
  requiresConceptCheck,
} from '../src/adam/tutor-law/tutor-law.math-intent-classifier.core';
import { normalizeMathClassifierText } from '../src/adam/tutor-law/tutor-law.math-intent.signals';
import {
  ConceptReadiness,
  MathIntent,
  MathTopic,
} from '../src/adam/tutor-law/tutor-law.math-intent.types';

function input(
  raw: string,
  overrides: Partial<Parameters<typeof classifyMathIntent>[0]> = {},
) {
  return {
    rawText:            raw,
    normText:           normalizeMathClassifierText(raw),
    hasShownWorking:    false,
    stuckCount:         0,
    conceptReadiness:   ConceptReadiness.UNVERIFIED,
    priorTopic:         null as MathTopic | null,
    ...overrides,
  };
}

describe('classifyMathIntent (Rule 61)', () => {
  it('V-R61-01: A_CONCEPT — tak faham pecahan', () => {
    const r = classifyMathIntent(input('Tak faham apa itu pecahan.'));
    expect(r.intent).toBe(MathIntent.A_CONCEPT);
    expect(r.topic).toBe(MathTopic.ARITHMETIC_FRACTION);
    expect(r.escalationActive).toBe(false);
  });

  it('V-R61-02: C_VERIFICATION — betul tak with answer', () => {
    const r = classifyMathIntent(input('2x+3=11 x=5 betul tak?'));
    expect(r.intent).toBe(MathIntent.C_VERIFICATION);
    expect(r.probeQuestion).toBeNull();
  });

  it('V-R61-03: EXAM_DIRECT — tolong selesaikan peperiksaan', () => {
    const r = classifyMathIntent(input('Tolong selesaikan soalan peperiksaan ini: 2x+3=11'));
    expect(r.intent).toBe(MathIntent.EXAM_DIRECT);
    expect(r.redirectScript).toContain('peperiksaan');
  });

  it('V-R61-04: SCIENCE_FACTUAL — E=mc² definition', () => {
    const r = classifyMathIntent(input('Apa maksud formula E=mc²?'));
    expect(r.intent).toBe(MathIntent.SCIENCE_FACTUAL);
    expect(r.topic).toBe(MathTopic.SCIENCE_MATH);
  });

  it('V-R61-05: B→A redirect when concept UNVERIFIED on algebra', () => {
    const r = classifyMathIntent(input('Saya dah cuba tapi tersekat', {
      hasShownWorking:  true,
      conceptReadiness: ConceptReadiness.UNVERIFIED,
      priorTopic:       MathTopic.ALGEBRA_LINEAR,
    }));
    expect(r.intent).toBe(MathIntent.A_CONCEPT);
    expect(r.probeQuestion).toBeTruthy();
  });

  it('V-R61-06: AMBIGUOUS — bare greeting', () => {
    const r = classifyMathIntent(input('ok'));
    expect(r.intent).toBe(MathIntent.AMBIGUOUS);
    expect(r.probeQuestion).toBeTruthy();
  });

  it('V-R61-07: escalation permitted when PASSED and stuckCount ≥ 3', () => {
    expect(isEscalationPermitted(ConceptReadiness.PASSED, 3)).toBe(true);
    expect(isEscalationPermitted(ConceptReadiness.UNVERIFIED, 5)).toBe(false);
  });

  it('V-R61-08: requiresConceptCheck bypasses arithmetic basic', () => {
    expect(requiresConceptCheck(MathTopic.ARITHMETIC_BASIC)).toBe(false);
    expect(requiresConceptCheck(MathTopic.ALGEBRA_QUADRATIC)).toBe(true);
  });

  it('V-R61-09: canAutoClose only for arithmetic with valid working', () => {
    expect(canAutoClose(MathTopic.ARITHMETIC_BASIC, true, true, false)).toBe(true);
    expect(canAutoClose(MathTopic.ALGEBRA_LINEAR, true, true, false)).toBe(false);
    expect(canAutoClose(MathTopic.ARITHMETIC_BASIC, true, true, true)).toBe(false);
  });
});
