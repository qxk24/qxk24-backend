/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Router Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  SubjectDomain,
  createInitialSession,
  detectDomain,
  routeStudentTurn,
} from '../src/adam/tutor-law/tutor-law.index';
import { MathIntent } from '../src/adam/tutor-law/tutor-law.math-intent.types';
import { CodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { ScienceIntent } from '../src/adam/tutor-law/tutor-law.science-intent.types';
import { IslamicIntent } from '../src/adam/tutor-law/tutor-law.islamic-intent.types';

describe('tutor-law.router', () => {
  const baseSession = createInitialSession('ali', 'sess-1', 'PRIMARY');

  it('V-RT-01: routes math concept turn', () => {
    const out = routeStudentTurn({
      userMessage: 'Tak faham apa itu pecahan.',
      session:     baseSession,
    });
    expect(out.domain).toBe(SubjectDomain.MATH);
    expect(out.routed.domain).toBe(SubjectDomain.MATH);
    if (out.routed.domain !== SubjectDomain.MATH) return;
    expect(out.routed.output.intent).toBe(MathIntent.A_CONCEPT);
    expect(out.nextSession.priorDomain).toBe(SubjectDomain.MATH);
    expect(out.nextSession.turnCount).toBe(1);
  });

  it('V-RT-02: detects code domain for traceback', () => {
    expect(detectDomain({
      userMessage: 'Traceback (most recent call last):',
      session:     baseSession,
    })).toBe(SubjectDomain.CODE);
  });

  it('V-RT-03: routes code debug intent', () => {
    const out = routeStudentTurn({
      userMessage: 'Kenapa error SyntaxError dalam kod python saya?',
      session:     baseSession,
    });
    expect(out.domain).toBe(SubjectDomain.CODE);
    if (out.routed.domain !== SubjectDomain.CODE) return;
    expect(out.routed.output.intent).toBe(CodeIntent.D_DEBUG);
  });

  it('V-RT-04: routes islamic fiqh turn', () => {
    const out = routeStudentTurn({
      userMessage: 'Apa hukum puasa bagi orang sakit?',
      session:     baseSession,
    });
    expect(out.domain).toBe(SubjectDomain.ISLAMIC);
    if (out.routed.domain !== SubjectDomain.ISLAMIC) return;
    expect(out.routed.output.intent).toBe(IslamicIntent.Q_FIQH);
  });

  it('V-RT-05: short continuation keeps prior domain', () => {
    const session = {
      ...baseSession,
      priorDomain: SubjectDomain.MATH,
    };
    expect(detectDomain({
      userMessage: '12',
      session,
    })).toBe(SubjectDomain.MATH);
  });

  it('V-RT-06: science factual routes to science classifier', () => {
    const out = routeStudentTurn({
      userMessage: 'Apa fungsi mitokondria dalam sel?',
      session:     baseSession,
    });
    expect(out.domain).toBe(SubjectDomain.SCIENCE);
    if (out.routed.domain !== SubjectDomain.SCIENCE) return;
    expect(out.routed.output.intent).toBe(ScienceIntent.F_FACTUAL);
  });
});
