/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Closure Behaviour Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildTutorMathTurnContext,
  classifyTutorMathIntent,
} from '../src/adam/tutor-law/tutor-law.math-intent-classifier';
import {
  buildMathIntentTurnLaw,
  buildTutorMathClosureCheckQuestion,
} from '../src/adam/tutor-law/tutor-law.math-prompt-laws';
import {
  studentAnsweredSingleDigitAfterFullNumberAsk,
  threadHasArithmeticClosureSummary,
} from '../src/adam/tutor-law/tutor-law.math-intent-detectors';

describe('math closure — post-summary practice offer', () => {
  it('V-MCL-01: closure check question offers latihan mengukuhan', () => {
    const q = buildTutorMathClosureCheckQuestion('arithmetic_multi_op');
    expect(q).toMatch(/latihan\s+mengukuhan/i);
    expect(q).not.toMatch(/Soalan semak|pecahan peratus|tempat Sa/i);
  });

  it('V-MCL-02: post-closure turn suppresses topic probes', () => {
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: 'kerana 0 tiada nilai',
      recentAssistantMessages: [
        [
          'Jawapan: 1 083 biji bola pingpong',
          'Kaedah penyelesaian:',
          'Baki bola pada Penny = 1 561 − 478',
          '= 1 083 biji',
        ].join('\n'),
      ],
    }));
    expect(intent.postClosureTurn).toBe(true);

    const law = buildMathIntentTurnLaw(intent);
    expect(law).toMatch(/SELEPAS RUMUSAN PENUTUP/i);
    expect(law).toMatch(/latihan\s+mengukuhan/i);
    expect(law).not.toMatch(/TOPIC PROBE|35%|Probe idea/i);
  });

  it('V-MCL-03: single digit after full-number ask triggers misread law', () => {
    expect(studentAnsweredSingleDigitAfterFullNumberAsk(
      '1',
      ['Boleh anda tulis jawapan akhirnya? Iaitu, apakah nombor penuh yang kita dapat?'],
    )).toBe(true);

    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: '1',
      recentAssistantMessages: [
        'Boleh anda tulis jawapan akhirnya? Iaitu, apakah nombor penuh yang kita dapat setelah lengkap mengisi semua lajur?',
      ],
    }));
    expect(intent.misreadFinalAnswer).toBe(true);
    expect(buildMathIntentTurnLaw(intent)).toMatch(/SALAH FAHAM JAWAPAN AKHIR/i);
  });

  it('V-MCL-04: thread closure summary detector', () => {
    expect(threadHasArithmeticClosureSummary([
      'Jawapan: 1 083 biji\nKaedah penyelesaian:\n560 + 1001 = 1561',
    ])).toBe(true);
  });
});
