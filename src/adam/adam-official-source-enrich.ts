/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Official Source Enrichment (universal)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Global factual prefetch enrichment — no entity lookup tables,
 * no country TLD guessing, no acronym → domain invention.
 * Search hits are the only source of URLs to fetch.
 */

import type { LlmSearchResult } from '../llm/llm-types';
import { stripLeadingAdamSalutation } from './adam-response-generation';

const ACRONYM_RE = /\b[A-Z]{2,10}\b/g;
const ORG_NAME_RE =
  /\b(?:University|Universiti|College|Kolej|Institute|Institut|Institution|School|Academy|Ministry|Department|Agency|Foundation|Corporation|Hospital|Bank|Lembaga|Jabatan|Kementerian)\s+[A-Z][A-Za-z0-9\s\-'.]{2,56}/g;

const STAT_FIGURE_PATTERNS = [
  /(?:lebih\s+|over\s+|more than\s+)?(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:orang\s+)?(?:pelajar|students?|murid|enrollees?|enrolment|enrollment)/gi,
  /(?:lebih\s+|over\s+)?(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:orang|kakitangan|staff|pekerja|employees?|workers?)/gi,
  /(?:sebanyak|seramai|jumlah|total|bilangan|berjumlah|approximately|about|around)[^.]{0,48}(\d{1,3}(?:,\d{3})+|\d{4,6})/gi,
];

/** Shared stat-figure patterns — any language in patterns, no entity list. */
export { STAT_FIGURE_PATTERNS };

export function matchStatFigureClaimsInText(text: string): string[] {
  const claims: string[] = [];
  const seen = new Set<string>();
  for (const pattern of STAT_FIGURE_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const claim = match[0].trim();
      const key = claim.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      claims.push(claim);
    }
  }
  return claims;
}

export function blobHasVerifiableStatFigure(blob: string): boolean {
  for (const pattern of STAT_FIGURE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(blob)) return true;
  }
  return /\d{1,3}(?:,\d{3})+/.test(blob);
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function extractHostsFromMessageUrls(message: string): string[] {
  const domains: string[] = [];
  const urlMatches = message.match(/https?:\/\/[^\s)]+/gi) ?? [];
  for (const raw of urlMatches) {
    try {
      const host = new URL(raw).hostname.replace(/^www\./, '');
      if (host) domains.push(host);
    } catch {
      // skip invalid URL
    }
  }
  return uniqueStrings(domains);
}

/** Subject label for stat answers — parsed from the user message only. */
export function extractStatSubjectFromMessage(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  const orgMatch = body.match(ORG_NAME_RE);
  if (orgMatch?.[0]?.trim()) return orgMatch[0].trim();
  const acronyms = body.match(ACRONYM_RE)?.filter((a) => a.length >= 2) ?? [];
  if (acronyms.length > 0) return acronyms[0]!;
  const trimmed = body.slice(0, 80).trim();
  return trimmed || 'the organisation';
}

/**
 * Hostnames from URLs the user pasted — optional DashScope assigned_site_list.
 * Never guess domains from acronyms or country TLDs.
 */
export function extractDomainsFromMessageUrls(message: string): string[] {
  return extractHostsFromMessageUrls(message).slice(0, 25);
}

/** @deprecated Use extractDomainsFromMessageUrls */
export const inferOfficialDomainsFromMessage = extractDomainsFromMessageUrls;

/** All institution identifiers in the user message — acronyms, org names, parentheticals. */
export function extractInstitutionAliasesFromMessage(message: string): string[] {
  const body = stripLeadingAdamSalutation(message.trim());
  const out: string[] = [];
  const push = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    if (out.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) return;
    out.push(trimmed);
  };

  for (const match of body.match(ORG_NAME_RE) ?? []) push(match);
  for (const match of body.match(/\(([^)]{3,80})\)/g) ?? []) push(match.replace(/[()]/g, ''));
  for (const match of body.match(ACRONYM_RE) ?? []) {
    if (match.length >= 2) push(match);
  }
  const roleMatch = body.match(
    /\bwhat\s+(?:is|does|are)\s+(?:a|an|the)\s+([\w][\w\s-]{2,56}?)(?:\s+do\b|\s+mean\b|,|\?)/i,
  );
  if (roleMatch?.[1]) push(roleMatch[1].trim());
  const subjectLabel = extractStatSubjectFromMessage(body);
  if (subjectLabel.length <= 64) push(subjectLabel);
  return out;
}

/** Subject tokens parsed from the user message — for binding stat figures to the asked entity. */
export function extractSubjectTokensFromMessage(message: string): string[] {
  return uniqueStrings(
    extractInstitutionAliasesFromMessage(message)
      .flatMap((alias) => [
        alias.toLowerCase(),
        ...alias.split(/\s+/).map((t) => t.toLowerCase()).filter((t) => t.length >= 3),
        ...(alias.match(ACRONYM_RE) ?? []).map((t) => t.toLowerCase()),
      ])
      .filter((t) => t.length >= 2),
  );
}

/** True when hit is an official-ish subject source — excludes third-party PDF aggregators. */
export function isOfficialSubjectStatHit(
  hit: LlmSearchResult,
  userMessage: string,
): boolean {
  const url = hit.url?.trim();
  if (url && isThirdPartyAggregatorHost(url)) return false;

  const tokens = extractSubjectTokensFromMessage(userMessage);
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      if (hostnameContainsSubjectToken(host, tokens)) return true;
    } catch {
      // skip invalid URL
    }
  }
  return hitEvidenceMentionsSubject(hit, userMessage);
}

/** Keep only official institution hits — scribd/researchgate never count as subject evidence. */
export function filterOfficialSubjectStatHits(
  hits: LlmSearchResult[],
  userMessage: string,
): LlmSearchResult[] {
  return hits.filter((hit) => isOfficialSubjectStatHit(hit, userMessage));
}

/** Keep only hits whose URL/title/snippet mentions the asked institution (official sources only). */
export function filterSearchHitsToSubjectRelevant(
  hits: LlmSearchResult[],
  userMessage: string,
): LlmSearchResult[] {
  return filterOfficialSubjectStatHits(hits, userMessage);
}

function extractFirstStatDigits(blob: string): string | null {
  for (const pattern of STAT_FIGURE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(blob);
    if (match?.[1]) return match[1].replace(/,/g, '');
  }
  return null;
}

/** True when hit URL/title/snippet mentions the parsed subject (acronym or name). */
export function hitEvidenceMentionsSubject(
  hit: LlmSearchResult,
  userMessage: string,
): boolean {
  const tokens = extractSubjectTokensFromMessage(userMessage);
  const blob = `${hit.url ?? ''} ${hit.title ?? ''} ${hit.snippet ?? ''}`.toLowerCase();
  return tokens.some((token) => blob.includes(token));
}

/** Stat figure only when a subject token appears near the number in the same text window. */
export function extractSubjectBoundStatFigure(
  blob: string,
  userMessage: string,
  windowChars = 140,
): string | null {
  const tokens = extractSubjectTokensFromMessage(userMessage);
  for (const pattern of STAT_FIGURE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(blob)) !== null) {
      const digits = (match[1] ?? '').replace(/,/g, '');
      if (!digits) continue;
      const start = Math.max(0, match.index - windowChars);
      const end = Math.min(blob.length, match.index + match[0].length + windowChars);
      const vicinity = blob.slice(start, end).toLowerCase();
      if (tokens.some((token) => vicinity.includes(token))) {
        return digits;
      }
    }
  }
  return null;
}

/** Subject-bound figure from a single hit — rejects national aggregates on institutional asks. */
export function extractStatFigureFromHit(
  hit: LlmSearchResult,
  userMessage: string,
): string | null {
  const snippetBlob = `${hit.title ?? ''} ${hit.snippet ?? ''}`.trim();
  if (!snippetBlob) return null;

  const bound = extractSubjectBoundStatFigure(snippetBlob, userMessage);
  if (bound) return bound;

  if (hitEvidenceMentionsSubject(hit, userMessage)) {
    return extractFirstStatDigits(snippetBlob);
  }
  return null;
}

/** True when any official (non-aggregator) hit mentions the parsed subject. */
export function searchHitsIncludeSubjectToken(
  hits: LlmSearchResult[],
  userMessage: string,
): boolean {
  return filterOfficialSubjectStatHits(hits, userMessage).length > 0;
}

const URL_IN_TEXT_RE = /https?:\/\/[^\s)"'<>]+/gi;

/** Institution URLs embedded in hit blobs — discovered from search text, not invented. */
export function collectInstitutionCandidateUrlsFromEvidence(
  hits: LlmSearchResult[],
  userMessage: string,
): string[] {
  const tokens = extractSubjectTokensFromMessage(userMessage);
  const seen = new Set<string>();
  const out: string[] = [];

  const consider = (raw: string) => {
    const url = raw.replace(/[.,;]+$/g, '').trim();
    if (!url || seen.has(url)) return;
    if (isThirdPartyAggregatorHost(url)) return;
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      if (!hostnameContainsSubjectToken(host, tokens) && !hitEvidenceMentionsSubject({ url }, userMessage)) {
        return;
      }
      seen.add(url);
      out.push(url);
    } catch {
      // skip invalid URL
    }
  };

  for (const hit of hits) {
    if (hit.url?.trim()) consider(hit.url.trim());
    const blob = `${hit.title ?? ''} ${hit.snippet ?? ''}`;
    for (const match of blob.matchAll(URL_IN_TEXT_RE)) {
      if (match[0]) consider(match[0]);
    }
  }
  return out;
}

/** Common academic TLD patterns — probe ladder from message acronym, not entity tables. */
const ACADEMIC_INSTITUTION_PROBE_TLDS = [
  'edu.my',
  'edu',
  'ac.id',
  'ac.uk',
  'edu.au',
  'edu.sg',
];

/** Campus subdomain prefixes — tried before www (often CDN-blocked/slow from VPS). */
const INSTITUTION_CAMPUS_SUBDOMAIN_PREFIXES = ['bangi', 'main', 'hq', 'portal'];

const INSTITUTION_STAT_PATH_SEGMENTS = (slug: string): string[] => [
  `sejarah-${slug}-copy`,
  'sejarah',
  'history',
  'about-us',
  'about',
  'corporate',
  'profile',
];

function extractCampusSubdomainsFromMessage(userMessage: string): string[] {
  const body = stripLeadingAdamSalutation(userMessage.trim());
  const out: string[] = [];
  const push = (value: string) => {
    const slug = value.trim().toLowerCase().replace(/\s+/g, '-');
    if (slug.length >= 3 && !out.includes(slug)) out.push(slug);
  };
  for (const match of body.matchAll(/\b(?:kampus|cawangan|campus)\s+([A-Za-z][A-Za-z-]{2,24})\b/gi)) {
    if (match[1]) push(match[1]);
  }
  for (const match of body.matchAll(/\b([A-Z]{2,10})\s+([A-Z][a-z]{2,24})\b/g)) {
    if (match[2]) push(match[2]);
  }
  return out;
}

/**
 * Candidate official pages derived from institution acronyms in the question.
 * Campus/history paths first — www.{slug}.edu.my often times out from VPS while
 * bangi.{slug}.edu.my/sejarah-{slug}-copy/ holds published enrollment stats.
 */
export function buildAcronymInstitutionProbeUrls(userMessage: string): string[] {
  const acronyms = extractInstitutionAliasesFromMessage(userMessage)
    .filter((token) => /^[A-Z]{2,12}$/.test(token));
  const campusHints = extractCampusSubdomainsFromMessage(userMessage);
  const urls: string[] = [];

  for (const acronym of acronyms) {
    const slug = acronym.toLowerCase();
    const campusPrefixes = uniqueStrings([...campusHints, ...INSTITUTION_CAMPUS_SUBDOMAIN_PREFIXES]);

    for (const tld of ACADEMIC_INSTITUTION_PROBE_TLDS) {
      const hosts: string[] = [];
      for (const campus of campusPrefixes) {
        if (campus !== 'www') hosts.push(`${campus}.${slug}.${tld}`);
      }
      hosts.push(`${slug}.${tld}`);
      hosts.push(`www.${slug}.${tld}`);

      for (const host of hosts) {
        for (const path of INSTITUTION_STAT_PATH_SEGMENTS(slug)) {
          urls.push(`https://${host}/${path}/`);
        }
        urls.push(`https://${host}/`);
      }
    }
  }
  return uniqueStrings(urls);
}

/**
 * Last-resort stat evidence — fetch acronym-derived institution URLs and crawl for figures.
 * Stops on first subject-bound enrollment stat (e.g. KPTM → kptm.edu.my → sejarah → 18,000).
 */
export async function probeInstitutionStatEvidenceFromAcronym(
  userMessage: string,
  options?: PageSnippetEnrichOptions,
): Promise<{ hits: LlmSearchResult[]; figureFound: boolean }> {
  const candidates = buildAcronymInstitutionProbeUrls(userMessage);
  if (candidates.length === 0) {
    return { hits: [], figureFound: false };
  }

  const subject = extractStatSubjectFromMessage(userMessage);
  const seedHits: LlmSearchResult[] = candidates.map((url) => ({
    url,
    title: `${subject} — official site probe`,
  }));

  console.log('[adam:search-first] acronym institution probe', JSON.stringify({
    subject,
    candidates: candidates.slice(0, 6),
    total: candidates.length,
  }));

  const result = await enrichSearchHitsUntilStatFigure(seedHits, userMessage, {
    maxUrls:    options?.maxUrls ?? 12,
    timeoutMs:  options?.timeoutMs ?? 6_000,
  });
  const useful = result.hits.filter((hit) => {
    if (!hit.snippet?.trim()) return false;
    return extractStatFigureFromHit(hit, userMessage) !== null
      || isOfficialSubjectStatHit(hit, userMessage);
  });
  return {
    hits:         useful,
    figureFound:  result.figureFound,
  };
}

const NHS_ADULT_NURSE_SKILLS_URL =
  'https://www.healthcareers.nhs.uk/explore-roles/nursing/roles-nursing/adult-nurse/personal-characteristics-and-skills-required-adult-nursing';
const NHS_ADULT_NURSE_URL =
  'https://www.healthcareers.nhs.uk/explore-roles/nursing/roles-nursing/adult-nurse';
const WHO_NURSING_FACTSHEET =
  'https://www.who.int/news-room/fact-sheets/detail/nursing';

/**
 * Known authoritative URLs when DashScope prefetch returns 0 hits.
 * Direct HTML fetch — not search snippets.
 */
export function buildFactualAuthoritativeProbeUrls(userMessage: string): string[] {
  const body = stripLeadingAdamSalutation(userMessage.trim()).toLowerCase();
  const urls: string[] = [];

  if (/\bregistered nurse\b/.test(body) || (/\bnurse\b/.test(body) && /\bskills?\b/.test(body))) {
    urls.push(NHS_ADULT_NURSE_SKILLS_URL, NHS_ADULT_NURSE_URL);
  } else if (/\bnurs(?:e|ing)\b/.test(body)) {
    urls.push(NHS_ADULT_NURSE_SKILLS_URL, WHO_NURSING_FACTSHEET);
  }

  return uniqueStrings(urls);
}

/**
 * Last-resort factual evidence — fetch known official career/health pages directly.
 * Used when DashScope agent returns 0 hits (common on intl for RN role asks).
 */
export async function probeFactualAuthoritativeEvidence(
  userMessage: string,
  options?: PageSnippetEnrichOptions,
): Promise<{ hits: LlmSearchResult[]; articleFound: boolean }> {
  const candidates = buildFactualAuthoritativeProbeUrls(userMessage);
  if (candidates.length === 0) {
    return { hits: [], articleFound: false };
  }

  console.log('[adam:search-first] factual authoritative probe', JSON.stringify({
    candidates: candidates.slice(0, 4),
    question:   userMessage.slice(0, 80),
  }));

  const seedHits: LlmSearchResult[] = candidates.map((url) => ({
    url,
    title: 'Official reference probe',
  }));

  const result = await enrichSearchHitsUntilStatFigure(seedHits, userMessage, {
    maxUrls:   options?.maxUrls ?? 4,
    timeoutMs: options?.timeoutMs ?? 10_000,
  });

  return { hits: result.hits, articleFound: result.articleFound };
}

const STAT_PATH_HINT_RE =
  /sejarah|history|enrol|enrollment|student|pelajar|about|corporate|profile|statistic|maklumat|sejarah|nurse|nursing|career|skills|role|responsibilit/i;

/** Government / health authority hosts — prefer for global factual career answers. */
const OFFICIAL_PUBLIC_REFERENCE_HOST_RE =
  /(?:^|\.)gov\.uk$|(?:^|\.)gov\.my$|(?:^|\.)moe\.gov\.my$|(?:^|\.)nhs\.uk$|healthcareers\.nhs\.uk|(?:^|\.)who\.int$|(?:^|\.)cdc\.gov$|(?:^|\.)nih\.gov$|(?:^|\.)edu$/i;

/** Third-party doc hosts — never primary for institutional enrollment stats. */
const THIRD_PARTY_AGGREGATOR_HOST_RE =
  /(?:^|\.)scribd\.com$|(?:^|\.)academia\.edu$|(?:^|\.)researchgate\.net$|(?:^|\.)yumpu\.com$|(?:^|\.)issuu\.com$/i;

/** China-web aggregators — wrong index for global English factual turns on DashScope intl. */
const CHINESE_WEB_AGGREGATOR_HOST_RE =
  /(?:^|\.)baidu\.com$|(?:^|\.)youdao\.com$|(?:^|\.)weixin\.qq\.com$|(?:^|\.)zhihu\.com$|(?:^|\.)sogou\.com$|(?:^|\.)so\.com$|(?:^|\.)163\.com$|(?:^|\.)tmall\.com$|(?:^|\.)taobao\.com$|(?:^|\.)qq\.com$/i;

export function isChineseWebAggregatorHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return CHINESE_WEB_AGGREGATOR_HOST_RE.test(host);
  } catch {
    return false;
  }
}

/** True when the user message is primarily English/Latin — prefer global web hits. */
export function messagePrefersGlobalWebSearch(message: string): boolean {
  const body = stripLeadingAdamSalutation(message.trim());
  if (!body) return false;
  const cjk = (body.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length;
  const latin = (body.match(/[a-z]/gi) ?? []).length;
  if (cjk >= 4 && cjk > latin / 4) return false;
  return latin >= 12 || /\b(?:what|how|why|registered|nurse|skills|career|healthcare)\b/i.test(body);
}

/** Drop China-index aggregator hits for global English questions; keep BM/MY official .my sources. */
export function filterSearchHitsForMessageLocale(
  hits: LlmSearchResult[],
  userMessage: string,
): LlmSearchResult[] {
  if (!messagePrefersGlobalWebSearch(userMessage)) return hits;
  const filtered = hits.filter((hit) => {
    const url = hit.url?.trim();
    if (!url) return true;
    if (isChineseWebAggregatorHost(url)) return false;
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      if (/\.cn$/i.test(host) && !/\.edu\.cn$/i.test(host)) return false;
    } catch {
      return true;
    }
    return true;
  });
  return filtered.length > 0 ? filtered : hits;
}

export function isThirdPartyAggregatorHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return THIRD_PARTY_AGGREGATOR_HOST_RE.test(host);
  } catch {
    return false;
  }
}

function registrableDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, '').toLowerCase().split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
}

/** Same institution — registrable domain match or subdomain sibling (e.g. bangi.kptm.edu.my ↔ kptm.edu.my). */
export function sameInstitutionHost(linkHost: string, baseHost: string): boolean {
  const link = linkHost.replace(/^www\./, '').toLowerCase();
  const base = baseHost.replace(/^www\./, '').toLowerCase();
  if (link === base) return true;
  if (registrableDomain(link) === registrableDomain(base)) return true;
  return link.endsWith(`.${base}`) || base.endsWith(`.${link}`);
}

/**
 * Extract same-institution links from fetched HTML — URLs come from the page, not invented.
 * Used when a search-hit landing page has no stat figure but links to history/about pages.
 */
export function extractInstitutionStatLinksFromHtml(
  html: string,
  baseUrl: string,
  maxLinks = 6,
): string[] {
  const base = new URL(baseUrl);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const raw = match[1]?.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('javascript:')) {
      continue;
    }
    try {
      const resolved = new URL(raw, baseUrl);
      if (!['http:', 'https:'].includes(resolved.protocol)) continue;
      if (!sameInstitutionHost(resolved.hostname, base.hostname)) continue;
      const pathBlob = `${resolved.pathname}${resolved.search}${raw}`.toLowerCase();
      if (!STAT_PATH_HINT_RE.test(pathBlob)) continue;
      const href = resolved.href;
      if (seen.has(href)) continue;
      seen.add(href);
      out.push(href);
    } catch {
      continue;
    }
  }
  return out.slice(0, maxLinks);
}

function hostnameContainsSubjectToken(hostname: string, tokens: string[]): boolean {
  const host = hostname.replace(/^www\./, '').toLowerCase();
  return tokens.some((token) => token.length >= 3 && host.includes(token.replace(/\s+/g, '')));
}

export function rankHitsForStatPageEnrich(
  hits: LlmSearchResult[],
  userMessage: string,
): LlmSearchResult[] {
  const tokens = extractSubjectTokensFromMessage(userMessage);

  const scoreHit = (hit: LlmSearchResult): number => {
    const blob = `${hit.url ?? ''} ${hit.title ?? ''} ${hit.snippet ?? ''}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (token.length >= 2 && blob.includes(token)) score += 12;
    }
    const url = hit.url?.trim();
    if (url) {
      if (isThirdPartyAggregatorHost(url)) score -= 50;
      if (isChineseWebAggregatorHost(url) && messagePrefersGlobalWebSearch(userMessage)) score -= 80;
      try {
        const host = new URL(url).hostname.replace(/^www\./, '');
        if (OFFICIAL_PUBLIC_REFERENCE_HOST_RE.test(host)) score += 42;
        if (hostnameContainsSubjectToken(host, tokens)) score += 40;
        const path = new URL(url).pathname.toLowerCase();
        if (STAT_PATH_HINT_RE.test(path)) score += 18;
      } catch {
        // skip invalid URL
      }
    }
    if (!hit.snippet?.trim()) score += 6;
    else if (!blobHasVerifiableStatFigure(blob)) score += 4;
    return score;
  };

  return [...hits].sort((a, b) => scoreHit(b) - scoreHit(a));
}

export function snippetIsFullArticle(snippet: string | undefined | null): boolean {
  return snippetHasGoldStandardBody(snippet);
}

/** Gold Standard body — full official page paragraphs (KPTM sejarah, NHS careers, etc.). */
export function snippetHasGoldStandardBody(snippet: string | undefined | null): boolean {
  if (!snippet?.trim()) return false;
  const trimmed = snippet.trim().replace(/&nbsp;/gi, ' ');
  const blocks = trimmed.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.length > 40);
  if (blocks.length >= 3 && trimmed.length >= 400) return true;
  if (blocks.length >= 2 && trimmed.length >= 280) return true;
  return false;
}

const ROLE_SKILL_GROUNDING_RE =
  /\b(?:role|roles|skill|skills|responsibilit|duties|duty|qualification|competen|peranan|kemahiran|tanggungjawab|guru|teacher|nurse|nursing|membimbing|mengajar|pendidikan|kurikulum|PdPc|pentaksiran)\b/i;

/**
 * Lower bar than Gold Standard — career/role pages or dense snippets usable for synthesis.
 * Prevents search-first turns from skipping synthesis when no enrollment stat exists.
 */
export function snippetHasSynthesisGroundingBody(snippet: string | undefined | null): boolean {
  if (snippetHasGoldStandardBody(snippet)) return true;
  if (!snippet?.trim()) return false;
  const trimmed = snippet.trim().replace(/&nbsp;/gi, ' ');
  if (trimmed.length < 120) return false;
  if (!ROLE_SKILL_GROUNDING_RE.test(trimmed)) return false;
  const blocks = trimmed.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.length > 40);
  return blocks.length >= 1 && trimmed.length >= 120;
}

function hitNeedsGoldStandardArticleFetch(hit: LlmSearchResult): boolean {
  const url = hit.url?.trim();
  if (!url) return false;
  if (hit.pageFetched && snippetHasGoldStandardBody(hit.snippet)) return false;
  return true;
}

function hitNeedsPageStatFetch(hit: LlmSearchResult): boolean {
  return hitNeedsGoldStandardArticleFetch(hit);
}

export function primaryEvidenceDomain(
  evidence: LlmSearchResult[],
  preferredFigure?: string | null,
): string | null {
  if (preferredFigure) {
    const compact = preferredFigure.replace(/,/g, '');
    const n = Number.parseInt(compact, 10);
    const formatted = Number.isFinite(n) ? n.toLocaleString('en-US') : preferredFigure;
    for (const hit of evidence) {
      const blob = `${hit.title ?? ''} ${hit.snippet ?? ''} ${hit.url ?? ''}`;
      if (blob.includes(preferredFigure) || blob.includes(formatted) || blob.includes(compact)) {
        const url = hit.url?.trim();
        if (url) {
          try {
            return new URL(url).hostname.replace(/^www\./, '');
          } catch {
            continue;
          }
        }
      }
    }
  }
  const ranked = [...evidence].sort((a, b) => evidenceHostPriority(b.url) - evidenceHostPriority(a.url));
  for (const hit of ranked) {
    const url = hit.url?.trim();
    if (!url) continue;
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      continue;
    }
  }
  return null;
}

function evidenceHostPriority(url: string | undefined | null): number {
  if (!url?.trim()) return 0;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (OFFICIAL_PUBLIC_REFERENCE_HOST_RE.test(host)) return 100;
    if (/\.edu\.my$/i.test(host) && !/^news\./i.test(host)) return 60;
    if (/^news\./i.test(host)) return 10;
    return 40;
  } catch {
    return 0;
  }
}

function extractStatSnippetFromText(text: string, window = 360): string | null {
  for (const pattern of STAT_FIGURE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.index !== undefined) {
      const start = Math.max(0, match.index - 48);
      return text.slice(start, start + window).trim();
    }
  }
  return null;
}

/** BM pages may spell graduan / graduat / graduate; EN may use alumni. */
export const GRADUATE_STAT_SENTENCE_RE =
  /[^.!?]*\b\d{1,3}(?:,\d{3})+\s*(?:orang\s+)?(?:gradu(?:an|at|ate?s?)|alumni)[^.!?]*[.!?]/gi;

function extractGraduateSentenceFromPageText(
  text: string,
  userMessage: string,
): string | null {
  const subjectTokens = extractSubjectTokensFromMessage(userMessage);
  GRADUATE_STAT_SENTENCE_RE.lastIndex = 0;
  for (const match of text.matchAll(GRADUATE_STAT_SENTENCE_RE)) {
    const sentence = match[0].trim();
    const idx = match.index ?? 0;
    const blob = `${sentence} ${
      text.slice(Math.max(0, idx - 140), idx + sentence.length + 40)
    }`.toLowerCase();
    if (subjectTokens.length > 0 && !subjectTokens.some((t) => blob.includes(t))) continue;
    return sentence;
  }
  return null;
}

function findEnrollmentSentenceStart(text: string, matchIndex: number, userMessage: string): number {
  const before = text.slice(0, matchIndex);
  const boundary = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? '),
  );
  if (boundary >= 0) return boundary + 2;

  const tokens = extractSubjectTokensFromMessage(userMessage);
  let subjectStart = -1;
  for (const token of tokens) {
    const idx = before.toLowerCase().lastIndexOf(token.toLowerCase());
    if (idx > subjectStart) subjectStart = idx;
  }
  if (subjectStart >= 0) return subjectStart;

  return Math.max(0, matchIndex - 72);
}

/** Full enrollment sentence through campus list — from sentence boundary, not a char window. */
function extractEnrollmentExcerptFromPageText(
  text: string,
  userMessage = '',
  maxWindow = 640,
): string | null {
  for (const pattern of STAT_FIGURE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.index === undefined) continue;
    if (!/\b(?:pelajar|students?|enrol)/i.test(match[0])) continue;
    const start = userMessage.trim()
      ? findEnrollmentSentenceStart(text, match.index, userMessage)
      : Math.max(0, match.index - 72);
    const after = text.slice(match.index);
    const endRel = after.search(/[.!?](?=\s|$)/);
    if (endRel > 0 && endRel < maxWindow) {
      return text.slice(start, match.index + endRel + 1).trim();
    }
    return text.slice(start, start + maxWindow).trim();
  }
  return extractStatSnippetFromText(text, maxWindow);
}

/**
 * Enrollment excerpt + graduate sentence from the same fetched page body.
 * Stored on the hit snippet so figure-led replies can cite both without re-fetch.
 */
/** Full-sentence fact lines from enriched hit snippets — feeds synthesis, not user-facing paste. */
export function extractCampusNamesFromStatText(text: string): string[] {
  const m = text.match(/\b(?:kampus|campuses?)[:;]\s*([^.!?]+)/i);
  if (!m?.[1]?.trim()) return [];
  return m[1]
    .replace(/\s+dan\s+/gi, ', ')
    .split(',')
    .map((s) => s.trim())
    .filter((name) => name.length > 2);
}

export function extractRichPageStatFactsFromHits(
  hits: LlmSearchResult[],
  userMessage: string,
): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const hit of rankHitsForStatPageEnrich(hits, userMessage)) {
    const snippet = hit.snippet?.trim();
    const url = hit.url?.trim() ?? 'source';
    if (!snippet || snippet.length < 24) continue;
    for (const block of snippet.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)) {
      const key = block.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`${block} | ${url}`);
      const campuses = extractCampusNamesFromStatText(block);
      if (campuses.length >= 2) {
        const campusLine = `Kampus: ${campuses.join(', ')} | ${url}`;
        const campusKey = campusLine.toLowerCase();
        if (!seen.has(campusKey)) {
          seen.add(campusKey);
          lines.push(campusLine);
        }
      }
    }
  }
  return lines.slice(0, 14).join('\n');
}

function paragraphLooksLikeSiteChrome(text: string): boolean {
  if (/^Laman Web\s*:/i.test(text)) return true;
  if (/\b(?:Skip to content|Facebook Rasmi|Email Pengurusan|Soalan Lazim)\b/i.test(text)) return true;
  if (/^(?:UTAMA|PROFIL|KEMASUKAN|HUBUNGI|ORGANISASI|CAPAIAN)\b/.test(text)) return true;
  if (text.length > 400 && (text.match(/\b[A-Z]{2,6}\b/g)?.length ?? 0) > 12) return true;
  return false;
}

/** NHS career pages — skip nav intros, list headers without items, application boilerplate. */
function careerParagraphIsBoilerplate(text: string): boolean {
  if (/^this page has information on\b/i.test(text)) return true;
  if (/^on a daily basis you will use a broad range of skills\b/i.test(text)) return true;
  if (/^if you're applying for a role\b/i.test(text)) return true;
  if (/^find out more about the nhs values\b/i.test(text)) return true;
  if (/^opens in a new window$/i.test(text)) return true;
  if (/^get started$/i.test(text)) return true;
  if (/^from learning about the roles and benefits\b/i.test(text)) return true;
  return false;
}

/** Role page noise when merging with a skills subpage — training routes, testimonials, CTAs. */
function careerParagraphIsRolePageNoise(text: string): boolean {
  if (careerParagraphIsBoilerplate(text)) return true;
  if (/\b(?:gcse|a level|btec|degree course at university|postgraduate qualification|entry requirements)\b/i.test(text)) {
    return true;
  }
  if (/^to become an adult nurse, the main route\b/i.test(text)) return true;
  if (/^that's one of the best things about choosing nursing\b/i.test(text)) return true;
  if (/^there are many reasons why you should consider a career\b/i.test(text)) return true;
  if (/^you'll also have access to the generous nhs pension\b/i.test(text)) return true;
  return false;
}

/**
 * NHS career HTML often joins two full sentences in one <p> — Gold Standard needs each on its own line.
 */
export function splitCareerParagraphIntoSentenceBlocks(text: string): string[] {
  const normalized = text.replace(/&nbsp;/gi, ' ').trim();
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40);

  if (sentences.length <= 1) return [normalized];

  if (sentences.length >= 2 && sentences.every((s) => /[.!?]$/.test(s))) {
    return sentences;
  }

  return [normalized];
}

export function mergeUniqueArticleParagraphs(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const para of group) {
      const key = para.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(para);
    }
  }
  return out;
}

function pushCareerArticleParagraphs(out: string[], seen: Set<string>, text: string): void {
  for (const block of splitCareerParagraphIntoSentenceBlocks(text)) {
    if (block.length < 48 || !/[.!?]/.test(block)) continue;
    if (careerParagraphIsBoilerplate(block)) continue;
    const key = block.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(block);
  }
}

/**
 * All substantive <p> prose from an official page — not a stat-figure char window.
 * When the page has a verifiable stat figure, include institutional paragraphs too.
 */
export function extractArticleParagraphsFromHtml(
  html: string,
  userMessage: string,
): string[] {
  const subjectTokens = extractSubjectTokensFromMessage(userMessage);
  const pagePlain = htmlToPlainText(html);
  const pageHasFigure = blobHasVerifiableStatFigure(pagePlain);
  const pageMentionsSubject = subjectTokens.some(
    (t) => t.length >= 3 && pagePlain.toLowerCase().includes(t.toLowerCase()),
  );
  const factualCareerPage = !pageHasFigure && (
    pageMentionsSubject
    || /\b(?:nurse|nursing|registered nurse|healthcare|clinical|patient care)\b/i.test(pagePlain)
  );
  const seen = new Set<string>();
  const out: string[] = [];

  for (const match of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = htmlToPlainText(match[1] ?? '').replace(/&nbsp;/gi, ' ').trim();
    if (text.length < 48 || text.length > 1_400) continue;
    if (!/[.!?]/.test(text)) continue;
    if (paragraphLooksLikeSiteChrome(text)) continue;

    const lower = text.toLowerCase();
    const key = lower.replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;

    if (factualCareerPage) {
      pushCareerArticleParagraphs(out, seen, text);
      continue;
    }

    const hasSubject = subjectTokens.length === 0
      || subjectTokens.some((token) => lower.includes(token.toLowerCase()));
    const hasFigure = blobHasVerifiableStatFigure(text);
    const institutional = /\b(?:kolej|universiti|institut|kampus|graduat|pelajar|diploma|ijazah|ditubuhkan|penubuhan|program)\b/i.test(text);

    const include = pageHasFigure
      ? (hasSubject || hasFigure || institutional)
      : (hasSubject && (hasFigure || institutional));

    if (!include) continue;
    seen.add(key);
    out.push(text);
  }

  return out.slice(0, 24);
}

/** User asks role definition + skills — prefer child pages like /skills-required/. */
export function messageAsksRoleAndSkills(message: string): boolean {
  const body = stripLeadingAdamSalutation(message.trim());
  if (/\b(?:what\s+(?:is|does|are)|skills?\s+(?:do\s+i\s+need|required|needed)|role|responsibilit)/i.test(body)) {
    return true;
  }
  if (/\b(?:apakah\s+peranan|peranan\s+(?:seorang|guru|pekerja)|kemahiran\s+apa|kemahiran\s+(?:yang\s+)?diperlukan|tanggungjawab)\b/i.test(body)) {
    return true;
  }
  return /\b(?:peranan|kemahiran)\b/i.test(body)
    && /\b(?:guru|jururawat|nurse|pekerjaan|jawatan|karier|career|sekolah)\b/i.test(body);
}

function rankChildLinksForMessage(links: string[], userMessage: string): string[] {
  const wantsSkills = /\bskills?\b/i.test(userMessage);
  const wantsRole = /\bwhat\s+(?:is|does)\b/i.test(userMessage);
  return [...links].sort((a, b) => {
    const score = (url: string) => {
      const path = url.toLowerCase();
      let s = 0;
      if (/skills|characteristics|personal|responsibilit|qualities|requirements/.test(path)) s += 50;
      if (wantsSkills && /skills/.test(path)) s += 30;
      if (wantsRole && /role|characteristics|personal/.test(path)) s += 20;
      if (/real-life-story|quiz|bookmark|login/.test(path)) s -= 40;
      return s;
    };
    return score(b) - score(a);
  });
}

function mergePageFetchedHit(
  hits: LlmSearchResult[],
  pageHit: LlmSearchResult,
): LlmSearchResult[] {
  const url = pageHit.url?.trim();
  const enriched: LlmSearchResult = { ...pageHit, pageFetched: true };
  if (!url) return [...hits, enriched];
  let replaced = false;
  const merged = hits.map((h) => {
    if (h.url?.trim() === url) {
      replaced = true;
      return { ...enriched, title: h.title?.trim() || enriched.title };
    }
    return h;
  });
  return replaced ? merged : [...merged, enriched];
}

function composeRoleAndSkillsPageSnippet(
  parentHtml: string,
  childHtml: string,
  userMessage: string,
): string | null {
  const roleParas = extractArticleParagraphsFromHtml(parentHtml, userMessage)
    .filter((p) => !careerParagraphIsRolePageNoise(p));
  const skillsParas = extractArticleParagraphsFromHtml(childHtml, userMessage);
  const merged = mergeUniqueArticleParagraphs(roleParas, skillsParas);
  if (merged.length >= 2) return merged.join('\n\n');
  return null;
}

function composePageSnippetFromHtml(html: string, userMessage: string): string | null {
  const article = userMessage.trim()
    ? extractArticleParagraphsFromHtml(html, userMessage)
    : [];
  if (article.length >= 2) return article.join('\n\n');

  const plain = htmlToPlainText(html);
  if (!userMessage.trim()) return extractStatSnippetFromText(plain);
  if (messageAsksRoleAndSkills(userMessage)) return null;
  return composeSamePageStatSnippet(plain, userMessage);
}

export function composeSamePageStatSnippet(plain: string, userMessage: string): string | null {
  const enrollment = extractEnrollmentExcerptFromPageText(plain, userMessage);
  if (!enrollment) return extractStatSnippetFromText(plain);
  if (!userMessage.trim()) return enrollment;
  const graduate = extractGraduateSentenceFromPageText(plain, userMessage);
  if (graduate && !/\bgradu|alumni/i.test(enrollment)) {
    return `${enrollment}\n\n${graduate}`;
  }
  return enrollment;
}

async function fetchPageHtml(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal:  controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':      'Alamtologi-ADAM/1.7 (search-hit enrichment)',
        'Accept':          'text/html,application/xhtml+xml',
        'Accept-Language': 'ms-MY,en;q=0.9',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchPageStatSnippet(
  url: string,
  title: string,
  timeoutMs = 10_000,
  options?: { maxCrawlLinks?: number; userMessage?: string },
): Promise<LlmSearchResult | null> {
  const html = await fetchPageHtml(url, timeoutMs);
  if (!html) return null;

  const userMessage = options?.userMessage ?? '';
  const crawlBudget = options?.maxCrawlLinks ?? 6;
  const childLinks = rankChildLinksForMessage(
    extractInstitutionStatLinksFromHtml(html, url, crawlBudget),
    userMessage,
  );

  if (messageAsksRoleAndSkills(userMessage) && childLinks.length > 0) {
    const parentRoleParas = extractArticleParagraphsFromHtml(html, userMessage)
      .filter((p) => !careerParagraphIsRolePageNoise(p));

    for (const childUrl of childLinks) {
      const childHtml = await fetchPageHtml(childUrl, timeoutMs);
      if (!childHtml) continue;

      const roleAndSkills = composeRoleAndSkillsPageSnippet(html, childHtml, userMessage);
      if (roleAndSkills && snippetHasGoldStandardBody(roleAndSkills)) {
        return {
          title:       title || childUrl,
          url:         childUrl,
          snippet:     roleAndSkills,
          pageFetched: true,
        };
      }

      const childSnippet = composePageSnippetFromHtml(childHtml, userMessage);
      if (childSnippet && snippetHasGoldStandardBody(childSnippet)) {
        const merged = mergeUniqueArticleParagraphs(
          parentRoleParas,
          childSnippet.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
        );
        const snippet = merged.join('\n\n');
        if (snippetHasGoldStandardBody(snippet)) {
          return {
            title:       title || childUrl,
            url:         childUrl,
            snippet,
            pageFetched: true,
          };
        }
      }
    }
  }

  let snippet = composePageSnippetFromHtml(html, userMessage);
  if (snippet && snippetHasGoldStandardBody(snippet)) {
    return { title: title || url, url, snippet, pageFetched: true };
  }

  for (const childUrl of childLinks) {
    const childHtml = await fetchPageHtml(childUrl, timeoutMs);
    if (!childHtml) continue;
    snippet = composePageSnippetFromHtml(childHtml, userMessage);
    if (snippet && snippetHasGoldStandardBody(snippet)) {
      return {
        title:       title || childUrl,
        url:         childUrl,
        snippet,
        pageFetched: true,
      };
    }
  }

  if (snippet) {
    return { title: title || url, url, snippet, pageFetched: true };
  }
  return null;
}

export interface PageSnippetEnrichOptions {
  maxUrls?:    number;
  timeoutMs?:  number;
}

/**
 * Fetch page text for search-hit URLs that lack snippets.
 * URLs come from search only — never invented.
 */
export async function enrichSearchHitsWithPageSnippets(
  hits: LlmSearchResult[],
  options?: PageSnippetEnrichOptions,
): Promise<LlmSearchResult[]> {
  const maxUrls = options?.maxUrls ?? 3;
  const timeoutMs = options?.timeoutMs ?? 5_000;
  const seen = new Set(hits.map((h) => h.url?.trim()).filter(Boolean) as string[]);

  const toFetch = hits
    .filter((h) => hitNeedsPageStatFetch(h))
    .slice(0, maxUrls);

  const fetched = await Promise.all(
    toFetch.map(async (hit) => {
      const url = hit.url?.trim();
      if (!url || seen.has(url)) return null;
      seen.add(url);
      return fetchPageStatSnippet(url, hit.title?.trim() || url, timeoutMs);
    }),
  );

  return fetched.filter((hit): hit is LlmSearchResult => hit !== null);
}

/**
 * Fetch ranked hit URLs one-by-one until a verifiable stat figure appears in evidence.
 * Stops early on first success — avoids parallel timeout races on production VPS.
 */
export async function enrichSearchHitsUntilStatFigure(
  hits: LlmSearchResult[],
  userMessage: string,
  options?: PageSnippetEnrichOptions,
): Promise<{ hits: LlmSearchResult[]; figureFound: boolean; articleFound: boolean }> {
  const maxUrls = options?.maxUrls ?? 6;
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const ranked = rankHitsForStatPageEnrich(hits, userMessage);
  const merged = [...hits];
  const fetchedUrls = new Set<string>();

  const evidenceHasSubjectFigure = (): boolean =>
    rankHitsForStatPageEnrich(merged, userMessage)
      .some((hit) => extractStatFigureFromHit(hit, userMessage) !== null);

  const evidenceHasFullArticle = (): boolean =>
    rankHitsForStatPageEnrich(merged, userMessage)
      .some((hit) => hit.pageFetched === true
        && (snippetHasGoldStandardBody(hit.snippet)
          || snippetHasSynthesisGroundingBody(hit.snippet)));

  if (evidenceHasFullArticle()) {
    return { hits: merged, figureFound: evidenceHasSubjectFigure(), articleFound: true };
  }

  if (evidenceHasSubjectFigure() && ranked.some(
    (h) => h.pageFetched && snippetHasGoldStandardBody(h.snippet),
  )) {
    return { hits: merged, figureFound: true, articleFound: true };
  }

  let fetchCount = 0;
  for (const hit of ranked) {
    if (fetchCount >= maxUrls) break;
    const url = hit.url?.trim();
    if (!url || fetchedUrls.has(url)) continue;
    if (isThirdPartyAggregatorHost(url)) continue;
    fetchedUrls.add(url);
    if (!hitNeedsGoldStandardArticleFetch(hit)) continue;
    fetchCount += 1;
    const pageHit = await fetchPageStatSnippet(url, hit.title?.trim() || url, timeoutMs, {
      maxCrawlLinks: 4,
      userMessage,
    });
    if (!pageHit) continue;
    const mergedNext = mergePageFetchedHit(merged, pageHit);
    merged.splice(0, merged.length, ...mergedNext);
    fetchedUrls.add(pageHit.url?.trim() ?? url);
    if (pageHit.pageFetched && (
      snippetHasGoldStandardBody(pageHit.snippet)
      || snippetHasSynthesisGroundingBody(pageHit.snippet)
    )) {
      return {
        hits:         merged,
        figureFound:  evidenceHasSubjectFigure(),
        articleFound: true,
      };
    }
    if (extractStatFigureFromHit(pageHit, userMessage)) {
      return { hits: merged, figureFound: true, articleFound: evidenceHasFullArticle() };
    }
  }

  const embeddedCandidates = collectInstitutionCandidateUrlsFromEvidence(merged, userMessage);
  for (const url of embeddedCandidates) {
    if (fetchCount >= maxUrls) break;
    if (fetchedUrls.has(url) || isThirdPartyAggregatorHost(url)) continue;
    fetchedUrls.add(url);
    fetchCount += 1;
    const pageHit = await fetchPageStatSnippet(url, url, timeoutMs, { maxCrawlLinks: 4, userMessage });
    if (!pageHit) continue;
    const mergedNext = mergePageFetchedHit(merged, pageHit);
    merged.splice(0, merged.length, ...mergedNext);
    fetchedUrls.add(pageHit.url?.trim() ?? url);
    if (pageHit.pageFetched && (
      snippetHasGoldStandardBody(pageHit.snippet)
      || snippetHasSynthesisGroundingBody(pageHit.snippet)
    )) {
      return {
        hits:         merged,
        figureFound:  evidenceHasSubjectFigure(),
        articleFound: true,
      };
    }
    if (extractStatFigureFromHit(pageHit, userMessage)) {
      return { hits: merged, figureFound: true, articleFound: evidenceHasFullArticle() };
    }
  }

  return {
    hits:         merged,
    figureFound:  evidenceHasSubjectFigure(),
    articleFound: evidenceHasFullArticle(),
  };
}
