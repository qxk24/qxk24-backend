/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D Industry Document Templates
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
 *
 * Charter: docs/ALAMTOLOGI_RD_EKSKLUSIF_CHARTER.md §VI–VII
 */

import {
  IMPLEMENTATION_WP_SECTION_KEYS,
  TECHNICAL_WP_SECTION_KEYS,
  type RdIndustryDeliverableType,
  type RdIndustrySectionKey,
} from './rd-industry.types';

export interface RdSectionTemplate {
  key:         RdIndustrySectionKey;
  title:       string;
  description: string;
}

const TECHNICAL_SECTIONS: RdSectionTemplate[] = [
  { key: 'executive_summary', title: '§1 Executive summary', description: '500–800 words — industry-facing overview of A+B=C' },
  { key: 'industry_problem', title: '§2 Industry problem & conventional baseline (A)', description: 'Problem framing and conventional baseline' },
  { key: 'methodological_limits', title: '§3 Methodological & instrumentation limits', description: 'Had kaedah — limits of conventional methods' },
  { key: 'alamtologi_framework', title: '§4 Alamtologi comparative framework (B)', description: 'Full Formula XYZ / Teori ALAMIN focus' },
  { key: 'technical_synthesis', title: '§5 A + B = C — technical synthesis', description: 'All themes integrated — not product pitch' },
  { key: 'risk_uncertainty', title: '§6 Risk, uncertainty & open gaps', description: 'Engineering/science gaps honestly stated' },
  { key: 'strategic_implications', title: '§7 Strategic implications for industry', description: 'Not a product roadmap' },
  { key: 'quran_optional', title: '§8 Quran (optional)', description: 'On request only — leave empty if not used' },
  { key: 'conclusion', title: '§9 Conclusion', description: 'Closing synthesis + ownership statement hooks' },
];

const IMPLEMENTATION_SECTIONS: RdSectionTemplate[] = [
  { key: 'purpose_scope', title: '§1 Purpose & scope', description: 'Scope of implementation specification' },
  { key: 'traceability_matrix', title: '§2 Traceability matrix', description: 'Technical WP § → requirement ID' },
  { key: 'architecture', title: '§3 System architecture (conceptual)', description: 'Conceptual architecture — no proprietary lock-in mandate' },
  { key: 'functional_requirements', title: '§4 Functional requirements', description: 'From A+B=C — testable requirements' },
  { key: 'non_functional_requirements', title: '§5 Non-functional requirements', description: 'Security, scale, compliance hooks' },
  { key: 'data_model', title: '§6 Data model & interface intent', description: 'Data and interface specification' },
  { key: 'validation_acceptance', title: '§7 Validation & acceptance criteria', description: 'How to test alignment with Technical WP' },
  { key: 'deployment_phases', title: '§8 Deployment phases', description: 'Specification only — not live product' },
  { key: 'risks_dependencies', title: '§9 Risks, dependencies, out-of-scope', description: 'Explicit boundaries' },
  { key: 'applied_science_handoff', title: '§10 Handoff to Applied Science', description: 'Boundary to Applied Science plan' },
];

export function listSectionTemplates(
  type: RdIndustryDeliverableType,
): RdSectionTemplate[] {
  return type === 'TECHNICAL_WHITEPAPER'
    ? TECHNICAL_SECTIONS
    : IMPLEMENTATION_SECTIONS;
}

export function isValidSectionKey(
  type: RdIndustryDeliverableType,
  key: string,
): boolean {
  const allowed = type === 'TECHNICAL_WHITEPAPER'
    ? TECHNICAL_WP_SECTION_KEYS
    : IMPLEMENTATION_WP_SECTION_KEYS;
  return (allowed as readonly string[]).includes(key);
}

export function deliverableHeader(type: RdIndustryDeliverableType): string {
  return type === 'TECHNICAL_WHITEPAPER'
    ? 'TECHNICAL WHITEPAPER (FULL) — Alamtologi R&D Eksklusif · Industry'
    : 'IMPLEMENTATION WHITEPAPER (FULL) — Alamtologi R&D Eksklusif · Industry';
}

export function emptyDeliverableSections(
  type: RdIndustryDeliverableType,
): Record<string, { content: string; updatedAt: Date }> {
  const keys = type === 'TECHNICAL_WHITEPAPER'
    ? TECHNICAL_WP_SECTION_KEYS
    : IMPLEMENTATION_WP_SECTION_KEYS;
  const now = new Date();
  return Object.fromEntries(
    keys.map((k) => [k, { content: '', updatedAt: now }]),
  );
}
