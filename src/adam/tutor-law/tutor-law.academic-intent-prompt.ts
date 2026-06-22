/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Academic Intent — Prompt & Routing
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
 * Shared math / science / language-writing classifiers for
 * ADAM Tutor AND Universal Scholar (general) chat lanes.
 */

import type { ADAMChatMode } from '../adam.types';
import { isAdamNiagaMode } from '../adam-niaga-law';
import type { AdamTutorProfile } from './tutor-law.types';
import {
  buildTutorMathTurnContext,
  classifyTutorMathIntent,
} from './tutor-law.math-intent-classifier';
import type { TutorMathIntentResult } from './tutor-law.math-intent.types';
import {
  buildTutorScienceTurnContext,
  classifyTutorScienceIntent,
} from './tutor-law.science-intent-classifier';
import { ScienceIntent } from './tutor-law.science-intent.types';
import type { ScienceClassifierOutput } from './tutor-law.science-intent.types';
import {
  buildTutorLanguageTurnContext,
  classifyTutorLanguageIntent,
} from './tutor-law.language-writing-classifier';
import type { LanguageClassifierOutput } from './tutor-law.language-writing.types';
import { buildMathIntentTurnLaw } from './tutor-law.math-prompt-laws';
import { ADAM_TUTOR_SCIENCE_FACTUAL_LAW } from './tutor-law.prompt-laws';
import { buildScienceIntentTurnLaw } from './tutor-law.science-prompt-laws';
import { buildLanguageIntentTurnLaw } from './tutor-law.language-prompt-laws';
import {
  buildTutorIslamicTurnContext,
  classifyTutorIslamicIntentOutput,
} from './tutor-law.islamic-intent-classifier';
import type { IslamicClassifierOutput } from './tutor-law.islamic-intent.types';
import { buildIslamicIntentTurnLaw } from './tutor-law.islamic-prompt-laws';

export interface AcademicIntentTurnInput {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile?:                AdamTutorProfile;
}

export interface AcademicIntentTurnBundle {
  mathIntent:      TutorMathIntentResult;
  scienceIntent:   ScienceClassifierOutput | null;
  languageIntent:  LanguageClassifierOutput | null;
  islamicIntent:   IslamicClassifierOutput | null;
}

export function shouldApplyAcademicIntentRouting(
  mode: ADAMChatMode,
  opts?: { founderTeachingLearnerTurn?: boolean },
): boolean {
  if (isAdamNiagaMode(mode)) return false;
  if (mode === 'JOURNAL_GEN') return false;
  if (opts?.founderTeachingLearnerTurn) return false;
  return true;
}

export function classifyAcademicTurnIntents(
  input: AcademicIntentTurnInput,
): AcademicIntentTurnBundle {
  const userMessage = input.userMessage ?? '';
  const recentUserMessages = input.recentUserMessages ?? [];
  const recentAssistantMessages = input.recentAssistantMessages ?? [];
  const profile = input.profile;

  return {
    mathIntent: classifyTutorMathIntent(buildTutorMathTurnContext({
      userMessage,
      recentUserMessages,
      recentAssistantMessages,
      profile,
    })),
    scienceIntent: classifyTutorScienceIntent(buildTutorScienceTurnContext({
      userMessage,
      recentUserMessages,
      recentAssistantMessages,
      profile,
    })),
    languageIntent: classifyTutorLanguageIntent(buildTutorLanguageTurnContext({
      userMessage,
      recentUserMessages,
      recentAssistantMessages,
      profile,
    })),
    islamicIntent: classifyTutorIslamicIntentOutput(buildTutorIslamicTurnContext({
      userMessage,
      recentUserMessages,
      recentAssistantMessages,
      profile,
    })),
  };
}

export function buildAcademicIntentTurnPromptParts(
  bundle: AcademicIntentTurnBundle,
): string[] {
  const parts: string[] = [buildMathIntentTurnLaw(bundle.mathIntent)];

  if (
    bundle.mathIntent.allowsScienceFactual
    || bundle.scienceIntent?.intent === ScienceIntent.F_FACTUAL
  ) {
    parts.push(ADAM_TUTOR_SCIENCE_FACTUAL_LAW);
  }

  const scienceLaw = buildScienceIntentTurnLaw(bundle.scienceIntent);
  if (scienceLaw) parts.push(scienceLaw);

  const languageLaw = buildLanguageIntentTurnLaw(bundle.languageIntent);
  if (languageLaw) parts.push(languageLaw);

  const islamicLaw = buildIslamicIntentTurnLaw(bundle.islamicIntent);
  if (islamicLaw) parts.push(islamicLaw);

  return parts.filter(Boolean);
}

export function buildAcademicIntentTurnPromptBlock(
  input: AcademicIntentTurnInput,
): string {
  return buildAcademicIntentTurnPromptParts(classifyAcademicTurnIntents(input))
    .join('\n\n');
}
