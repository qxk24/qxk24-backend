/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Web Search Config
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * Updated     : 2026-06-09 — Fasa 3 shared search prompt base
 * ============================================================
 */

import { ENV } from '../config/environments';
import { parseQuranAyahRefs } from '../quran/quran-ayah-parser';
import {
  isUserEntityCorrectionMessage,
  resolveTechnicalPrecisionTurn,
} from './adam-factual-grounding';
import { isLifeEmotionTurn } from './adam-universal-voice';
import {
  buildFounderWebSearchPrompt,
  buildStudentWebSearchPrompt,
} from './adam-web-search-prompts';

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

// ── Pure greeting — no search needed ────────────────────────────────────────
const GREETING_ONLY =
  /^(salam|assalamu|waalaikum|bismillah|hi|hello|terima\s+kasih|thank\s+you|syukran|good\s+(morning|afternoon|evening|night))\b/i;

// ── Pure opinion / reflection — no external data needed ─────────────────────
const PURE_REFLECTION =
  /^(apa\s+pendapat|apa\s+pandangan|apa\s+perasaan|what\s+do\s+you\s+think|how\s+do\s+you\s+feel|tell\s+me\s+about\s+yourself|siapa\s+kamu|who\s+are\s+you)\b/i;

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
  },
): string {
  if (!isFounder) {
    if (options?.searchPrefetched) {
      const msg = options?.userMessage?.trim() ?? '';
      if (msg && isLifeEmotionTurn(msg)) {
        return buildStudentWebSearchPrompt('life_substantive');
      }
      return buildStudentWebSearchPrompt('prefetched');
    }
    const msg = options?.userMessage?.trim() ?? '';
    const recent = options?.recentUserMessages ?? [];
    if (msg && resolveTechnicalPrecisionTurn(msg, recent).isActive) {
      return buildStudentWebSearchPrompt('technical_precision');
    }
    if (msg && isUserEntityCorrectionMessage(msg)) {
      return buildStudentWebSearchPrompt('entity_correction');
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
export function buildQwenSearchOptions(forcedSearch = false): Record<string, unknown> {
  const options: Record<string, unknown> = {
    search_strategy: ENV.QWEN_SEARCH_STRATEGY,
    forced_search:   forcedSearch,
  };
  if (ENV.QWEN_SEARCH_ENABLE_CITATION) {
    options.enable_citation = true;
  }
  return options;
}

/**
 * Gate web search per turn.
 *
 * Philosophy: ADAM should search on almost every factual question.
 * Real data makes every answer stronger and more trustworthy.
 * Only skip search for greetings, pure reflection, Quran references,
 * and founder comparing their own in-session teaching.
 */
export function getWebSearchGateReason(
  message: string,
  options?: {
    isFounder?: boolean;
    hasTeachingUpload?: boolean;
    founderTeachingSynthesis?: boolean;
    /** Short reply continuing a technical thread (e.g. "850cc?", "Exclusive pula?"). */
    technicalFollowUp?: boolean;
  },
): string | null {
  if (!adamWebSearchEnabled()) return null;

  if (options?.founderTeachingSynthesis) {
    return options.hasTeachingUpload
      ? 'founder_teaching_synthesis_upload'
      : 'founder_teaching_synthesis';
  }

  if (options?.isFounder && options?.hasTeachingUpload) {
    return 'founder_teaching_upload';
  }

  const text = message.trim();
  if (!text) return null;

  if (EXPLICIT_WEB_SEARCH.test(text)) return 'explicit_search';

  if (options?.technicalFollowUp) return 'technical_follow_up';

  if (isUserEntityCorrectionMessage(text)) return 'entity_correction';

  if (text.length < 8) return null;

  if (GREETING_ONLY.test(text)) return null;

  if (parseQuranAyahRefs(text).length > 0) return null;

  if (PURE_REFLECTION.test(text)) return null;

  if (
    options?.isFounder &&
    FOUNDER_OWN_TEACHING.test(text) &&
    FOUNDER_SESSION_REF.test(text)
  ) return null;

  return 'factual_question';
}

export function shouldEnableWebSearchForMessage(message: string): boolean {
  return getWebSearchGateReason(message) !== null;
}
