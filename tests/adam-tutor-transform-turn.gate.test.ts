/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Transform Turn Gate Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';
import {
  isTutorAssessmentAnswerTurn,
  resolveTutorTransformASource,
  shouldTutorTransformTurn,
} from '../src/adam/adam-tutor-transform-turn.gate';

describe('adam-tutor-transform-turn.gate — F3 UI Guide + UID', () => {
  const baseProfile = defaultTutorLearningProfile();
  const placementCompleteProfile = {
    ...baseProfile,
    placementComplete: true,
  };

  it('skips placement answer turns', () => {
    const profile = {
      ...baseProfile,
      placement: {
        itemIdsAsked:      [],
        currentItemId:     'p1',
        questionsAnswered: 0,
        abilityEstimate:   0,
        awaitingAnswer:    true,
      },
    };
    expect(isTutorAssessmentAnswerTurn(profile, 'A')).toBe(true);
    expect(shouldTutorTransformTurn({
      studentId:     'pelajar-test',
      userMessage:   'Apa itu fotosintesis?',
      finalResponse: 'x'.repeat(220),
      gateContext:   { profile },
    })).toBe(false);
  });

  it('resolves conventional when web search without recall', () => {
    expect(resolveTutorTransformASource({
      userMessage:   'Harga minyak hari ini?',
      webSearchUsed: true,
      recallLoaded:  false,
    })).toBe('conventional');
  });

  it('resolves tutor aSource for substantive dialogue', () => {
    expect(resolveTutorTransformASource({
      userMessage: 'Terangkan fotosintesis kepada saya',
    })).toBe('tutor');
  });

  it('passes gate for substantive tutor turn when placement complete', () => {
    expect(shouldTutorTransformTurn({
      studentId:     'pelajar-test',
      userMessage:   'Terangkan fotosintesis',
      finalResponse: 'Fotosintesis ialah proses tumbuhan menukar cahaya kepada glukosa. '.repeat(4),
      gateContext:   { profile: placementCompleteProfile },
    })).toBe(true);
  });

  it('skips light chat', () => {
    expect(shouldTutorTransformTurn({
      studentId:     'pelajar-test',
      userMessage:   'terima kasih',
      finalResponse: 'x'.repeat(220),
      gateContext:   { profile: placementCompleteProfile },
    })).toBe(false);
  });
});
