/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D & Applied Science Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Commercial SKU IDs — docs/ALAMTOLOGI_COMMERCIAL_PLAN.md v1.0 */
export enum RdAppliedSku {
  RD_IND_SOLO          = 'RD-IND-SOLO',
  RD_GRAD_SOLO         = 'RD-GRAD-SOLO',
  RD_GRAD_EDU          = 'RD-GRAD-EDU',
  RD_LAB_5             = 'RD-LAB-5',
  AS_IND_SOLO          = 'AS-IND-SOLO',
  AS_LAB_5             = 'AS-LAB-5',
  BUNDLE_IND_AS_SOLO   = 'BUNDLE-IND-AS-SOLO',
  BUNDLE_IND_AS_LAB    = 'BUNDLE-IND-AS-LAB',
}

export type RdCategory = 'academic' | 'industry';

export enum RdSubscriptionStatus {
  PENDING   = 'PENDING',
  ACTIVE    = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED   = 'EXPIRED',
}

export enum RdGraduatePhase {
  PHASE_0 = 'phase0',
  SATL    = 'satl',
  PHASE_1 = 'phase1',
}

export interface RdLegalAck {
  platformTerms:    boolean;
  rdTerms:          boolean;
  disclaimer:       boolean;
  journalPublish:   boolean;
  graduateRules?:   boolean;
  appliedPack?:     boolean;
  labSharedProject?: boolean;
}

export const RD_POOL_SKUS = ['RD-POOL-10', 'RD-POOL-25', 'RD-POOL-50'] as const;

export const SELF_SERVE_RD_SKUS: ReadonlySet<string> = new Set(Object.values(RdAppliedSku));
