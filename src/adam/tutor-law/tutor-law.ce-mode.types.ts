/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Mode Types
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
import type { CodeClassifierOutput } from './tutor-law.code-intent-classifier';
import type {
  CEAbstractionLayer,
  CESubdomain,
} from './tutor-law.ce-intent.types';

export type CETurnHandler =
  | 'SECURITY_BLOCK'
  | 'LAYER_PROBE'
  | 'REDIRECT'
  | 'VERIFY_ANCHOR'
  | 'VERIFY_FEEDBACK'
  | 'DESIGN_SCAFFOLD'
  | 'TRACE_PROBE'
  | 'CONCEPT_PROBE'
  | 'ANALYZE_PROBE'
  | 'PROOF_PROBE'
  | 'COMPLEXITY_PROBE'
  | 'AMBIGUOUS_PROBE'
  | 'CODE_DEBUG'
  | 'CODE_BUILD'
  | 'CODE_REVIEW'
  | 'CODE_CONCEPT';

export interface CESessionState {
  lockedSubdomain:        CESubdomain | null;
  lockedLayer:            CEAbstractionLayer | null;
  layerProbeAnswered:     boolean;
  verifyAnchorAnswered:   boolean;
  designScaffoldDelivered: boolean;
  stuckCount:             number;
}

export interface CETurnContext {
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  profile?:                 AdamTutorProfile;
  sessionState?:            Partial<CESessionState>;
  stuckCount?:              number;
}

export interface CodeIntentResult {
  output:               CodeClassifierOutput;
  handler:              CETurnHandler;
  sessionState:         CESessionState;
  nextSessionState:     CESessionState;
  verifyAnchorSkipped:  boolean;
}
