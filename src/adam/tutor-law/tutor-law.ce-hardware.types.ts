/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Hardware Intent Types
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

export enum HardwareIntent {
  H_CONCEPT   = 'H_CONCEPT',
  H_DESIGN    = 'H_DESIGN',
  H_TRACE     = 'H_TRACE',
  H_VERIFY    = 'H_VERIFY',
  EXAM_DIRECT = 'EXAM_DIRECT',
  AMBIGUOUS   = 'AMBIGUOUS',
}

export enum HardwareTopic {
  BOOLEAN_ALGEBRA  = 'BOOLEAN_ALGEBRA',
  COMBINATIONAL    = 'COMBINATIONAL',
  SEQUENTIAL       = 'SEQUENTIAL',
  COMPUTER_ARCH    = 'COMPUTER_ARCH',
  MEMORY_SYSTEMS   = 'MEMORY_SYSTEMS',
  NUMBER_SYSTEMS   = 'NUMBER_SYSTEMS',
  HDL              = 'HDL',
  UNKNOWN          = 'UNKNOWN',
}

export interface HardwareClassifierInput {
  rawText:          string;
  normText:         string;
  hasTruthTable:    boolean;
  hasCircuitDesc:   boolean;
  hasHDLCode:       boolean;
  stuckCount:       number;
  priorTopic:       HardwareTopic | null;
  abstractionLayer: CEAbstractionLayer;
}

export interface HardwareClassifierOutput {
  intent:         HardwareIntent;
  topic:          HardwareTopic;
  confidence:     'HIGH' | 'MEDIUM' | 'LOW';
  conceptProbe:   string | null;
  designScaffold: string | null;
  traceProbe:     string | null;
  verifyAnchor:   string | null;
  redirectScript: string | null;
  probeQuestion:  string | null;
  _trace:         string[];
}
