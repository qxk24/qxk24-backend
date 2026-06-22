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
import {
  buildTutorGenericTurnContext,
  classifyTutorGenericIntentFull,
} from './tutor-law.generic-intent-classifier';
import type { GenericIntentResult } from './tutor-law.generic-intent.types';
import { buildGenericIntentTurnLaw } from './tutor-law.generic-prompt-laws';
import {
  buildTutorCodeTurnContext,
  classifyTutorCodeIntentFull,
} from './tutor-law.code-intent-classifier';
import type { CodeIntentResult } from './tutor-law.ce-mode.types';
import { buildCEIntentTurnLaws } from './tutor-law.ce-prompt-laws';
import {
  classifyPedagogyV2Turn,
} from './tutor-law.pedagogy-v2-classifier';
import { buildPedagogyV2TurnLaw } from './tutor-law.pedagogy-v2-prompt-laws';
import type { PedagogyV2TurnResult } from './tutor-law.pedagogy-v2.types';

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
  genericIntent:   GenericIntentResult | null;
  codeIntent:      CodeIntentResult | null;
  pedagogyV2:      PedagogyV2TurnResult | null;
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

  const bundle: AcademicIntentTurnBundle = {
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
    genericIntent: classifyTutorGenericIntentFull(buildTutorGenericTurnContext({
      userMessage,
      recentUserMessages,
      recentAssistantMessages,
      profile,
    })),
    codeIntent: classifyTutorCodeIntentFull(buildTutorCodeTurnContext({
      userMessage,
      recentUserMessages,
      recentAssistantMessages,
      profile,
    })),
    pedagogyV2: null,
  };

  bundle.pedagogyV2 = classifyPedagogyV2Turn({
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
    profile,
    mathIntent:    bundle.mathIntent,
    genericIntent: bundle.genericIntent,
  });

  return bundle;
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

  const genericLaw = buildGenericIntentTurnLaw(
    bundle.genericIntent?.output ?? null,
    bundle.genericIntent?.handler,
  );
  if (genericLaw) parts.push(genericLaw);

  const codeLaw = buildCEIntentTurnLaws(bundle.codeIntent);
  if (codeLaw) parts.push(codeLaw);

  const pedagogyLaw = buildPedagogyV2TurnLaw(bundle.pedagogyV2);
  if (pedagogyLaw) parts.push(pedagogyLaw);

  return parts.filter(Boolean);
}

export function buildAcademicIntentTurnPromptBlock(
  input: AcademicIntentTurnInput,
): string {
  return buildAcademicIntentTurnPromptParts(classifyAcademicTurnIntents(input))
    .join('\n\n');
}
