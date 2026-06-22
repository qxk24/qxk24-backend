/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Builder — Tutor Lane
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
 */

import {
  ADAM_TUTOR_GUARDRAILS,
  ADAM_TUTOR_IDENTITY,
  ADAM_TUTOR_LAW,
  ADAM_TUTOR_OFF_TOPIC_TURN,
  classifyAcademicTurnIntents,
  buildAcademicIntentTurnPromptParts,
  ADAM_TUTOR_MAIN_SYSTEM_LAW_V1,
  ADAM_TUTOR_FIVE_RESPONSE_MODES_LAW,
  ADAM_TUTOR_MATH_MODULE_LAW,
  ADAM_TUTOR_SESSION_CLOSURE_WITH_CHECK_LAW,
  ADAM_TUTOR_PERCENTAGE_WORD_PROBLEM_LAW,
  ADAM_TUTOR_FRACTION_REMAINDER_LAW,
  ADAM_TUTOR_PLACE_VALUE_COLUMN_LAW,
  ADAM_TUTOR_CARRY_PLACEMENT_LAW,
  ADAM_TUTOR_ARITHMETIC_MULTI_OP_LAW,
  ADAM_TUTOR_ARITHMETIC_ADAPTIVE_LAW,
  ADAM_TUTOR_ARITHMETIC_COMPACT_LAW,
  ADAM_TUTOR_ARITHMETIC_FLUENT_LAW,
  ADAM_TUTOR_STUDENT_CORRECTION_LAW,
  ADAM_TUTOR_FULL_WORKING_LAW,
  ADAM_TUTOR_STUCK_ESCALATION_LAW,
  ADAM_TUTOR_QUADRATIC_FACTORING_LAW,
  ADAM_TUTOR_FACTOR_PAIR_MICRO_LAW,
  tutorThreadIsQuantityWordProblem,
  tutorThreadIsMultiStepFractionWordProblem,
  tutorTurnNeedsFullWorkingLaw,
  tutorTurnNeedsAlgebraWorkedExampleLaw,
  tutorTurnNeedsFactorPairMicroLaw,
  tutorThreadIsPlaceValueAddition,
  tutorStudentFlagsTeacherMathError,
  tutorStudentFlagsTeachingLoopError,
  tutorInferArithmeticProficiency,
  tutorThreadIsMultiStepArithmetic,
  resolveActiveAddThenSubtractProblem,
  buildAdamTutorTeacherIntroLaw,
  buildAdamTutorProfileBlock,
  buildTutorStudentAddressLaw,
  isAdamTutorOffTopicMessage,
  buildTutorLevelScopeRefusalLaw,
  isQuestionBeyondStudentLevel,
} from './adam-tutor-law';
import { ADAM_PROSE_DASH_LAW } from './adam-prose-sanitize';
import { ADAM_BAHASA_MELAYU_LAW } from './adam-language-prompts';
import {
  ADAM_MEMORY_HONESTY_RULE_STUDENT,
  ADAM_MEMORY_HONESTY_WEB_SEARCH_OVERRIDE,
  webSearchPromptNeedsMemoryOverride,
} from './adam-users-prompts';
import type { AdamChatSystemPromptParams } from './adam-prompt-builder.types';

export function buildAdamTutorSystemPrompt(params: AdamChatSystemPromptParams): string {
  const academic = classifyAcademicTurnIntents({
    userMessage:             params.userMessage ?? '',
    recentUserMessages:      params.recentUserMessages ?? [],
    recentAssistantMessages: params.recentAssistantMessages ?? [],
    profile:                 params.tutorProfile,
  });
  const mathIntent = academic.mathIntent;

  const parts: string[] = [
    ADAM_TUTOR_MAIN_SYSTEM_LAW_V1,
    ADAM_TUTOR_FIVE_RESPONSE_MODES_LAW,
    ADAM_TUTOR_IDENTITY,
    ADAM_TUTOR_MATH_MODULE_LAW,
    buildAdamTutorTeacherIntroLaw(
      params.tutorProfile,
      params.userMessage ?? '',
      params.recentAssistantMessages ?? [],
    ),
    ADAM_TUTOR_GUARDRAILS,
    ADAM_PROSE_DASH_LAW,
    ADAM_BAHASA_MELAYU_LAW,
    buildAdamTutorProfileBlock(params.tutorProfile),
    ADAM_TUTOR_LAW,
  ];

  if (params.userMessage?.trim() && isAdamTutorOffTopicMessage(params.userMessage)) {
    parts.push(ADAM_TUTOR_OFF_TOPIC_TURN);
  }

  if (
    params.tutorProfile
    && params.userMessage?.trim()
    && isQuestionBeyondStudentLevel(params.userMessage, params.tutorProfile)
  ) {
    parts.push(buildTutorLevelScopeRefusalLaw(params.tutorProfile));
  }

  parts.push(...buildAcademicIntentTurnPromptParts(academic));

  const tags = new Set(mathIntent.topicGuardTags);

  if (
    tags.has('place_value')
    || tags.has('multi_op')
    || tutorThreadIsPlaceValueAddition(
      params.userMessage ?? '',
      params.recentUserMessages ?? [],
      params.recentAssistantMessages ?? [],
    )
    || tutorThreadIsMultiStepArithmetic(
      params.userMessage ?? '',
      params.recentUserMessages ?? [],
      params.recentAssistantMessages ?? [],
    )
  ) {
    const tier = tutorInferArithmeticProficiency(
      params.userMessage ?? '',
      ...(params.recentUserMessages ?? []),
    );
    parts.push(ADAM_TUTOR_ARITHMETIC_ADAPTIVE_LAW);
    parts.push(`TAHAP PELAJAR TURN INI: **${tier.toUpperCase()}** — ikut ADAM_TUTOR_ARITHMETIC_ADAPTIVE_LAW.`);

    if (tier === 'fluent') {
      parts.push(ADAM_TUTOR_ARITHMETIC_FLUENT_LAW);
    } else if (tier === 'compact') {
      parts.push(ADAM_TUTOR_PLACE_VALUE_COLUMN_LAW);
      parts.push(ADAM_TUTOR_ARITHMETIC_COMPACT_LAW);
    } else {
      parts.push(ADAM_TUTOR_PLACE_VALUE_COLUMN_LAW);
      parts.push(ADAM_TUTOR_CARRY_PLACEMENT_LAW);
    }

    if (
      tags.has('multi_op')
      || resolveActiveAddThenSubtractProblem(
        params.userMessage ?? '',
        params.recentUserMessages ?? [],
        params.recentAssistantMessages ?? [],
      )
    ) {
      parts.push(ADAM_TUTOR_ARITHMETIC_MULTI_OP_LAW);
    }
  }

  if (
    tutorStudentFlagsTeacherMathError(params.userMessage ?? '')
    || tutorStudentFlagsTeachingLoopError(params.userMessage ?? '')
  ) {
    parts.push(ADAM_TUTOR_STUDENT_CORRECTION_LAW);
  }

  if (tags.has('percentage') || tutorThreadIsQuantityWordProblem(
    params.userMessage ?? '',
    params.recentUserMessages ?? [],
    params.recentAssistantMessages ?? [],
  )) {
    parts.push(ADAM_TUTOR_PERCENTAGE_WORD_PROBLEM_LAW);
  }

  if (tags.has('fraction') || tutorThreadIsMultiStepFractionWordProblem(
    params.userMessage ?? '',
    params.recentUserMessages ?? [],
    params.recentAssistantMessages ?? [],
  )) {
    parts.push(ADAM_TUTOR_FRACTION_REMAINDER_LAW);
  }

  if (
    tutorTurnNeedsFullWorkingLaw(
      params.userMessage ?? '',
      params.recentUserMessages ?? [],
      params.recentAssistantMessages ?? [],
    )
  ) {
    parts.push(ADAM_TUTOR_FULL_WORKING_LAW);
  }

  if (mathIntent.warrantsAutoClosure) {
    parts.push(ADAM_TUTOR_SESSION_CLOSURE_WITH_CHECK_LAW);
  }

  if (
    tutorTurnNeedsAlgebraWorkedExampleLaw(
      params.userMessage ?? '',
      params.recentUserMessages ?? [],
      params.recentAssistantMessages ?? [],
    )
  ) {
    parts.push(ADAM_TUTOR_STUCK_ESCALATION_LAW);
    parts.push(ADAM_TUTOR_QUADRATIC_FACTORING_LAW);
  } else if (
    tutorTurnNeedsFactorPairMicroLaw(
      params.userMessage ?? '',
      params.recentUserMessages ?? [],
      params.recentAssistantMessages ?? [],
    )
  ) {
    parts.push(ADAM_TUTOR_FACTOR_PAIR_MICRO_LAW);
  }

  if (params.webSearchPrompt) parts.push(params.webSearchPrompt);
  parts.push(buildTutorStudentAddressLaw(params.participantName));
  parts.push(ADAM_MEMORY_HONESTY_RULE_STUDENT);
  if (webSearchPromptNeedsMemoryOverride(params.webSearchPrompt)) {
    parts.push(ADAM_MEMORY_HONESTY_WEB_SEARCH_OVERRIDE);
  }

  return parts.filter(Boolean).join('\n\n');
}
