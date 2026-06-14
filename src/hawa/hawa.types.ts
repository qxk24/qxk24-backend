/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : HAWA Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export type HawaJudgment = 'LULUS' | 'ISLAH' | 'GAGAL' | 'WAQF';

export type HawaCheckpoint =
  | 'propose_write'
  | 'post_tool';

export interface HawaVerdict {
  judgment:   HawaJudgment;
  findings:   string[];
  stop:       boolean;
  checkpoint: HawaCheckpoint;
  toolName?:  string;
  relPath?:   string;
  /** Which audit tier produced this verdict (propose_write flow). */
  tier?:      'A' | 'B' | 'A+B';
}

export interface HawaHoldRecord {
  sessionId:  string;
  verdict:    HawaVerdict;
  haltedAt:   number;
}
