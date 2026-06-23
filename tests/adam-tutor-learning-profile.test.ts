/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Profile Tests (ERA_2 MVP 100%)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  applyPlacementAnswer,
  applyStealthTurnUpdate,
  bktUpdateMastery,
  buildLearningProfilePromptSummary,
  conceptPercentCorrect,
  listConceptMasteryDisplay,
} from '../src/adam/tutor-law/tutor-law.learning-profile-bkt';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';
import {
  abilityToCefr,
  getPlacementItemById,
  getStaticPlacementItemByIndex,
  PLACEMENT_ITEM_BANK,
  PLACEMENT_TARGET_QUESTIONS,
  scorePlacementAnswer,
  selectNextPlacementItem,
  STATIC_PLACEMENT_ORDER,
} from '../src/adam/tutor-law/tutor-law.placement-bank';
import { LearnerEmotionalSignal } from '../src/adam/tutor-law/tutor-law.adaptive-assessment';

describe('ERA_2 placement bank', () => {
  it('LP-01: scores past simple goes', () => {
    const item = getPlacementItemById('pl-present-goes')!;
    expect(scorePlacementAnswer(item, 'goes')).toBe(true);
    expect(scorePlacementAnswer(item, 'go')).toBe(false);
  });

  it('LP-02: adaptive item selection by ability (legacy)', () => {
    const easy = selectNextPlacementItem(-2, []);
    expect(easy?.difficulty).toBeLessThanOrEqual(-1);
  });

  it('LP-03: ability maps to CEFR', () => {
    expect(abilityToCefr(0)).toBe('B1');
    expect(abilityToCefr(-2)).toBe('A1');
  });

  it('LP-07: bank has 20 static placement items', () => {
    expect(PLACEMENT_ITEM_BANK).toHaveLength(20);
    expect(STATIC_PLACEMENT_ORDER).toHaveLength(PLACEMENT_TARGET_QUESTIONS);
  });

  it('LP-08: static order is fixed across students', () => {
    expect(getStaticPlacementItemByIndex(0)?.id).toBe('pl-past-go');
    expect(getStaticPlacementItemByIndex(1)?.id).toBe('pl-math-add-20');
    expect(getStaticPlacementItemByIndex(19)?.id).toBe('pl-math-pct-20');
  });
});

describe('ERA_2 BKT + profile', () => {
  it('LP-04: BKT increases on correct', () => {
    expect(bktUpdateMastery(0.3, true)).toBeGreaterThan(0.3);
    expect(bktUpdateMastery(0.3, false)).toBeLessThan(0.3);
  });

  it('LP-05: placement answer updates CEFR and correctCount', () => {
    const base = defaultTutorLearningProfile();
    const item = getPlacementItemById('pl-present-goes')!;
    const next = applyPlacementAnswer(base, item, 'goes');
    expect(next.placement?.questionsAnswered).toBe(1);
    expect(next.estimatedCefr).not.toBe('UNKNOWN');
    expect(next.conceptMastery[item.conceptTag]?.correctCount).toBe(1);
    expect(conceptPercentCorrect(next.conceptMastery[item.conceptTag]!)).toBe(1);
  });

  it('LP-09: placement completes at 20 answers with subject levels', () => {
    let profile = defaultTutorLearningProfile();
    for (let i = 0; i < PLACEMENT_TARGET_QUESTIONS; i += 1) {
      const item = getStaticPlacementItemByIndex(i)!;
      profile = applyPlacementAnswer(profile, item, 'wrong answer');
    }
    expect(profile.placementComplete).toBe(true);
    expect(profile.placement?.questionsAnswered).toBe(PLACEMENT_TARGET_QUESTIONS);
    expect(profile.subjectLevels.math).toMatch(/^MATH_/);
    expect(profile.subjectLevels.bm).toMatch(/^BM_/);
  });

  it('LP-10: topic display shows percent correct', () => {
    const base = defaultTutorLearningProfile();
    const item = getPlacementItemById('pl-math-add-20')!;
    const next = applyPlacementAnswer(base, item, '20');
    const rows = listConceptMasteryDisplay(next);
    expect(rows[0]?.percent).toBe(1);
    expect(rows[0]?.correct).toBe(1);
    expect(rows[0]?.attempts).toBe(1);
  });

  it('LP-06: stealth turn adds XP on engagement', () => {
    const base = defaultTutorLearningProfile();
    const next = applyStealthTurnUpdate(
      base,
      {
        shortResponse:      false,
        longEngaged:        true,
        frustrationHit:     false,
        boredomHit:         false,
        hintRequest:        false,
        giveUp:             false,
        selfCorrection:     false,
        deepQuestion:       false,
        inferredConcepts:   ['grammar.irregular_verbs'],
      },
      LearnerEmotionalSignal.NEUTRAL,
      ['grammar.irregular_verbs'],
    );
    expect(next.gamification.xp).toBeGreaterThan(0);
    expect(next.conceptMastery['grammar.irregular_verbs']?.correctCount).toBe(1);
  });

  it('LP-11: prompt summary mentions static placement progress', () => {
    const summary = buildLearningProfilePromptSummary(defaultTutorLearningProfile());
    expect(summary).toMatch(/Placement statik: 0\/20/);
    expect(summary).toMatch(/Tahap subjek/);
  });
});
