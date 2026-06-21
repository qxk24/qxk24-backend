/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Intent Types
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

import type { AdamTutorProfile } from './tutor-law.types';

export type TutorMathIntentMode =
  | 'concept'
  | 'procedural'
  | 'verification'
  | 'teach_me'
  | 'exam_block'
  | 'non_math';

export type TutorMathQueryShape =
  | 'science_factual'
  | 'computation'
  | 'conceptual'
  | 'mixed';

export type TutorMathTopic =
  | 'arithmetic_place_value'
  | 'arithmetic_multi_op'
  | 'percentage_word'
  | 'fraction_remainder'
  | 'algebra_linear'
  | 'algebra_quadratic'
  | 'general_math'
  | 'none';

export type TutorMathReleaseLayer = 1 | 2 | 3 | 4;

export interface TutorMathSessionState {
  activeMode:         TutorMathIntentMode;
  conceptUnderstood:  boolean;
  workingShown:       boolean;
  diagnosticAnswered: boolean;
  stuckCount:         number;
  lockedTopic:        TutorMathTopic;
  releaseLayer:       TutorMathReleaseLayer;
  closureDelivered:   boolean;
}

export interface TutorMathTurnContext {
  userMessage:             string;
  recentUserMessages:      string[];
  recentAssistantMessages: string[];
  profile?:                AdamTutorProfile;
  sessionState?:           Partial<TutorMathSessionState>;
}

export interface TutorMathIntentResult {
  mode:                    TutorMathIntentMode;
  queryShape:              TutorMathQueryShape;
  topic:                   TutorMathTopic;
  releaseLayer:            TutorMathReleaseLayer;
  warrantsAutoClosure:     boolean;
  requiresWorkingFirst:    boolean;
  allowsStuckEscalation:   boolean;
  allowsScienceFactual:    boolean;
  closureIncludesCheckQ:   boolean;
  promptLawTags:           string[];
  topicGuardTags:          string[];
  decisionTrace:           string[];
  nextSessionState:        TutorMathSessionState;
}
