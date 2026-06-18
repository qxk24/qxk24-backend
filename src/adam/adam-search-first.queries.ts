/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Search-First Flow (student factual turns)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */
import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
import {
  isAdamContinuationDepthTurn,
  isAdamEducationalWebSearchTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import {
  buildContinuationSearchPrefetchPrompt,
  resolveAdamThreadSearchTopic,
  type AdamThreadSearchContext,
} from './adam-search-continuation';
import {
  buildCurrentAffairsPrefetchPrompt,
  isAdamCurrentAffairsTurn,
} from './adam-current-affairs';
import {
  buildEducationalPrefetchPrompt,
  buildEducationalSearchDisplayQuery,
} from './adam-educational-grounding';
import {
  buildUsersDomainSearchHint,
  resolveAdamUsersDomainFacet,
  type AdamUsersDomainFacet,
} from './adam-users-domain-router';
import {
  buildMarketPricingPrefetchPrompt,
  buildMarketPricingSearchDisplayQuery,
  isAdamMarketPricingTurn,
} from './adam-market-pricing';
import {
  blobHasVerifiableStatFigure,
  extractDomainsFromMessageUrls,
  extractInstitutionAliasesFromMessage,
  extractStatSubjectFromMessage,
  messageAsksRoleAndSkills,
} from './adam-official-source-enrich';
import { extractVerifiedStatFigureFromEvidence } from './adam-alpha-output-guard';
import {
  isFactualAdamWebSearchGateReason,
  isVerifiedDataStatAsk,
} from './adam-web-search';

export function hasVerifiableStatSignal(
  extractedFacts: string,
  hits: LlmSearchResult[],
  userMessage = '',
): boolean {
  if (userMessage.trim()) {
    return Boolean(extractVerifiedStatFigureFromEvidence(hits, extractedFacts, userMessage));
  }
  if (/\d{1,3}(?:,\d{3})+|\d{4,6}/.test(extractedFacts)) return true;
  const blob = hits.map((h) => `${h.title ?? ''} ${h.snippet ?? ''}`).join(' ');
  return blobHasVerifiableStatFigure(blob);
}

function searchHitRichness(hit: LlmSearchResult): number {
  const snippet = hit.snippet?.trim() ?? '';
  let score = snippet.length;
  if (hit.pageFetched) score += 100_000;
  if (blobHasVerifiableStatFigure(`${hit.title ?? ''} ${snippet}`)) score += 10_000;
  return score;
}

export function dedupeSearchHits(hits: LlmSearchResult[]): LlmSearchResult[] {
  const byKey = new Map<string, LlmSearchResult>();
  for (const hit of hits) {
    const key = hit.url?.trim() || hit.title?.trim() || '';
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || searchHitRichness(hit) > searchHitRichness(prev)) {
      byKey.set(key, hit);
    }
  }
  return [...byKey.values()];
}

export function enrichHitsWithExtractedFacts(
  hits: LlmSearchResult[],
  extractedFacts: string,
): LlmSearchResult[] {
  if (!extractedFacts.trim()) return hits;
  return hits.map((hit) => {
    if (hit.snippet?.trim()) return hit;
    const url = hit.url?.trim() ?? '';
    const title = hit.title?.trim() ?? '';
    const related = extractedFacts
      .split('\n')
      .filter((line) => url && line.includes(url))
      .join('; ');
    if (!related) return hit;
    return { ...hit, snippet: related };
  });
}

export function formatPrefetchedSearchHitLine(hit: LlmSearchResult, index: number): string {
  const title = hit.title?.trim() || 'Untitled';
  const url = hit.url?.trim();
  const snippet = hit.snippet?.trim();
  const head = url ? `${index + 1}. ${title} — ${url}` : `${index + 1}. ${title}`;
  if (!snippet) return head;
  return `${head}\n   Snippet: ${snippet.slice(0, 320)}`;
}

/**
 * Canonical search-first pipeline — prefetch web search before synthesis on every
 * factual gate reason (stats, specs, science, news, substantive explain-back).
 * Applies to all participants (student, founder, guest).
 */
export function shouldUsersUseSearchFirstFlow(
  _isFounder: boolean,
  searchGateReason: string | null,
): boolean {
  if (!searchGateReason) return false;
  return isFactualAdamWebSearchGateReason(searchGateReason);
}

export function threadContextFromRecentMessages(
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): AdamThreadSearchContext {
  return { recentUserMessages, recentAssistantMessages };
}

export function recentUserStringsFromLlmMessages(recentUserMessages: LlmMessage[] = []): string[] {
  return recentUserMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.replace(/^\[[^\]]+\]:\s*/, '').trim())
    .filter(Boolean);
}

export function recentAssistantStringsFromLlmMessages(recentUserMessages: LlmMessage[] = []): string[] {
  return recentUserMessages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content.trim())
    .filter(Boolean);
}

/** Shown in search UI — focused query, not raw salam-prefixed message. */
export function buildAdamSearchDisplayQuery(
  userMessage: string,
  webSearchGateReason?: string | null,
  threadContext?: AdamThreadSearchContext,
  gateDomain?: AdamUsersDomainFacet,
): string {
  const statAsk = isVerifiedDataStatAsk(userMessage)
    || webSearchGateReason === 'verified_data_stat';
  const body = stripLeadingAdamSalutation(userMessage.trim());
  if (isAdamContinuationDepthTurn(body) && threadContext) {
    return resolveAdamThreadSearchTopic(body, threadContext);
  }
  if (statAsk && body) {
    return body.slice(0, 120);
  }
  if (isAdamMarketPricingTurn(body)) {
    return buildMarketPricingSearchDisplayQuery(userMessage);
  }
  if (messageAsksRoleAndSkills(body)) {
    return buildFactualZeroHitSearchDisplayQuery(body);
  }
  if (isAdamEducationalWebSearchTurn(body)) {
    return buildEducationalSearchDisplayQuery(userMessage);
  }
  const domainFacet = gateDomain ?? resolveAdamUsersDomainFacet(body, threadContext);
  if (domainFacet === 'economics') {
    const hint = body.slice(0, 80);
    return `${hint} Malaysia BNM DOSM`.trim().slice(0, 120);
  }
  if (domainFacet === 'science') {
    return `${body.slice(0, 90)} science process mechanism`.trim().slice(0, 120);
  }
  if (domainFacet === 'civics') {
    return `${body.slice(0, 90)} Perlembagaan Malaysia`.trim().slice(0, 120);
  }
  return userMessage.trim().slice(0, 120) || 'Searching verified data…';
}

/** Expanded search query for institutional / agency statistics — any entity, any country. */
export function buildVerifiedDataStatPrefetchPrompt(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  const aliases = extractInstitutionAliasesFromMessage(body);
  const subject = aliases[0] ?? extractStatSubjectFromMessage(body);
  const quoted = aliases.slice(0, 4).map((a) => `"${a}"`).join(' ');
  const domains = extractDomainsFromMessageUrls(body);
  return [
    `Find published official statistics for: ${body}`,
    `Institution identifiers (mandatory in search): ${aliases.join(' | ')}`,
    `Primary search query: ${quoted} student enrollment total official published statistics`,
    'Results MUST mention the institution identifier in the page title, URL, or snippet.',
    'Do NOT return generic national enrollment databases or unrelated foreign universities.',
    'Priority sources: official institution or government websites, annual reports, and verified primary sources — any country.',
    ...(domains.length ? [`User-supplied domains (focus here first): ${domains.join(', ')}`] : []),
    'Extract published figures, dates, office-holders, and report/session year — exact numbers only, no estimates.',
  ].join('\n');
}

/** Focused retry when DashScope returns off-subject hits (e.g. US enrollment portals for KPTM). */
export function buildSubjectFocusedStatRetryPrompt(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  const aliases = extractInstitutionAliasesFromMessage(body);
  const quoted = aliases.slice(0, 4).map((a) => `"${a}"`).join(' ');
  return [
    'SUBJECT-FOCUSED WEB SEARCH RETRY — prior results did not mention the asked institution.',
    `Institution identifiers: ${aliases.join(' | ')}`,
    `Required search query: ${quoted} student enrollment total official published statistics`,
    'Return ONLY pages where the institution name or acronym appears in the title, URL, or snippet.',
    'Ignore generic national enrollment dashboards and unrelated foreign university portals.',
    'Output EXTRACTED_FACTS block only — one line per verifiable fact tied to this institution.',
  ].join('\n');
}

/** Display query for subject-focused retry — quoted identifiers for DashScope search UI. */
export function buildSubjectFocusedStatSearchDisplayQuery(message: string): string {
  const aliases = extractInstitutionAliasesFromMessage(message);
  const quoted = aliases.slice(0, 3).map((a) => `"${a}"`).join(' ');
  return `${quoted} student enrollment official`.slice(0, 120);
}

/** Focused retry when factual prefetch returns 0 hits (e.g. RN role, career, science). */
export function buildFactualZeroHitRetryPrompt(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  return [
    'FOCUSED WEB SEARCH RETRY — prior search returned zero usable hits.',
    `Question: ${body}`,
    'Search for authoritative reference pages: professional bodies, government health sites, universities, WHO/ICN/NHS/ANA.',
    'Prefer global English sources — not Baidu, WeChat, or Chinese dictionary aggregators.',
    'Return pages with clear role definitions, required skills, qualifications, or published standards.',
    'Output EXTRACTED_FACTS block only — one line per verifiable claim with source title and URL.',
  ].join('\n');
}

/** Expanded prefetch prompt for career role + skills asks — clearer than raw student question. */
export function buildFactualCareerPrefetchPrompt(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  const query = buildFactualZeroHitSearchDisplayQuery(message);
  const prefersHealth = /\b(?:nurse|nursing|healthcare|midwife|jururawat)\b/i.test(body);
  const prefersBmEdu = /\b(?:guru|sekolah|murid|pendidikan|kurikulum|kemahiran|peranan)\b/i.test(body);
  const prioritySources = prefersHealth
    ? 'healthcareers.nhs.uk, nhs.uk, who.int, national nursing bodies.'
    : prefersBmEdu
      ? 'Kementerian Pendidikan Malaysia (moe.gov.my), portal rasmi KPM, garis panduan kurikulum/pendidikan — bukan berita kampus atau blog persendirian.'
      : 'official government (.gov), professional bodies, and national career guidance sites — not job boards or news aggregators.';
  return [
    `Find official career reference pages for: ${body}`,
    `Search query: ${query} official role duties required skills qualifications`,
    `Priority sources: ${prioritySources}`,
    'Return pages with clear role definitions, daily duties, and required skills or competencies.',
    'Output EXTRACTED_FACTS block — one line per verifiable role duty or skill with source title and URL.',
  ].join('\n');
}

/** Shorter display query for factual zero-hit retry — drops filler words for DashScope search UI. */
export function buildFactualZeroHitSearchDisplayQuery(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  const stop = new Set([
    'what', 'how', 'why', 'when', 'where', 'who', 'does', 'do', 'can', 'could',
    'would', 'should', 'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in',
    'on', 'with', 'i', 'me', 'my', 'we', 'you', 'your', 'is', 'are', 'am', 'be',
    'tell', 'about', 'need', 'boleh', 'beritahu', 'tentang', 'apa', 'adakah',
  ]);
  const condensed = body
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w.toLowerCase()))
    .join(' ')
    .trim();
  return (condensed.length >= 8 ? condensed : body).slice(0, 120);
}

/** User block for the prefetch LLM call — includes short thread context when present. */
export function buildSearchPrefetchUserPrompt(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  gateDomain?: AdamUsersDomainFacet,
): string {
  const msg = userMessage.trim();
  if (isAdamContinuationDepthTurn(msg)) {
    return buildContinuationSearchPrefetchPrompt(msg, {
      recentUserMessages,
      recentAssistantMessages,
    });
  }
  const searchBody = isAdamCurrentAffairsTurn(msg)
    ? buildCurrentAffairsPrefetchPrompt(msg)
    : isVerifiedDataStatAsk(msg)
      ? buildVerifiedDataStatPrefetchPrompt(msg)
      : isAdamMarketPricingTurn(msg)
        ? buildMarketPricingPrefetchPrompt(msg)
        : messageAsksRoleAndSkills(msg)
          ? buildFactualCareerPrefetchPrompt(msg)
          : (() => {
              const domainFacet = gateDomain ?? resolveAdamUsersDomainFacet(msg, {
                recentUserMessages,
              });
              const domainHint = buildUsersDomainSearchHint(domainFacet, msg);
              if (domainHint) {
                return `${domainHint}\n\nUser question: ${msg}`;
              }
              return isAdamEducationalWebSearchTurn(msg)
                ? buildEducationalPrefetchPrompt(msg)
                : msg;
            })();
  const recent = recentUserMessages.slice(-2).filter(Boolean);
  if (recent.length === 0) return searchBody;
  return [
    'Recent student messages (context only):',
    ...recent.map((m) => `- ${m}`),
    '',
    `Current message: ${searchBody}`,
  ].join('\n');
}
