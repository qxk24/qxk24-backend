/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE System Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildSystemClassifierInput,
  classifySystemIntent,
  classifyTutorCESystemIntent,
} from '../src/adam/tutor-law/tutor-law.ce-system-classifier';
import { classifyCodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { CodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { classifyCEIntent } from '../src/adam/tutor-law/tutor-law.ce-intent-classifier.core';
import { buildCEClassifierInput } from '../src/adam/tutor-law/tutor-law.ce-intent-classifier';
import {
  SystemIntent,
  SystemTopic,
} from '../src/adam/tutor-law/tutor-law.ce-system.types';

describe('classifySystemIntent (Rule 61)', () => {
  it('V-CSY-01: S_CONCEPT — deadlock basics', () => {
    const out = classifySystemIntent(buildSystemClassifierInput({
      userMessage: 'Apa maksud deadlock dalam sistem operasi?',
    }));
    expect(out.intent).toBe(SystemIntent.S_CONCEPT);
    expect(out.topic).toBe(SystemTopic.SYNCHRONIZATION);
    expect(out.conceptProbe).toMatch(/critical section|mutex/i);
  });

  it('V-CSY-02: S_ANALYZE — why deadlock occurs', () => {
    const out = classifySystemIntent(buildSystemClassifierInput({
      userMessage: 'Kenapa deadlock berlaku antara dua proses yang kongsi printer dan scanner?',
    }));
    expect(out.intent).toBe(SystemIntent.S_ANALYZE);
    expect(out.topic).toBe(SystemTopic.SYNCHRONIZATION);
    expect(out.analyzeProbe).toMatch(/resource allocation|syarat deadlock/i);
  });

  it('V-CSY-03: S_TRACE — scheduling trace', () => {
    const out = classifySystemIntent(buildSystemClassifierInput({
      userMessage: 'Boleh trace round robin untuk 3 proses dengan Gantt chart?',
    }));
    expect(out.intent).toBe(SystemIntent.S_TRACE);
    expect(out.topic).toBe(SystemTopic.SCHEDULING);
    expect(out.traceProbe).toMatch(/slot masa|burst/i);
  });

  it('V-CSY-04: S_DESIGN — prevent deadlock scaffold', () => {
    const out = classifySystemIntent(buildSystemClassifierInput({
      userMessage: 'Macam mana nak design penyelesaian untuk elak deadlock dalam sistem ni?',
    }));
    expect(out.intent).toBe(SystemIntent.S_DESIGN);
    expect(out.designScaffold).toMatch(/JANGAN tulis kod|shared resource/i);
  });

  it('V-CSY-05: S_VERIFY — check student answer', () => {
    const out = classifySystemIntent(buildSystemClassifierInput({
      userMessage: 'Betul tak jawapan saya untuk page fault handling?',
    }));
    expect(out.intent).toBe(SystemIntent.S_VERIFY);
    expect(out.verifyAnchor).toMatch(/Sebelum ADAM semak|Before ADAM checks/i);
  });

  it('V-CSY-06: EXAM_DIRECT — no complete driver solution', () => {
    const out = classifySystemIntent(buildSystemClassifierInput({
      userMessage: 'Tolong selesaikan soalan peperiksaan tulis device driver ni.',
    }));
    expect(out.intent).toBe(SystemIntent.EXAM_DIRECT);
    expect(out.redirectScript).toMatch(/tidak akan tulis driver|will not write/i);
  });

  it('V-CSY-07: MEMORY_MGMT topic — virtual memory concept', () => {
    const out = classifySystemIntent(buildSystemClassifierInput({
      userMessage: 'Apa itu virtual memory dan page fault?',
    }));
    expect(out.topic).toBe(SystemTopic.MEMORY_MGMT);
    expect(out.intent).toBe(SystemIntent.S_CONCEPT);
  });
});

describe('CE system routing in code-intent-classifier', () => {
  it('V-CSY-08: classifyTutorCESystemIntent null for theory route', () => {
    const ce = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Apa time complexity merge sort?',
    }));
    expect(classifyTutorCESystemIntent({
      userMessage: 'Apa time complexity merge sort?',
      ceRouting: ce,
    })).toBeNull();
  });

  it('V-CSY-09: code intent attaches ceSystem for deadlock question', () => {
    const out = classifyCodeIntent({
      rawText:         'Macam mana deadlock berlaku antara dua proses?',
      normText:        'macam mana deadlock berlaku antara dua proses?',
      hasCodeBlock:    false,
      hasErrorMessage: false,
      codeLineCount:   0,
      priorLanguage:   null,
      stuckCount:      0,
    });
    expect(out.ceRouting?.routeTo).toBe('ce-system-classifier');
    expect(out.ceSystem?.intent).toBe(SystemIntent.S_ANALYZE);
    expect(out.probeQuestion).toMatch(/resource allocation|syarat deadlock|shared resource/i);
    expect(out.intent).toBe(CodeIntent.C_CONCEPT);
  });
});
