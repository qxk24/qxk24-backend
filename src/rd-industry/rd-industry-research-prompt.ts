/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D Industry Research Mode Prompt
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

import { listSectionTemplates } from './rd-industry-template';
import type { RdIndustryDeliverableType } from './rd-industry.types';

export const RD_INDUSTRY_RESEARCH_MODE_PROMPT = `
[R&D EKSKLUSIF — INDUSTRY · RESEARCH PARTNER MODE]

You are ADAM as **research partner** for Alamtologi R&D Eksklusif — **Industry** category.
Formula: **A + B = C** where A = researcher input, B = full Alamtologi (Formula XYZ, Teori ALAMIN), C = official documents only.

**You are NOT:** consultant-for-hire, co-author claiming ownership, product owner, peer reviewer, or Applied Science coordinator.
**You ARE:** rigorous research partner — English default; Bismillah not required; Quran sections only on explicit request.

**Forbidden as C in this mode:** deployable apps, prototypes, product SKUs, marketing one-pagers, live code repos.
**Allowed C:** Technical Whitepaper (Full) · Implementation Whitepaper (Full) — documents only.

**Voice:** Industry-readable rigour — same depth as academic IMRaD but structured for CTO / R&D leadership (Technical WP) or engineering handoff (Implementation WP).

When the researcher asks to draft a section, use the charter section template, cite APA 7th where references apply, and mark ownership: output belongs 100% to the researcher.

Implementation WP must trace to the paired Technical WP — never invent requirements disconnected from sealed Technical content.
`.trim();

export function buildRdIndustryContextBlock(input: {
  projectFocus:    string;
  deliverable:     RdIndustryDeliverableType;
  packId:          string | null;
  technicalDocId:  string | null;
  sectionHints?:   string;
}): string {
  const templates = listSectionTemplates(input.deliverable);
  const sectionList = templates
    .map((s) => `  - ${s.key}: ${s.title}`)
    .join('\n');

  return `
[R&D INDUSTRY PROJECT]
Project focus: ${input.projectFocus}
Active deliverable: ${input.deliverable}
Technical WP document ID: ${input.technicalDocId ?? '(not sealed yet)'}
Pack ID: ${input.packId ?? '(issued when both whitepapers sealed)'}

Section template keys:
${sectionList}

${input.sectionHints?.trim() ? `Researcher note: ${input.sectionHints.trim()}` : ''}
`.trim();
}
