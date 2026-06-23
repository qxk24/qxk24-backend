/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Karangan Pedagogy Tests
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
  buildKaranganPedagogyTurnLaw,
  detectKaranganGenre,
  KaranganExamTier,
  KaranganGenre,
  KaranganVocabTopic,
  lookupKaranganVocab,
  resolveKaranganExamTier,
  resolveKaranganVocabTopic,
} from '../src/adam/tutor-law/tutor-law.karangan-pedagogy';
import {
  buildLanguageClassifierInput,
  classifyLanguageIntent,
} from '../src/adam/tutor-law/tutor-law.language-writing-classifier';
import {
  LanguageIntent,
  WritingType,
} from '../src/adam/tutor-law/tutor-law.language-writing.types';

describe('karangan pedagogy — genre & exam tier', () => {
  it('K-01: detects naratif genre', () => {
    expect(detectKaranganGenre('karangan cerita pengalaman tidak dapat dilupakan')).toBe(
      KaranganGenre.NARATIF,
    );
  });

  it('K-02: detects fakta/isu genre', () => {
    expect(detectKaranganGenre('kepentingan amalan kitar semula')).toBe(KaranganGenre.FAKTA);
  });

  it('K-03: PT3 from message markers', () => {
    expect(resolveKaranganExamTier(undefined, 'latihan karangan pt3 tingkatan 2')).toBe(
      KaranganExamTier.PT3,
    );
  });

  it('K-04: UPSR from primary profile', () => {
    expect(resolveKaranganExamTier('primary')).toBe(KaranganExamTier.UPSR);
  });

  it('K-05: SPM from secondary profile default', () => {
    expect(resolveKaranganExamTier('secondary')).toBe(KaranganExamTier.SPM);
  });
});

describe('karangan pedagogy — vocabulary bank', () => {
  it('K-V01: resolves alam sekitar topic', () => {
    expect(resolveKaranganVocabTopic('karangan kepentingan kitar semula alam sekitar')).toBe(
      KaranganVocabTopic.ALAM_SEKITAR,
    );
  });

  it('K-V02: resolves pendidikan topic', () => {
    expect(resolveKaranganVocabTopic('kepentingan teknologi dalam pendidikan')).toBe(
      KaranganVocabTopic.PENDIDIKAN,
    );
  });

  it('K-V03: resolves kesihatan topic', () => {
    expect(resolveKaranganVocabTopic('amalan hidup sihat dan kesihatan mental')).toBe(
      KaranganVocabTopic.KESIHATAN,
    );
  });

  it('K-V04: lookup returns topic words capped', () => {
    const words = lookupKaranganVocab(KaranganVocabTopic.ALAM_SEKITAR, 5);
    expect(words.length).toBe(5);
    expect(words).toContain('pemuliharaan');
    expect(words).toContain('lestari');
  });

  it('K-V05: vocab hint injected in turn law', () => {
    const intent = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Macam mana nak susun karangan tentang pencemaran alam sekitar?',
    }));
    const law = buildKaranganPedagogyTurnLaw({
      languageIntent: intent,
      userMessage:    'Macam mana nak susun karangan tentang pencemaran alam sekitar?',
    });
    expect(law).toMatch(/Kosa Kata Power \(Alam Sekitar\)/);
    expect(law).toMatch(/pemuliharaan|ekosistem/i);
  });
});

describe('karangan pedagogy — turn law & probes', () => {
  it('K-06: W_IDEA karangan includes 5W1H brainstorm', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Saya tak tahu nak tulis apa untuk karangan kepentingan sukan.',
    }));
    expect(out.intent).toBe(LanguageIntent.W_IDEA);
    expect(out.ideationProbe).toMatch(/5W1H|cuci otak/i);
  });

  it('K-07: W_STRUCTURE karangan includes PIE scaffold', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Macam mana nak susun karangan tentang alam sekitar?',
    }));
    expect(out.intent).toBe(LanguageIntent.W_STRUCTURE);
    expect(out.scaffoldPrompt).toMatch(/PIE|Point/i);
  });

  it('K-08: W_REVIEW karangan turn law includes SPM rubric', () => {
    const intent = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Semak karangan saya tentang kitar semula.',
    }));
    const law = buildKaranganPedagogyTurnLaw({
      languageIntent: intent,
      userMessage:    'Semak karangan saya tentang kitar semula.',
      profile:        { level: 'secondary', curriculum: 'national' },
    });
    expect(law).toMatch(/5F|PIE|MARKAH|rubrik/i);
    expect(law).toMatch(/Isi 30%/);
  });

  it('K-09: TRAP karangan redirect uses 5W1H not full essay', () => {
    const out = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Tolong tulis karangan naratif pengalaman saya.',
    }));
    expect(out.intent).toBe(LanguageIntent.TRAP);
    expect(out.redirectScript).toMatch(/cuci otak|tiga perkara|5W1H/i);
    expect(out.redirectScript).not.toMatch(/karangan penuh/i);
  });

  it('K-10: academic prompt bundle injects karangan law for karangan turns', () => {
    const bundle = classifyAcademicTurnIntents({
      userMessage: 'Macam mana nak susun karangan fakta isu kitar semula untuk spm?',
      profile:     { level: 'secondary', curriculum: 'national' },
    });
    expect(bundle.languageIntent?.writingType).toBe(WritingType.KARANGAN);
    const parts = buildAcademicIntentTurnPromptParts(bundle, {
      userMessage: 'Macam mana nak susun karangan fakta isu kitar semula untuk spm?',
      profile:     { level: 'secondary', curriculum: 'national' },
    });
    const blob = parts.join('\n');
    expect(blob).toMatch(/KARANGAN BM|5F|PEEL/i);
  });
});
