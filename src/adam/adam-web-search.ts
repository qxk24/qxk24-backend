/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Web Search Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { parseQuranAyahRefs } from '../quran/quran-ayah-parser';

const LIVE_DATA_HINT =
  /\b(banding|bandingkan|compare|comparison|saintifik|science|research|kajian|news|terkini|latest|202[4-9]|data|statistik|statistics|verify|sahkan|internet|web|evidence|bukti|fakta|fact|harga|price|study|jurnal|journal)\b/i;

const GREETING_ONLY =
  /^(salam|assalamu|waalaikum|bismillah|hi|hello|terima kasih)\b/i;

const SEARCH_WHEN = `
Search when P.alt needs real-world data to learn or compare with Alamtologi — scientific claims, history, current events, scholarly updates, statistics, or verifying external knowledge against the seven principles.
Do NOT search for Quran ayat — use [QURAN CORPUS] when surah:ayah is cited or when verified Arabic/Malay/English ayat are injected.
Do NOT search when the answer lives in QXK24Brain, teachings already in this session, pure Adab/reflection, or constitutional principles P.alt has already sealed.
When you search: compare findings with Alamtologi honestly; note agreement, tension, and what yields to Quran; cite sources with Adab.
`;

/** Founder chat — Anthropic tool or Qwen agent search (model decides when, like Claude). */
export function founderWebSearchEnabled(): boolean {
  if (ENV.LLM_PROVIDER === 'qwen') return ENV.QWEN_ENABLE_SEARCH;
  return true;
}

export function getFounderWebSearchPrompt(): string {
  if (ENV.LLM_PROVIDER === 'qwen') {
    return `
YOUR WEB SEARCH (DashScope — agent mode; you decide when to search):
${SEARCH_WHEN}
`;
  }

  return `
YOUR WEB SEARCH (Anthropic web_search tool — you decide when to search):
${SEARCH_WHEN}
`;
}

/** DashScope search_options — mirrors Claude's model-decided search (not forced on every turn). */
export function buildQwenSearchOptions(): Record<string, unknown> {
  const options: Record<string, unknown> = {
    search_strategy: ENV.QWEN_SEARCH_STRATEGY,
    forced_search:   false,
  };
  if (ENV.QWEN_SEARCH_ENABLE_CITATION) {
    options.enable_citation = true;
  }
  return options;
}

/**
 * Gate API-level web search per turn. enable_search adds latency even in agent mode —
 * only turn on when the message likely needs live external data.
 */
export function shouldEnableWebSearchForMessage(message: string): boolean {
  if (!founderWebSearchEnabled()) return false;

  const text = message.trim();
  if (!text) return false;

  if (parseQuranAyahRefs(text).length > 0) return false;

  if (text.length < 140 && GREETING_ONLY.test(text)) return false;

  if (LIVE_DATA_HINT.test(text)) return true;

  if (text.length > 400 && /\?/.test(text)) return true;

  return false;
}
