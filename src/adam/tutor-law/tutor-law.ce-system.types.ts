/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE System Intent Types
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

import type { CEAbstractionLayer } from './tutor-law.ce-intent.types';

export enum SystemIntent {
  S_CONCEPT   = 'S_CONCEPT',
  S_ANALYZE   = 'S_ANALYZE',
  S_TRACE     = 'S_TRACE',
  S_DESIGN    = 'S_DESIGN',
  S_VERIFY    = 'S_VERIFY',
  EXAM_DIRECT = 'EXAM_DIRECT',
  AMBIGUOUS   = 'AMBIGUOUS',
}

export enum SystemTopic {
  PROCESS_THREAD     = 'PROCESS_THREAD',
  SCHEDULING         = 'SCHEDULING',
  SYNCHRONIZATION    = 'SYNCHRONIZATION',
  MEMORY_MGMT        = 'MEMORY_MGMT',
  FILE_SYSTEMS       = 'FILE_SYSTEMS',
  INTERRUPTS_SYSCALLS = 'INTERRUPTS_SYSCALLS',
  EMBEDDED_RTOS      = 'EMBEDDED_RTOS',
  UNKNOWN            = 'UNKNOWN',
}

export interface SystemClassifierInput {
  rawText:          string;
  normText:         string;
  hasCodeSnippet:   boolean;
  hasScenarioDesc:  boolean;
  hasTimingTrace:   boolean;
  stuckCount:       number;
  priorTopic:       SystemTopic | null;
  abstractionLayer: CEAbstractionLayer;
}

export interface SystemClassifierOutput {
  intent:          SystemIntent;
  topic:           SystemTopic;
  confidence:      'HIGH' | 'MEDIUM' | 'LOW';
  analyzeProbe:    string | null;
  traceProbe:      string | null;
  designScaffold:  string | null;
  verifyAnchor:    string | null;
  conceptProbe:    string | null;
  redirectScript:  string | null;
  probeQuestion:   string | null;
  _trace:          string[];
}
