/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Profile Tests (ERA_2)
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
} from '../src/adam/tutor-law/tutor-law.learning-profile-bkt';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';
import {
  abilityToCefr,
  getPlacementItemById,
  scorePlacementAnswer,
  selectNextPlacementItem,
} from '../src/adam/tutor-law/tutor-law.placement-bank';
import { LearnerEmotionalSignal } from '../src/adam/tutor-law/tutor-law.adaptive-assessment';

describe('ERA_2 placement bank', () => {
  it('LP-01: scores past simple goes', () => {
    const item = getPlacementItemById('pl-present-goes')!;
    expect(scorePlacementAnswer(item, 'goes')).toBe(true);
    expect(scorePlacementAnswer(item, 'go')).toBe(false);
  });

  it('LP-02: adaptive item selection by ability', () => {
    const easy = selectNextPlacementItem(-2, []);
    expect(easy?.difficulty).toBeLessThanOrEqual(-1);
  });

  it('LP-03: ability maps to CEFR', () => {
    expect(abilityToCefr(0)).toBe('B1');
    expect(abilityToCefr(-2)).toBe('A1');
  });
});

describe('ERA_2 BKT + profile', () => {
  it('LP-04: BKT increases on correct', () => {
    expect(bktUpdateMastery(0.3, true)).toBeGreaterThan(0.3);
    expect(bktUpdateMastery(0.3, false)).toBeLessThan(0.3);
  });

  it('LP-05: placement answer updates CEFR', () => {
    const base = defaultTutorLearningProfile();
    const item = getPlacementItemById('pl-present-goes')!;
    const next = applyPlacementAnswer(base, item, 'goes');
    expect(next.placement?.questionsAnswered).toBe(1);
    expect(next.estimatedCefr).not.toBe('UNKNOWN');
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
    expect(next.conceptMastery['grammar.irregular_verbs']).toBeDefined();
  });

  it('LP-07: prompt summary uses growth language not IQ', () => {
    const profile = applyPlacementAnswer(
      defaultTutorLearningProfile(),
      getPlacementItemById('pl-present-goes')!,
      'goes',
    );
    const summary = buildLearningProfilePromptSummary(profile);
    expect(summary).toMatch(/bukan IQ|CEFR/i);
  });
});
