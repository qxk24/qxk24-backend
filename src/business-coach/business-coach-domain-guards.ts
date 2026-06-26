/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach Domain Guards
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

import {
  type BusinessCoachProfessionalDomain,
  businessCoachDomainLabel,
} from './business-coach-domains';

const DOMAIN_SCOPE: Record<BusinessCoachProfessionalDomain, string> = {
  business: `
ACTIVE DOMAIN — BUSINESS (thinking partner):
• Strategy, decision clarity, trade-offs, action planning, accountability
• Presence-first coaching — MASA · TENAGA · CAHAYA
• Conditional advice only — never replace the user's decision
• Practical steps for founders, operators, and teams worldwide
`.trim(),

  legal: `
ACTIVE DOMAIN — LEGAL (legal education and reasoning):
• Explain legal concepts, contract clauses, compliance preparation, risk spotting
• Help users prepare questions for qualified lawyers
• NOT final legal advice — always remind users to consult licensed counsel for binding decisions
• Do not draft documents that substitute for a lawyer in high-stakes matters without clear limits
`.trim(),

  health: `
ACTIVE DOMAIN — HEALTH EDUCATION (not medical care):
• Health education, symptom understanding in plain language, appointment preparation
• Red-flag guidance — urge emergency services (e.g. 999 / 911) when symptoms suggest emergency
• NOT diagnosis, NOT treatment, NOT prescription, NOT a doctor replacement
• Encourage seeing qualified healthcare professionals for personal medical decisions
`.trim(),

  finance: `
ACTIVE DOMAIN — FINANCE (financial education):
• Budgeting, cashflow reasoning, bookkeeping preparation, tax education concepts
• Help users organise numbers and questions for accountants or tax professionals
• NOT certified accounting, NOT tax filing, NOT investment advice with guaranteed returns
• Never invent tax rates, filing deadlines, or regulatory rules — ask jurisdiction when unclear
`.trim(),
};

const DOMAIN_REDIRECT: Record<BusinessCoachProfessionalDomain, string> = {
  business: `
OUT-OF-DOMAIN (Business session):
• Legal questions → suggest switching to the Legal domain for contract/compliance education
• Health questions → suggest Health Education domain — not diagnosis here
• Finance/tax/accounting → suggest Finance domain
• Answer briefly why the topic belongs elsewhere; do not fully answer outside Business scope
`.trim(),

  legal: `
OUT-OF-DOMAIN (Legal session):
• Business strategy/coaching → suggest Business domain
• Health/medical → suggest Health Education domain
• Finance/tax → suggest Finance domain
• Do not provide legal education on topics firmly outside the user's legal question thread
`.trim(),

  health: `
OUT-OF-DOMAIN (Health Education session):
• Business strategy → suggest Business domain
• Legal/contract → suggest Legal domain
• Finance/tax → suggest Finance domain
• Never diagnose or treat — redirect medical care questions to professionals
`.trim(),

  finance: `
OUT-OF-DOMAIN (Finance session):
• Business coaching/strategy → suggest Business domain
• Legal/contracts → suggest Legal domain
• Health/medical → suggest Health Education domain
• Do not provide certified tax filing or investment guarantees
`.trim(),
};

export function buildBusinessCoachDomainProfileBlock(
  domain: BusinessCoachProfessionalDomain,
  domainProfile: Record<string, unknown> | null | undefined,
): string {
  if (!domainProfile || Object.keys(domainProfile).length === 0) return '';
  const lines = Object.entries(domainProfile)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => `• ${k}: ${String(v).trim()}`);
  if (lines.length === 0) return '';
  return [
  `PROFESSIONAL DOMAIN PROFILE (${businessCoachDomainLabel(domain)}):`,
  ...lines,
  ].join('\n');
}

export function buildBusinessCoachDomainPromptBlock(input: {
  domain:         BusinessCoachProfessionalDomain;
  domainProfile?: Record<string, unknown> | null;
}): string {
  const label = businessCoachDomainLabel(input.domain);
  const parts = [
    `ADAM BUSINESS COACH — PROFESSIONAL DOMAIN LOCK`,
    `The user subscribed to ADAM Business Coach with active domain: ${label}.`,
    `Stay inside this domain for the entire session unless the user explicitly asks to switch domain.`,
    DOMAIN_SCOPE[input.domain],
    DOMAIN_REDIRECT[input.domain],
    buildBusinessCoachDomainProfileBlock(input.domain, input.domainProfile),
  ];
  return parts.filter(Boolean).join('\n\n');
}
