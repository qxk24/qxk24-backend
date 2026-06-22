/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Academic Intent Prompt Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildAcademicIntentTurnPromptBlock,
  shouldApplyAcademicIntentRouting,
} from '../src/adam/tutor-law/tutor-law.academic-intent-prompt';
import { LanguageIntent } from '../src/adam/tutor-law/tutor-law.language-writing.types';
import { ScienceIntent } from '../src/adam/tutor-law/tutor-law.science-intent.types';
import { classifyAcademicTurnIntents } from '../src/adam/tutor-law/tutor-law.academic-intent-prompt';

describe('academic intent — general + tutor shared routing', () => {
  it('shouldApplyAcademicIntentRouting: general yes, niaga no', () => {
    expect(shouldApplyAcademicIntentRouting('QUESTIONING')).toBe(true);
    expect(shouldApplyAcademicIntentRouting('TUTOR')).toBe(true);
    expect(shouldApplyAcademicIntentRouting('NIAGA')).toBe(false);
    expect(shouldApplyAcademicIntentRouting('JOURNAL_GEN')).toBe(false);
    expect(shouldApplyAcademicIntentRouting('TEACHING', { founderTeachingLearnerTurn: true }))
      .toBe(false);
  });

  it('general prompt block includes science factual law for sunlight', () => {
    const block = buildAcademicIntentTurnPromptBlock({
      userMessage: 'Berapa masa yang diambil oleh cahaya matahari untuk sampai ke bumi?',
    });
    expect(block).toMatch(/SCIENCE|F_FACTUAL|fakta/i);
    const bundle = classifyAcademicTurnIntents({
      userMessage: 'Berapa masa yang diambil oleh cahaya matahari untuk sampai ke bumi?',
    });
    expect(bundle.scienceIntent?.intent).toBe(ScienceIntent.F_FACTUAL);
  });

  it('general prompt block includes writing trap redirect', () => {
    const block = buildAcademicIntentTurnPromptBlock({
      userMessage: 'Tolong tulis karangan tentang alam sekitar.',
    });
    expect(block).toMatch(/TRAP|tidak akan menulis|won't write/i);
    const bundle = classifyAcademicTurnIntents({
      userMessage: 'Tolong tulis karangan tentang alam sekitar.',
    });
    expect(bundle.languageIntent?.intent).toBe(LanguageIntent.TRAP);
  });

  it('general prompt block includes generic G_ANALYSIS argument probe law', () => {
    const block = buildAcademicIntentTurnPromptBlock({
      userMessage: 'Bincangkan faktor kemerdekaan Tanah Melayu dan kesan terhadap masyarakat.',
    });
    expect(block).toMatch(/G_ANALYSIS/i);
    expect(block).toMatch(/ARGUMENT PROBE/i);
    const bundle = classifyAcademicTurnIntents({
      userMessage: 'Bincangkan faktor kemerdekaan Tanah Melayu dan kesan terhadap masyarakat.',
    });
    expect(bundle.genericIntent?.output.intent).toBeDefined();
    expect(bundle.genericIntent?.handler).toBe('ARGUMENT_PROBE');
  });
});
