/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Profile (α / β)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Answer Constitution v2 — docs/ADAM_ANSWER_CONSTITUTION.md
 * α = Fakta dulu · β = Explain-Back ilmu (gambar hidup → konvensional → C) · light = salam/thanks
 * L5: α opsyenal · β wajib tamparan jiwa (meterai 2026-06-15)
 */

import { isAdamCurrentAffairsTurn } from './adam-current-affairs';
import {
  ADAM_DIRECT_TECHNICAL_REPLY_LAW,
  isDirectTechnicalHowToQuestion,
} from './adam-direct-technical-law';
import {
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamSimpleFactualTurn,
  isAdamSubstantiveTurn,
  threadRootIsPracticalAdvisory,
} from './adam-response-generation';
import { isTechnicalPrecisionQuestion } from './adam-universal-voice';
import { isVerifiedDataStatAsk } from './adam-web-search';

export type AdamAnswerProfile = 'light' | 'alpha' | 'beta';

export interface ResolveAdamAnswerProfileInput {
  message:               string;
  recentUserMessages?:   string[];
}

/** Route substantive turns to ADAM-α (fakta dulu) or ADAM-β (explain-back). */
export function resolveAdamAnswerProfile(input: ResolveAdamAnswerProfileInput): AdamAnswerProfile {
  const t = input.message.trim();
  if (!t || isAdamLightChatTurn(t)) return 'light';

  if (isDirectTechnicalHowToQuestion(t)) return 'alpha';
  if (isVerifiedDataStatAsk(t)) return 'alpha';
  if (isAdamCurrentAffairsTurn(t)) return 'alpha';
  if (isTechnicalPrecisionQuestion(t)) return 'alpha';
  if (isAdamSimpleFactualTurn(t)) return 'alpha';
  if (isAdamPracticalAdvisoryTurn(t)) return 'alpha';
  if (threadRootIsPracticalAdvisory(input.recentUserMessages ?? [], t)) return 'alpha';

  if (isAdamSubstantiveTurn(t)) return 'beta';

  return 'light';
}

/** Brain-first search skip — only stable β concept depth; α always refreshes figures. */
export function adamProfileAllowsBrainFirstSearchSkip(message: string): boolean {
  return resolveAdamAnswerProfile({ message }) === 'beta';
}

export function buildAdamAnswerProfileHeader(profile: AdamAnswerProfile): string {
  if (profile === 'light') return '';
  const label = profile === 'alpha' ? 'ADAM-α' : 'ADAM-β';
  const tagline = profile === 'alpha'
    ? 'Fakta dulu — L1 inti terus; lapisan proporsional'
    : 'Explain-Back — L1 realiti semasa → L2 konvensional → L3 Brain C → L5 tamparan wajib';
  return `ANSWER PROFILE: ${label} (Answer Constitution v2 — ${tagline}).`;
}

/** Same L1–L5 chart all roles; voice differs Founder vs User Tier 1. */
export function buildAdamAnswerVoiceOverlay(
  profile: AdamAnswerProfile,
  isFounder: boolean,
): string {
  if (profile === 'light') return '';

  const shared = [
    'VOICE OVERLAY (Answer Constitution v2 — proportional layers, not fixed paragraph count):',
    'L1–L4 depth scales with question complexity — never pad simple turns.',
    profile === 'alpha'
      ? 'α L5: optional practical fork only when it adds value — no filler on short factual turns.'
      : 'β L5: mandatory one soul-strike question (tamparan jiwa) — see Explain-Back Law CLOSE.',
    'L3 form follows content: code block, numbered list, table, or prose — not prose by default.',
  ];

  if (isFounder) {
    return [
      ...shared,
      'FOUNDER: Pencipta/hikmah weave in L2–L3 when natural.',
      'Quran / constitutional depth in L4 after L1+L2 on β turns.',
    ].join('\n');
  }

  return [
    ...shared,
    'USER TIER 1: Universal scholar — all ages, backgrounds, nations; no MASA/TENAGA/RUANG billboards.',
    'No unsolicited Quran or Arabic on science/nature α or β tier 1.',
    'Brain C on β recall hit — synthesise; on α figures always trust live search over stale C.',
  ].join('\n');
}

export const ADAM_ALPHA_REPLY_LAW = `
ADAM-α — FAKTA DULU (Answer Constitution v2 — mandatory this turn):

NOT Explain-Back 1A (no three lived pictures before the answer).
NOT philosophy prelude, constitutional billboard, or "tiada dalam konteks saya".

LAYERS (proportional — not every layer on every α turn):
L1 — INTI (mandatory): Direct answer first — fact, figure, code, or first step in opening line or block.
L2 — PENJELASAN: Conventional context — scale to complexity (one sentence to several paragraphs).
L3 — BENTUK + SINTESIS: Choose form by content — code fence, numbered list, table, or prose; light Brain C if recall helps.
L4 — CAVEAT: Only when relevant — stale data, library version, scope limits.
L5 — SAMBUNGAN (optional): Practical next step or fork ONLY when it adds value — skip on short factual turns.

LENGTH (v2):
- Simple factual / office-holder: L1 (+ L4 if caveat) — no forced L5.
- Verified stat (enrollment, institution): L1 + L2 + L3 prose — multi-paragraph OK; L5 optional (e.g. offer formal letter).
- Practical advisory (role, career, skills): L1 + L2 + L3 — multi-paragraph ADAM voice OK; penjiwaan when it wraps search-verified facts; L5 organic close.
- Technical / procedural: L1 code or steps first, L2 why — no essay prelude.

SEARCH: figures, office-holders, and career role/skills MUST come from this turn's web search when enabled — not model memory alone.

FORBIDDEN:
- Three gambar hidup before L1 on this turn.
- Meta preambles before L1: "Soalan anda berkaitan…", "Saya telah menjalankan carian…" — open with the figure or honest gap.
- "Maklumat tidak ada dalam konteks semasa saya" when [WEB SEARCH] blocks are present.
- Invented statistics, journals, laporan tahunan years, or press-release dates not in search hits.
- Mandatory closing question on turns that are already complete at L1.
`.trim();

/** Pick generation law for α turns — procedural subset uses direct technical delta. */
export function buildAdamAlphaGenerationLaw(message: string): string {
  if (isDirectTechnicalHowToQuestion(message)) {
    return `${ADAM_ALPHA_REPLY_LAW}\n\n${ADAM_DIRECT_TECHNICAL_REPLY_LAW}`;
  }
  return ADAM_ALPHA_REPLY_LAW;
}
