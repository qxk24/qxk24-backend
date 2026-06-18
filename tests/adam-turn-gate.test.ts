/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { beginAdamBrainRiver } from '../src/adam/adam-brain-river';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';
import { resolveAdamTurnGate } from '../src/adam/turn-gate';

const EMPTY = NO_FOUNDER_TEACHING_FLAGS;

const POLICY_ASK =
  'Apakah kesan campur tangan kerajaan dalam mengawal harga barangan keperluan?';

describe('resolveAdamTurnGate — IQ', () => {
  it('routes economics policy ask to economics-formal display', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: POLICY_ASK,
      teachingFlags: EMPTY,
    });
    expect(gate.iq.domainFacet).toBe('economics');
    expect(gate.iq.displayChannel).toBe('economics-formal');
    expect(gate.iq.shapeIntent).toBe('causal');
    expect(gate.flags.formalDisplayLaw).toBe(true);
    expect(gate.answerPlan.displayChannel).toBe('economics-formal');
    expect(gate.answerPlan.answerShape?.formalDataLayout).toBe(true);
  });

  it('routes fotosintesis to science domain', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu fotosintesis?',
      teachingFlags: EMPTY,
    });
    expect(gate.iq.domainFacet).toBe('science');
    expect(gate.iq.usersMode).toBe('technical');
    expect(gate.flags.usersTechnicalFinalize).toBe(true);
    expect(gate.flags.domainTeachingPack).toBe(true);
  });

  it('routes general geography definitional to Universal Scholar prose (not technical)', () => {
    const ask = 'Apakah sungai terpanjang di dunia?';
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: EMPTY,
    });
    expect(gate.iq.domainFacet).toBe('geography');
    expect(gate.iq.surfaceKind).toBe('record-superlative');
    expect(gate.iq.usersMode).toBe('general');
    expect(gate.iq.contentIntent).toBe('substantive');
    expect(gate.flags.usersTechnicalFinalize).toBe(false);
    expect(gate.flags.domainTeachingPack).toBe(false);
    expect(gate.flags.knowledgeMode).toBe('konvensional');
    expect(gate.flags.konvensionalSurface).toBe(true);
  });

  it('routes algebra to mathematics technical domain', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Solve the quadratic equation x^2 - 5x + 6 = 0 step by step.',
      teachingFlags: EMPTY,
    });
    expect(gate.iq.domainFacet).toBe('mathematics');
    expect(gate.iq.usersMode).toBe('technical');
    expect(gate.flags.domainTeachingPack).toBe(true);
  });

  it('routes CRISPR bioethics to science-formal with konvensional knowledge surface', () => {
    const ask =
      'Apakah implikasi etika dan perubatan terhadap penyuntingan gen manusia menggunakan teknologi CRISPR-Cas9?';
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: EMPTY,
    });
    expect(gate.iq.domainFacet).toBe('science');
    expect(gate.iq.surfaceKind).toBe('causal');
    expect(gate.iq.usersMode).toBe('technical');
    expect(gate.iq.displayChannel).toBe('science-formal');
    expect(gate.flags.faithPermitted).toBe(false);
    expect(gate.flags.konvensionalSurface).toBe(true);
    expect(gate.flags.knowledgeMode).toBe('konvensional');
    expect(gate.eq.affectiveTone).toBe('substantive');
  });
});

describe('resolveAdamTurnGate — EQ', () => {
  it('routes salam to light tone with display none', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'salam',
      teachingFlags: EMPTY,
    });
    expect(gate.eq.affectiveTone).toBe('light');
    expect(gate.iq.contentIntent).toBe('light');
    expect(gate.iq.usersMode).toBe('general');
    expect(gate.iq.displayChannel).toBe('none');
    expect(gate.flags.domainTeachingPack).toBe(false);
    expect(gate.flags.formalDisplayLaw).toBe(false);
  });

  it('allows Hai greeting only when user addresses Adam by name', () => {
    const off = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu inflasi?',
      teachingFlags: EMPTY,
      sessionMeta: { participantName: 'Ahmad' },
    });
    expect(off.eq.addressPolicy.allowHaiGreeting).toBe(false);

    const on = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Hai Adam, apa itu inflasi?',
      teachingFlags: EMPTY,
      sessionMeta: { participantName: 'Ahmad' },
    });
    expect(on.eq.addressPolicy.allowHaiGreeting).toBe(true);
    expect(on.eq.addressPolicy.participantFirstName).toBe('Ahmad');
  });
});

describe('resolveAdamTurnGate — IQ/EQ separation', () => {
  it('keeps analytic mode on IQ and relational tone on EQ only', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: POLICY_ASK,
      teachingFlags: EMPTY,
      sessionMeta: { participantName: 'Suhaila' },
    });
    expect(gate.iq.usersMode).toBe('technical');
    expect(gate.iq.contentIntent).toBe('substantive');
    expect(gate.eq.affectiveTone).toBe('substantive');
    expect('usersMode' in gate.eq).toBe(false);
    expect('usersIntent' in gate.eq).toBe(false);
    expect(gate.eq.addressPolicy.participantFirstName).toBe('Suhaila');
    expect(gate.flags.knowledgeMode).toBe('konvensional');
    expect(gate.flags.faithPermitted).toBe(false);
  });
});

describe('resolveAdamTurnGate — fuse', () => {
  it('downgrades display channel on prose-craft turns', () => {
    const ask =
      'Kembangkan ayat ini dengan lebih panjang: Apabila manusia telah lupa pada realiti maka pasti hidup mereka penuh dengan fantasi.';
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: EMPTY,
    });
    expect(gate.eq.affectiveTone).toBe('prose-craft');
    expect(gate.iq.displayChannel).toBe('none');
    expect(gate.flags.formalDisplayLaw).toBe(false);
  });

  it('emits canonical log line', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu kos peluang?',
      teachingFlags: EMPTY,
    });
    expect(gate.logLine).toMatch(/\[adam:turn-gate\]/);
    expect(gate.logLine).toMatch(/domain=economics/);
    expect(gate.logLine).toMatch(/lane=users/);
  });
});

describe('beginAdamBrainRiver — gate on river', () => {
  it('attaches gate decision to river turn', () => {
    const river = beginAdamBrainRiver({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: POLICY_ASK,
      teachingFlags: EMPTY,
    });
    expect(river.gate).toBeDefined();
    expect(river.gate.iq.domainFacet).toBe('economics');
    expect(river.answerPlan).toEqual(river.gate.answerPlan);
  });
});
