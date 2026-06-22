/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Network Intent Types
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

export enum NetworkIntent {
  N_CONCEPT   = 'N_CONCEPT',
  N_ANALYZE   = 'N_ANALYZE',
  N_TRACE     = 'N_TRACE',
  N_DESIGN    = 'N_DESIGN',
  N_VERIFY    = 'N_VERIFY',
  EXAM_DIRECT = 'EXAM_DIRECT',
  AMBIGUOUS   = 'AMBIGUOUS',
}

export enum NetworkTopic {
  TCP_UDP              = 'TCP_UDP',
  IP_ROUTING           = 'IP_ROUTING',
  OSI_MODEL            = 'OSI_MODEL',
  APPLICATION_PROTOCOL = 'APPLICATION_PROTOCOL',
  SECURITY_TLS         = 'SECURITY_TLS',
  SWITCHING_LAN        = 'SWITCHING_LAN',
  WIRELESS             = 'WIRELESS',
  UNKNOWN              = 'UNKNOWN',
}

export interface NetworkClassifierInput {
  rawText:          string;
  normText:         string;
  hasPacketDesc:    boolean;
  hasAddressing:    boolean;
  hasTopologyDesc:  boolean;
  stuckCount:       number;
  priorTopic:       NetworkTopic | null;
  abstractionLayer: CEAbstractionLayer;
}

export interface NetworkClassifierOutput {
  intent:          NetworkIntent;
  topic:           NetworkTopic;
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
