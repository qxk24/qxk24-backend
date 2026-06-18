/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate Sensing Test (Fasa 3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { resolveAdamTurnGate } from '../src/adam/turn-gate';
import {
  fitraRecompose,
  readQuestionSignal,
  readSituationSignal,
  runAdamSensingEngine,
} from '../src/adam/turn-gate/sensing-engine';
import { resolveAdamTurnIQ } from '../src/adam/turn-gate/adam-turn-gate.iq';
import { resolveAdamTurnEQ } from '../src/adam/turn-gate/adam-turn-gate.eq';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

const EMPTY = NO_FOUNDER_TEACHING_FLAGS;

describe('runAdamSensingEngine — Article 8 readers', () => {
  it('reads causal surface for economics policy ask', () => {
    const ask =
      'Apakah kesan campur tangan kerajaan dalam mengawal harga barangan keperluan?';
    const sensing = runAdamSensingEngine({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: EMPTY,
    });
    expect(sensing.surfaceKind).toBe('causal');
    expect(sensing.domainFacet).toBe('economics');
    expect(sensing.situationPosture).toBe('substantive');
    expect(sensing.faithDoorOpen).toBe(false);
  });

  it('reads greeting surface for salam', () => {
    expect(readQuestionSignal('salam')).toBe('greeting');
    expect(readSituationSignal('salam')).toBe('light-social');
  });

  it('reads record-superlative surface for geography ask', () => {
    expect(readQuestionSignal('Apakah sungai terpanjang di dunia?')).toBe('record-superlative');
    expect(readSituationSignal('Apakah sungai terpanjang di dunia?')).toBe('substantive');
  });

  it('reads companion cadangan situation when thread matches', () => {
    const posture = readSituationSignal({
      message: 'Ya, cadangkan outline seterusnya.',
      recentAssistantMessages: ['**Cadangan:** 1. Mulakan outline.'],
      recentUserMessages: ['Saya nak tulis buku.'],
    });
    expect(posture).toBe('companion-cadangan');
  });
});

describe('fitraRecompose — fuse conflicts', () => {
  it('downgrades faith domain when faith door is closed', () => {
    const input = {
      isFounder: false,
      mode: 'TEACHING' as const,
      userMessage: 'Apa maksud jihad dalam Islam?',
      teachingFlags: EMPTY,
    };
    const sensing = runAdamSensingEngine(input);
    const eq = resolveAdamTurnEQ(input, {
      ...sensing,
      domainFacet: 'faith',
    });
    const rawIq = resolveAdamTurnIQ(input, eq, {
      ...sensing,
      domainFacet: 'faith',
      faithDoorOpen: false,
    });
    const { iq, fuseNotes } = fitraRecompose(rawIq, eq, {
      ...sensing,
      domainFacet: 'faith',
      faithDoorOpen: false,
    });
    expect(iq.domainFacet).toBe('general');
    expect(iq.displayChannel).toBe('none');
    expect(fuseNotes).toContain('faith→general');
  });

  it('suppresses economics domain on prose-craft turns', () => {
    const ask =
      'Kembangkan ayat ini dengan lebih panjang: Apabila manusia telah lupa pada realiti maka pasti hidup mereka penuh dengan fantasi.';
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: EMPTY,
    });
    expect(gate.eq.affectiveTone).toBe('prose-craft');
    expect(gate.iq.domainFacet).toBe('general');
    expect(gate.flags.domainTeachingPack).toBe(false);
    expect(gate.fuseNotes).toContain('prose-craft→general');
  });

  it('schema v2 includes sensing bundle and fuse notes', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu fotosintesis?',
      teachingFlags: EMPTY,
    });
    expect(gate.schemaVersion).toBe(2);
    expect(gate.sensing.surfaceKind).toBe('definitional');
    expect(gate.logLine).toMatch(/surface=definitional/);
    expect(gate.logLine).toMatch(/situation=substantive/);
  });
});
