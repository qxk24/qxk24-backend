/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Voice Assessment Tests (ERA_2c)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  assessVoiceTurn,
  extractSpeakingTargetFromAssistant,
  scoreVoiceTranscript,
} from '../src/adam/tutor-law/tutor-law.voice-assessment';
import {
  applyVoiceTurnUpdate,
} from '../src/adam/tutor-law/tutor-law.learning-profile-bkt';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';

describe('ERA_2c voice assessment', () => {
  it('VA-01: extracts speaking target from assistant prompt', () => {
    expect(
      extractSpeakingTargetFromAssistant('Good try. Now say: "make a decision"'),
    ).toBe('make a decision');
  });

  it('VA-02: scores pronunciation against target phrase', () => {
    const result = scoreVoiceTranscript({
      transcript:   'I want to make a decision today',
      targetPhrase: 'make a decision',
      viaVoice:     true,
    });
    expect(result.pronunciationScore).toBeGreaterThan(0.5);
    expect(result.wordCount).toBeGreaterThan(2);
  });

  it('VA-03: penalizes empty transcript', () => {
    const result = scoreVoiceTranscript({
      transcript: '',
      viaVoice:   true,
    });
    expect(result.combinedScore).toBeLessThan(0.2);
  });

  it('VA-04: assessVoiceTurn only when viaVoice', () => {
    expect(assessVoiceTurn({ transcript: 'hello world', viaVoice: false })).toBeNull();
    expect(assessVoiceTurn({
      transcript: 'hello world from voice',
      viaVoice:   true,
      recentAssistantMessages: ['Repeat: "hello world"'],
    })).not.toBeNull();
  });

  it('VA-05: applyVoiceTurnUpdate persists rolling averages', () => {
    const base = defaultTutorLearningProfile();
    const assessment = scoreVoiceTranscript({
      transcript:   'make a decision',
      targetPhrase: 'make a decision',
      viaVoice:     true,
    });
    const next = applyVoiceTurnUpdate(base, assessment);
    expect(next.voice.sessions).toBe(1);
    expect(next.voice.avgPronunciation).toBeGreaterThan(0.5);
    expect(next.conceptMastery['speaking.pronunciation']).toBeDefined();
  });
});
