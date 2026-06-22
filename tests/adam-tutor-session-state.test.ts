/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Session State Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { ConceptReadiness } from '../src/adam/tutor-law/tutor-law.math-intent.types';
import { SubjectDomain } from '../src/adam/tutor-law/tutor-law.router';
import {
  PedagogyLayer,
  addToResponseHistory,
  advanceLayer,
  createFullSession,
  deserialiseSession,
  inferPreferredLang,
  isDuplicateResponse,
  isEscalationDue,
  isStudentStuck,
  recordConceptConfirmed,
  resetLayerForNewTopic,
  serialiseSession,
} from '../src/adam/tutor-law/tutor-law.session-state';

describe('tutor-law.session-state', () => {
  it('V-SS-01: createFullSession seeds all domains at L1', () => {
    const s = createFullSession('ali', 'sess-1', 'PRIMARY');
    expect(s.studentLevel).toBe('PRIMARY');
    expect(s.mathConceptReadiness).toBe(ConceptReadiness.UNVERIFIED);
    expect(s.layerState[SubjectDomain.MATH].currentLayer).toBe(PedagogyLayer.L1_DIAGNOSE);
    expect(s.preferredLang).toBe('BM');
  });

  it('V-SS-02: advanceLayer escalates L2→L3 after one attempt', () => {
    const layer = {
      currentLayer:      PedagogyLayer.L2_HINT,
      attemptCount:      1,
      lastProbeAnswered: true,
    };
    expect(advanceLayer(layer, 0)).toBe(PedagogyLayer.L3_SCAFFOLD);
  });

  it('V-SS-03: advanceLayer reaches L4 when stuckCount ≥ 3 at scaffold', () => {
    const layer = {
      currentLayer:      PedagogyLayer.L3_SCAFFOLD,
      attemptCount:      1,
      lastProbeAnswered: false,
    };
    expect(advanceLayer(layer, 3)).toBe(PedagogyLayer.L4_FULL);
  });

  it('V-SS-04: recordConceptConfirmed marks math passed and resets layer', () => {
    let s = createFullSession('ali', 'sess-1');
    s = {
      ...s,
      stuckCount: 2,
      layerState: {
        ...s.layerState,
        [SubjectDomain.MATH]: {
          currentLayer:      PedagogyLayer.L3_SCAFFOLD,
          attemptCount:      2,
          lastProbeAnswered: true,
        },
      },
    };
    const next = recordConceptConfirmed(s, 'place value');
    expect(next.mathConceptReadiness).toBe(ConceptReadiness.PASSED);
    expect(next.lastConfirmedConcept).toBe('place value');
    expect(next.stuckCount).toBe(0);
    expect(next.layerState[SubjectDomain.MATH].currentLayer).toBe(PedagogyLayer.L1_DIAGNOSE);
  });

  it('V-SS-05: inferPreferredLang detects BM vs EN', () => {
    expect(inferPreferredLang('saya nak tahu kenapa ini tak boleh')).toBe('BM');
    expect(inferPreferredLang('what is the answer and how do you solve this')).toBe('EN');
  });

  it('V-SS-06: isDuplicateResponse flags near-identical probes', () => {
    const prior = 'Apa digit di tempat puluh untuk nombor ini?';
    const dup   = 'Apa digit di tempat puluh untuk nombor ini sekarang?';
    expect(isDuplicateResponse(dup, [prior])).toBe(true);
    expect(isDuplicateResponse('Berapa hasil tambah 12 dengan 8?', [prior])).toBe(false);
  });

  it('V-SS-07: serialise/deserialise round-trip preserves persisted fields', () => {
    let s = createFullSession('sabrina', 'sess-9', 'SECONDARY');
    s = addToResponseHistory(s, 'Jawapan pertama');
    s = resetLayerForNewTopic(s, SubjectDomain.SCIENCE);
    const blob = serialiseSession(s);
    const restored = deserialiseSession(blob);
    expect(restored.studentId).toBe('sabrina');
    expect(restored.studentLevel).toBe('SECONDARY');
    expect(restored.turnCount).toBe(s.turnCount);
    expect(restored.recentResponses).toEqual([]);
    expect(restored.languageHasDraft).toBe(false);
  });

  it('V-SS-08: stuck helpers', () => {
    const s = { ...createFullSession('x', 'y'), stuckCount: 3 };
    expect(isStudentStuck(s)).toBe(true);
    s.layerState[SubjectDomain.MATH].currentLayer = PedagogyLayer.L3_SCAFFOLD;
    expect(isEscalationDue(s, SubjectDomain.MATH)).toBe(true);
    s.layerState[SubjectDomain.MATH].currentLayer = PedagogyLayer.L2_HINT;
    expect(isEscalationDue(s, SubjectDomain.MATH)).toBe(false);
  });
});
