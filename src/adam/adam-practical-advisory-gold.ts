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

export const RN_PRACTICAL_ADVISORY_ASK =
  'What does a registered nurse do, and what skills do I need?';

/** Founder-approved RN gold — guards must not gut this shape. */
export const RN_FULL_VOICE_REGRESSION_SAMPLE = [
  'What does a registered nurse do, and what skills do I need?: (verified via web search, healthcareers.nhs.uk).',
  'A registered nurse is responsible for the care of multiple patients, each with different clinical needs, emotional states, and personal circumstances. The role demands high levels of organisation, flexibility, and the ability to prioritise effectively under pressure.',
  'A good adult nurse is highly observant — able to assess subtle changes in a patient\'s condition (breathing, skin tone, speech, or behaviour) and take timely, responsible action based on that assessment.',
  'Communication and interpersonal skills are central, not secondary. You\'ll reassure, explain, advocate for, and sometimes gently challenge patients and their families or carers, especially during difficult, uncertain, or emotionally charged moments.',
  'This isn\'t about delivering information alone; it\'s about holding space with clarity and compassion, even when the news is hard.',
  'You\'ll also work closely within multidisciplinary teams — doctors, physiotherapists, social workers, occupational therapists — coordinating care, sharing accurate observations, and contributing your nursing perspective grounded in holistic understanding of the person, not just the diagnosis.',
  'Skills you\'ll need (from official nursing guidance): clinical assessment and safe care; accurate documentation; infection control; medication administration where licensed; emergency response; and professional accountability under your registration body.',
  'Would you like me to explain another part in more detail?',
].join('\n\n');

export function isRnPracticalAdvisoryFullVoiceBody(text: string): boolean {
  const t = text.trim();
  if (t.length < 800) return false;
  const paras = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length < 6) return false;
  return /verified via web search, healthcareers\.nhs\.uk/i.test(t)
    && /Skills you'?ll need \(from official nursing guidance\)/i.test(t)
    && /explain another part in more detail/i.test(t);
}
