/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Commercial Plans Categories (Plan 2)
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

/** Industry-standard commercial plan categories — docs/ALAMTOLOGI_COMMERCIAL_PLANS_CHARTER.md */
export enum CommercialPlanCategory {
  BUSINESS      = 'BUSINESS',
  MARKETING     = 'MARKETING',
  FINANCIAL     = 'FINANCIAL',
  MANUFACTURING = 'MANUFACTURING',
  QUALITY       = 'QUALITY',
}

export type CommercialPlanIdSuffix = 'BIZ' | 'MKT' | 'FIN' | 'MFG' | 'QUA';

export interface CommercialPlanCategoryDef {
  key: CommercialPlanCategory;
  idSuffix: CommercialPlanIdSuffix;
  labelEn: string;
}

export const COMMERCIAL_PLAN_CATEGORIES: readonly CommercialPlanCategoryDef[] = [
  { key: CommercialPlanCategory.BUSINESS,      idSuffix: 'BIZ', labelEn: 'Business Plan (Full)' },
  { key: CommercialPlanCategory.MARKETING,     idSuffix: 'MKT', labelEn: 'Marketing Plan (Full)' },
  { key: CommercialPlanCategory.FINANCIAL,     idSuffix: 'FIN', labelEn: 'Financial Plan (Full)' },
  { key: CommercialPlanCategory.MANUFACTURING, idSuffix: 'MFG', labelEn: 'Manufacturing Plan (Full)' },
  { key: CommercialPlanCategory.QUALITY,       idSuffix: 'QUA', labelEn: 'Quality Plan (Full)' },
] as const;

export const COMMERCIAL_PLANS_DELIVERABLE_COUNT = 5;

export const COMMERCIAL_PLANS_FORMULA = 'Source + ADAM = C' as const;
