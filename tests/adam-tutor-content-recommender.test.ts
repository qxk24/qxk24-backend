/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Content Recommender Tests (ERA_2g)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { KNOWLEDGE_CONCEPT_GRAPH } from '../src/adam/tutor-law/tutor-law.adaptive-assessment';
import {
  CONTENT_ITEM_BANK,
  getActiveContentBank,
} from '../src/adam/tutor-law/tutor-law.content-bank';
import {
  buildContentDeliveryPrompt,
  recommendNextContent,
} from '../src/adam/tutor-law/tutor-law.content-recommender';
import { applyContentAnswer } from '../src/adam/tutor-law/tutor-law.learning-profile-content';
import { computeLearningProgress } from '../src/adam/tutor-law/tutor-law.learning-progress';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';

function profileWithMastery(
  tag: string,
  attempts: number,
  correctCount: number,
) {
  const profile = defaultTutorLearningProfile();
  profile.placementComplete = true;
  profile.conceptMastery[tag] = {
    pMastery:     correctCount / attempts,
    attempts,
    correctCount,
    lastUpdated:  new Date().toISOString(),
  };
  return profile;
}

describe('ERA_2g content bank', () => {
  it('REC-08: bank has 60 active items with known concept tags', () => {
    expect(CONTENT_ITEM_BANK).toHaveLength(60);
    expect(getActiveContentBank()).toHaveLength(60);
    for (const item of CONTENT_ITEM_BANK) {
      expect(KNOWLEDGE_CONCEPT_GRAPH[item.conceptTag]).toBeTruthy();
    }
  });
});

describe('ERA_2g recommender', () => {
  it('REC-01: prefers ZPD concept over mastered', () => {
    const profile = profileWithMastery('grammar.tenses.present_continuous', 4, 2);
    profile.conceptMastery['grammar.tenses.past_simple'] = {
      pMastery: 0.95,
      attempts: 10,
      correctCount: 9,
      lastUpdated: new Date().toISOString(),
    };

    const rec = recommendNextContent({ profile });
    expect(rec).toBeTruthy();
    expect(rec!.item.conceptTag).not.toBe('grammar.tenses.past_simple');
  });

  it('REC-02: avoids recent content ids', () => {
    const profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    const first = recommendNextContent({ profile });
    expect(first).toBeTruthy();

    profile.content = {
      lastContentId:     first!.item.id,
      lastContentAt:     new Date().toISOString(),
      recentContentIds:  [first!.item.id],
      weeklyBySubject:   {},
      currentContentId:  null,
      awaitingAnswer:    false,
    };

    const second = recommendNextContent({ profile });
    expect(second?.item.id).not.toBe(first!.item.id);
  });

  it('REC-04: boosts underrepresented math subject', () => {
    const profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    profile.content = {
      lastContentId:     null,
      lastContentAt:     null,
      recentContentIds:  [],
      weeklyBySubject:   { english: 8, math: 0, bm: 2 },
      currentContentId:  null,
      awaitingAnswer:    false,
    };

    const rec = recommendNextContent({ profile, preferSubject: 'math' });
    expect(rec?.item.subject).toBe('math');
  });

  it('REC-05: returns null when pool empty', () => {
    const profile = defaultTutorLearningProfile();
    profile.placementComplete = true;
    const rec = recommendNextContent({ profile, pool: [] });
    expect(rec).toBeNull();
  });

  it('REC-06: content delivery prompt includes contentId', () => {
    const prompt = buildContentDeliveryPrompt('ct-en-d01', 'Test prompt?');
    expect(prompt).toMatch(/ID=ct-en-d01/);
    expect(prompt).toMatch(/Test prompt/);
  });
});

describe('ERA_2g content answers + progress', () => {
  it('REC-03: drill answer updates BKT and interaction log', () => {
    const profile = defaultTutorLearningProfile();
    const item = CONTENT_ITEM_BANK.find((i) => i.id === 'ct-en-d01')!;
    const next = applyContentAnswer(profile, item, 'Yesterday I went to school');

    expect(next.interactionLog?.[0]?.contentId).toBe('ct-en-d01');
    expect(next.interactionLog?.[0]?.correct).toBe(true);
    expect(next.conceptMastery[item.conceptTag]?.correctCount).toBe(1);
  });

  it('REC-07: learning velocity positive when last 7 days better', () => {
    const now = new Date('2026-06-22T12:00:00Z');
    const profile = defaultTutorLearningProfile(now);
    profile.placementComplete = true;
    profile.interactionLog = [
      { at: '2026-06-21T10:00:00Z', kind: 'drill', contentId: 'a', conceptTag: 'grammar.tenses.past_simple', subject: 'english', correct: true },
      { at: '2026-06-20T10:00:00Z', kind: 'drill', contentId: 'b', conceptTag: 'grammar.tenses.past_simple', subject: 'english', correct: true },
      { at: '2026-06-10T10:00:00Z', kind: 'drill', contentId: 'c', conceptTag: 'grammar.tenses.past_simple', subject: 'english', correct: false },
      { at: '2026-06-09T10:00:00Z', kind: 'drill', contentId: 'd', conceptTag: 'grammar.tenses.past_simple', subject: 'english', correct: false },
    ];

    const metrics = computeLearningProgress(profile, now);
    expect(metrics.velocity).toBeGreaterThan(0);
  });
});
