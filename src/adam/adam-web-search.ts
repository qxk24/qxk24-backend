/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Web Search Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * Updated     : 2026-06-09 — Fasa 3 shared search prompt base
 * ============================================================
 */

import { ENV } from '../config/environments';
import { parseQuranAyahRefs } from '../quran/quran-ayah-parser';
import { isUserEntityCorrectionMessage } from './adam-factual-grounding';
import {
  isAdamLayer1WritingChatTurn,
  isAdamLifeWellbeingTurn,
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamRelationalPersonalTurn,
  isAdamSimpleArithmeticTurn,
  isAdamTeachingDepthTurn,
  isAdamUserCoachingHelpTurn,
  isAdamUserGuidanceCoachingTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import { userUmumPerlaksanaanTurnActive } from './adam-universal-scholar';
import { isAdamPedagogyKonvensionalTurn } from './adam-domain-detectors';
import { isAdamMarketPricingTurn } from './adam-market-pricing';
import { isDirectTechnicalHowToQuestion } from './adam-direct-technical-law';
import { isTechnicalPrecisionQuestion } from './adam-universal-voice';
import { extractDomainsFromMessageUrls, messageAsksRoleAndSkills } from './adam-official-source-enrich';
import { buildFounderWebSearchPrompt, buildStudentWebSearchPrompt } from './adam-web-search-prompts';
import { extractDashScopeApiHost, isDashScopeIntlHost } from '../llm/dashscope-search';

export { ADAM_STUDENT_REPLY_PIPELINE } from './adam-search-first';

export {
  ADAM_CITATION_HONESTY,
  ADAM_SEARCH_WHEN_TO,
  ADAM_WEB_SEARCH_FOUNDATION,
  buildFounderWebSearchPrompt,
  buildStudentWebSearchPrompt,
  FOUNDER_SEARCH_INSTRUCTION,
  FOUNDER_TEACHING_SEARCH_INSTRUCTION,
  FOUNDER_TEACHING_SYNTHESIS_SEARCH_INSTRUCTION,
  STUDENT_ENTITY_CORRECTION_SEARCH_INSTRUCTION,
  STUDENT_PREFETCHED_SEARCH_INSTRUCTION,
  STUDENT_SEARCH_INSTRUCTION,
  STUDENT_TECHNICAL_PRECISION_SEARCH_INSTRUCTION,
} from './adam-web-search-prompts';

// ── Explicit user request to search ─────────────────────────────────────────
const EXPLICIT_WEB_SEARCH =
  /\b(cuba\s+search|carian\s+web|search\s+the\s+web|web\s+search|google|mencari\s+(?:di\s+)?internet|search\s+online|search\s+tentang)\b/i;

/** User asks for latest data, verification, or fresh study — search even when C exists. */
const EXPLICIT_FRESHNESS =
  /\b(latest|terbaru|new\s+study|kajian\s+terbaru|verify|sahkan|confirm|double[\s-]?check|most\s+recent|kemaskini|updated|202[4-9])\b/i;

/** Gate reasons that require factual web grounding before ADAM answers. */
export const FACTUAL_ADAM_WEB_SEARCH_GATE_REASONS = new Set([
  'explicit_search',
  'current_affairs',
  'technical_follow_up',
  'technical_precision',
  'entity_correction',
  'verified_data_stat',
  'substantive_conventional',
  'factual_question',
]);

export function isFactualAdamWebSearchGateReason(reason: string | null): boolean {
  return reason !== null && FACTUAL_ADAM_WEB_SEARCH_GATE_REASONS.has(reason);
}

/** Institutional / enrollment figures — always verify on web, never brain-only. */
const VERIFIED_DATA_STAT_ASK =
  /\b(?:jumlah|bilangan|berapa\s+(?:ramai\s+)?(?:orang|pelajar|murid|siswa|kakitangan|staff)|statistik|statistic|enrollment|maklumat\s+(?:jumlah|rasmi)|official\s+(?:figure|number|data)|data\s+(?:rasmi|terkini)|total\s+students?)\b/i;

export function isVerifiedDataStatAsk(message: string): boolean {
  const body = stripLeadingAdamSalutation(message.trim());
  if (isAdamSimpleArithmeticTurn(body)) return false;
  return VERIFIED_DATA_STAT_ASK.test(body);
}

// ── Pure opinion / reflection — no external data needed ─────────────────────
const PURE_REFLECTION =
  /^(apa\s+pendapat|apa\s+pandangan|apa\s+perasaan|what\s+do\s+you\s+think|how\s+do\s+you\s+feel|tell\s+me\s+about\s+yourself|siapa\s+kamu|who\s+are\s+you)\b/i;

// ── Current office-holders, news, dates — search before answering ───────────
const CURRENT_AFFAIRS =
  /\b(current|latest|today|presiden|president|prime minister|menteri|who is the|siapa presiden|siapa(?:lah)?\s+presiden|pemerintah|cabinet|in office)\b/i;

/** Temporal words alone — only current affairs when paired with news/office context, not personal coaching. */
const CURRENT_AFFAIRS_TEMPORAL =
  /\b(now|sekarang|kini)\b/i;

const PERSONAL_ACTION_NOW_ASK =
  /\b(?:apa\s+(?:yang\s+)?(?:perlu|patut)|langkah\s+seterusnya|nak\s+mula|what\s+should\s+i|where\s+(?:do\s+i|should\s+i)\s+start|buat|lakukan|mula)\b/i;

/** Personal guidance — inline only (avoid circular import with practical-advisory). */
const USER_GUIDANCE_COACHING_INLINE =
  /\b(?:apa\s+(?:yang\s+)?(?:perlu|patut)\s+(?:saya|aku)\s+(?:buat|lakukan)|belum\s+tahu\s+(?:nak\s+)?mula|perlukan?\s+bimbingan|nak\s+mula\s+dari\s+mana|what\s+should\s+i\s+do|saya\s+boleh\s+memasak|kueh\s+melayu)\b/i;

/** True when message asks for live news/office data — not "what should I do now?". */
export function isAdamCurrentAffairsTurn(message: string): boolean {
  const text = stripLeadingAdamSalutation(message.trim());
  if (!text) return false;
  if (USER_GUIDANCE_COACHING_INLINE.test(text)) return false;
  if (PERSONAL_ACTION_NOW_ASK.test(text) && CURRENT_AFFAIRS_TEMPORAL.test(text)) return false;
  if (CURRENT_AFFAIRS.test(text)) return true;
  if (CURRENT_AFFAIRS_TEMPORAL.test(text)) return true;
  return false;
}

// ── Founder comparing own in-session teaching ────────────────────────────────
const FOUNDER_OWN_TEACHING =
  /\b(banding|bandingkan|compare|comparison)\b/i;
const FOUNDER_SESSION_REF =
  /\b(saya|p\.?alt|panduan|penjelasan|teaching|mengajar|dalam\s+sesi|tadi|just\s+now|earlier)\b/i;

/** Whether search is enabled globally via env config */
export function adamWebSearchEnabled(): boolean {
  return ENV.QWEN_ENABLE_SEARCH;
}

/** @deprecated Use adamWebSearchEnabled */
export const founderWebSearchEnabled = adamWebSearchEnabled;

export function getAdamWebSearchPrompt(
  isFounder = true,
  options?: {
    founderTeachingSynthesis?: boolean;
    founderTeachingAbsorption?: boolean;
    userMessage?: string;
    recentUserMessages?: string[];
    /** Search-first flow — prefetch already injected into system context. */
    searchPrefetched?: boolean;
    /** Institutional enrollment / official statistics — forced live search. */
    verifiedDataStat?: boolean;
  },
): string {
  if (!isFounder) {
    if (options?.searchPrefetched) {
      return buildStudentWebSearchPrompt('prefetched');
    }
    if (options?.verifiedDataStat) {
      return buildStudentWebSearchPrompt('verified_data_stat');
    }
    return buildStudentWebSearchPrompt('agent_default');
  }

  if (options?.founderTeachingSynthesis) {
    return buildFounderWebSearchPrompt('teaching_synthesis');
  }
  if (options?.founderTeachingAbsorption) {
    return buildFounderWebSearchPrompt('teaching_absorption');
  }
  return buildFounderWebSearchPrompt('default');
}

/** @deprecated Use getAdamWebSearchPrompt */
export const getFounderWebSearchPrompt = getAdamWebSearchPrompt;

/** DashScope search_options passed to API */
export function buildQwenSearchOptions(
  forcedSearch = false,
  options?: { assignedSites?: string[]; searchStrategy?: string },
): Record<string, unknown> {
  const strategy = normalizeDashScopeSearchStrategy(options?.searchStrategy);
  const searchOptions: Record<string, unknown> = {
    search_strategy: strategy,
    forced_search:   forcedSearch,
  };
  if (ENV.QWEN_SEARCH_ENABLE_CITATION) {
    searchOptions.enable_citation = true;
  }
  searchOptions.enable_source = true;
  if (ENV.QWEN_SEARCH_PREPEND_RESULTS) {
    searchOptions.prepend_search_result = true;
  }
  const sites = options?.assignedSites?.map((s) => s.trim()).filter(Boolean).slice(0, 25);
  if (sites?.length) {
    searchOptions.assigned_site_list = sites;
  }
  return searchOptions;
}

/** Optional DashScope site focus — only hostnames from URLs pasted in the question. */
export function buildVerifiedDataStatSearchSites(message: string): string[] | undefined {
  const domains = extractDomainsFromMessageUrls(message);
  return domains.length > 0 ? domains : undefined;
}

/** DashScope site focus for career factual asks — prefer official hosts by locale/topic. */
export function buildFactualCareerSearchSites(message: string): string[] | undefined {
  const body = stripLeadingAdamSalutation(message.trim());
  const careerAsk = messageAsksRoleAndSkills(body) || isAdamPracticalAdvisoryTurn(body);
  if (!careerAsk) return undefined;
  if (/\b(?:registered nurse|nursing|nurse|midwife|healthcare career|jururawat)\b/i.test(body)) {
    return ['healthcareers.nhs.uk', 'nhs.uk', 'who.int'];
  }
  if (/\b(?:guru|sekolah|murid|pendidikan|kurikulum|karier|peranan|kemahiran)\b/i.test(body)) {
    return ['moe.gov.my', 'gov.my'];
  }
  if (/\b(?:salam|berapa|apakah|jelaskan|terangkan)\b/i.test(body)) {
    return ['gov.my', 'moe.gov.my'];
  }
  return ['gov.uk', 'nhs.uk', 'who.int'];
}

/** DashScope search strategy for stat prefetch — agent on intl (max returns China-index hits). */
export function resolveVerifiedDataStatSearchStrategy(): string {
  return 'agent';
}

/** Map legacy "max" to agent on intl — prevents China-web index on global factual turns. */
export function normalizeDashScopeSearchStrategy(
  strategy: string | undefined,
  nativeHost?: string,
): string {
  const raw = strategy?.trim() || ENV.QWEN_SEARCH_STRATEGY;
  const host = nativeHost?.trim() || extractDashScopeApiHost(ENV.QWEN_API_BASE);
  if (isDashScopeIntlHost(host) && raw === 'max') return 'agent';
  return raw;
}

/** Inline Qwen search — force retrieval when live factual data must not be skipped. */
export function shouldForceWebSearchForGateReason(reason: string | null): boolean {
  return isFactualAdamWebSearchGateReason(reason);
}

/** User explicitly wants fresh verification — overrides brain-first skip. */
export function isExplicitFreshnessRequest(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return EXPLICIT_FRESHNESS.test(text) || EXPLICIT_WEB_SEARCH.test(text);
}

export interface BrainFirstSearchSkipInput {
  message:              string;
  brainRecallLoaded:    boolean;
  technicalFollowUp?:   boolean;
}

/**
 * Gold Standard default — search runs on every substantive turn even when Brain C recall loaded.
 * Brain-first search skip is disabled so live evidence always grounds α figures and β Phase 1B.
 */
export function shouldSkipSearchWhenRecallHitStableTopic(
  _input: BrainFirstSearchSkipInput,
): boolean {
  return false;
}

/**
 * Gate web search per turn.
 *
 * Philosophy: ADAM should search on factual questions that benefit from live data.
 * Skip search for greetings, pure reflection, Layer 1 book/journal/code output asks,
 * Quran references, and founder comparing their own in-session teaching.
 */
export function getWebSearchGateReason(
  message: string,
  options?: {
    isFounder?: boolean;
    hasTeachingUpload?: boolean;
    founderTeachingSynthesis?: boolean;
    /** Short reply continuing a technical thread (e.g. "850cc?", "Exclusive pula?"). */
    technicalFollowUp?: boolean;
    /**
     * Users channel (Universal Scholar — account umum).
     * JWT role may be `student` in code; this is NOT Tutor (Student) and NOT Niaga.
     * Search only on factual gates — not every substantive chat turn.
     * @deprecated Alias — use userUmumChannelGate
     */
    usersFounderParity?: boolean;
    userUmumChannelGate?: boolean;
    /** Indexed Brain C episode loaded this turn — brain-first may skip search. */
    brainRecallLoaded?: boolean;
    recentUserMessages?: string[];
    recentAssistantMessages?: string[];
  },
): string | null {
  if (!adamWebSearchEnabled()) return null;

  const text = message.trim();
  if (!text) return null;

  /** α word-problem arithmetic — no web search (3 epal + 4, jika ada 3 epal, …). */
  if (isAdamSimpleArithmeticTurn(text)) return null;

  const brainFirstSkip = !options?.userUmumChannelGate
    && !options?.usersFounderParity
    && shouldSkipSearchWhenRecallHitStableTopic({
      message:            text,
      brainRecallLoaded:  options?.brainRecallLoaded === true,
      technicalFollowUp:  options?.technicalFollowUp,
    });
  if (brainFirstSkip) return null;

  const userUmumGate = options?.userUmumChannelGate === true || options?.usersFounderParity === true;

  if (userUmumGate) {
    if (EXPLICIT_WEB_SEARCH.test(text)) return 'explicit_search';
    if (isExplicitFreshnessRequest(text)) return 'explicit_search';
    if (isAdamLightChatTurn(text)) return null;
    if (isAdamLayer1WritingChatTurn(text)) return null;
    if (isAdamUserCoachingHelpTurn(text)) return null;
    if (isAdamUserGuidanceCoachingTurn(text)) return null;
    if (isAdamRelationalPersonalTurn(text)) return null;
    if (isAdamLifeWellbeingTurn(text)) return null;
    if (userUmumPerlaksanaanTurnActive(
      text,
      options?.recentAssistantMessages ?? [],
      options?.recentUserMessages ?? [],
    )) return null;
    if (PURE_REFLECTION.test(text)) return null;
    if (isAdamPedagogyKonvensionalTurn(text)) return null;
    if (isAdamCurrentAffairsTurn(text)) return 'current_affairs';
    if (isVerifiedDataStatAsk(text)) return 'verified_data_stat';
    if (options?.technicalFollowUp) return 'technical_follow_up';
    if (isUserEntityCorrectionMessage(text)) return 'entity_correction';
    if (isAdamTeachingDepthTurn(text)) return null;
    if (isTechnicalPrecisionQuestion(text)) return 'technical_precision';
    if (isAdamPracticalAdvisoryTurn(text)) return 'factual_question';
    if (isDirectTechnicalHowToQuestion(text)) return 'factual_question';
    if (isAdamMarketPricingTurn(text)) return 'factual_question';
    return null;
  }

  if (options?.founderTeachingSynthesis) {
    return options.hasTeachingUpload
      ? 'founder_teaching_synthesis_upload'
      : 'founder_teaching_synthesis';
  }

  if (options?.isFounder && options?.hasTeachingUpload) {
    return 'founder_teaching_upload';
  }

  if (EXPLICIT_WEB_SEARCH.test(text)) return 'explicit_search';

  if (isAdamCurrentAffairsTurn(text)) return 'current_affairs';

  if (isVerifiedDataStatAsk(text)) return 'verified_data_stat';

  if (options?.technicalFollowUp) return 'technical_follow_up';

  if (isUserEntityCorrectionMessage(text)) return 'entity_correction';
  if (isAdamTeachingDepthTurn(text)) return null;
  if (isTechnicalPrecisionQuestion(text)) return 'technical_precision';

  if (text.length < 8) return null;

  if (isAdamLightChatTurn(text)) return null;
  if (isAdamLayer1WritingChatTurn(text)) return null;
  if (PURE_REFLECTION.test(text)) return null;
  if (isAdamPedagogyKonvensionalTurn(text)) return null;
  if (isAdamCurrentAffairsTurn(text)) return 'current_affairs';
  if (isVerifiedDataStatAsk(text)) return 'verified_data_stat';
  if (options?.technicalFollowUp) return 'technical_follow_up';
  if (isUserEntityCorrectionMessage(text)) return 'entity_correction';
  if (isAdamTeachingDepthTurn(text)) return null;
  if (isTechnicalPrecisionQuestion(text)) return 'technical_precision';
  if (isAdamPracticalAdvisoryTurn(text)) return 'factual_question';
  if (isDirectTechnicalHowToQuestion(text)) return 'factual_question';
  if (isAdamMarketPricingTurn(text)) return 'factual_question';

  if (parseQuranAyahRefs(text).length > 0) return null;

  if (
    options?.isFounder &&
    FOUNDER_OWN_TEACHING.test(text) &&
    FOUNDER_SESSION_REF.test(text)
  ) return null;

  return null;
}

export function shouldEnableWebSearchForMessage(message: string): boolean {
  return getWebSearchGateReason(message) !== null;
}
