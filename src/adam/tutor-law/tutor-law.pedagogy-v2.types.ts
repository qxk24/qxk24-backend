/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pedagogy v2 Types
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
import type { GenericIntentResult } from './tutor-law.generic-intent.types';
import type { TutorMathIntentResult } from './tutor-law.math-intent.types';

export enum PedagogyV2Intent {
  NONE              = 'NONE',
  FEYNMAN           = 'FEYNMAN',
  FIVE_WHYS         = 'FIVE_WHYS',
  ITHINK_MAP        = 'ITHINK_MAP',
  CROSS_CURRICULAR  = 'CROSS_CURRICULAR',
  FORMATIVE_QUIZ    = 'FORMATIVE_QUIZ',
  METACOGNITION     = 'METACOGNITION',
}

export enum IThinkMapType {
  BUBBLE        = 'BUBBLE',
  DOUBLE_BUBBLE = 'DOUBLE_BUBBLE',
  FLOW          = 'FLOW',
  MULTI_FLOW    = 'MULTI_FLOW',
  BRIDGE        = 'BRIDGE',
  TREE          = 'TREE',
  CIRCLE        = 'CIRCLE',
  BRACE         = 'BRACE',
  UNKNOWN       = 'UNKNOWN',
}

export enum CrossCurricularCluster {
  HISTORY_GEO_ECON   = 'HISTORY_GEO_ECON',
  SCIENCE_MATH       = 'SCIENCE_MATH',
  LANGUAGE_HUMANITIES = 'LANGUAGE_HUMANITIES',
  STEM_SOCIETY       = 'STEM_SOCIETY',
  GENERAL            = 'GENERAL',
}

export interface PedagogyV2SessionState {
  feynmanDelivered:        boolean;
  fiveWhysStarted:         boolean;
  fiveWhysDepth:           number;
  formativeQuizStarted:    boolean;
  formativeQuestionsAsked: number;
  metacognitionDelivered:  boolean;
  practiceOfferAccepted:   boolean;
}

export interface PedagogyV2TurnInput {
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  profile?:                 AdamTutorProfile;
  mathIntent?:              TutorMathIntentResult;
  genericIntent?:           GenericIntentResult | null;
  sessionState?:            Partial<PedagogyV2SessionState>;
}

export interface PedagogyV2ClassifierOutput {
  intent:            PedagogyV2Intent;
  mapType:           IThinkMapType;
  crossCluster:      CrossCurricularCluster;
  topicHint:         string | null;
  feynmanProbe:      string | null;
  fiveWhysProbe:     string | null;
  mapScaffold:       string | null;
  crossLinkPrompt:   string | null;
  formativeQuestion: string | null;
  metacognitionProbe: string | null;
  confidence:        'HIGH' | 'MEDIUM' | 'LOW';
  _trace:            string[];
}

export interface PedagogyV2TurnResult {
  output:           PedagogyV2ClassifierOutput;
  sessionState:     PedagogyV2SessionState;
  nextSessionState: PedagogyV2SessionState;
}
