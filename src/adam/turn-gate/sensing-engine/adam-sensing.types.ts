/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sensing Engine Types (Article 8 bridge)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

import type { AdamUsersDomainFacet } from '../../adam-users-domain-router';
import type {
  AdamAffectiveTone,
  AdamThreadPosture,
  AdamTurnGateInput,
} from '../adam-turn-gate.types';

/** S1 — Question surface (bentuk soalan di permukaan). */
export type AdamSurfaceKind =
  | 'greeting'
  | 'factual'
  | 'arithmetic'
  | 'definitional'
  | 'causal'
  | 'comparative'
  | 'compound'
  | 'depth'
  | 'continuation'
  | 'prose-craft'
  | 'relational'
  | 'practical'
  | 'wellbeing'
  | 'substantive'
  | 'record-superlative'
  | 'procedure-howto'
  | 'opinion-evaluative'
  | 'translation';

/** S2 — Situational posture (konteks giliran). */
export type AdamSituationPosture =
  | 'light-social'
  | 'relational'
  | 'practical-advisory'
  | 'wellbeing'
  | 'new-inquiry'
  | 'continuation'
  | 'depth-request'
  | 'substantive'
  | 'companion-cadangan'
  | 'companion-perlaksanaan'
  | 'current-affairs'
  | 'entity-correction';

/** Article 8 sensing bundle — satu bacaan sebelum IQ/EQ/fuse. */
export interface AdamSensingBundle {
  message: string;
  surfaceKind: AdamSurfaceKind;
  domainFacet: AdamUsersDomainFacet;
  /** Search/recall facet — may differ from voice when faith door + verifiable sirah facts. */
  groundingFacet: AdamUsersDomainFacet;
  faithDoorOpen: boolean;
  affectiveTone: AdamAffectiveTone;
  situationPosture: AdamSituationPosture;
  threadPosture: AdamThreadPosture;
}

export type AdamSensingInput = AdamTurnGateInput;
