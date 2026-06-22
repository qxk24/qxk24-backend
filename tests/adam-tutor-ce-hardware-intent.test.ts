/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Hardware Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildHardwareClassifierInput,
  classifyHardwareIntent,
  classifyTutorCEHardwareIntent,
} from '../src/adam/tutor-law/tutor-law.ce-hardware-classifier';
import { classifyCodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { CodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { classifyCEIntent } from '../src/adam/tutor-law/tutor-law.ce-intent-classifier.core';
import { buildCEClassifierInput } from '../src/adam/tutor-law/tutor-law.ce-intent-classifier';
import {
  HardwareIntent,
  HardwareTopic,
} from '../src/adam/tutor-law/tutor-law.ce-hardware.types';

describe('classifyHardwareIntent (Rule 61)', () => {
  it('V-CHW-01: H_CONCEPT — apa itu truth table', () => {
    const out = classifyHardwareIntent(buildHardwareClassifierInput({
      userMessage: 'Apa maksud truth table untuk gerbang AND?',
    }));
    expect(out.intent).toBe(HardwareIntent.H_CONCEPT);
    expect(out.topic).toBe(HardwareTopic.COMBINATIONAL);
    expect(out.conceptProbe).toMatch(/truth table/i);
  });

  it('V-CHW-02: H_DESIGN — truth-table-first scaffold', () => {
    const out = classifyHardwareIntent(buildHardwareClassifierInput({
      userMessage: 'Macam mana nak reka litar combinational untuk fungsi 3 input?',
    }));
    expect(out.intent).toBe(HardwareIntent.H_DESIGN);
    expect(out.designScaffold).toMatch(/JANGAN terus lukis litar|DON'T draw the circuit/i);
    expect(out.designScaffold).toMatch(/truth table/i);
  });

  it('V-CHW-03: H_TRACE — trace output with circuit desc', () => {
    const out = classifyHardwareIntent(buildHardwareClassifierInput({
      userMessage: 'Saya ada litar XOR — apa output bila A=1 B=0?',
    }));
    expect(out.intent).toBe(HardwareIntent.H_TRACE);
    expect(out.traceProbe).toMatch(/truth table|row/i);
  });

  it('V-CHW-04: H_VERIFY — betul tak output saya', () => {
    const out = classifyHardwareIntent(buildHardwareClassifierInput({
      userMessage: 'Betul tak truth table saya untuk fungsi ini?',
    }));
    expect(out.intent).toBe(HardwareIntent.H_VERIFY);
    expect(out.verifyAnchor).toMatch(/Sebelum ADAM semak|Before ADAM checks/i);
  });

  it('V-CHW-05: EXAM_DIRECT — tolong reka litar', () => {
    const out = classifyHardwareIntent(buildHardwareClassifierInput({
      userMessage: 'Tolong reka litar untuk soalan peperiksaan ni.',
    }));
    expect(out.intent).toBe(HardwareIntent.EXAM_DIRECT);
    expect(out.redirectScript).toMatch(/tidak akan reka|won't design/i);
  });

  it('V-CHW-06: SEQUENTIAL topic — flip flop concept', () => {
    const out = classifyHardwareIntent(buildHardwareClassifierInput({
      userMessage: 'Apa beza D flip flop dengan JK flip flop?',
    }));
    expect(out.topic).toBe(HardwareTopic.SEQUENTIAL);
    expect(out.intent).toBe(HardwareIntent.H_CONCEPT);
  });
});

describe('CE hardware routing in code-intent-classifier', () => {
  it('V-CHW-07: classifyTutorCEHardwareIntent null when not hardware route', () => {
    const ce = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Terangkan three-way handshake TCP.',
    }));
    expect(classifyTutorCEHardwareIntent({
      userMessage: 'Terangkan three-way handshake TCP.',
      ceRouting: ce,
    })).toBeNull();
  });

  it('V-CHW-08: code intent attaches ceHardware for truth table question', () => {
    const out = classifyCodeIntent({
      rawText:         'Apa maksud truth table untuk gerbang NAND?',
      normText:        'apa maksud truth table untuk gerbang nand?',
      hasCodeBlock:    false,
      hasErrorMessage: false,
      codeLineCount:   0,
      priorLanguage:   null,
      stuckCount:      0,
    });
    expect(out.ceRouting?.routeTo).toBe('ce-hardware-classifier');
    expect(out.ceHardware?.intent).toBe(HardwareIntent.H_CONCEPT);
    expect(out.probeQuestion).toMatch(/truth table|logic gate/i);
  });

  it('V-CHW-09: H_DESIGN via code path enforces design scaffold', () => {
    const out = classifyCodeIntent({
      rawText:         'Macam mana nak buat litar menggunakan gerbang AND dan OR?',
      normText:        'macam mana nak buat litar menggunakan gerbang and dan or?',
      hasCodeBlock:    false,
      hasErrorMessage: false,
      codeLineCount:   0,
      priorLanguage:   null,
      stuckCount:      0,
    });
    expect(out.ceHardware?.intent).toBe(HardwareIntent.H_DESIGN);
    expect(out.probeQuestion).toMatch(/truth table/i);
    expect(out.intent).toBe(CodeIntent.B_BUILD);
  });
});
