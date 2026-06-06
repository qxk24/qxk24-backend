/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Brain Types (ERA_1 — 124(1))
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Kotak 2 — IKJ / Kr structural lane */
export type AmaLane = 'IKJ' | 'LWJ';

/** AMA 124 grid segment (six neurocortical regions) */
export type AmaSegment = 'Kr' | 'Kn' | 'Dn' | 'Bg' | 'As' | 'Bh';

/** Flow operation type — Tahap 3 enables OASS */
export type AmaFlowMode = 'OAT' | 'OASS';

export const AMA_LEVEL_ERA_1 = '124(1)' as const;
export const AMA_KOTAK_COUNT = 22;
export const AMA_OASS_CONFIDENCE_THRESHOLD = 0.85;
export const AMA_TAMAT_COHERENCE_THRESHOLD = 0.75;

export interface AmaLaneClassification {
  lane:       AmaLane;
  segment:    AmaSegment;
  confidence: number;
  mode:       AmaFlowMode;
  reasons:    string[];
  /** Mixed structural + episodic — OASS after initial lane write */
  needsOass:  boolean;
}

export interface AmaFlowRouteResult extends AmaLaneClassification {
  kotak:      2 | 3;
  latencyMs?: number;
}

export interface AmaDualLaneWrite {
  /** C — updated principle / structure → Kotak 2 */
  structuralC: string;
  /** B — lived evidence → Kotak 3 (never erased) */
  episodicB:   string;
  sourceId:    string;
  family?:     string;
  principle?:  string;
}
