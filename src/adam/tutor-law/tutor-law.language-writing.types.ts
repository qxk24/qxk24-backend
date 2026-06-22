/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Language & Writing Intent Types
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

export enum LanguageIntent {
  W_IDEA      = 'W_IDEA',
  W_STRUCTURE = 'W_STRUCTURE',
  W_REVIEW    = 'W_REVIEW',
  G_GRAMMAR   = 'G_GRAMMAR',
  TRAP        = 'TRAP',
  AMBIGUOUS   = 'AMBIGUOUS',
}

export enum WritingType {
  ESEI       = 'ESEI',
  KARANGAN   = 'KARANGAN',
  LAPORAN    = 'LAPORAN',
  SURAT      = 'SURAT',
  PUISI      = 'PUISI',
  KOMSAS     = 'KOMSAS',
  SEJARAH    = 'SEJARAH',
  PERIBAHASA = 'PERIBAHASA',
  GENERAL    = 'GENERAL',
  UNKNOWN    = 'UNKNOWN',
}

export enum LanguageVariant {
  BAHASA_MELAYU = 'BM',
  ENGLISH       = 'EN',
  MIXED         = 'MIXED',
}

export interface LanguageSessionState {
  lockedWritingType: WritingType | null;
}

export interface LanguageClassifierInput {
  rawText:           string;
  normText:          string;
  hasDraftContent:   boolean;
  draftWordCount:    number;
  stuckCount:        number;
  priorWritingType:  WritingType | null;
  profile?:          AdamTutorProfile;
}

export interface LanguageClassifierOutput {
  intent:          LanguageIntent;
  writingType:     WritingType;
  languageVariant: LanguageVariant;
  confidence:      'HIGH' | 'MEDIUM' | 'LOW';
  redirectScript:  string | null;
  ideationProbe:   string | null;
  scaffoldPrompt:  string | null;
  feedbackAnchor:  string | null;
  probeQuestion:   string | null;
  decisionTrace:   string[];
}

export interface LanguageTurnContext {
  userMessage:             string;
  recentUserMessages:      string[];
  recentAssistantMessages: string[];
  profile?:                AdamTutorProfile;
  sessionState?:           Partial<LanguageSessionState>;
  stuckCount?:             number;
}
