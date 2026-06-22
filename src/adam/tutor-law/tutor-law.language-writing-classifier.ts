/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Language & Writing Intent Classifier
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
 * Covers BM, BI, Komsas, Sastera, Sejarah writing tasks.
 * Rule 61 core in language-writing-classifier.core.ts.
 */

export type {
  LanguageClassifierInput,
  LanguageClassifierOutput,
  LanguageSessionState,
  LanguageTurnContext,
} from './tutor-law.language-writing.types';

export {
  LanguageIntent,
  WritingType,
  LanguageVariant,
} from './tutor-law.language-writing.types';

export {
  classifyLanguageIntent,
  detectLanguageVariant,
  detectWritingType,
} from './tutor-law.language-writing-classifier.core';

import {
  DRAFT_STRUCTURE_MARKERS,
  GRAMMAR_SIGNALS,
  IDEA_SIGNALS,
  LANGUAGE_DOMAIN_MARKERS,
  REVIEW_SIGNALS,
  STRUCTURE_SIGNALS,
  TRAP_EXPLICIT,
  TRAP_IMPLICIT,
  countSignalHits,
} from './tutor-law.language-writing-signals';
import { classifyLanguageIntent, detectWritingType } from './tutor-law.language-writing-classifier.core';
import type {
  LanguageClassifierInput,
  LanguageClassifierOutput,
  LanguageSessionState,
  LanguageTurnContext,
} from './tutor-law.language-writing.types';
import { LanguageIntent, WritingType } from './tutor-law.language-writing.types';

const DRAFT_MIN_WORDS = 30;

function estimateDraftWordCount(raw: string): number {
  return raw.trim().split(/\s+/).filter(Boolean).length;
}

function detectHasDraftContent(raw: string, normText: string): boolean {
  const wordCount = estimateDraftWordCount(raw);
  const structureHits = countSignalHits(normText, DRAFT_STRUCTURE_MARKERS);
  if (wordCount >= 25 && structureHits >= 2) return true;
  if (wordCount < DRAFT_MIN_WORDS) return false;
  if (countSignalHits(normText, TRAP_EXPLICIT) >= 1 && wordCount < 80) return false;
  const sentenceEnds = (raw.match(/[.!?]/g) ?? []).length;
  return sentenceEnds >= 2 || wordCount >= 80 || structureHits >= 1;
}

export function isTutorLanguageWritingDomainMessage(
  message: string,
  recentUserMessages: string[] = [],
): boolean {
  const blob = [message, ...recentUserMessages].join('\n').toLowerCase().trim();
  if (!blob || blob.length < 6) return false;

  if (detectWritingType(blob, null) !== WritingType.UNKNOWN) return true;

  const intentSignals = [
    ...TRAP_EXPLICIT,
    ...TRAP_IMPLICIT,
    ...IDEA_SIGNALS,
    ...STRUCTURE_SIGNALS,
    ...REVIEW_SIGNALS,
    ...GRAMMAR_SIGNALS,
  ];
  if (countSignalHits(blob, intentSignals) >= 1) return true;

  return countSignalHits(blob, LANGUAGE_DOMAIN_MARKERS) >= 1;
}

export function buildLanguageClassifierInput(input: {
  userMessage:             string;
  recentUserMessages?:     string[];
  profile?:                LanguageClassifierInput['profile'];
  sessionState?:           Partial<LanguageSessionState>;
  stuckCount?:             number;
}): LanguageClassifierInput {
  const rawText = input.userMessage ?? '';
  const normText = rawText.trim().toLowerCase();
  const draftWordCount = estimateDraftWordCount(rawText);

  return {
    rawText,
    normText,
    hasDraftContent:  detectHasDraftContent(rawText, normText),
    draftWordCount,
    stuckCount:       input.stuckCount ?? 0,
    priorWritingType: input.sessionState?.lockedWritingType ?? null,
    profile:          input.profile,
  };
}

export function buildTutorLanguageTurnContext(input: {
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  profile?:                 LanguageTurnContext['profile'];
  sessionState?:            Partial<LanguageSessionState>;
  stuckCount?:              number;
}): LanguageTurnContext {
  return {
    userMessage:             input.userMessage ?? '',
    recentUserMessages:      input.recentUserMessages ?? [],
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
    sessionState:            input.sessionState,
    stuckCount:              input.stuckCount,
  };
}

export function classifyTutorLanguageIntent(
  ctx: LanguageTurnContext,
): LanguageClassifierOutput | null {
  if (!isTutorLanguageWritingDomainMessage(ctx.userMessage, ctx.recentUserMessages)) {
    return null;
  }
  return classifyLanguageIntent(buildLanguageClassifierInput(ctx));
}

export function mergeLanguageSessionState(
  prior: Partial<LanguageSessionState> | undefined,
  output: LanguageClassifierOutput,
): LanguageSessionState {
  const locked = output.writingType !== WritingType.UNKNOWN
    ? output.writingType
    : (prior?.lockedWritingType ?? null);
  return { lockedWritingType: locked };
}

export function languageIntentSkipsMathPedagogy(_intent: LanguageClassifierOutput): boolean {
  return true;
}

export function languageIntentSkipsZeroAnswer(intent: LanguageClassifierOutput): boolean {
  return (
    intent.intent === LanguageIntent.TRAP
    || intent.intent === LanguageIntent.W_REVIEW
    || intent.intent === LanguageIntent.W_STRUCTURE
    || intent.intent === LanguageIntent.W_IDEA
    || intent.intent === LanguageIntent.G_GRAMMAR
    || intent.intent === LanguageIntent.AMBIGUOUS
  );
}
