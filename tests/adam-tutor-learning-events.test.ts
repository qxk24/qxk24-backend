/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Events Tests (ERA_2h)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  applyCheckpointAnswer,
  startCheckpointSession,
} from '../src/adam/tutor-law/tutor-law.learning-profile-checkpoint';
import {
  applyStealthTurnUpdate,
  applyVoiceTurnUpdate,
} from '../src/adam/tutor-law/tutor-law.learning-profile-bkt';
import { applyContentAnswer } from '../src/adam/tutor-law/tutor-law.learning-profile-content';
import { getContentItemById } from '../src/adam/tutor-law/tutor-law.content-bank';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';
import { LearnerEmotionalSignal } from '../src/adam/tutor-law/tutor-law.adaptive-assessment';

describe('ERA_2h event log', () => {
  it('EVT-01: checkpoint answer appends interactionLog with responseMs', () => {
    let profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    const started = startCheckpointSession(profile);
    profile = started.profile;
    const item = started.item;
    expect(item).toBeTruthy();

    profile = applyCheckpointAnswer(profile, item!, 'wrong answer', 4200);
    expect(profile.interactionLog?.[0]).toMatchObject({
      kind:       'checkpoint',
      contentId:  item!.id,
      correct:    false,
      responseMs: 4200,
    });
  });

  it('EVT-02: voice turn appends voice interaction', () => {
    const profile = defaultTutorLearningProfile();
    const next = applyVoiceTurnUpdate(profile, {
      targetPhrase:       'Hello world',
      transcript:         'hello world',
      pronunciationScore: 0.8,
      fluencyScore:       0.7,
      combinedScore:      0.75,
      wordCount:          2,
      feedback:           [],
    }, 3100);

    expect(next.interactionLog?.[0]).toMatchObject({
      kind:       'voice',
      contentId:  'Hello world',
      conceptTag: 'speaking.pronunciation',
      subject:    'english',
      correct:    true,
      responseMs: 3100,
    });
  });

  it('EVT-03: stealth turn with concept tags appends probe event', () => {
    const profile = defaultTutorLearningProfile();
    const next = applyStealthTurnUpdate(
      profile,
      {
        shortResponse:    false,
        longEngaged:      true,
        frustrationHit:   false,
        boredomHit:       false,
        hintRequest:      false,
        giveUp:           false,
        selfCorrection:   false,
        deepQuestion:     false,
        inferredConcepts: ['grammar.tenses.present_simple'],
      },
      LearnerEmotionalSignal.NEUTRAL,
      ['grammar.tenses.present_simple'],
      1800,
    );

    expect(next.interactionLog?.[0]).toMatchObject({
      kind:       'probe',
      conceptTag: 'grammar.tenses.present_simple',
      correct:    true,
      responseMs: 1800,
    });
  });

  it('EVT-04: weeklyBySubject resets on new ISO week', () => {
    const profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    profile.content = {
      lastContentId:    null,
      lastContentAt:    null,
      recentContentIds: [],
      weeklyBySubject:  { english: 5, math: 2 },
      weeklyWeekStart:  '2020-01-06',
      currentContentId: 'ct-en-d01',
      awaitingAnswer:   true,
    };

    const item = getContentItemById('ct-en-d01');
    expect(item).toBeTruthy();

    const next = applyContentAnswer(profile, item!, 'correct answer', 900);
    expect(next.content?.weeklyWeekStart).not.toBe('2020-01-06');
    expect(next.content?.weeklyBySubject?.english).toBe(1);
    expect(next.content?.weeklyBySubject?.math).toBeUndefined();
  });
});
