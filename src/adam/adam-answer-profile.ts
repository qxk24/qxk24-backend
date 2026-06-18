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
import { ADAM_TECHNICAL_ESSENCE_LAW } from './adam-technical-essence-law';
import {
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamHistorySynthesisTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  isAdamAlgorithmTeachingTurn,
  isAdamLinearAlgebraTurn,
  isAdamSimpleFactualTurn,
  isAdamSubstantiveTurn,
  isAdamUserGuidanceCoachingTurn,
  threadRootIsPracticalAdvisory,
} from './adam-response-generation';
import {
  isTechnicalPrecisionQuestion,
  userAskedForAlamtologi,
  userAskedForConstitutionalStructure,
} from './adam-universal-voice';
import { isVerifiedDataStatAsk } from './adam-web-search';
import { userUmumPerlaksanaanTurnActive, isUserUmumCompanionTurnActive } from './adam-universal-scholar';

export type AdamAnswerProfile = 'light' | 'alpha' | 'beta';

export interface ResolveAdamAnswerProfileInput {
  message:                    string;
  recentUserMessages?:        string[];
  recentAssistantMessages?:   string[];
  isFounder?:                 boolean;
}

/**
 * User tier-1 default = α konvensional.
 * β Explain-Back only after an explicit door the codebase already recognises —
 * never inferred from topic alone.
 */
export function userOptedIntoStudentExplainBackBeta(
  input: ResolveAdamAnswerProfileInput,
): boolean {
  const msg = input.message.trim();
  if (!msg) return false;

  // β Explain-Back only when user explicitly opened Alamtologi / constitutional mode THIS turn.
  if (userAskedForAlamtologi(msg) || userAskedForConstitutionalStructure(msg)) return true;

  return false;
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
  if (isAdamUserGuidanceCoachingTurn(t)) return 'alpha';
  if (userUmumPerlaksanaanTurnActive(
    t,
    input.recentAssistantMessages ?? [],
    input.recentUserMessages ?? [],
  )) return 'alpha';
  if (isUserUmumCompanionTurnActive(
    t,
    input.recentAssistantMessages ?? [],
    input.recentUserMessages ?? [],
  )) return 'alpha';

  if (isAdamSubstantiveTurn(t)) {
    if (input.isFounder) return 'beta';
    if (userOptedIntoStudentExplainBackBeta(input)) return 'beta';
    return 'alpha';
  }

  return 'light';
}

/** Brain-first search skip — only stable β concept depth; α always refreshes figures. */
export function adamProfileAllowsBrainFirstSearchSkip(input: ResolveAdamAnswerProfileInput): boolean {
  return resolveAdamAnswerProfile(input) === 'beta';
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
      'FOUNDER: β turns need full depth — empirical blocks per concept with formulas, instruments, institutions from web search.',
      'FOUNDER: minimum 4–8 sentences per scientific concept; never stub summaries on P.alt substantive asks.',
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

/** Algorithm / CS α — lecture depth on universal channel (not technical display pipeline). */
export const ADAM_ALPHA_ALGORITHM_TEACHING_LAW = `
ADAM-α ALGORITMA — KEDALAMAN KULIAH (universal channel — mandatory this turn):
- L1: definisi + contoh angka dalam ayat pembuka atau blok berikutnya.
- L2–L3: contoh kerja 2 pusingan, pseudokod, jadual kerumitan masa, kerumitan ruang, kelebihan/kekurangan.
- L5: **Cadangan:** praktikal — bukan menu susulan.
- Panjang: tutorial penuh — bukan ringkasan 4 perenggan.
`.trim();

/** School / nature science α — technical essence fusion (Esei + Teknikal = C). */
export const ADAM_ALPHA_SCIENCE_REPLY_LAW = `
ADAM-α SAINS / ALAM — TEKNIKAL + ESEI = C (mandatory this turn):
${ADAM_TECHNICAL_ESSENCE_LAW}

Contoh bentuk fotosintesis:
- ### Apa itu fotosintesis? — prosa 2–3 ayat (kloroplas, klorofil, glukosa, oksigen).
- ### Bagaimana proses berlaku? — langkah air/CO₂/cahaya dalam prosa atau senarai ringkas.
- ### Hasil dan kepentingannya — glukosa + oksigen; kemudian perenggan C (asas kehidupan di Bumi).
`.trim();

/** School linear algebra α — steps + answer, no philosophy essay. */
export const ADAM_ALPHA_ALGEBRA_REPLY_LAW = `
ADAM-α ALJABAR LINEAR — KONVENSIONAL SAHAJA (mandatory this turn):
- L1: nyatakan matlamat (cari x) dan tunjuk langkah isolasi — kurang/bahagi kedua-dua belah.
- L2: jawapan akhir x = … + semakan gantian ringkas.
- DILARANG: "bukan sekadar angka", keseimbangan meta alam semesta, hukum kesetiaan, penuh adab, kerangka dalaman.
- "Hai {name}," only when the user called ADAM by name — jangan salam dua kali.
`.trim();

/** School / world history α — konvensional narrative, no framework weave. */
export const ADAM_ALPHA_HISTORY_REPLY_LAW = `
ADAM-α SEJARAH — PAPARAN TEKNIKAL KONVENSIONAL (mandatory this turn):
- L1: tarikh/peristiwa inti dalam ayat pertama.
- ### Punca utama / Peristiwa penting — senarai bernombor fakta (nasionalisme, imperialisme, sekutu, dll.).
- Perenggan pendek antara bahagian dibenarkan; bukan esei meta tanpa tajuk.
- DILARANG: MASA, TENAGA, RUANG, weave kerangka pada penutup.
- Tutup: jemputan kedalaman (kesan perang, Tanah Melayu) — tanpa kerangka.
`.trim();

/** Shared technical display — science, history, algebra α turns. */
export const ADAM_ALPHA_TECHNICAL_KONVENSIONAL_DISPLAY_LAW = `
ADAM-α PAPARAN TEKNIKAL + ESEI = C (mandatory this turn):
${ADAM_TECHNICAL_ESSENCE_LAW}
`.trim();

/** Pick generation law for α turns — one technical channel for substantive explain/teach. */
export function buildAdamAlphaGenerationLaw(
  message: string,
  options?: { isFounder?: boolean },
): string {
  const isFounder = options?.isFounder === true;
  if (isDirectTechnicalHowToQuestion(message)) {
    return `${ADAM_ALPHA_REPLY_LAW}\n\n${ADAM_DIRECT_TECHNICAL_REPLY_LAW}`;
  }
  if (isFounder || !isAdamTechnicalKonvensionalDisplayTurn(message)) {
    if (isAdamAlgorithmTeachingTurn(message)) {
      return `${ADAM_ALPHA_REPLY_LAW}\n\n${ADAM_ALPHA_ALGORITHM_TEACHING_LAW}`;
    }
    return ADAM_ALPHA_REPLY_LAW;
  }
  const historyHint = isAdamHistorySynthesisTurn(message)
    ? `\n\n${ADAM_ALPHA_HISTORY_REPLY_LAW}`
    : '';
  const algebraHint = isAdamLinearAlgebraTurn(message)
    ? `\n\n${ADAM_ALPHA_ALGEBRA_REPLY_LAW}`
    : '';
  return `${ADAM_ALPHA_REPLY_LAW}${historyHint}${algebraHint}\n\n${ADAM_ALPHA_TECHNICAL_KONVENSIONAL_DISPLAY_LAW}`;
}
