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

const EXPLICIT_WEB_SEARCH =
  /\b(cuba\s+search|carian\s+web|search\s+the\s+web|web\s+search|google|mencari\s+(?:di\s+)?internet|search\s+online|search\s+tentang)\b/i;

const LIVE_DATA_HINT =
  /\b(banding|bandingkan|compare|comparison|saintifik|science|research|kajian|news|terkini|latest|202[4-9]|data|statistik|statistics|verify|sahkan|internet|web|evidence|bukti|fakta|fact|harga|price|study|jurnal|journal)\b/i;

const GREETING_ONLY =
  /^(salam|assalamu|waalaikum|bismillah|hi|hello|terima kasih)\b/i;

const SEARCH_WHEN = `
Search when the question needs real-world data — scientific claims, history, current events, scholarly updates, statistics, or verifying external knowledge against Alamtologi and the seven principles.
Do NOT search for Quran ayat — use [QURAN CORPUS] when surah:ayah is cited or when verified Arabic/Malay/English ayat are injected.
Do NOT search when the answer lives in QXK24Brain, material already in this session, pure Adab/reflection, or constitutional principles already established here.
When you search: compare findings with Alamtologi honestly; note agreement, tension, and what yields to Quran; cite sources with Adab.
`;

/** DashScope agent search (model decides when) — founder and student chat. */
export function adamWebSearchEnabled(): boolean {
  return ENV.QWEN_ENABLE_SEARCH;
}

/** @deprecated Use adamWebSearchEnabled */
export const founderWebSearchEnabled = adamWebSearchEnabled;

export function getAdamWebSearchPrompt(): string {
  return `
YOUR WEB SEARCH (DashScope — agent mode; you decide when to search):
${SEARCH_WHEN}
`;
}

/** @deprecated Use getAdamWebSearchPrompt */
export const getFounderWebSearchPrompt = getAdamWebSearchPrompt;

/** DashScope search_options — model-decided search (not forced on every turn). */
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
export function getWebSearchGateReason(
  message: string,
  options?: { isFounder?: boolean },
): string | null {
  if (!adamWebSearchEnabled()) return null;

  const text = message.trim();
  if (!text) return null;

  if (parseQuranAyahRefs(text).length > 0) return null;

  if (text.length < 140 && GREETING_ONLY.test(text)) return null;

  if (EXPLICIT_WEB_SEARCH.test(text)) return 'explicit_search';

  if (LIVE_DATA_HINT.test(text)) {
    /** Founder comparing to own teaching in-session — QXK24Brain holds it */
    if (
      options?.isFounder &&
      /\b(banding|bandingkan|compare|comparison)\b/i.test(text) &&
      /\b(saya|p\.?alt|panduan|penjelasan|teaching|mengajar|dalam sesi|tadi)\b/i.test(text)
    ) {
      return null;
    }
    return 'live_data_hint';
  }

  if (text.length > 400 && /\?/.test(text)) return 'long_question';

  return null;
}

export function shouldEnableWebSearchForMessage(message: string): boolean {
  return getWebSearchGateReason(message) !== null;
}
