/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Technical Precision Grounding (universal)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Universal technical precision — one policy for every domain.
 * No per-product hardcoding. Search + honest markers govern all specs.
 */

import type { LlmMessage } from '../llm/llm-types';
import { isTechnicalPrecisionQuestion, userOpenedFaithDoor } from './adam-universal-voice';

export interface TechnicalPrecisionTurnContext {
  /** Apply technical mandate, forced search, and output guards. */
  isActive: boolean;
  /** Current message alone did not match — inherited from recent technical thread. */
  isFollowUp: boolean;
  /** Text used for grounding, guards, and forced-search detection. */
  precisionText: string;
}

const TECHNICAL_FOLLOW_UP_CUE =
  /^(?:dan\s+)?(?:yang\s+)?(?:exclusive|elite|standard|pro|max|plus|premium|manual|auto|automatik|pula|juga|tu\s*plk|itu\s*plk|yang\s+tu|the\s+other|what\s+about|how\s+about|berapa\s+lg|bandingkan|compare|kelajuan|transmisi|tork|torque|spek|spesifikasi)\b/i;

const TECHNICAL_FOLLOW_UP_BLOCK = `
TECHNICAL FOLLOW-UP TURN:
The student's message continues an earlier specification thread in this session.
Run web search again for this follow-up — do not rely on memory from the prior turn alone.
Use conversation context only to understand what is being compared; numbers must come from fresh search.
`.trim();

export const SEARCH_UNAVAILABLE_USER_NOTE =
  'Catatan: Carian web tidak tersedia pada giliran ini (penapis kandungan platform). '
  + 'Sebarang angka teknikal di bawah mungkin tidak disahkan sepenuhnya — sila rujuk sumber rasmi atau hantar semula.';

const TECHNICAL_PRECISION_MANDATE = `
TECHNICAL PRECISION TURN — UNIVERSAL POLICY (all domains):

This turn requires verifiable facts. Accuracy comes before voice, philosophy, or metaphor.

MANDATORY WORKFLOW:
1. Run web search BEFORE stating numbers, formulas, dosages, specs, rates, dates, or comparisons.
2. Open with the direct technical answer from search — numbers with correct units, table, or bullets.
3. Search results govern. Memory, trim names, and analogy do NOT substitute for missing data.
4. If search is inconclusive: say so — := 0 SUSPENDED or an honest verified range only. Never fake precision.
5. Model/trim/package/variant names describe equipment or marketing — NOT different engineering unless search proves it.
6. Cite only sources that appeared in search: title and domain. Omit year/volume if search did not provide them.

APPLIES UNIVERSALLY (examples, not an exhaustive list):
- Automotive, machines, appliances
- Medicine, dosage, clinical ranges (not personal diagnosis)
- Chemistry, physics, constants, equations
- Biology, nutrition, lab values
- Electronics, computing, APIs, standards
- Engineering, construction, materials
- Finance, pricing, rates when factually asked

DIMENSION FIDELITY (universal — any product, any domain):
- The student named measurable dimensions (units, specs, rates). Answer in those dimensions first.
- Do not swap to category-guessing, spelling theories, or "what did you really mean" essays.
- Search for the model/variant/year the student named — then state verified numbers or an honest gap.

FORBIDDEN on every technical turn:
- Philosophical or MASA/TENAGA prelude instead of the technical answer
- Confident precise figures without search backing
- Invented journals, bulletins, report numbers, Vol./Issue, or statistics
- "Saya telah menjalankan carian" followed by fabricated document IDs
- Deflection ramble instead of search-backed specs (reinterpretation, "tiada rekod", possibility lists)
`.trim();

const TECHNICAL_ANSWER_STRUCTURE = `
TECHNICAL ANSWER STRUCTURE (use for ANY spec question):

1. One-sentence direct answer with the key figure(s) and units.
2. Short table or bullets if comparing variants, models, or conditions.
3. Clarify what is the same vs different (e.g. trim vs engine, manual vs auto) — only from search.
4. Source line: domain/title from search only — never invent bulletin or report numbers.
5. Optional plain-language insight AFTER facts — brief, never instead of them.
6. One honest follow-up question if useful — not a lecture close.
`.trim();

/** Recent user lines from LLM context (oldest → newest), excluding the current turn. */
export function extractRecentUserTurns(
  contextMessages: LlmMessage[],
  limit = 3,
): string[] {
  const users = contextMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.replace(/^\[[^\]]+\]:\s*/, '').trim())
    .filter(Boolean);
  if (users.length <= 1) return [];
  return users.slice(-(limit + 1), -1);
}

/** True when a short message continues a prior technical specification thread. */
export function isTechnicalFollowUpMessage(
  message: string,
  recentUserMessages: string[],
): boolean {
  const t = message.trim();
  if (!t || isTechnicalPrecisionQuestion(t)) return false;
  if (!recentUserMessages.some((m) => isTechnicalPrecisionQuestion(m))) return false;
  if (TECHNICAL_FOLLOW_UP_CUE.test(t)) return true;
  return t.length <= 48;
}

/** Resolve whether this turn is a technical precision turn (direct or follow-up). */
export function resolveTechnicalPrecisionTurn(
  currentMessage: string,
  recentUserMessages: string[],
): TechnicalPrecisionTurnContext {
  const current = currentMessage.trim();
  const isDirect = isTechnicalPrecisionQuestion(current);
  const isFollowUp = !isDirect && isTechnicalFollowUpMessage(current, recentUserMessages);
  const isActive = isDirect || isFollowUp;
  const anchor = recentUserMessages[recentUserMessages.length - 1] ?? '';
  const precisionText = isFollowUp && anchor
    ? `${anchor}\n${current}`
    : current;
  return { isActive, isFollowUp, precisionText };
}

/** System prompt block injected on technical precision turns. */
export function buildFactualGroundingPromptBlock(
  message: string,
  options?: { recentUserMessages?: string[] },
): string {
  const ctx = resolveTechnicalPrecisionTurn(
    message,
    options?.recentUserMessages ?? [],
  );
  if (!ctx.isActive) return '';
  const parts = [TECHNICAL_PRECISION_MANDATE, TECHNICAL_ANSWER_STRUCTURE];
  if (ctx.isFollowUp) parts.push(TECHNICAL_FOLLOW_UP_BLOCK);
  return parts.join('\n\n');
}

/** Whether DashScope should force search this turn. */
export function shouldForceWebSearchForTechnicalTurn(
  message: string,
  options?: { recentUserMessages?: string[] },
): boolean {
  return resolveTechnicalPrecisionTurn(
    message,
    options?.recentUserMessages ?? [],
  ).isActive;
}

/** Prepend honest notice when web search was dropped mid-turn. */
export function prependSearchUnavailableNotice(
  text: string,
  options: { technicalTurn: boolean; searchWasDropped: boolean },
): string {
  void options;
  return text;
}

/** @deprecated Use shouldForceWebSearchForTechnicalTurn */
export const shouldForceWebSearchForFactualTurn = shouldForceWebSearchForTechnicalTurn;

/** Hedge word + precise unit — universal guess pattern. */
const TECHNICAL_GUESS_WITH_NUMBER =
  /\b(?:mungkin|biasanya|kemungkinan|contohnya|anggaran|sekitar|around|approximately|roughly)\b[^.\n]{0,60}\b\d+[\d.,]*\s*(?:nm|cc|hp|ps\b|watt|w\b|mg|ml|km\/?l|mah|gb|v\b|a\b|°c|kcal|kalori|rpm|mol|ppm|mmhg|kpa|bar|psi|mhz|ghz)\b/i;

const TECHNICAL_NUMBER_UNIT =
  /\b\d+[\d.,]*\s*(?:nm|cc|hp|ps\b|watt|w\b|mg|ml|km\/?l|mah|gb|v\b|a\b|°c|kcal|kalori|rpm|mol|ppm|mmhg|kpa|bar|psi|mhz|ghz)\b/i;

/** True uncertainty markers — strip hedge + number entirely. */
const STRONG_GUESS_MARKERS =
  /\b(?:mungkin|biasanya|kemungkinan|contohnya|anggaran)\b/i;

function redactHedgedNumberPhrases(paragraph: string): string {
  const re = new RegExp(TECHNICAL_GUESS_WITH_NUMBER.source, 'gi');
  let changed = false;
  const out = paragraph.replace(re, (match) => {
    changed = true;
    const numUnit = match.match(TECHNICAL_NUMBER_UNIT);
    if (!numUnit) return '';
    if (STRONG_GUESS_MARKERS.test(match)) return '';
    return numUnit[0];
  });
  if (!changed) return paragraph;
  return out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
}

/** Invented authority documents with fabricated IDs — any domain. */
const INVENTED_TECHNICAL_DOCUMENT =
  /\b(?:technical\s+bulletin|service\s+bulletin|vehicle\s+dynamics\s+report|engineering\s+report|datasheet|white\s+paper)\b[^.\n]{0,50}\bno\.?\s*[a-z0-9][-a-z0-9]+\b/i;

/** Bulletin codes without "No." (e.g. Technical Bulletin V10-2008). */
const INVENTED_BULLETIN_CODE =
  /\btechnical\s+bulletin\s+v?\d+-\d+/i;

/** Stacked "official" sources that models invent together on spec answers. */
const INVENTED_OFFICIAL_SOURCE_STACK =
  /\b(?:manual\s+pemilik|laporan\s+ujian\s+miros|technical\s+bulletin|dokumen\s+teknikal\s+rasmi)\b/i;

/** Confident tone markers on paragraphs that also state precise specs. */
const CONFIDENT_UNVERIFIED_TONE =
  /\b(?:ini\s+bukan\s+anggaran|sudah\s+dibincangkan|jawapannya\s+tetap\s+sama|nilai\s+yang\s+diukur\s+secara\s+fizikal|data\s+teknikal\s+rasmi)\b/i;

const PRECISE_SPEC_UNITS =
  /\b\d+[\d.,]*\s*(?:nm|ps\b|hp\b)\b|\b\d+[\d.,]*\s*nm\s*@\s*\d/i;

function paragraphIsConfidentUnverifiedSpecs(paragraph: string): boolean {
  return CONFIDENT_UNVERIFIED_TONE.test(paragraph) && PRECISE_SPEC_UNITS.test(paragraph);
}

/** Fabricated journal citations with vol/issue detail. */
const INVENTED_JOURNAL_CITATION =
  /\b(?:nature|lancet|nejm|harvard|who|max\s+planck|ieee|springer)\b[^.\n]{0,80}\b(?:vol\.|volume|issue|iss\.)\s*\d+/i;

function paragraphHasInventedSourceStack(paragraph: string): boolean {
  const matches = paragraph.match(INVENTED_OFFICIAL_SOURCE_STACK);
  return (matches?.length ?? 0) >= 2;
}

function paragraphHasInventedSourceStackOrFalseVerified(paragraph: string): boolean {
  return paragraphHasInventedSourceStack(paragraph)
    || paragraphClaimsFalseSearchVerification(paragraph);
}

const HAS_VERIFIED_STYLE_NUMBER =
  /\b\d+[\d.,]*\s*(?:nm|ps|hp|mg|ml|pH|ppm|km\/h|km\/j|kW|cc|rpm)\b/i;

/** Model claims search verified specs — strip when verification gate already failed. */
export const FALSE_SEARCH_VERIFIED_CLAIM =
  /\b(?:disahkan\s+melalui\s+carian|carian\s+web\s+terkini|carian\s+semasa|berdasarkan\s+carian\s+semasa|data\s+teknikal\s+yang\s+disahkan|berdasarkan\s+spesifikasi\s+rasmi|ini\s+berdasarkan\s+spesifikasi|saya\s+telah\s+(?:men)?jalankan\s+carian|(?:men)?jalankan\s+carian\s+(?:web\s+)?(?:khusus|terkini)?|telah\s+(?:men)?jalankan\s+carian|berdasarkan\s+sumber\s+rasmi|laporan\s+teknikal\s+terverifikasi|spesifikasi\s+rasmi\s+\w+|hasil\s+pengesahan|pengesahan\s+daripada\s+sumber|hasil\s+carian\s+yang\s+sah|tiada\s+rekod\s+rasmi|sah\s+dan\s+diverifikasi|data\s+di\s+atas\s+adalah\s+sah|carian\s+khusus\s+untuk|saya\s+akan\s+cari\s+semula)\b/i;

export function paragraphClaimsFalseSearchVerification(paragraph: string): boolean {
  if (FALSE_SEARCH_VERIFIED_CLAIM.test(paragraph)) return true;
  if (/^Sumber\s*:/i.test(paragraph.trim())) return true;
  if (/\bsaya\s+telah\s+(?:men)?jalankan\s+carian\b/i.test(paragraph)) return true;
  if (/\btelah\s+(?:men)?jalankan\s+carian\b/i.test(paragraph)) return true;
  if (/\bberdasarkan\s+sumber\s+rasmi\b/i.test(paragraph)) return true;
  if (/\bspesifikasi\s+rasmi\b/i.test(paragraph) && /\b(?:carian|sumber|terverifikasi|enjin|tork)\b/i.test(paragraph)) {
    return true;
  }
  const links = paragraph.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g) ?? [];
  return links.length >= 2
    && /\b(?:official|brochure|specification|spesifikasi|review)\b/i.test(paragraph);
}

/** Promises valid search results but delivers no verified picu — strip after failed verification. */
export function paragraphIsHollowSearchResultTeaser(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (HAS_VERIFIED_STYLE_NUMBER.test(t)) return false;
  if (/\b(?:berikut|di\s+bawah)\b[^.\n]{0,60}\b(?:hasil\s+(?:carian|pengesahan)|pengesahan\s+daripada|carian\s+yang\s+sah)\b/i.test(t)) return true;
  if (/^Berikut\s+(?:adalah\s+)?(?:hasil\s+(?:carian|pengesahan)|ringkasan|perbandingan)/i.test(t)) return true;
  if (/^Saya\s+sedia\s+bantu\b/i.test(t)) return true;
  if (/\b(?:angka\s+sah|bukan\s+anggaran)\b/i.test(t) && !HAS_VERIFIED_STYLE_NUMBER.test(t)) return true;
  return false;
}

/**
 * Model dodges a spec ask with reinterpretation / clarification menus — no product lists.
 * Only strips hollow paragraphs (no verified measurement in the paragraph).
 */
export function paragraphIsTechnicalAskDeflection(paragraph: string): boolean {
  if (HAS_VERIFIED_STYLE_NUMBER.test(paragraph)) return false;
  return /\bkelihatan\s+merujuk\s+kepada\b/i.test(paragraph)
    || /\btiada\s+rekod\s+rasmi\b/i.test(paragraph)
    || /^Namun,\s*berdasarkan\b/i.test(paragraph)
    || /^Beberapa\s+kemungkinan\b/i.test(paragraph)
    || /^Bolehkah\s+anda\s+nyatakan\b/i.test(paragraph)
    || /\bApakah\s+jenis\s+.+\s+yang\s+dimaksudkan\b/i.test(paragraph)
    || (
      /\b(?:salah\s+eja|salah\s+sebut)\b/i.test(paragraph)
      && /\b(?:mungkin|boleh\s+jadi)\b/i.test(paragraph)
    );
}

export function paragraphIsEpistemicFrameworkLeak(paragraph: string): boolean {
  return /\bsetiap\s+nama,\s*angka,\s*dan\s+pola\s+ada\s+maksud/i.test(paragraph)
    || /\bkebenaran\s+teknikal\s+mesti\s+bermula\s+dari\s+realiti\b/i.test(paragraph)
    || /^Dalam\s*,\s*setiap\s+nama/i.test(paragraph.trim());
}

export function paragraphIsSpeculativePossibilitiesList(paragraph: string): boolean {
  const t = paragraph.trim();
  if (HAS_VERIFIED_STYLE_NUMBER.test(t)) return false;
  return /^Ini\s+mungkin\s+nama\s+kod\b/i.test(t);
}

/** Universal strip set after verification catatan (no brand names). */
export function paragraphShouldStripAfterVerificationFailure(
  paragraph: string,
  userMessage = '',
  recentUserMessages: string[] = [],
): boolean {
  return paragraphClaimsFalseSearchVerification(paragraph)
    || paragraphIsPassiveStudentMenu(paragraph)
    || paragraphIsHollowPerformanceOffer(paragraph)
    || paragraphIsHollowSearchResultTeaser(paragraph)
    || paragraphIsTechnicalAskDeflection(paragraph)
    || paragraphIsEpistemicFrameworkLeak(paragraph)
    || paragraphIsSpeculativePossibilitiesList(paragraph)
    || /^Soalan\s+anda\./i.test(paragraph.trim())
    || /\bSaya\s+di\s+sini\.?\s*bersama\s+anda\b/i.test(paragraph)
    || /\blangkah\s+demi\s+langkah\b/i.test(paragraph);
}

export const TECHNICAL_GUESS_NOTE =
  'Catatan: Angka teknikal yang tidak disahkan telah dibuang. '
  + 'Nilai tepat hendaklah dirujuk pada sumber rasmi atau hasil carian web yang disahkan.';

export const INVENTED_CITATION_NOTE =
  'Catatan: Rujukan dokumen atau angka yang tidak disahkan oleh carian web telah dibuang. '
  + 'Sila rujuk sumber rasmi atau hantar semula supaya ADAM boleh cari data terkini.';

/** Single user-facing note when multiple verification layers fire on one turn. */
export const UNIFIED_VERIFICATION_CATATAN =
  'Catatan: Saya belum dapat mengesahkan angka spesifik pada carian ini — '
  + 'tuntutan tanpa bukti web telah dibuang supaya jawapan kekal jujur.';

const PRECISION_COMPARE_CUE =
  /\b(?:beza|bezaan|perbezaan|banding|compare|berbanding|vs\.?|versus|varian|variant|trim)\b/i;

/** Two distinguishable spec anchors (e.g. 2.5 dengan 2.0) — universal, no brand lists. */
const PRECISION_TWO_VARIANT_ANCHOR =
  /\b\d[\d.]*\s*(?:l|cc|kw|hp|ps)?\b[^.\n]{0,50}\b(?:dengan|dan|vs\.?|versus|berbanding|against)\b[^.\n]{0,50}\b\d[\d.]*\b/i;

const PRECISION_YEAR_ANCHOR = /\b(?:19|20)\d{2}\b/;

/** User already named model + variant/compare — do not ask them to retype the same question. */
export function precisionAskAlreadyAnchored(precisionText: string): boolean {
  const t = precisionText.trim();
  if (!t) return false;
  if (PRECISION_YEAR_ANCHOR.test(t)) return true;
  if (PRECISION_TWO_VARIANT_ANCHOR.test(t)) return true;
  if (/\b(?:beza|bezaan|perbezaan|vs\.?|versus|berbanding)\b/i.test(t)) return true;
  if (/\b(?:banding|compare)\b/i.test(t) && PRECISION_COMPARE_CUE.test(t)) return true;
  return false;
}

/** Direct next step when verification gate removes unverified technical content. */
function echoPrecisionAsk(precisionText: string, maxLen = 80): string {
  const oneLine = precisionText.replace(/\s+/g, ' ').trim();
  if (!oneLine) return 'soalan teknikal anda';
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen - 1)}…`;
}

export function buildTechnicalVerificationFallback(
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  const ctx = resolveTechnicalPrecisionTurn(userMessage, recentUserMessages);
  const askEcho = echoPrecisionAsk(ctx.precisionText);
  const asksTorque = /\b(?:tork|torque)\b/i.test(ctx.precisionText);
  const asksCompare = PRECISION_COMPARE_CUE.test(ctx.precisionText);
  const unitHint = asksTorque ? 'angka tork' : 'angka';
  const anchored = precisionAskAlreadyAnchored(ctx.precisionText);

  if (anchored) {
    if (asksCompare) {
      return `Saya tidak dapat mengesahkan ${unitHint} daripada carian web pada giliran ini. Tambah **tahun keluaran** jika anda tahu — saya cuba carian semula.`;
    }
    return `Saya tidak dapat mengesahkan ${unitHint} daripada carian web pada giliran ini. Tambah **tahun atau kod model** jika ada — saya cuba carian semula.`;
  }

  if (asksCompare) {
    return [
      'Taip semula dengan **tahun, kod model, dan varian tepat** —',
      `contoh format: «${askEcho} (tahun, varian A vs varian B)» —`,
      `saya cari semula dan jawab dengan ${unitHint} yang disahkan.`,
    ].join(' ');
  }

  return [
    'Taip semula dengan **konteks tepat** (model, tahun, unit, atau keadaan ujian) —',
    `contoh: «${askEcho}» — saya cari semula dan jawab dengan ${unitHint} yang disahkan.`,
  ].join(' ');
}

const VERIFICATION_CATATAN_PREFIX = /^Catatan:\s/m;

/** Remove internal Catatan paragraphs — never shown to students (gates stay silent). */
export function stripUserFacingCatatan(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !VERIFICATION_CATATAN_PREFIX.test(p))
    .join('\n\n')
    .trim();
}

/** Strip Catatan blocks from pipeline text (legacy name — no merge into user output). */
export function consolidateVerificationCatatan(text: string): string {
  return stripUserFacingCatatan(text);
}

const BISMILLAH_ONLY_PARAGRAPH = /^\s*Bismillah(?:irahmanirrahim)?\.?\s*$/i;

/** Universal passive menus — no brand names; sales/compare deflection after failed verification. */
const PASSIVE_STUDENT_MENU =
  /\bAdakah\s+anda\s+(?:ingin|sedang\s+mempertimbangkan)\b|\bAtau\s+jika\s+anda\s+ingin\s+bandingkan\b|\batau\s+ingin\s+membanding|\bJika\s+anda\s+ingin\s+saya\s+bandingkan\b|\bBolehkah\s+anda\s+nyatakan\b|\bmodel\s+lain\b|\bmempertimbangkan\s+pembelian\b|\b0[\s–-]100\s*km|\bpenggunaan\s+bahan\s+api\b|\bsaya\s+boleh\s+bantu\s+dengan\s+detail\b|\bSaya\s+akan\s+cari\s+semula\b/i;

export function paragraphIsPassiveStudentMenu(paragraph: string): boolean {
  return PASSIVE_STUDENT_MENU.test(paragraph);
}

function paragraphIsHollowPerformanceOffer(paragraph: string): boolean {
  if (HAS_VERIFIED_STYLE_NUMBER.test(paragraph)) return false;
  return /\b(?:prestasi\s+sebenar|0[\s–-]100\s*km|penggunaan\s+bahan\s+api)\b/i.test(paragraph)
    && /\b(?:saya\s+boleh\s+bantu|perbandingan\s+dengan|model\s+lain)\b/i.test(paragraph);
}

/** Final student output — strip bad claims; no Catatan prefix (silent gate). */
export function finalizeVerificationGatedOutput(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  const faithOk = userOpenedFaithDoor(userMessage);
  const precision = resolveTechnicalPrecisionTurn(userMessage, recentUserMessages);
  const filtered = stripUserFacingCatatan(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => {
      if (!faithOk && BISMILLAH_ONLY_PARAGRAPH.test(p)) return false;
      if (paragraphShouldStripAfterVerificationFailure(p, userMessage, recentUserMessages)) return false;
      return true;
    });

  if (filtered.length === 0) {
    return '';
  }
  const joined = filtered.join('\n\n');
  if (
    precision.isActive
    && !HAS_VERIFIED_STYLE_NUMBER.test(joined)
    && !/\b\d+[\d.,]*/.test(joined)
  ) {
    return '';
  }
  return joined;
}

function stripParagraphsMatching(
  text: string,
  patterns: RegExp[],
): { text: string; stripped: boolean } {
  const paragraphs = text.split(/\n{2,}/);
  const kept: string[] = [];
  let stripped = false;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (patterns.some((re) => re.test(trimmed))) {
      stripped = true;
      continue;
    }
    kept.push(trimmed);
  }

  return { text: kept.join('\n\n').trim(), stripped };
}

function isTechnicalPrecisionContext(
  userMessage: string,
  recentUserMessages: string[],
): boolean {
  return resolveTechnicalPrecisionTurn(userMessage, recentUserMessages).isActive;
}

/** Remove hedged invented numbers on technical questions. */
export function stripTechnicalGuessHallucination(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  if (!isTechnicalPrecisionContext(userMessage, recentUserMessages)) return text;

  const paragraphs = text.split(/\n{2,}/);
  const kept: string[] = [];
  let stripped = false;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const redacted = redactHedgedNumberPhrases(trimmed);
    if (redacted !== trimmed) stripped = true;
    if (redacted) kept.push(redacted);
  }

  if (!stripped) return text;
  return kept.join('\n\n').trim();
}

/** Remove invented bulletins, reports, or journal vol/issue on technical questions. */
export function stripInventedTechnicalCitations(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  if (!isTechnicalPrecisionContext(userMessage, recentUserMessages)) return text;

  const paragraphs = text.split(/\n{2,}/);
  const kept: string[] = [];
  let stripped = false;
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (
      INVENTED_TECHNICAL_DOCUMENT.test(trimmed)
      || INVENTED_BULLETIN_CODE.test(trimmed)
      || INVENTED_JOURNAL_CITATION.test(trimmed)
      || paragraphIsConfidentUnverifiedSpecs(trimmed)
      || paragraphHasInventedSourceStackOrFalseVerified(trimmed)
    ) {
      stripped = true;
      continue;
    }
    kept.push(trimmed);
  }
  const body = kept.join('\n\n').trim();
  if (!stripped) return text;
  return body;
}

/** Universal post-stream sanitize for technical precision turns. */
export function sanitizeTechnicalPrecisionOutput(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  let out = text;
  out = stripInventedTechnicalCitations(out, userMessage, recentUserMessages);
  out = stripTechnicalGuessHallucination(out, userMessage, recentUserMessages);
  return out;
}
