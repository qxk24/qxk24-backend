/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D Industry Types
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

export type RdIndustryDeliverableType =
  | 'TECHNICAL_WHITEPAPER'
  | 'IMPLEMENTATION_WHITEPAPER';

export type RdDeliverableStatus = 'draft' | 'sealed';

export const TECHNICAL_WP_SECTION_KEYS = [
  'executive_summary',
  'industry_problem',
  'methodological_limits',
  'alamtologi_framework',
  'technical_synthesis',
  'risk_uncertainty',
  'strategic_implications',
  'quran_optional',
  'conclusion',
] as const;

export const IMPLEMENTATION_WP_SECTION_KEYS = [
  'purpose_scope',
  'traceability_matrix',
  'architecture',
  'functional_requirements',
  'non_functional_requirements',
  'data_model',
  'validation_acceptance',
  'deployment_phases',
  'risks_dependencies',
  'applied_science_handoff',
] as const;

export type TechnicalWpSectionKey = typeof TECHNICAL_WP_SECTION_KEYS[number];
export type ImplementationWpSectionKey = typeof IMPLEMENTATION_WP_SECTION_KEYS[number];

export type RdIndustrySectionKey = TechnicalWpSectionKey | ImplementationWpSectionKey;

export interface RdIndustrySectionDraft {
  content:   string;
  updatedAt: Date;
}

export interface RdIndustryDeliverable {
  type:              RdIndustryDeliverableType;
  status:            RdDeliverableStatus;
  documentId:        string | null;
  sections:          Record<string, RdIndustrySectionDraft>;
  sealedAt:          Date | null;
  technicalWpVersion: string | null;
}

export type RdIndustryProjectStatus =
  | 'active'
  | 'technical_sealed'
  | 'pack_sealed'
  | 'completed';
