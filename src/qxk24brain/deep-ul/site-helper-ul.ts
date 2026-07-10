/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Site Helper Engine
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

const FAQ_RULES: Array<{ patterns: RegExp[]; reply: string }> = [
  {
    patterns: [/register|sign\s*up|account/i],
    reply: 'Register free at qxk24.com/register, then open full ADAM teaching at qxk24.com/adam/chat.',
  },
  {
    patterns: [/pric|plan|premium|subscription/i],
    reply: 'See plans at qxk24.com/pricing/packages — Guest, Free, Premium, Profesional, and Enterprise tiers.',
  },
  {
    patterns: [/what is alamtologi|alamtologi/i],
    reply: 'Alamtologi is the Universal Science — a unified framework for natural and human systems. ADAM teaches on the QXK24 kernel.',
  },
  {
    patterns: [/what is adam|who is adam/i],
    reply: 'ADAM is the constitutional AI teacher on QXK24, created by P.alt Masa Bayu. Full teaching requires a free account.',
  },
  {
    patterns: [/tutor|pelajar|student/i],
    reply: 'ADAM Tutor supports school and university subjects with a zero-answer tutoring style — separate from ADAM Learn.',
  },
  {
    patterns: [/support|contact|email/i],
    reply: 'Email support@alamtologi.com for account help. FAQ: qxk24.com/faq',
  },
];

export function runSiteHelperDeterministic(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return 'Ask me about ADAM, registration, plans, or how qxk24.com works.';
  }

  for (const rule of FAQ_RULES) {
    if (rule.patterns.some((p) => p.test(trimmed))) {
      return rule.reply;
    }
  }

  return 'For deep teaching, register free at qxk24.com/register and open ADAM at qxk24.com/adam/chat. For plans see qxk24.com/pricing/packages.';
}
