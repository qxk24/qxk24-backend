/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor UI Guide Loop (F3 — mini-loop)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Bounded UI Guide loop — plan → observe (read-only tools) → speak.
 * Max 4 internal tool steps before synthesis. See ADAM_TUTOR_C_UID_SPEC.md §XI
 */

import type { AdamUiPlanStep, AdamUiPlanStepStatus } from './adam-ui-plan';
import { isTutorAssessmentAnswerTurn } from './adam-tutor-transform-turn.gate';
import type { AdamTutorLearningProfile } from './tutor-law/tutor-law.learning-profile.types';
import type { AdamTutorProfile } from './tutor-law/tutor-law.types';
import {
  observeGuideMode,
  observeRecallUid,
  observeStemLink,
  observeTagSyllabus,
} from './adam-tutor-ui-guide-tools';

export const TUTOR_UI_GUIDE_LOOP_MAX_STEPS = 4;

export interface TutorUiGuideLoopInput {
  studentId:               string;
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile:                 AdamTutorLearningProfile;
  tutorProfile?:           AdamTutorProfile;
  brainRecallLoaded:       boolean;
  brainRecallStable:       boolean;
}

export interface TutorUiGuideLoopResult {
  steps:                    AdamUiPlanStep[];
  assessmentAnswerTurn:     boolean;
  crystallisationBlocked:   boolean;
}

function step(
  id: string,
  label: string,
  status: AdamUiPlanStepStatus,
): AdamUiPlanStep {
  return { id, label, status };
}

/** Deterministic F3 observe loop — no LLM planner, no write tools. */
export function runTutorUiGuideLoop(input: TutorUiGuideLoopInput): TutorUiGuideLoopResult {
  const userMessage = input.userMessage.trim();
  const recentUser = input.recentUserMessages ?? [];
  const recentAssistant = input.recentAssistantMessages ?? [];
  const assessmentAnswerTurn = isTutorAssessmentAnswerTurn(input.profile, userMessage);

  const recall = observeRecallUid(input.brainRecallLoaded, input.brainRecallStable);
  const syllabus = observeTagSyllabus(userMessage, recentUser, recentAssistant, input.tutorProfile);
  const guide = observeGuideMode(input.profile, userMessage, recentUser, recentAssistant);
  const stem = observeStemLink(userMessage, recentUser, input.tutorProfile);

  const steps: AdamUiPlanStep[] = [];

  steps.push(
    recall.loaded
      ? step(
        'recall',
        recall.stable
          ? 'UID crystallised C loaded — brain-first'
          : 'UID crystallised C loaded from Brain',
        'done',
      )
      : step('recall', 'UID memory probe — no prior episode yet', 'done'),
  );

  const tagLabel = syllabus.topicLabel
    ? `Syllabus tag — ${syllabus.topicLabel.slice(0, 64)}`
    : syllabus.conceptTags.length > 0
      ? `Concept tags — ${syllabus.conceptTags.slice(0, 3).join(', ')}`
      : 'Syllabus tag — general tutoring turn';
  steps.push(step('syllabus', tagLabel, 'done'));

  if (guide.mode === 'checkpoint-answer') {
    steps.push(step('guide', guide.label, 'active'));
  } else if (guide.mode === 'checkpoint-due') {
    steps.push(step('guide', guide.label, 'done'));
  } else {
    steps.push(step('guide', guide.label, 'done'));
  }

  steps.push(
    stem.matched
      ? step('stem', `STEM allowlist — ${stem.label}`, 'done')
      : step('stem', 'No STEM simulation needed', 'skipped'),
  );

  const capped = steps.slice(0, TUTOR_UI_GUIDE_LOOP_MAX_STEPS);

  return {
    steps:                  capped,
    assessmentAnswerTurn,
    crystallisationBlocked: assessmentAnswerTurn,
  };
}
