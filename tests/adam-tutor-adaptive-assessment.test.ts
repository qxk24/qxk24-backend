/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Adaptive Assessment Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildAcademicIntentTurnPromptParts,
  classifyAcademicTurnIntents,
} from '../src/adam/tutor-law/tutor-law.academic-intent-prompt';
import {
  AdaptiveAssessmentPhase,
  analyzeStealthAssessment,
  buildAdaptiveAssessmentTurnLaw,
  detectAdaptiveAssessmentPhase,
  detectLearnerEmotionalSignal,
  inferConceptTagsFromMessage,
  LearnerEmotionalSignal,
  LearnerMasteryBand,
  masteryBandFromStealth,
} from '../src/adam/tutor-law/tutor-law.adaptive-assessment';

describe('adaptive assessment — detection', () => {
  it('A-01: detects frustration signal', () => {
    expect(detectLearnerEmotionalSignal("I don't understand this at all")).toBe(
      LearnerEmotionalSignal.FRUSTRATED,
    );
  });

  it('A-02: detects onboarding phase', () => {
    expect(detectAdaptiveAssessmentPhase('I am new here, what level am I?')).toBe(
      AdaptiveAssessmentPhase.ONBOARDING,
    );
  });

  it('A-03: infers irregular verb concept from goed', () => {
    expect(inferConceptTagsFromMessage('She goed to school yesterday')).toContain(
      'grammar.irregular_verbs',
    );
  });

  it('A-04: stealth snapshot flags hint request', () => {
    const snap = analyzeStealthAssessment({
      userMessage: 'Can you give me a hint please?',
    });
    expect(snap.hintRequest).toBe(true);
  });

  it('A-05: struggling band when give up', () => {
    const snap = analyzeStealthAssessment({ userMessage: 'forget it, give up' });
    expect(masteryBandFromStealth(snap)).toBe(LearnerMasteryBand.STRUGGLING);
  });
});

describe('adaptive assessment — turn law', () => {
  it('A-06: ethics law forbids IQ labeling', () => {
    const law = buildAdaptiveAssessmentTurnLaw({
      userMessage: 'Help me with grammar',
    });
    expect(law).toMatch(/ZPD|bukan IQ/i);
    expect(law).toMatch(/JANGAN label pelajar/i);
  });

  it('A-07: placement phase injects adaptive probe', () => {
    const law = buildAdaptiveAssessmentTurnLaw({
      userMessage:        'Start my placement test',
      recentUserMessages: ['placement diagnostic please'],
    });
    expect(law).toMatch(/Adaptive placement|satu soalan/i);
  });

  it('A-08: irregular verb error injects knowledge graph hint', () => {
    const law = buildAdaptiveAssessmentTurnLaw({
      userMessage: 'She goed to Paris last year',
    });
    expect(law).toMatch(/Irregular Verbs|NEEDS PRACTICE/i);
  });

  it('A-09: academic bundle always includes adaptive ethics', () => {
    const bundle = classifyAcademicTurnIntents({
      userMessage: 'Ali ada 12 guli',
    });
    const parts = buildAcademicIntentTurnPromptParts(bundle, {
      userMessage: 'Ali ada 12 guli',
    });
    expect(parts.join('\n')).toMatch(/PENILAIAN ADAPTIF/i);
  });

  it('A-10: frustrated student triggers simplification hint', () => {
    const law = buildAdaptiveAssessmentTurnLaw({
      userMessage:        'Too hard, I give up',
      recentUserMessages: ["I don't understand"],
    });
    expect(law).toMatch(/FRUSTRATED|permudah/i);
  });
});
