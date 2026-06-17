/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM General Konvensional Zero Alamtologi Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  userOptedIntoStudentExplainBackBeta,
  resolveAdamAnswerProfile,
} from '../src/adam/adam-answer-profile';
import {
  isAdamGeneralKonvensionalTurn,
  resolveAdamKnowledgeMode,
  shouldStripKonvensionalFrameworkLeaks,
} from '../src/adam/adam-knowledge-mode';
import {
  paragraphIsAlamtologiPromotionLeak,
  resolveStudentKnowledgeTier,
  stripAlamtologiPromotionInline,
} from '../src/adam/adam-universal-scholar';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';

const ICE_ASK = 'Apakah yang berlaku apabila ais dipanaskan?';

const ALAMTOLOGI_DOOR_LEAK = [
  'Hai QA, Apabila ais dipanaskan, ia menjadi air cecair.',
  'Adakah anda ingin melihat sudut Alamtologi tentang perubahan fasa ini, atau teruskan pada peringkat 2?',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n\n');

describe('General konvensional — separated from Alamtologi mode', () => {
  it('isAdamGeneralKonvensionalTurn for ice ask', () => {
    expect(isAdamGeneralKonvensionalTurn(ICE_ASK)).toBe(true);
    expect(isAdamGeneralKonvensionalTurn('Terangkan sudut Alamtologi tentang air.')).toBe(false);
  });

  it('does not stick tier 2 from prior Alamtologi opt-in in session history', () => {
    expect(
      resolveStudentKnowledgeTier(ICE_ASK, ['Ya, terangkan sudut Alamtologi tentang air.'], []),
    ).toBe(1);
  });

  it('does not stick β profile from prior Alamtologi in session', () => {
    expect(
      resolveAdamAnswerProfile({
        message: ICE_ASK,
        recentUserMessages: ['Ya, terangkan sudut Alamtologi tentang air.'],
        isFounder: false,
      }),
    ).toBe('alpha');
    expect(
      userOptedIntoStudentExplainBackBeta({
        message: ICE_ASK,
        recentUserMessages: ['Ya, terangkan sudut Alamtologi tentang air.'],
        isFounder: false,
      }),
    ).toBe(false);
  });

  it('still strips framework on new topic after prior Alamtologi opt-in', () => {
    expect(
      shouldStripKonvensionalFrameworkLeaks(ICE_ASK, ['Ya, terangkan sudut Alamtologi tentang air.']),
    ).toBe(true);
    expect(resolveAdamKnowledgeMode({
      userMessage: ICE_ASK,
      recentUserMessages: ['Ya, terangkan sudut Alamtologi tentang air.'],
      isFounder: false,
    })).toBe('konvensional');
  });

  it('detects and strips Alamtologi promotion doors', () => {
    const door = 'Adakah anda ingin melihat sudut Alamtologi tentang perubahan fasa ini?';
    expect(paragraphIsAlamtologiPromotionLeak(door)).toBe(true);
    const out = stripAlamtologiPromotionInline(ALAMTOLOGI_DOOR_LEAK);
    expect(out).toMatch(/cecair/i);
    expect(out).not.toMatch(/sudut\s+Alamtologi/i);
    expect(out).not.toMatch(/peringkat\s+2/i);
  });

  it('sanitizeStudentOutputSync removes Alamtologi door on general turn', () => {
    const out = sanitizeStudentOutputSync(ALAMTOLOGI_DOOR_LEAK, ICE_ASK, [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    expect(out).not.toMatch(/sudut\s+Alamtologi/i);
    expect(out).not.toMatch(/peringkat\s+2/i);
  });
});
