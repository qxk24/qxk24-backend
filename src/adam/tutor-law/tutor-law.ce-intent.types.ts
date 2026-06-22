/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Intent Types
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

export enum CESubdomain {
  HARDWARE      = 'HARDWARE',
  THEORY        = 'THEORY',
  SYSTEM        = 'SYSTEM',
  NETWORK       = 'NETWORK',
  SOFTWARE_ENG  = 'SOFTWARE_ENG',
  DATABASE      = 'DATABASE',
  COMPILER      = 'COMPILER',
  DISCRETE_MATH = 'DISCRETE_MATH',
  UNKNOWN       = 'UNKNOWN',
}

export enum CEAbstractionLayer {
  SILICON      = 'SILICON',
  GATE         = 'GATE',
  REGISTER     = 'REGISTER',
  MICROARCH    = 'MICROARCH',
  OS           = 'OS',
  NETWORK      = 'NETWORK',
  APPLICATION  = 'APPLICATION',
  UNKNOWN      = 'UNKNOWN',
}

export enum CESecurityFlag {
  NONE       = 'NONE',
  DEFENSIVE  = 'DEFENSIVE',
  CONCEPTUAL = 'CONCEPTUAL',
  EXPLOIT    = 'EXPLOIT',
}

export interface CEClassifierInput {
  rawText:        string;
  normText:       string;
  hasCodeBlock:   boolean;
  hasEquation:    boolean;
  hasDiagram:     boolean;
  stuckCount:     number;
  priorSubdomain: CESubdomain | null;
  priorLayer:     CEAbstractionLayer | null;
}

export interface CEClassifierOutput {
  subdomain:        CESubdomain;
  abstractionLayer: CEAbstractionLayer;
  securityFlag:     CESecurityFlag;
  confidence:       'HIGH' | 'MEDIUM' | 'LOW';
  layerProbe:       string | null;
  securityGuard:    string | null;
  routeTo:          string;
  _trace:           string[];
}
