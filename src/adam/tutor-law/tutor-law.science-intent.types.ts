/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Science Intent Types
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

export enum ScienceIntent {
  F_FACTUAL     = 'F_FACTUAL',
  C_CALCULATION = 'C_CALCULATION',
  E_EXPERIMENT  = 'E_EXPERIMENT',
  AMBIGUOUS     = 'AMBIGUOUS',
  EXAM_DIRECT   = 'EXAM_DIRECT',
}

export enum ScienceSubject {
  BIOLOGY   = 'BIOLOGY',
  CHEMISTRY = 'CHEMISTRY',
  PHYSICS   = 'PHYSICS',
  GEOGRAPHY = 'GEOGRAPHY',
  GENERAL   = 'GENERAL',
  UNKNOWN   = 'UNKNOWN',
}

export enum ExperimentPhase {
  HYPOTHESIS = 'HYPOTHESIS',
  PROCEDURE  = 'PROCEDURE',
  VARIABLES  = 'VARIABLES',
  RESULTS    = 'RESULTS',
  ANALYSIS   = 'ANALYSIS',
  CONCLUSION = 'CONCLUSION',
  UNKNOWN    = 'UNKNOWN',
}

export interface ScienceSessionState {
  lockedSubject: ScienceSubject | null;
}

export interface ScienceClassifierInput {
  rawText:             string;
  normText:            string;
  hasShownData:        boolean;
  hasShownProcedure:   boolean;
  stuckCount:          number;
  priorSubject:        ScienceSubject | null;
  profile?:            AdamTutorProfile;
}

export interface ScienceClassifierOutput {
  intent:          ScienceIntent;
  subject:         ScienceSubject;
  experimentPhase: ExperimentPhase | null;
  confidence:      'HIGH' | 'MEDIUM' | 'LOW';
  depthQuestion:   string | null;
  variableProbe:   string | null;
  probeQuestion:   string | null;
  redirectScript:  string | null;
  decisionTrace:   string[];
}

export interface ScienceTurnContext {
  userMessage:             string;
  recentUserMessages:      string[];
  recentAssistantMessages: string[];
  profile?:                AdamTutorProfile;
  sessionState?:           Partial<ScienceSessionState>;
}
