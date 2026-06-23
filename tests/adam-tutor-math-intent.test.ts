/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import {
  buildTutorMathTurnContext,
  classifyTutorMathIntent,
  hasNumericalComputation,
  studentAsksMathConcept,
  studentRequestsAnswerVerification,
  tutorQuestionIsScienceFactualIntent,
} from '../src/adam/tutor-law/tutor-law.math-intent-classifier';
import { buildMathIntentTurnLaw } from '../src/adam/tutor-law/tutor-law.math-prompt-laws';
import { tutorInferFurthestColumnInThread } from '../src/adam/tutor-law/tutor-law.arithmetic-phase';

describe('tutor math intent classifier', () => {
  it('V-MI-01: concept — tak faham pecahan', () => {
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: 'Tak faham apa itu pecahan.',
    }));
    expect(intent.mode).toBe('concept');
    expect(intent.warrantsAutoClosure).toBe(false);
    expect(intent.allowsStuckEscalation).toBe(false);
  });

  it('V-MI-02: verification — betul tak without working', () => {
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: '2x+3=11 x=5 betul tak?',
    }));
    expect(intent.mode).toBe('verification');
    expect(intent.requiresWorkingFirst).toBe(true);
    expect(intent.warrantsAutoClosure).toBe(false);
  });

  it('V-MI-05: bare final answer without working — no auto-close', () => {
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: '156 orang',
    }));
    expect(intent.mode).toBe('verification');
    expect(intent.warrantsAutoClosure).toBe(false);
  });

  it('V-MI-06: E=mc² factual — science not computation', () => {
    const ctx = buildTutorMathTurnContext({ userMessage: 'Apa maksud formula E=mc²?' });
    expect(hasNumericalComputation(ctx.userMessage)).toBe(false);
    expect(tutorQuestionIsScienceFactualIntent(ctx)).toBe(true);
    const intent = classifyTutorMathIntent(ctx);
    expect(intent.allowsScienceFactual).toBe(true);
  });

  it('V-MI-07: E=mc² computation routes to math module', () => {
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: 'Kira tenaga jisim 1g menggunakan E=mc²',
    }));
    expect(hasNumericalComputation('Kira tenaga jisim 1g menggunakan E=mc²')).toBe(true);
    expect(intent.allowsScienceFactual).toBe(false);
    expect(intent.mode).not.toBe('non_math');
  });

  it('V-MI-10: exam block', () => {
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: 'Tolong selesaikan soalan peperiksaan ini: 2x+3=11',
    }));
    expect(intent.mode).toBe('exam_block');
  });

  it('studentAsksMathConcept detects pecahan question', () => {
    expect(studentAsksMathConcept('Apa beza perimeter dengan luas?')).toBe(true);
  });

  it('studentRequestsAnswerVerification detects betul tak', () => {
    expect(studentRequestsAnswerVerification('Jawapan saya x=4, betul tak?')).toBe(true);
  });

  it('V-MI-04: micro-teach thread + final answer may warrant closure', () => {
    const recentAssistant = [
      'Berapa **5 + 7** di tempat **Sa**?\n→ ______',
    ];
    const recentUser = ['12'];
    tutorInferFurthestColumnInThread(recentUser, recentAssistant, '1083');
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage:            '1 083 biji',
      recentUserMessages:     recentUser,
      recentAssistantMessages: recentAssistant,
    }));
    expect(intent.nextSessionState.workingShown).toBe(true);
    expect(intent.warrantsAutoClosure).toBe(true);
    expect(intent.studentGaveFinalAnswer).toBe(true);
  });

  it('V-MI-08: micro blank answer stays procedural — not verification drill', () => {
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: '12',
      recentAssistantMessages: ['Berapa **5 + 7** di tempat **Sa**?\n→ ______'],
    }));
    expect(intent.mode).toBe('procedural');
    expect(intent.answeringMicroBlank).toBe(true);
    expect(intent.warrantsAutoClosure).toBe(false);
    expect(buildMathIntentTurnLaw(intent)).toMatch(/JAWAPAN MIKRO BETUL/i);
  });

  it('V-MI-09: final answer with working thread triggers closure law', () => {
    const intent = classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage: '156 orang',
      recentUserMessages: ['12', '8', '5'],
      recentAssistantMessages: [
        'Berapa di tempat Puluh?\n→ ______',
        'Berapa **5 + 7** di tempat **Sa**?\n→ ______',
      ],
    }));
    expect(intent.warrantsAutoClosure).toBe(true);
    expect(buildMathIntentTurnLaw(intent)).toMatch(/CLOSURE/i);
  });
});
