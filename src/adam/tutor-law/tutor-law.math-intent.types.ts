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

/** Rule 61 primary math intent — upstream classifier output. */
export enum MathIntent {
  A_CONCEPT       = 'A_CONCEPT',
  B_PROCEDURE     = 'B_PROCEDURE',
  C_VERIFICATION  = 'C_VERIFICATION',
  AMBIGUOUS       = 'AMBIGUOUS',
  SCIENCE_FACTUAL = 'SCIENCE_FACTUAL',
  EXAM_DIRECT     = 'EXAM_DIRECT',
}

/** Rule 61 topic keys — consumed by guards and session state. */
export enum MathTopic {
  ARITHMETIC_BASIC    = 'ARITHMETIC_BASIC',
  ARITHMETIC_FRACTION = 'ARITHMETIC_FRACTION',
  ARITHMETIC_DECIMAL  = 'ARITHMETIC_DECIMAL',
  ALGEBRA_LINEAR      = 'ALGEBRA_LINEAR',
  ALGEBRA_QUADRATIC   = 'ALGEBRA_QUADRATIC',
  ALGEBRA_SYSTEMS     = 'ALGEBRA_SYSTEMS',
  GEOMETRY            = 'GEOMETRY',
  STATISTICS          = 'STATISTICS',
  WORD_PROBLEM        = 'WORD_PROBLEM',
  SCIENCE_MATH        = 'SCIENCE_MATH',
  UNKNOWN             = 'UNKNOWN',
}

export enum ConceptReadiness {
  UNVERIFIED = 'UNVERIFIED',
  PASSED     = 'PASSED',
  BYPASSED   = 'BYPASSED',
}

export interface ClassifierInput {
  rawText:            string;
  normText:           string;
  hasShownWorking:    boolean;
  stuckCount:         number;
  conceptReadiness:   ConceptReadiness;
  priorTopic:         MathTopic | null;
}

export interface ClassifierOutput {
  intent:           MathIntent;
  topic:            MathTopic;
  confidence:       'HIGH' | 'MEDIUM' | 'LOW';
  probeQuestion:    string | null;
  escalationActive: boolean;
  redirectScript:   string | null;
  _trace:           string[];
}

/** Legacy routing topic — downstream place-value / algebra guards. */
export type TutorMathTopic =
  | 'arithmetic_place_value'
  | 'arithmetic_multi_op'
  | 'percentage_word'
  | 'fraction_remainder'
  | 'algebra_linear'
  | 'algebra_quadratic'
  | 'general_math'
  | 'none';

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
  /** Rule 61 upstream classification — for math-mode wiring. */
  rule61?:                 ClassifierOutput;
}
