/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Islamic Education Intent Types
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

export enum IslamicIntent {
  Q_QURAN          = 'Q_QURAN',
  Q_HADITH         = 'Q_HADITH',
  Q_FIQH           = 'Q_FIQH',
  Q_IMAN           = 'Q_IMAN',
  Q_AKHLAQ         = 'Q_AKHLAQ',
  Q_HISTORY        = 'Q_HISTORY',
  Q_COMPARE        = 'Q_COMPARE',
  FABRICATION_RISK = 'FABRICATION_RISK',
  AMBIGUOUS        = 'AMBIGUOUS',
}

export enum SourceTier {
  QURAN    = 'QURAN',
  HADITH   = 'HADITH',
  IJMAK    = 'IJMAK',
  QIYAS    = 'QIYAS',
  ACADEMIC = 'ACADEMIC',
  UNKNOWN  = 'UNKNOWN',
}

export enum FabricationRisk {
  HIGH   = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW    = 'LOW',
}

export type IslamicStudentLevel =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'UNIVERSITY'
  | 'UNKNOWN';

export interface IslamicClassifierInput {
  rawText:        string;
  normText:       string;
  stuckCount:     number;
  studentLevel:   IslamicStudentLevel;
  profile?:       AdamTutorProfile;
}

export interface IslamicClassifierOutput {
  intent:               IslamicIntent;
  sourceTier:           SourceTier;
  fabricationRisk:      FabricationRisk;
  confidence:           'HIGH' | 'MEDIUM' | 'LOW';
  fabricationGuard:     string | null;
  verificationReminder: string | null;
  pedagogyProbe:        string | null;
  probeQuestion:        string | null;
  decisionTrace:        string[];
}

export interface IslamicTurnContext {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile?:                AdamTutorProfile;
  stuckCount?:             number;
  sessionState?:           Partial<IslamicSessionState>;
}

export interface IslamicSessionState {
  lockedIntent:              IslamicIntent | null;
  lockedSourceTier:          SourceTier | null;
  pedagogyProbeAnswered:     boolean;
  fabricationGuardDelivered: boolean;
  verificationAcknowledged:  boolean;
  stuckCount:                number;
}

export interface IslamicIntentResult {
  output:              IslamicClassifierOutput;
  sessionState:        IslamicSessionState;
  nextSessionState:    IslamicSessionState;
  pedagogyProbeSkipped: boolean;
}
