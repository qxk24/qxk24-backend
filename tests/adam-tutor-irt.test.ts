/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor IRT Tests (ERA_2f)
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
  startPlacementSession,
} from '../src/adam/tutor-law/tutor-law.learning-profile-bkt';
import {
  abilityStandardError,
  itemInformation,
  PLACEMENT_MIN_QUESTIONS,
  PLACEMENT_SE_THRESHOLD,
  PLACEMENT_SUBJECT_MIN,
  raschProbability,
  selectNextIrtItem,
  shouldStopPlacement,
  updateAbilityEap,
} from '../src/adam/tutor-law/tutor-law.irt-engine';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';
import {
  getPlacementItemById,
  getStaticPlacementItemByIndex,
  PLACEMENT_ITEM_BANK,
  PLACEMENT_TARGET_QUESTIONS,
} from '../src/adam/tutor-law/tutor-law.placement-bank';

describe('ERA_2f IRT engine', () => {
  it('IRT-01: θ increases after correct on harder item', () => {
    const theta = 0;
    const hard = 1.5;
    const next = updateAbilityEap(theta, hard, true);
    expect(next).toBeGreaterThan(theta);
  });

  it('IRT-02: θ decreases after incorrect on easy item', () => {
    const theta = 0;
    const easy = -2;
    const next = updateAbilityEap(theta, easy, false);
    expect(next).toBeLessThan(theta);
  });

  it('IRT-03: SE decreases with more answered items', () => {
    const items = [
      getPlacementItemById('pl-past-go')!,
      getPlacementItemById('pl-math-add-20')!,
      getPlacementItemById('pl-present-goes')!,
    ];
    const seOne = abilityStandardError(0, items.slice(0, 1));
    const seThree = abilityStandardError(0, items);
    expect(seThree).toBeLessThan(seOne);
  });

  it('IRT-04: early stop when SE below threshold and min questions met', () => {
    const counts = { english: 4, math: 4, bm: 4 };
    expect(shouldStopPlacement(PLACEMENT_MIN_QUESTIONS, PLACEMENT_SE_THRESHOLD - 0.01, counts)).toBe(true);
    expect(shouldStopPlacement(PLACEMENT_MIN_QUESTIONS - 1, 0.1, counts)).toBe(false);
  });

  it('IRT-05: no early stop without subject quotas 3+3+3', () => {
    const counts = { english: 5, math: 5, bm: 1 };
    expect(shouldStopPlacement(PLACEMENT_MIN_QUESTIONS, 0.2, counts)).toBe(false);
  });

  it('IRT-06: no duplicate items in IRT placement session', () => {
    let { profile, item } = startPlacementSession(defaultTutorLearningProfile());
    const asked = new Set<string>();

    for (let i = 0; i < 8 && item && !profile.placementComplete; i += 1) {
      expect(asked.has(item.id)).toBe(false);
      asked.add(item.id);
      profile = applyPlacementAnswer(profile, item, 'wrong answer');
      const nextId = profile.placement?.currentItemId;
      item = nextId ? getPlacementItemById(nextId) : null;
    }

    expect(asked.size).toBeGreaterThanOrEqual(1);
    expect(profile.placement?.questionsAnswered).toBe(asked.size);
    expect(new Set(profile.placement?.itemIdsAsked).size)
      .toBe(profile.placement?.itemIdsAsked.length);
  });

  it('IRT-07: v1 incomplete profile uses IRT on next answer', () => {
    const legacy = {
      ...defaultTutorLearningProfile(),
      version: 1 as const,
      placement: {
        itemIdsAsked:      ['pl-past-go'],
        currentItemId:     'pl-past-go',
        questionsAnswered: 0,
        abilityEstimate:   0,
        awaitingAnswer:    true,
        subjectScores:     {},
      },
    };
    const item = getPlacementItemById('pl-past-go')!;
    const next = applyPlacementAnswer(legacy, item, 'went');
    expect(next.placement?.mode).toBe('irt');
    expect(next.interactionLog?.[0]?.contentId).toBe('pl-past-go');
    expect(next.interactionLog?.[0]?.correct).toBe(true);
  });

  it('IRT-08: high-ability start selects harder items than low-ability', () => {
    const low = selectNextIrtItem({
      theta:      -2,
      pool:       PLACEMENT_ITEM_BANK,
      excludeIds: [],
    });
    const high = selectNextIrtItem({
      theta:      2,
      pool:       PLACEMENT_ITEM_BANK,
      excludeIds: [],
    });
    expect(low).toBeTruthy();
    expect(high).toBeTruthy();
    expect(high!.difficulty).toBeGreaterThan(low!.difficulty);
  });
});

describe('ERA_2f placement wiring', () => {
  it('IRT-09: startPlacementSession uses IRT for new profiles', () => {
    const { item, profile } = startPlacementSession(defaultTutorLearningProfile());
    expect(profile.placement?.mode).toBe('irt');
    expect(item).toBeTruthy();
    expect(profile.placement?.abilitySe).toBe(1);
  });

  it('IRT-10: static mode still completes at 20 fixed items', () => {
    let profile = defaultTutorLearningProfile();
    profile.placement = {
      ...profile.placement!,
      mode: 'static',
    };

    for (let i = 0; i < PLACEMENT_TARGET_QUESTIONS; i += 1) {
      const item = getStaticPlacementItemByIndex(i)!;
      profile = applyPlacementAnswer(profile, item, 'x');
    }

    expect(profile.placementComplete).toBe(true);
    expect(profile.placement?.questionsAnswered).toBe(PLACEMENT_TARGET_QUESTIONS);
  });

  it('IRT-11: Rasch probability is highest when θ matches difficulty', () => {
    const atMatch = raschProbability(0, 0);
    const offMatch = raschProbability(0, 2);
    expect(atMatch).toBeGreaterThan(offMatch);
    expect(itemInformation(0, 0)).toBeGreaterThan(itemInformation(0, 2));
  });

  it('IRT-12: subject quota steering prefers underrepresented subject', () => {
    const item = selectNextIrtItem({
      theta:          0,
      pool:           PLACEMENT_ITEM_BANK,
      excludeIds:     new Set(['pl-past-go', 'pl-present-goes', 'pl-past-played']),
      subjectCounts:  { english: PLACEMENT_SUBJECT_MIN, math: 0, bm: 0 },
      subjectMin:     PLACEMENT_SUBJECT_MIN,
    });
    expect(item?.subject).toBe('math');
  });
});
