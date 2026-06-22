/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Language & Writing Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildLanguageClassifierInput,
  classifyLanguageIntent,
  isTutorLanguageWritingDomainMessage,
} from '../src/adam/tutor-law/tutor-law.language-writing-classifier';
import {
  LanguageIntent,
  WritingType,
} from '../src/adam/tutor-law/tutor-law.language-writing.types';

describe('tutor language & writing intent classifier', () => {
  it('V-LW-01: TRAP explicit — tolong tulis karangan', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Tolong tulis karangan tentang alam sekitar.',
    }));
    expect(out.intent).toBe(LanguageIntent.TRAP);
    expect(out.writingType).toBe(WritingType.KARANGAN);
    expect(out.redirectScript).toBeTruthy();
  });

  it('V-LW-02: W_IDEA — tak tahu nak tulis apa', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Saya tak tahu nak tulis apa untuk karangan ni.',
    }));
    expect(out.intent).toBe(LanguageIntent.W_IDEA);
    expect(out.ideationProbe).toBeTruthy();
  });

  it('V-LW-03: W_STRUCTURE — susun karangan', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Macam mana nak susun karangan saya ni?',
    }));
    expect(out.intent).toBe(LanguageIntent.W_STRUCTURE);
    expect(out.scaffoldPrompt).toBeTruthy();
  });

  it('V-LW-04: W_REVIEW — semak karangan', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Boleh semak karangan saya?',
    }));
    expect(out.intent).toBe(LanguageIntent.W_REVIEW);
    expect(out.feedbackAnchor).toBeTruthy();
  });

  it('V-LW-05: G_GRAMMAR — ayat betul ke', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Ayat ni betul ke dari segi tatabahasa?',
    }));
    expect(out.intent).toBe(LanguageIntent.G_GRAMMAR);
  });

  it('V-LW-06: TRAP wins over review-like wording', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Tolong tulis karangan saya dan semak sekali.',
    }));
    expect(out.intent).toBe(LanguageIntent.TRAP);
  });

  it('V-LW-07: math exercise is not language writing domain', () => {
    const msg = 'Ali ada 2,385 biji guli. Dia beli lagi 1,427.';
    expect(isTutorLanguageWritingDomainMessage(msg)).toBe(false);
  });

  it('V-LW-08: pasted draft routes to W_REVIEW', () => {
    const draft =
      'Pengenalan: Alam sekitar sangat penting untuk kehidupan manusia. '
      + 'Isi 1: Pencemaran air merosakkan ekosistem sungai. '
      + 'Isi 2: Kitar semula mengurangkan sampah. '
      + 'Kesimpulan: Kita mesti menjaga alam sekitar demi generasi akan datang.';
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: draft,
    }));
    expect(out.intent).toBe(LanguageIntent.W_REVIEW);
    expect(out.confidence).toBe('HIGH');
  });
});
