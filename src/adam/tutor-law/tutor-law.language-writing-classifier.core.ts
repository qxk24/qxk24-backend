/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Language & Writing Classifier (Rule 61 core)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Decision tree: TRAP → G_GRAMMAR → W_REVIEW → W_STRUCTURE → W_IDEA → AMBIGUOUS
 */

import {
  GRAMMAR_SIGNALS,
  IDEA_SIGNALS,
  REVIEW_SIGNALS,
  STRUCTURE_SIGNALS,
  TRAP_EXPLICIT,
  TRAP_IMPLICIT,
  TYPE_SIGNALS,
  countSignalHits,
} from './tutor-law.language-writing-signals';
import {
  FEEDBACK_ANCHOR_BM,
  FEEDBACK_ANCHOR_EN,
  buildAmbiguousProbe,
  buildIdeationProbe,
  buildScaffoldPrompt,
  buildTrapRedirect,
} from './tutor-law.language-writing.probes';
import {
  LanguageClassifierInput,
  LanguageClassifierOutput,
  LanguageIntent,
  LanguageVariant,
  WritingType,
} from './tutor-law.language-writing.types';

export function detectWritingType(norm: string, prior: WritingType | null): WritingType {
  for (const [type, signals] of Object.entries(TYPE_SIGNALS)) {
    if (signals && countSignalHits(norm, signals) >= 1) {
      return type as WritingType;
    }
  }
  return prior ?? WritingType.UNKNOWN;
}

export function detectLanguageVariant(
  rawText: string,
  profile?: LanguageClassifierInput['profile'],
): LanguageVariant {
  const hasMalay = /\b(saya|kamu|nak|tak|boleh|macam|dengan|yang|ini|itu|karangan)\b/i.test(rawText);
  const hasEnglish = /\b(i|you|the|is|are|was|were|have|has|this|that|essay|write)\b/i.test(rawText);
  if (hasMalay && hasEnglish) return LanguageVariant.MIXED;
  if (hasMalay) return LanguageVariant.BAHASA_MELAYU;
  if (profile?.language === 'malay') return LanguageVariant.BAHASA_MELAYU;
  if (hasEnglish) return LanguageVariant.ENGLISH;
  return LanguageVariant.BAHASA_MELAYU;
}

/** Rule 61 primary language/writing classifier. */
export function classifyLanguageIntent(
  input: LanguageClassifierInput,
): LanguageClassifierOutput {
  const { normText, hasDraftContent, priorWritingType, profile } = input;
  const rawText = input.rawText;
  const trace: string[] = [];
  const writingType = detectWritingType(normText, priorWritingType);
  const languageVariant = detectLanguageVariant(rawText, profile);
  trace.push(`writingType: ${writingType}, lang: ${languageVariant}`);

  const trapExplicitHits = countSignalHits(normText, TRAP_EXPLICIT);
  const trapImplicitHits = countSignalHits(normText, TRAP_IMPLICIT);
  const isTrap =
    trapExplicitHits >= 1
    || trapImplicitHits >= 2
    || (trapImplicitHits >= 1 && !hasDraftContent);

  if (isTrap) {
    trace.push(`TRAP: explicit=${trapExplicitHits}, implicit=${trapImplicitHits}, hasDraft=${hasDraftContent}`);
    return {
      intent:          LanguageIntent.TRAP,
      writingType,
      languageVariant,
      confidence:      trapExplicitHits >= 1 ? 'HIGH' : 'MEDIUM',
      redirectScript:  buildTrapRedirect(writingType, languageVariant, normText),
      ideationProbe:   null,
      scaffoldPrompt:  null,
      feedbackAnchor:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  const grammarHits = countSignalHits(normText, GRAMMAR_SIGNALS);
  if (grammarHits >= 1) {
    trace.push(`G_GRAMMAR: ${grammarHits} hit(s)`);
    return {
      intent:          LanguageIntent.G_GRAMMAR,
      writingType,
      languageVariant,
      confidence:      grammarHits >= 2 ? 'HIGH' : 'MEDIUM',
      redirectScript:  null,
      ideationProbe:   null,
      scaffoldPrompt:  null,
      feedbackAnchor:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  const reviewHits = countSignalHits(normText, REVIEW_SIGNALS);
  if (reviewHits >= 1 || hasDraftContent) {
    trace.push(`W_REVIEW: reviewHits=${reviewHits}, hasDraft=${hasDraftContent}`);
    const anchor = languageVariant === LanguageVariant.ENGLISH
      ? FEEDBACK_ANCHOR_EN
      : FEEDBACK_ANCHOR_BM;
    return {
      intent:          LanguageIntent.W_REVIEW,
      writingType,
      languageVariant,
      confidence:      hasDraftContent ? 'HIGH' : 'MEDIUM',
      redirectScript:  null,
      ideationProbe:   null,
      scaffoldPrompt:  null,
      feedbackAnchor:  anchor,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  const structureHits = countSignalHits(normText, STRUCTURE_SIGNALS);
  if (structureHits >= 1) {
    trace.push(`W_STRUCTURE: ${structureHits} hit(s)`);
    return {
      intent:          LanguageIntent.W_STRUCTURE,
      writingType,
      languageVariant,
      confidence:      structureHits >= 2 ? 'HIGH' : 'MEDIUM',
      redirectScript:  null,
      ideationProbe:   null,
      scaffoldPrompt:  buildScaffoldPrompt(writingType, languageVariant, normText, profile?.level),
      feedbackAnchor:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  const ideaHits = countSignalHits(normText, IDEA_SIGNALS);
  if (ideaHits >= 1) {
    trace.push(`W_IDEA: ${ideaHits} hit(s)`);
    return {
      intent:          LanguageIntent.W_IDEA,
      writingType,
      languageVariant,
      confidence:      ideaHits >= 2 ? 'HIGH' : 'MEDIUM',
      redirectScript:  null,
      ideationProbe:   buildIdeationProbe(writingType, languageVariant, normText, profile?.level),
      scaffoldPrompt:  null,
      feedbackAnchor:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  trace.push('AMBIGUOUS: no clear signal');
  return {
    intent:          LanguageIntent.AMBIGUOUS,
    writingType,
    languageVariant,
    confidence:      'LOW',
    redirectScript:  null,
    ideationProbe:   null,
    scaffoldPrompt:  null,
    feedbackAnchor:  null,
    probeQuestion:   buildAmbiguousProbe(languageVariant),
    _trace:          trace,
  };
}
