/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Theory Intent Types
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

export enum TheoryIntent {
  T_CONCEPT    = 'T_CONCEPT',
  T_COMPLEXITY = 'T_COMPLEXITY',
  T_TRACE      = 'T_TRACE',
  T_PROOF      = 'T_PROOF',
  T_DESIGN     = 'T_DESIGN',
  EXAM_DIRECT  = 'EXAM_DIRECT',
  AMBIGUOUS    = 'AMBIGUOUS',
}

export enum TheoryTopic {
  SORTING          = 'SORTING',
  GRAPH_ALGO       = 'GRAPH_ALGO',
  DYNAMIC_PROG     = 'DYNAMIC_PROG',
  GREEDY           = 'GREEDY',
  DIVIDE_CONQUER   = 'DIVIDE_CONQUER',
  COMPLEXITY       = 'COMPLEXITY',
  AUTOMATA         = 'AUTOMATA',
  FORMAL_LANG      = 'FORMAL_LANG',
  PROOF_TECHNIQUES = 'PROOF_TECHNIQUES',
  DISCRETE_MATH    = 'DISCRETE_MATH',
  UNKNOWN          = 'UNKNOWN',
}

export interface TheoryClassifierInput {
  rawText:         string;
  normText:        string;
  hasCodeBlock:    boolean;
  hasEquation:     boolean;
  hasProofAttempt: boolean;
  stuckCount:      number;
  priorTopic:      TheoryTopic | null;
}

export interface TheoryClassifierOutput {
  intent:          TheoryIntent;
  topic:           TheoryTopic;
  confidence:      'HIGH' | 'MEDIUM' | 'LOW';
  complexityProbe: string | null;
  proofProbe:      string | null;
  designScaffold:  string | null;
  traceAnchor:     string | null;
  conceptProbe:    string | null;
  redirectScript:  string | null;
  probeQuestion:   string | null;
  _trace:          string[];
}
