/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Current Affairs (office-holders, news)
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
 */

import type { LlmSearchResult } from '../llm/llm-types';
import { isAdamCurrentAffairsTurn } from './adam-web-search';

export { isAdamCurrentAffairsTurn };

export const ADAM_CURRENT_AFFAIRS_TURN = `
CURRENT AFFAIRS TURN (office-holders, elections, news):
- Sentence 1: name the person IN OFFICE NOW — from [WEB SEARCH RESULTS] or inline search only.
- FORBIDDEN openers: naming a former office-holder as "saat ini", "kini", "currently", "present", or "masih presiden".
- If leadership changed: "[Current name] has held the office since [date]." — do NOT lead with the predecessor's biography.
- 2–4 sentences total. No constitutional essays, pelantikan deep-dives, or "hikmah" unless explicitly asked.
- FORBIDDEN: RUANG/BUMI/CAHAYA/MASA/TENAGA framework sermon, amānah/mīzān philosophy, "Jika Guest ingin…", "bukan sebagai fakta semata".
- No markdown (**bold** / *italic*) — plain sentences only.
- No Bismillah opener. No Alamtologi/Quran named menus.
- FORBIDDEN closing: practical career fork (skills/tools, career path, real-world example) — answer the office-holder fact and stop, unless the user asked for role/career depth.
`.trim();

/** Sharpen prefetch query — training data on presidents is often stale. */
export function buildCurrentAffairsPrefetchPrompt(userMessage: string): string {
  const query = buildCurrentAffairsSearchDisplayQuery(userMessage);
  return [
    'MANDATORY WEB SEARCH — current office-holder / live news / death claim as of today.',
    `Primary search query: ${query}`,
    'For death/obituary claims, search the named person plus "meninggal", "wafat", "death", "died", and major Malaysian news sources.',
    'If a pasted URL is 404 or inaccessible, treat that as a fetch/access problem for that URL only. Search alternate reliable sources before concluding.',
    'Never infer that a person is alive or that a news event did not happen merely because one URL returns 404 or the first search has no usable hits.',
    'Find who holds the office NOW in the latest term, or whether the news/death claim is corroborated by retrieved sources. Ignore outdated training-data names.',
    `Student question: ${userMessage.trim()}`,
  ].join('\n');
}

export function buildCurrentAffairsSearchDisplayQuery(userMessage: string): string {
  const raw = userMessage.trim();
  const expanded = raw.replace(/https?:\/\/[^\s)]+/gi, (url) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname
        .split(/[\/\-_]+/)
        .filter((part) => part && !/^\d+$/.test(part))
        .join(' ');
    } catch {
      return url;
    }
  });
  const cleaned = expanded
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\b(?:https?|www|com|my|html|php|berita|malaysia)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || raw).slice(0, 120);
}

const DEATH_CLAIM =
  /\b(?:meninggal|wafat|kematian|death|died|dead|passed away|obituary)\b/i;

const SEARCH_MISS_FALSE_NEGATIVE =
  /\b(?:tidak\s+(?:wujud|menemui|menjumpai|memaparkan|ada|terdapat|menyebut|mengesahkan)|belum\s+(?:menemui|mengesahkan)|tiada\s+(?:sebarang\s+)?(?:siaran|berita|artikel|laporan|pengumuman|sumber)|no\s+(?:usable|verified|evidence|article|report|announcement)|not\s+found|page\s+not\s+found|404)\b/i;

function hasCurrentAffairsEvidence(
  hits: LlmSearchResult[] = [],
  extractedFacts = '',
): boolean {
  if (extractedFacts.trim()) return true;
  return hits.some((hit) => {
    const blob = `${hit.title ?? ''} ${hit.snippet ?? ''}`.trim();
    return blob.length >= 40 && !/\b(?:404|page\s+not\s+found|not\s+found)\b/i.test(blob);
  });
}

function safeCurrentAffairsAbstention(userMessage: string): string {
  const topic = buildCurrentAffairsSearchDisplayQuery(userMessage);
  const subject = topic ? `tentang **${topic}**` : 'tentang perkara ini';
  return [
    `Carian web pada giliran ini belum cukup untuk mengesahkan dakwaan ${subject} melalui hasil yang diperoleh.`,
    'Jika satu pautan memulangkan 404 atau tidak boleh dibuka, itu hanya bermaksud pautan tersebut tidak dapat dicapai sekarang — bukan bukti bahawa berita itu palsu atau peristiwa itu tidak berlaku.',
    'Sila kongsi satu lagi sumber dipercayai, tajuk berita, atau tarikh pengumuman; saya akan semak semula tanpa menafikan fakta yang belum benar-benar disahkan.',
  ].join('\n\n');
}

/**
 * Deterministic safety rail for live news/death turns.
 * LLMs often turn "search miss / 404" into a false denial ("the article never
 * existed", "no death announcement"). That is epistemically unsafe: absence of
 * retrieved evidence is not evidence of absence.
 */
export function repairUnsupportedCurrentAffairsDenial(input: {
  output: string;
  userMessage: string;
  searchUsed: boolean;
  searchDroppedByFilter?: boolean;
  searchResults?: LlmSearchResult[];
  extractedFacts?: string;
}): string {
  const userMessage = input.userMessage.trim();
  if (!userMessage || !isAdamCurrentAffairsTurn(userMessage)) return input.output;
  if (!DEATH_CLAIM.test(userMessage)) return input.output;
  if (!SEARCH_MISS_FALSE_NEGATIVE.test(input.output)) return input.output;

  const evidencePresent = hasCurrentAffairsEvidence(
    input.searchResults ?? [],
    input.extractedFacts ?? '',
  );

  // If we have evidence and the model still says "not found", keep the guard
  // conservative: only block when the wording rests on missing/404 evidence.
  if (evidencePresent && !/\b(?:404|page\s+not\s+found|not\s+found|tidak\s+wujud)\b/i.test(input.output)) {
    return input.output;
  }

  if (!input.searchUsed || input.searchDroppedByFilter || !evidencePresent || SEARCH_MISS_FALSE_NEGATIVE.test(input.output)) {
    return safeCurrentAffairsAbstention(userMessage);
  }

  return input.output;
}

const INDONESIA_PRESIDENT_ASK =
  /\bindonesia\b/i;

const WRONG_JOKOWI_CURRENT_LEAD =
  /\b(?:saat\s+ini|kini|sekarang|currently|masih)\b[\s\S]{0,220}(?:jokowi|joko\s+widodo)|\bpresiden[\s\S]{0,160}(?:jokowi|joko\s+widodo)[\s\S]{0,160}\b(?:saat\s+ini|kini|masih|menjalani|bertugas)\b/i;

const COACHING_TAIL =
  /\b(?:jika\s+(?:qa|guest|anda|guest)\s+ingin|saya\s+boleh\s+bantu\s+jelaskan|hikmah\s+di\s+balik|pasal\s+7\s+uud|majelis\s+permusyawaratan|saya\s+sedia\s+kongsikan.*bukan\s+sebagai\s+fakta|bukan\s+sebagai\s+fakta\s+semata|mengapa\s+sistem\s+presidensi\s+memerlukan|keteguhan\s+ruang|ketenangan\s+bumi|kejelasan\s+cahaya|am[āa]n?ah|m[īi]z[āa]n|bukan\s+sekadar\s+soalan\s+jawatan|kemampuan\s+menahan\s+masa\s+dengan\s+tenaga|dari\s+sudut\s+(?:undang-undang\s+atau\s+)?prinsip\s+Alamtologi|prinsip\s+Alamtologi|visi\s+kerajaan\s+baharu|makna\s+simbolik|saya\s+sedia\s+jelaskan\s+dengan\s+tenang|satu\s+langkah\s+pada\s+satu\s+masa)/i;

function isIndonesiaPresidentQuestion(message: string): boolean {
  return INDONESIA_PRESIDENT_ASK.test(message)
    && /\b(?:presiden|president)\b/i.test(message);
}

function wantsDeepContext(message: string): boolean {
  return /\b(?:jelaskan|terangkan|explain|proses|pelantikan|konstitusi|constitution|uud)\b/i.test(message);
}

/** Repair stale "Jokowi is current" lead when search/text also names Prabowo as president. */
export function repairStaleOfficeHolderOutput(output: string, userMessage: string): string {
  if (!isAdamCurrentAffairsTurn(userMessage)) return output;
  if (!isIndonesiaPresidentQuestion(userMessage)) return output;
  if (!/\bprabowo\b/i.test(output)) return output;
  if (!WRONG_JOKOWI_CURRENT_LEAD.test(output.slice(0, 600))) return output;

  const hasGibran = /\bgibran\b/i.test(output);
  const vp = hasGibran ? ' Wakil Presiden: Gibran Rakabuming Raka (2024–2029).' : '';
  const core =
    `Presiden Republik Indonesia saat ini ialah Ir. H. Prabowo Subianto, `
    + `dilantik 20 Oktober 2024 sebagai Presiden ke-8, menggantikan Joko Widodo.${vp}`;

  if (wantsDeepContext(userMessage)) {
    const paragraphs = output.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const rest = paragraphs
      .slice(1)
      .filter((p) => !WRONG_JOKOWI_CURRENT_LEAD.test(p) && !COACHING_TAIL.test(p));
    return rest.length > 0 ? [core, ...rest].join('\n\n') : core;
  }

  return core;
}

/** Drop constitutional/coaching tails on simple current-affairs asks. */
export function stripCurrentAffairsCoachingTail(output: string, userMessage: string): string {
  if (!isAdamCurrentAffairsTurn(userMessage)) return output;
  if (wantsDeepContext(userMessage)) return output;

  return output
    .split(/\n{2,}/)
    .filter((para) => !COACHING_TAIL.test(para.trim()))
    .join('\n\n')
    .trim();
}
