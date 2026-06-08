/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Server Types (Layer 2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Layer 2 output servers — separate from Layer 1 platform chat. */
export enum AdamServerId {
  JURNAL = 'JURNAL',
  BUKU   = 'BUKU',
  KOD    = 'KOD',
}

export enum AdamServerTier {
  STARTER      = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  INSTITUTION  = 'INSTITUTION',
}

export type LayerGateBlockReason =
  | 'LAYER1_CHAT_ONLY'
  | 'LAYER2_TESTING'
  | 'NO_SERVER_SUBSCRIPTION';

export interface LayerGateCheckResult {
  allowed:       boolean;
  server:        AdamServerId | null;
  reason:        LayerGateBlockReason | null;
  message:       string | null;
  plansUrl:      string;
  layer2Enabled: boolean;
  layer2Open:    boolean;
}
