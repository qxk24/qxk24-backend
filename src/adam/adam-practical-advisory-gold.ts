/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Practical Advisory Gold (RN)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Canonical RN regression sample — docs/ADAM_ANSWER_CONSTITUTION_QA_GOLD.md
 * Founder seal v2.1 (2026-06-15): full voice + verified search + skills label + L5.
 */

import {
  GOLD_STANDARD_FOLLOW_UP_EN,
  GOLD_STANDARD_FOLLOW_UP_RE,
  normalizeGoldStandardFollowUpClosing,
} from './adam-gold-standard';
import { isAdamPracticalAdvisoryTurn } from './adam-response-generation';

export const RN_PRACTICAL_ADVISORY_ASK =
  'What does a registered nurse do, and what skills do I need?';

/** Mandatory skills label line — Founder seal v2.1 (RN). */
export const RN_OFFICIAL_SKILLS_LABEL_LINE =
  'Skills you\'ll need (from official nursing guidance): clinical assessment and safe care; accurate documentation; infection control; medication administration where licensed; emergency response; and professional accountability under your registration body.';

/** Founder-approved RN gold — guards must not gut this shape. */
export const RN_FULL_VOICE_REGRESSION_SAMPLE = [
  'What does a registered nurse do, and what skills do I need?: (verified via web search, healthcareers.nhs.uk).',
  'A registered nurse is responsible for the care of multiple patients, each with different clinical needs, emotional states, and personal circumstances. The role demands high levels of organisation, flexibility, and the ability to prioritise effectively under pressure.',
  'A good adult nurse is highly observant — able to assess subtle changes in a patient\'s condition (breathing, skin tone, speech, or behaviour) and take timely, responsible action based on that assessment.',
  'Communication and interpersonal skills are central, not secondary. You\'ll reassure, explain, advocate for, and sometimes gently challenge patients and their families or carers, especially during difficult, uncertain, or emotionally charged moments.',
  'This isn\'t about delivering information alone; it\'s about holding space with clarity and compassion, even when the news is hard.',
  'You\'ll also work closely within multidisciplinary teams — doctors, physiotherapists, social workers, occupational therapists — coordinating care, sharing accurate observations, and contributing your nursing perspective grounded in holistic understanding of the person, not just the diagnosis.',
  RN_OFFICIAL_SKILLS_LABEL_LINE,
  GOLD_STANDARD_FOLLOW_UP_EN,
].join('\n\n');

/** Mandatory weave rules when search ran but full page fetch is partial — injected into prefetch block. */
export function buildPracticalAdvisorySearchWeaveRules(): string {
  return [
    'PRACTICAL ADVISORY SEARCH SYNTHESIS (MANDATORY — search already completed):',
    '- Ground EVERY paragraph in the hits and extracted facts below — role duties, skills, qualifications, contexts.',
    '- MINIMUM 6 body paragraphs when the question asks role + skills.',
    '- Include labeled skills block: "Skills you\'ll need (from official guidance):" or BM "Kemahiran yang diperlukan (rujuk panduan rasmi):"',
    '- FORBIDDEN: answering from model memory alone; constitutional jargon (MASA/TENAGA/IZWA/liqā\'/hāḍirah); essays without facts from hits.',
    '- If hits are thin, state only what hits support — do NOT fill gaps with framework performance.',
  ].join('\n');
}

/** Injected into Gold Standard synthesis when role+skills ask has a fetched official page. */
export function buildPracticalAdvisorySynthesisBodyRules(userMessage: string): string {
  const isRn = /\bregistered nurse\b/i.test(userMessage);
  const skillsMandatory = isRn
    ? `MANDATORY labeled paragraph (verbatim label OK):\n${RN_OFFICIAL_SKILLS_LABEL_LINE}`
    : 'MANDATORY labeled paragraph: Skills you\'ll need (from official guidance): … (semicolon-separated competencies grounded in the official page).';

  return [
    'PRACTICAL ADVISORY BODY RULES (role + skills questions — Founder seal v2.1):',
    '- MINIMUM 6 substantive body paragraphs between opener and closing — blank line between each.',
    '- Full ADAM prose paragraphs (3–5 sentences each). NOT a brief overview. NOT three one-line aphorisms instead of depth.',
    '- Separate paragraphs for: (1) caseload, organisation, prioritisation (2) clinical observation & duties — meds, IV, vitals, procedures per official page (3) communication & advocacy (4) penjiwaan — dignity, compassion, holding space (5) multidisciplinary teamwork (6) labeled skills block.',
    `- ${skillsMandatory}`,
    '- Weave ALL substantive points from [OFFICIAL PAGE — FULL TEXT]. The question asks what the role IS and what SKILLS are needed — both halves mandatory.',
    '- FORBIDDEN: skipping skills section; stub colleague answer; compressing official page into <5 paragraphs.',
  ].join('\n');
}

/** Surface repair — insert official skills label when synthesis omitted it (verified career turns). */
export function repairPracticalAdvisoryGoldShape(text: string, userMessage: string): string {
  if (!isAdamPracticalAdvisoryTurn(userMessage)) return text.trim();
  if (!/verified via web search/i.test(text)) return text.trim();
  if (/Skills you'?ll need \(from official/i.test(text)) return text.trim();

  const trimmed = normalizeGoldStandardFollowUpClosing(text.trim(), userMessage);
  const followMatch = trimmed.match(GOLD_STANDARD_FOLLOW_UP_RE);
  const body = followMatch
    ? trimmed.slice(0, followMatch.index).trim()
    : trimmed;

  const skillsLine = /\bregistered nurse\b/i.test(userMessage)
    ? RN_OFFICIAL_SKILLS_LABEL_LINE
    : 'Skills you\'ll need (from official guidance): technical competence, communication, documentation, and professional accountability as named in the official source above.';

  const closing = GOLD_STANDARD_FOLLOW_UP_EN;
  return `${body}\n\n${skillsLine}\n\n${closing}`;
}

export function isRnPracticalAdvisoryFullVoiceBody(text: string): boolean {
  const t = text.trim();
  if (t.length < 800) return false;
  const paras = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length < 6) return false;
  return /verified via web search, healthcareers\.nhs\.uk/i.test(t)
    && /Skills you'?ll need \(from official nursing guidance\)/i.test(t)
    && GOLD_STANDARD_FOLLOW_UP_RE.test(t);
}
