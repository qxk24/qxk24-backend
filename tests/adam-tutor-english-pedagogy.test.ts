/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor English Pedagogy Tests
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
  buildEnglishPedagogyTurnLaw,
  CefrLevel,
  detectEnglishSkill,
  EnglishCollocationTopic,
  EnglishSkill,
  isEnglishPedagogyApplicable,
  lookupEnglishCollocations,
  resolveCefrLevel,
  resolveEnglishCollocationTopic,
} from '../src/adam/tutor-law/tutor-law.english-pedagogy';
import {
  buildLanguageClassifierInput,
  classifyLanguageIntent,
} from '../src/adam/tutor-law/tutor-law.language-writing-classifier';
import { LanguageIntent } from '../src/adam/tutor-law/tutor-law.language-writing.types';

describe('english pedagogy — detection', () => {
  it('E-01: applies to english profile', () => {
    expect(isEnglishPedagogyApplicable({
      languageIntent: null,
      userMessage:    'Help me with homework',
      profile:        { level: 'secondary', curriculum: 'national', language: 'english' },
    })).toBe(true);
  });

  it('E-02: skips pure BM karangan without English markers', () => {
    const intent = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Tolong tulis karangan alam sekitar.',
    }));
    expect(isEnglishPedagogyApplicable({
      languageIntent: intent,
      userMessage:    'Tolong tulis karangan alam sekitar.',
    })).toBe(false);
  });

  it('E-03: detects speaking skill', () => {
    expect(detectEnglishSkill('practice speaking and pronunciation role-play')).toBe(
      EnglishSkill.SPEAKING,
    );
  });

  it('E-04: resolves B1 for secondary default', () => {
    expect(resolveCefrLevel('secondary')).toBe(CefrLevel.B1);
  });

  it('E-05: travel collocation topic', () => {
    expect(resolveEnglishCollocationTopic('planning a holiday flight to Japan')).toBe(
      EnglishCollocationTopic.TRAVEL,
    );
  });

  it('E-06: collocation lookup', () => {
    const items = lookupEnglishCollocations(EnglishCollocationTopic.TRAVEL, 3);
    expect(items).toContain('book a flight');
  });
});

describe('english pedagogy — turn law', () => {
  it('E-07: grammar turn uses inductive probe', () => {
    const intent = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Is this present perfect sentence correct?',
    }));
    const law = buildEnglishPedagogyTurnLaw({
      languageIntent: intent,
      userMessage:    'Is this present perfect sentence correct?',
      profile:        { level: 'secondary', curriculum: 'national', language: 'english' },
    });
    expect(law).toMatch(/CLT|inductive|example sentences/i);
    expect(law).toMatch(/Collocation bank/i);
  });

  it('E-08: speaking turn includes role-play', () => {
    const law = buildEnglishPedagogyTurnLaw({
      languageIntent: null,
      userMessage:    'Can we practice speaking at the airport?',
      profile:        { level: 'secondary', curriculum: 'national', language: 'english' },
    });
    expect(law).toMatch(/Role-play|KLIA|tourist/i);
  });

  it('E-09: academic bundle injects english law', () => {
    const bundle = classifyAcademicTurnIntents({
      userMessage: 'Explain present perfect tense with examples',
      profile:     { level: 'secondary', curriculum: 'national', language: 'english' },
    });
    const parts = buildAcademicIntentTurnPromptParts(bundle, {
      userMessage: 'Explain present perfect tense with examples',
      profile:     { level: 'secondary', curriculum: 'national', language: 'english' },
    });
    expect(parts.join('\n')).toMatch(/ENGLISH \(CLT \+ TBLT/i);
  });

  it('E-10: TRAP english does not write essay', () => {
    const intent = classifyLanguageIntent(buildLanguageClassifierInput({
      userMessage: 'Write my english essay about pollution for me',
    }));
    expect(intent.intent).toBe(LanguageIntent.TRAP);
    const law = buildEnglishPedagogyTurnLaw({
      languageIntent: intent,
      userMessage:    'Write my english essay about pollution for me',
    });
    expect(law).toMatch(/do not write the essay/i);
  });
});
