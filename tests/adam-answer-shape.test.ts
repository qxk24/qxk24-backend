/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Shape Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  extractComparePair,
  extractTeachingTopicTitle,
  isAdamCompoundTurn,
  isAdamDefinitionalTurn,
  resolveAdamAnswerShape,
} from '../src/adam/adam-answer-shape';
import { resolveAdamAnswerPlan } from '../src/adam/adam-answer-plan';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

describe('resolveAdamAnswerShape — universal intent', () => {
  it('detects definitional for kos peluang', () => {
    const shape = resolveAdamAnswerShape('Apa itu kos peluang?', { structured: true });
    expect(shape.intent).toBe('definitional');
    expect(shape.topicTitle).toBe('kos peluang');
    expect(shape.structured).toBe(true);
  });

  it('detects comparative for hukum jenayah vs sivil', () => {
    const ask = 'Apa perbezaan antara hukum jenayah dan hukum sivil?';
    const shape = resolveAdamAnswerShape(ask, { structured: true });
    expect(shape.intent).toBe('comparative');
    expect(shape.comparePair).toEqual({
      left:  'hukum jenayah',
      right: 'hukum sivil',
    });
  });

  it('detects compound for cognitive dissonance ask', () => {
    const ask =
      "Apa yang dimaksudkan dengan 'cognitive dissonance' dan bagaimana ia mempengaruhi tingkah laku?";
    const shape = resolveAdamAnswerShape(ask, { structured: true });
    expect(shape.intent).toBe('compound');
    expect(shape.topicTitle).toBe('cognitive dissonance');
    expect(shape.secondaryTitle).toBe('Bagaimana ia mempengaruhi tingkah laku');
  });

  it('attaches shape on answer plan for substantive Users turns', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu kos peluang?',
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.answerShape?.intent).toBe('definitional');
    expect(plan.answerShape?.structured).toBe(true);
  });

  it('detects compound for SCM kepentingannya ask', () => {
    const ask = "Apa itu konsep 'supply chain management' dan kepentingannya?";
    const shape = resolveAdamAnswerShape(ask, { structured: true });
    expect(shape.intent).toBe('compound');
    expect(shape.topicTitle).toBe('supply chain management');
    expect(shape.secondaryTitle).toBe('Kepentingannya');
  });

  it('attaches composer on answer plan for substantive Users turns', () => {
    const ask = "Apa itu konsep 'supply chain management' dan kepentingannya?";
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.answerComposer?.topicTitle).toBe('supply chain management');
    expect(plan.answerComposer?.secondaryHeader).toBe('Kepentingannya');
    expect(plan.answerComposer?.sections).toHaveLength(2);
    expect(plan.answerComposer?.sections[1]?.title).toBe('Kepentingannya');
  });
});

describe('extractComparePair', () => {
  it('parses BM perbezaan antara A dan B', () => {
    expect(extractComparePair('Perbezaan antara utilitarianisme dan deontologi?')).toEqual({
      left:  'utilitarianisme',
      right: 'deontologi',
    });
  });

  it('parses terangkan perbezaan with continuation depth tail', () => {
    const ask =
      'Terangkan perbezaan antara hukum jenayah dan hukum sivil dalam sistem perundangan Malaysia. Lebih perinci dan perangkaan';
    expect(extractComparePair(ask)).toEqual({
      left:  'hukum jenayah',
      right: 'hukum sivil',
    });
  });
});

describe('intent detectors', () => {
  it('isAdamDefinitionalTurn excludes compare', () => {
    expect(isAdamDefinitionalTurn('Apa itu kos peluang?')).toBe(true);
    expect(isAdamDefinitionalTurn('Perbezaan antara A dan B')).toBe(false);
  });

  it('isAdamCompoundTurn detects secondary clause', () => {
    expect(
      isAdamCompoundTurn(
        "Apa yang dimaksudkan dengan fotosintesis dan bagaimana ia berlaku dalam tumbuhan?",
      ),
    ).toBe(true);
    expect(extractTeachingTopicTitle('Apa itu fotosintesis?')).toBe('fotosintesis');
  });
});
