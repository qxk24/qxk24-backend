/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Intent Types
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

export enum GenericIntent {
  G_FACT      = 'G_FACT',
  G_ANALYSIS  = 'G_ANALYSIS',
  G_REVIEW    = 'G_REVIEW',
  G_CONCEPT   = 'G_CONCEPT',
  EXAM_DIRECT = 'EXAM_DIRECT',
  AMBIGUOUS   = 'AMBIGUOUS',
}

export enum GenericDomain {
  SEJARAH  = 'SEJARAH',
  GEOGRAFI = 'GEOGRAFI',
  EKONOMI  = 'EKONOMI',
  SASTERA  = 'SASTERA',
  KOMSAS   = 'KOMSAS',
  SIVIK    = 'SIVIK',
  SENI     = 'SENI',
  UMUM     = 'UMUM',
}

export interface GenericClassifierInput {
  rawText:           string;
  normText:          string;
  hasDraftContent:   boolean;
  stuckCount:        number;
  priorDomain:       GenericDomain | null;
  profile?:          AdamTutorProfile;
}

export interface GenericClassifierOutput {
  intent:               GenericIntent;
  domain:               GenericDomain;
  confidence:           'HIGH' | 'MEDIUM' | 'LOW';
  significanceQuestion: string | null;
  argumentProbe:        string | null;
  reviewAnchor:         string | null;
  redirectScript:       string | null;
  probeQuestion:        string | null;
  _trace:               string[];
}

export interface GenericSessionState {
  lockedDomain:           GenericDomain | null;
  reviewAnchorAnswered:   boolean;
  factAnsweredThisThread: boolean;
  significanceAsked:      boolean;
  argumentProbeDelivered: boolean;
  stuckCount:             number;
}

export interface GenericTurnContext {
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  profile?:                 AdamTutorProfile;
  sessionState?:            Partial<GenericSessionState>;
  stuckCount?:              number;
}

export type GenericTurnHandler =
  | 'REDIRECT'
  | 'AMBIGUOUS_PROBE'
  | 'ARGUMENT_PROBE'
  | 'FACT_WITH_SIGNIFICANCE'
  | 'FACT_SIGNIFICANCE_ONLY'
  | 'REVIEW_ANCHOR'
  | 'REVIEW_FEEDBACK'
  | 'CONCEPT_DIAGNOSE';

export interface GenericIntentResult {
  output:              GenericClassifierOutput;
  handler:             GenericTurnHandler;
  sessionState:        GenericSessionState;
  nextSessionState:    GenericSessionState;
  reviewAnchorSkipped: boolean;
}
