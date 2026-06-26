/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach Professional Domains
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export const BUSINESS_COACH_PROFESSIONAL_DOMAINS = [
  'business',
  'legal',
  'health',
  'finance',
] as const;

export type BusinessCoachProfessionalDomain = typeof BUSINESS_COACH_PROFESSIONAL_DOMAINS[number];

export const BUSINESS_COACH_DOMAIN_LABELS: Record<BusinessCoachProfessionalDomain, string> = {
  business: 'Business',
  legal:    'Legal',
  health:   'Health Education',
  finance:  'Finance',
};

export function isBusinessCoachProfessionalDomain(
  value: string,
): value is BusinessCoachProfessionalDomain {
  return (BUSINESS_COACH_PROFESSIONAL_DOMAINS as readonly string[]).includes(value);
}

export function businessCoachDomainLabel(
  domain: BusinessCoachProfessionalDomain,
): string {
  return BUSINESS_COACH_DOMAIN_LABELS[domain];
}
