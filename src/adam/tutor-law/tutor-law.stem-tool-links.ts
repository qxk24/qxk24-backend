/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor STEM Tool Links (allowlist)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Pedagogy v2.1 P2 — controlled PhET / GeoGebra / Desmos links only.
 */

import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { ScienceIntent } from './tutor-law.science-intent.types';
import type { ScienceClassifierOutput } from './tutor-law.science-intent.types';
import type { TutorMathIntentResult } from './tutor-law.math-intent.types';
import {
  normalizeTutorLearningStyle,
  type AdamTutorLearningStyle,
  type AdamTutorProfile,
} from './tutor-law.types';

const ALLOWED_STEM_HOSTS = new Set([
  'phet.colorado.edu',
  'www.geogebra.org',
  'geogebra.org',
  'www.desmos.com',
  'desmos.com',
]);

export interface StemToolLink {
  label: string;
  url:   string;
  topicPatterns: readonly RegExp[];
}

const STEM_TOOL_CATALOG: readonly StemToolLink[] = [
  {
    label: 'PhET Projectile Motion',
    url:   'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html',
    topicPatterns: [
      /parabola|projectile|mercun|fungsi\s*kuadratik|quadratic|laluan\s*bola/i,
    ],
  },
  {
    label: 'PhET Build an Atom',
    url:   'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html',
    topicPatterns: [
      /atom|elektron|proton|neutron|ion|unsur\s*kimia|periodic/i,
    ],
  },
  {
    label: 'PhET Circuit Construction Kit',
    url:   'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html',
    topicPatterns: [
      /litar|circuit|arusrus|voltan|resistor|sambung\s*seri|sambung\s*parallel/i,
    ],
  },
  {
    label: 'PhET Acid-Base Solutions',
    url:   'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_all.html',
    topicPatterns: [
      /asid|base|alkali|ph\b|neutralisasi|indikator/i,
    ],
  },
  {
    label: 'GeoGebra Graphing Calculator',
    url:   'https://www.geogebra.org/graphing',
    topicPatterns: [
      /graf|graph|fungsi|linear|kuadratik|coordinate|koordinat|plot/i,
    ],
  },
  {
    label: 'Desmos Graphing Calculator',
    url:   'https://www.desmos.com/calculator',
    topicPatterns: [
      /desmos|graf|graph|fungsi|persamaan|equation/i,
    ],
  },
];

export const ADAM_TUTOR_STEM_TOOL_LINKS_LAW = `
ADAM TUTOR — ALAT STEM (PhET / GeoGebra / Desmos — allowlist sahaja):
- SATU link simulasi/graf setiap turn — domain allowlist: phet.colorado.edu, geogebra.org, desmos.com.
- Link = pengalaman visual/kinestetik — BUKAN jawapan siap. Selepas link, SATU soalan probe.
- Jangan cadangkan URL luar allowlist atau carian web bebas.
- Zero-answer kekal: pelajar mesti jelaskan pemerhatian sendiri.
`.trim();

export function isAllowedStemToolUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_STEM_HOSTS.has(host);
  } catch {
    return false;
  }
}

function learningStylePrefersStemTools(style?: AdamTutorLearningStyle): boolean {
  if (!style || style === 'mixed') return true;
  return style === 'visual' || style === 'kinesthetic';
}

export function matchStemToolLink(blob: string): StemToolLink | null {
  const norm = normalizeMathClassifierText(blob);
  if (!norm || norm.length < 4) return null;

  for (const tool of STEM_TOOL_CATALOG) {
    if (!isAllowedStemToolUrl(tool.url)) continue;
    if (tool.topicPatterns.some((re) => re.test(norm))) {
      return tool;
    }
  }
  return null;
}

export interface StemToolTurnContext {
  userMessage:    string;
  recentUserMessages?: string[];
  mathIntent?:    TutorMathIntentResult;
  scienceIntent?: ScienceClassifierOutput | null;
  profile?:       AdamTutorProfile;
}

export function resolveStemToolLink(ctx: StemToolTurnContext): StemToolLink | null {
  const style = normalizeTutorLearningStyle(ctx.profile?.learningStyle);
  if (!learningStylePrefersStemTools(style)) return null;

  const blob = [
    ctx.userMessage,
    ...(ctx.recentUserMessages ?? []),
    ctx.mathIntent?.topic ?? '',
    ctx.scienceIntent?.subject ?? '',
  ].join('\n');

  const scienceIntent = ctx.scienceIntent?.intent;
  const stemRelevant =
    scienceIntent === ScienceIntent.E_EXPERIMENT
    || scienceIntent === ScienceIntent.F_FACTUAL
    || scienceIntent === ScienceIntent.C_CALCULATION
    || /algebra|graph|graf|eksperimen|simulasi|fungsi/i.test(blob);

  if (!stemRelevant) return null;

  return matchStemToolLink(blob);
}

export function buildStemToolTurnLaw(ctx: StemToolTurnContext): string {
  const tool = resolveStemToolLink(ctx);
  if (!tool) return '';

  const parts = [
    ADAM_TUTOR_STEM_TOOL_LINKS_LAW,
    `STEM TOOL (allowlist — SATU link turn ini):\n`
    + `• ${tool.label}\n`
    + `• ${tool.url}\n`
    + 'Selepas pelajar cuba simulasi/graf, tanya SATU soalan pemerhatian — jangan beri jawapan penuh.',
  ];

  const style = normalizeTutorLearningStyle(ctx.profile?.learningStyle);
  if (style === 'kinesthetic') {
    parts.push(
      'VAK hint: pelajar kinestetik — galakkan cuba/ubah parameter simulasi sebelum teori.',
    );
  } else if (style === 'visual') {
    parts.push(
      'VAK hint: pelajar visual — minta pelajar huraikan corak/graf yang mereka nampak.',
    );
  }

  return parts.join('\n\n');
}
