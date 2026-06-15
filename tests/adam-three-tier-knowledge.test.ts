/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Three Tier Knowledge Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  buildThreeTierTurnOverlay,
  paragraphIsUniversalScholarDoorOffer,
  resolveStudentKnowledgeTier,
  userOptedIntoAlamtologiTier,
  userOptedIntoQuranTier,
  UNIVERSAL_SCHOLAR_DOOR_EN,
} from '../src/adam/adam-three-tier-knowledge';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';

describe('three-tier knowledge architecture', () => {
  it('defaults to tier 1 on conventional questions', () => {
    expect(resolveStudentKnowledgeTier('Apa punca diabetes?')).toBe(1);
    expect(buildThreeTierTurnOverlay(1)).toMatch(/ACTIVE TIER THIS TURN: 1/);
  });

  it('detects tier 2 opt-in', () => {
    expect(userOptedIntoAlamtologiTier('Ya, saya ingin sudut Alamtologi')).toBe(true);
    expect(resolveStudentKnowledgeTier('Ya, teruskan dari sudut Alamtologi')).toBe(2);
    expect(buildThreeTierTurnOverlay(2)).toMatch(/ACTIVE TIER THIS TURN: 2/);
  });

  it('detects tier 3 opt-in', () => {
    expect(userOptedIntoQuranTier('Ya, saya nak rujukan ayat Quran')).toBe(true);
    expect(resolveStudentKnowledgeTier('Nak pengesahan dari Quran')).toBe(3);
    expect(buildThreeTierTurnOverlay(3)).toMatch(/ACTIVE TIER THIS TURN: 3/);
  });

  it('tier door offers are kept by output guard on practical advisory turns', () => {
    const door = UNIVERSAL_SCHOLAR_DOOR_EN;
    expect(paragraphIsUniversalScholarDoorOffer(door)).toBe(true);
    const out = sanitizeStudentOutputSync(
      `An electrician installs wiring safely.\n\n${door}`,
      'What does an electrician do day to day?',
    );
    expect(out).toMatch(/skills and tools/i);
  });

  it('broad yes opens tier 2 without saying Alamtologi', () => {
    const adamPrior = `Insulin resistance is central.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`;
    expect(resolveStudentKnowledgeTier('Yes, go deeper', [], [adamPrior])).toBe(2);
  });

  it('student prompt stack includes active tier overlay', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
      userMessage:          'Apa itu fotosintesis?',
    });
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 1/);
    expect(prompt).toMatch(/USER MODE —/);
  });
});
