/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Checkpoint Tests (ERA_2e)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  CHECKPOINT_INTERVAL_DAYS,
  CHECKPOINT_TARGET_QUESTIONS,
  daysUntilNextCheckpoint,
  isCheckpointDue,
  selectCheckpointItemIds,
  userRequestedCheckpoint,
} from '../src/adam/tutor-law/tutor-law.checkpoint-bank';
import {
  applyCheckpointAnswer,
  checkpointProgressLabel,
  startCheckpointSession,
} from '../src/adam/tutor-law/tutor-law.learning-profile-checkpoint';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';
import { getCheckpointItemByIndex } from '../src/adam/tutor-law/tutor-law.checkpoint-bank';

describe('ERA_2e checkpoint bank', () => {
  it('CK-01: detects user checkpoint request', () => {
    expect(userRequestedCheckpoint('semak kemajuan saya')).toBe(true);
    expect(userRequestedCheckpoint('help with fractions')).toBe(false);
  });

  it('CK-02: selects 6 checkpoint items across subjects', () => {
    const profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    const ids = selectCheckpointItemIds(profile);
    expect(ids).toHaveLength(CHECKPOINT_TARGET_QUESTIONS);
  });

  it('CK-03: checkpoint due after 14 days from placement', () => {
    const profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    profile.placementCompletedAt = new Date(
      Date.now() - (CHECKPOINT_INTERVAL_DAYS + 1) * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(isCheckpointDue(profile)).toBe(true);
    expect(daysUntilNextCheckpoint(profile)).toBe(0);
  });

  it('CK-04: checkpoint not due within 14 days', () => {
    const profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    profile.placementCompletedAt = new Date().toISOString();
    expect(isCheckpointDue(profile)).toBe(false);
    expect((daysUntilNextCheckpoint(profile) ?? 99)).toBeGreaterThan(0);
  });
});

describe('ERA_2e checkpoint session', () => {
  it('CK-05: completes checkpoint and updates subject levels', () => {
    let profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    profile.placementCompletedAt = new Date().toISOString();
    profile.subjectLevels = { english: 'A2', math: 'MATH_ASAS', bm: 'BM_ASAS' };

    const started = startCheckpointSession(profile);
    profile = started.profile;
    expect(profile.checkpoint?.itemIds).toHaveLength(CHECKPOINT_TARGET_QUESTIONS);

    for (let i = 0; i < CHECKPOINT_TARGET_QUESTIONS; i += 1) {
      const item = getCheckpointItemByIndex(profile.checkpoint!.itemIds, i)!;
      profile = applyCheckpointAnswer(profile, item, 'deliberately wrong');
    }

    expect(profile.checkpoint?.active).toBe(false);
    expect(profile.lastCheckpointAt).toBeTruthy();
    expect(profile.checkpointHistory?.[0]?.total).toBe(CHECKPOINT_TARGET_QUESTIONS);
    expect(profile.subjectLevels.math).toMatch(/^MATH_/);
  });

  it('CK-06: checkpoint progress label', () => {
    const profile = defaultTutorLearningProfile();
    profile.checkpoint = {
      active:            true,
      itemIds:           ['a', 'b'],
      currentItemId:     'a',
      questionsAnswered: 2,
      awaitingAnswer:    false,
    };
    expect(checkpointProgressLabel(profile)).toBe('2/6');
  });
});
