/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Theory Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildTheoryClassifierInput,
  classifyTheoryIntent,
  classifyTutorCETheoryIntent,
} from '../src/adam/tutor-law/tutor-law.ce-theory-classifier';
import { classifyCodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { CodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { classifyCEIntent } from '../src/adam/tutor-law/tutor-law.ce-intent-classifier.core';
import { buildCEClassifierInput } from '../src/adam/tutor-law/tutor-law.ce-intent-classifier';
import {
  CEAbstractionLayer,
  CESecurityFlag,
  CESubdomain,
} from '../src/adam/tutor-law/tutor-law.ce-intent.types';
import {
  TheoryIntent,
  TheoryTopic,
} from '../src/adam/tutor-law/tutor-law.ce-theory.types';

describe('classifyTheoryIntent (Rule 61)', () => {
  it('V-CTH-01: T_COMPLEXITY — big-O requires trace-first probe', () => {
    const out = classifyTheoryIntent(buildTheoryClassifierInput({
      userMessage: 'Apa time complexity merge sort?',
    }));
    expect(out.intent).toBe(TheoryIntent.T_COMPLEXITY);
    expect(out.topic).toBe(TheoryTopic.SORTING);
    expect(out.complexityProbe).toMatch(/trace algoritma/i);
  });

  it('V-CTH-02: T_PROOF — intuition before formal proof', () => {
    const out = classifyTheoryIntent(buildTheoryClassifierInput({
      userMessage: 'Buktikan statement ini betul menggunakan induksi matematik.',
    }));
    expect(out.intent).toBe(TheoryIntent.T_PROOF);
    expect(out.topic).toBe(TheoryTopic.PROOF_TECHNIQUES);
    expect(out.proofProbe).toMatch(/INTUISI|intuition/i);
  });

  it('V-CTH-03: T_TRACE — manual trace anchor', () => {
    const out = classifyTheoryIntent(buildTheoryClassifierInput({
      userMessage: 'Boleh trace bubble sort untuk input [5,2,8,1]?',
    }));
    expect(out.intent).toBe(TheoryIntent.T_TRACE);
    expect(out.traceAnchor).toMatch(/\[5, 2, 8, 1\]|langkah pertama/i);
  });

  it('V-CTH-04: T_DESIGN — algorithm design scaffold', () => {
    const out = classifyTheoryIntent(buildTheoryClassifierInput({
      userMessage: 'Macam mana nak design algoritma untuk shortest path dalam graf?',
    }));
    expect(out.intent).toBe(TheoryIntent.T_DESIGN);
    expect(out.topic).toBe(TheoryTopic.GRAPH_ALGO);
    expect(out.designScaffold).toMatch(/design graph algorithm|graf directed/i);
  });

  it('V-CTH-05: EXAM_DIRECT — no complete proof', () => {
    const out = classifyTheoryIntent(buildTheoryClassifierInput({
      userMessage: 'Tolong selesaikan soalan peperiksaan proof ni.',
    }));
    expect(out.intent).toBe(TheoryIntent.EXAM_DIRECT);
    expect(out.redirectScript).toMatch(/tidak akan selesaikan|will not solve/i);
  });

  it('V-CTH-06: T_CONCEPT — P vs NP intuition', () => {
    const out = classifyTheoryIntent(buildTheoryClassifierInput({
      userMessage: 'Apa itu P vs NP? Saya tak faham.',
    }));
    expect(out.intent).toBe(TheoryIntent.T_CONCEPT);
    expect(out.topic).toBe(TheoryTopic.COMPLEXITY);
    expect(out.conceptProbe).toMatch(/polynomial|P vs NP/i);
  });

  it('V-CTH-07: discrete route biases topic', () => {
    const out = classifyTheoryIntent(buildTheoryClassifierInput({
      userMessage: 'Terangkan combination dan permutation.',
      ceRouting: {
        subdomain:        CESubdomain.DISCRETE_MATH,
        abstractionLayer: CEAbstractionLayer.UNKNOWN,
        securityFlag:     CESecurityFlag.NONE,
        confidence:       'HIGH',
        layerProbe:       null,
        securityGuard:    null,
        routeTo:          'ce-theory-classifier:discrete',
        _trace:           [],
      },
    }));
    expect(out.topic).toBe(TheoryTopic.DISCRETE_MATH);
  });
});

describe('CE theory routing in code-intent-classifier', () => {
  it('V-CTH-08: classifyTutorCETheoryIntent null for hardware route', () => {
    const ce = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Boleh terangkan truth table untuk gerbang AND?',
    }));
    expect(classifyTutorCETheoryIntent({
      userMessage: 'Boleh terangkan truth table untuk gerbang AND?',
      ceRouting: ce,
    })).toBeNull();
  });

  it('V-CTH-09: code intent attaches ceTheory for complexity question', () => {
    const out = classifyCodeIntent({
      rawText:         'Apa time complexity untuk quick sort?',
      normText:        'apa time complexity untuk quick sort?',
      hasCodeBlock:    false,
      hasErrorMessage: false,
      codeLineCount:   0,
      priorLanguage:   null,
      stuckCount:      0,
    });
    expect(out.ceRouting?.routeTo).toBe('ce-theory-classifier');
    expect(out.ceTheory?.intent).toBe(TheoryIntent.T_COMPLEXITY);
    expect(out.probeQuestion).toMatch(/trace algoritma|trace/i);
    expect(out.intent).toBe(CodeIntent.C_CONCEPT);
  });
});
