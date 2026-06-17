/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Search-First Flow (student factual turns)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Student substantive turns: web search runs BEFORE answer generation.
 * The LLM synthesis phase receives prefetched hits — it does not
 * answer from memory while search runs in parallel.
 *
 * Canonical pipeline (student):
 *   User soalan → Web search → Analisa hits → Jawab (fakta + kedalaman ilmiah)
 */

import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
import { isQwenDataInspectionError, llmPrefetchWebSearch } from '../llm/llm-client';
import { getFastModel } from '../config/llm-models';
import { ADAM_SCIENTIST_SCHOLAR_IDENTITY } from './adam-universal-voice';
import {
  buildCurrentAffairsPrefetchPrompt,
  isAdamCurrentAffairsTurn,
} from './adam-current-affairs';
import { isAdamPracticalAdvisoryTurn, stripLeadingAdamSalutation } from './adam-response-generation';
import {
  buildMarketPricingPrefetchPrompt,
  buildMarketPricingSearchDisplayQuery,
  buildMarketPricingSearchSites,
  buildMarketPricingSearchWeaveRules,
  isAdamMarketPricingTurn,
} from './adam-market-pricing';
import {
  blobHasVerifiableStatFigure,
  enrichSearchHitsUntilStatFigure,
  extractDomainsFromMessageUrls,
  extractInstitutionAliasesFromMessage,
  extractStatSubjectFromMessage,
  extractStatFigureFromHit,
  filterOfficialSubjectStatHits,
  filterSearchHitsForMessageLocale,
  filterSearchHitsToSubjectRelevant,
  extractRichPageStatFactsFromHits,
  matchStatFigureClaimsInText,
  messageAsksRoleAndSkills,
  probeFactualAuthoritativeEvidence,
  probeInstitutionStatEvidenceFromAcronym,
  rankHitsForStatPageEnrich,
  searchHitsIncludeSubjectToken,
  snippetIsFullArticle,
  snippetHasGoldStandardBody,
  snippetHasSynthesisGroundingBody,
  buildFactualAuthoritativeProbeUrls,
} from './adam-official-source-enrich';
import { buildPracticalAdvisorySearchWeaveRules } from './adam-practical-advisory-gold';
import {
  buildGoldStandardSynthesisInstruction,
  evidenceHasGoldStandardArticle,
  extractVerifiedStatFigureFromEvidence,
} from './adam-alpha-output-guard';
import {
  buildFactualCareerSearchSites,
  buildVerifiedDataStatSearchSites,
  isFactualAdamWebSearchGateReason,
  isVerifiedDataStatAsk,
  resolveVerifiedDataStatSearchStrategy,
} from './adam-web-search';

/** Search-only phase — qwen-turbo (fast); deep model + web search stalls production prefetch. */
export function getStudentSearchPrefetchModel(): string {
  return getFastModel();
}

/** Default substantive reply pipeline — all roles (founder, student, guest). */
export const ADAM_DEFAULT_GOLD_STANDARD_PIPELINE = `
ADAM GOLD STANDARD — DEFAULT FOR EVERY SUBSTANTIVE QUESTION (mandatory):
1. Read intent — α (fakta dulu) or β (explain-back) per Answer Constitution.
2. Web search — prefetch before synthesis; ground truth in search hits or [GOLD STANDARD — ADAM FULL VOICE].
3. Official page enrich — when a credible source page is fetchable, use full article text (not DashScope snippets alone).
4. Synthesize — ADAM full voice; α opens with verified facts; β follows Explain-Back 1A → 1B → synthesis.
5. Close — α: L5 optional when valuable; α practical advisory: organic close (career fork or Gold Standard follow-up); β: L5 tamparan jiwa mandatory (Answer Constitution v2).

Skip only for salam, thanks, pure reflection, or Teaching-room learner absorption.

${ADAM_SCIENTIST_SCHOLAR_IDENTITY}
`.trim();

/** @deprecated Use ADAM_DEFAULT_GOLD_STANDARD_PIPELINE */
export const ADAM_STUDENT_REPLY_PIPELINE = ADAM_DEFAULT_GOLD_STANDARD_PIPELINE;

export const SEARCH_PREFETCH_SYSTEM = `
WEB SEARCH PREFETCH PHASE — mandatory.

Run web search for the student's question using current web data.
Do NOT answer the question in this phase.
After search completes, reply with exactly: OK
`.trim();

/** Factual prefetch — extract verifiable claims from search for synthesis (not just OK). */
export const FACT_EXTRACTION_PREFETCH_SYSTEM = `
WEB SEARCH FACT EXTRACTION — mandatory.

Run web search for the student's question using current web data.
Do NOT write a conversational answer.

After search completes, output ONLY this plain-text block:

EXTRACTED_FACTS:
- claim_or_figure | source_title | url

Rules:
- One line per verifiable fact: enrollment totals, office-holders, role duties, required skills, qualifications, published standards
- Include role definitions and skill requirements when the question asks about a job or career
- Use exact figures from sources — never invent or round creatively
- Max 8 lines
- If nothing verifiable was found, output exactly: EXTRACTED_FACTS: NONE
`.trim();

export function buildSearchPrefetchSystem(
  userMessage: string,
  webSearchGateReason?: string | null,
): string {
  if (
    isVerifiedDataStatAsk(userMessage)
    || webSearchGateReason === 'verified_data_stat'
    || isFactualAdamWebSearchGateReason(webSearchGateReason ?? null)
  ) {
    return FACT_EXTRACTION_PREFETCH_SYSTEM;
  }
  return SEARCH_PREFETCH_SYSTEM;
}

/** Parse EXTRACTED_FACTS block from prefetch LLM output. */
export function parseExtractedFactsFromPrefetch(text: string): string {
  const match = text.match(/EXTRACTED_FACTS:\s*([\s\S]*)/i);
  if (match?.[1]) {
    const body = match[1].trim();
    if (!/^NONE\b/i.test(body)) {
      const lines = body
        .split('\n')
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line) => line.length > 4 && !/^NONE\b/i.test(line));
      if (lines.length > 0) return lines.slice(0, 8).join('\n');
    }
  }
  // Fallback — numbered lines with pipe separators from loose model output
  const loose = text
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => /\d{1,3}(?:,\d{3})+/.test(line) && line.includes('|'));
  return loose.slice(0, 8).join('\n');
}

/**
 * Drop prefetch LLM fact lines that are not grounded in search-hit URLs/snippets.
 * When hits are empty, discard all — prevents memory hallucination with hits:0.
 */
export function groundExtractedFactsToSearchHits(
  extractedFacts: string,
  hits: LlmSearchResult[],
  userMessage = '',
): string {
  if (!extractedFacts.trim()) return '';
  if (hits.length === 0) return '';

  const scopedHits = userMessage.trim()
    ? filterSearchHitsToSubjectRelevant(hits, userMessage)
    : hits;
  if (userMessage.trim() && scopedHits.length === 0) return '';

  const hitUrls = scopedHits
    .map((h) => h.url?.trim())
    .filter((url): url is string => Boolean(url));
  const hitBlob = scopedHits
    .map((h) => `${h.title ?? ''} ${h.snippet ?? ''} ${h.url ?? ''}`)
    .join(' ')
    .toLowerCase();

  const careerAsk = messageAsksRoleAndSkills(userMessage) || isAdamPracticalAdvisoryTurn(userMessage);

  const kept = extractedFacts
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (hitUrls.some((url) => line.includes(url))) return true;
      const figures = line.match(/\d{1,3}(?:,\d{3})+|\d{4,6}/g) ?? [];
      if (figures.some((fig) => {
        const compact = fig.replace(/,/g, '');
        return hitBlob.includes(fig.toLowerCase()) || hitBlob.includes(compact);
      })) {
        return true;
      }
      if (careerAsk) {
        const tokens = line.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
        const overlap = tokens.filter((t) => hitBlob.includes(t)).length;
        if (overlap >= 3) return true;
      }
      return false;
    });

  return kept.slice(0, 8).join('\n');
}

/** Client-side figure extraction from hit titles/snippets — does not rely on prefetch LLM format. */
export function extractHeuristicFactsFromSearchHits(
  hits: LlmSearchResult[],
  userMessage = '',
): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  const scopedHits = userMessage.trim()
    ? filterSearchHitsToSubjectRelevant(hits, userMessage)
    : hits;

  for (const hit of scopedHits) {
    const title = hit.title?.trim() ?? '';
    const url = hit.url?.trim() ?? '';
    const snippet = hit.snippet?.trim() ?? '';
    const blob = `${title} ${snippet} ${url}`;

    for (const claim of matchStatFigureClaimsInText(blob)) {
      const key = claim.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`${claim} | ${title || 'source'} | ${url}`);
    }
  }

  return lines.slice(0, 8).join('\n');
}

/** Role/skill claims from search snippets — career asks without enrollment stats. */
export function extractRoleSkillFactsFromSearchHits(
  hits: LlmSearchResult[],
  userMessage = '',
): string {
  if (!messageAsksRoleAndSkills(userMessage) && !isAdamPracticalAdvisoryTurn(userMessage)) {
    return '';
  }
  const lines: string[] = [];
  const seen = new Set<string>();
  const scopedHits = userMessage.trim()
    ? filterSearchHitsToSubjectRelevant(hits, userMessage)
    : hits;
  const pool = scopedHits.length > 0 ? scopedHits : hits;

  for (const hit of pool) {
    const title = hit.title?.trim() ?? '';
    const url = hit.url?.trim() ?? '';
    const snippet = hit.snippet?.trim() ?? '';
    const blob = `${title}\n${snippet}`;
    const chunks = blob
      .split(/(?<=[.!?])\s+|\n{2,}/)
      .map((c) => c.trim())
      .filter((c) => c.length >= 40);

    for (const chunk of chunks) {
      if (!/\b(?:role|skill|responsibilit|duty|duties|peranan|kemahiran|guru|teacher|nurse|tanggungjawab|competen|qualification|membimbing|mengajar|pendidikan|kurikulum|PdPc|pentaksiran)\b/i.test(chunk)) {
        continue;
      }
      const key = chunk.toLowerCase().slice(0, 96);
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`${chunk} | ${title || 'source'} | ${url}`);
      if (lines.length >= 8) break;
    }
    if (lines.length >= 8) break;
  }

  return lines.join('\n');
}

/** Stat figures + role/skill claims — unified fact extraction for synthesis. */
export function extractFactsFromSearchHits(
  hits: LlmSearchResult[],
  userMessage = '',
): string {
  return mergeExtractedFactLines(
    extractHeuristicFactsFromSearchHits(hits, userMessage),
    extractRoleSkillFactsFromSearchHits(hits, userMessage),
  );
}

export function mergeExtractedFactLines(...blocks: Array<string | undefined>): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const block of blocks) {
    for (const line of (block ?? '').split('\n').map((l) => l.trim()).filter(Boolean)) {
      const key = line.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(line);
    }
  }
  return lines.slice(0, 8).join('\n');
}

/**
 * Stat fast-path result — reply when figure/zero-hit/off-subject only;
 * null reply + enriched evidence when subject hits need guarded synthesis.
 */
export interface AlphaStatFastPathResult {
  /** Terminal reply for zero-hit / off-subject only — never snippet paste. */
  reply:           string | null;
  evidence:        LlmSearchResult[];
  extractedFacts:  string;
  /** Verified enrollment figure — caller prepends opener and runs synthesis for body. */
  verifiedFigure:  string | null;
}

/**
 * Gold Standard prefetch resolution — full official article when page enrich succeeds;
 * stat zero-hit/off-subject terminal replies; otherwise synthesis fallback.
 */
export async function resolveGoldStandardSearchFirstReply(input: {
  userMessage:     string;
  searchResults:   LlmSearchResult[];
  extractedFacts:  string;
}): Promise<AlphaStatFastPathResult> {
  const isStat = isVerifiedDataStatAsk(input.userMessage);
  let evidence = input.searchResults;
  let facts = input.extractedFacts;
  let figure = extractVerifiedStatFigureFromEvidence(evidence, facts, input.userMessage);

  if (evidence.length === 0 && !isStat && buildFactualAuthoritativeProbeUrls(input.userMessage).length > 0) {
    const probed = await probeFactualAuthoritativeEvidence(input.userMessage, {
      maxUrls: 4,
      timeoutMs: 8_000,
    });
    if (probed.hits.length > 0) {
      evidence = dedupeSearchHits(probed.hits);
      facts = mergeExtractedFactLines(
        facts,
        extractRichPageStatFactsFromHits(evidence, input.userMessage),
      );
      console.log('[adam:search-first] gold standard authoritative probe', JSON.stringify({
        articleFound: probed.articleFound,
        hits: evidence.length,
        topUrls: evidence.slice(0, 3).map((h) => h.url?.slice(0, 80)),
      }));
    }
  }

  const needsArticleEnrich = evidence.length > 0
    && !evidenceHasGoldStandardArticle(evidence, input.userMessage);

  if (needsArticleEnrich) {
    const { hits: enriched, figureFound, articleFound } = await enrichSearchHitsUntilStatFigure(
      evidence,
      input.userMessage,
      { maxUrls: 8, timeoutMs: 6_000 },
    );
    evidence = dedupeSearchHits(enriched);
    facts = mergeExtractedFactLines(
      facts,
      extractFactsFromSearchHits(enriched, input.userMessage),
      extractRichPageStatFactsFromHits(enriched, input.userMessage),
    );
    figure = extractVerifiedStatFigureFromEvidence(evidence, facts, input.userMessage);
    console.log('[adam:search-first] gold standard page enrich', JSON.stringify({
      figureFound,
      articleFound,
      hits: evidence.length,
      hasFigure: Boolean(figure),
    }));
  }

  if (isStat && !figure) {
    const probed = await applyAcronymInstitutionProbeIfNeeded(
      input.userMessage,
      evidence,
      facts,
    );
    evidence = probed.hits;
    facts = probed.extractedFacts;
    figure = extractVerifiedStatFigureFromEvidence(evidence, facts, input.userMessage);
    if (probed.figureFound || figure) {
      console.log('[adam:search-first] acronym institution probe success', JSON.stringify({
        hits: evidence.length,
        hasFigure: Boolean(figure),
        topUrls: evidence.slice(0, 3).map((h) => h.url?.slice(0, 80)),
      }));
    }
  }

  if (evidenceHasGoldStandardArticle(evidence, input.userMessage)) {
    facts = mergeExtractedFactLines(
      facts,
      extractHeuristicFactsFromSearchHits(evidence, input.userMessage),
      extractRoleSkillFactsFromSearchHits(evidence, input.userMessage),
      extractRichPageStatFactsFromHits(evidence, input.userMessage),
    );
    console.log('[adam:search-first] gold standard full article ready', JSON.stringify({
      figure: figure ?? null,
      hits: evidence.length,
      factLines: facts.split('\n').filter(Boolean).length,
      topUrls: evidence.slice(0, 3).map((h) => h.url?.slice(0, 80)),
    }));
    return {
      reply:          null,
      evidence,
      extractedFacts: facts,
      verifiedFigure: figure,
    };
  }

  if (!isStat) {
    return { reply: null, evidence, extractedFacts: facts, verifiedFigure: null };
  }

  if (figure) {
    facts = mergeExtractedFactLines(
      facts,
      extractHeuristicFactsFromSearchHits(evidence, input.userMessage),
      extractRoleSkillFactsFromSearchHits(evidence, input.userMessage),
      extractRichPageStatFactsFromHits(evidence, input.userMessage),
    );
    return {
      reply:          null,
      evidence,
      extractedFacts: facts,
      verifiedFigure: figure,
    };
  }
  if (evidence.length === 0) {
    console.warn('[adam:search-first] stat zero-hit — synthesis with empty evidence', JSON.stringify({
      subject: extractStatSubjectFromMessage(input.userMessage),
    }));
  } else if (!searchHitsIncludeSubjectToken(evidence, input.userMessage)) {
    console.warn('[adam:search-first] stat off-subject hits — synthesis fallback', JSON.stringify({
      hits: evidence.length,
      topUrls: evidence.slice(0, 3).map((h) => h.url?.slice(0, 80)),
    }));
  }

  evidence = preferOfficialStatEvidence(evidence, input.userMessage);
  console.warn('[adam:search-first] stat subject hits — guarded synthesis fallback', JSON.stringify({
    hits: evidence.length,
    factLines: facts.split('\n').filter(Boolean).length,
    topUrls: evidence.slice(0, 3).map((h) => h.url?.slice(0, 80)),
  }));
  return { reply: null, evidence, extractedFacts: facts, verifiedFigure: null };
}

/** Re-attach prefetched search block after evidence enrich (synthesis fallback). */
export function appendPrefetchedSearchContextToPrompt(
  baseSystemPrompt: string,
  results: LlmSearchResult[],
  options?: { searchDropped?: boolean; extractedFacts?: string; userMessage?: string },
): string {
  const marker = '\n\n[WEB SEARCH';
  const base = baseSystemPrompt.includes(marker)
    ? baseSystemPrompt.slice(0, baseSystemPrompt.indexOf(marker)).trimEnd()
    : baseSystemPrompt.trimEnd();
  return `${base}\n\n${buildPrefetchedSearchContextBlock(results, options)}`;
}

/** Gold Standard — full official page in context; ADAM synthesizes in complete voice (not paste). */
export function appendGoldStandardSynthesisContextToPrompt(
  baseSystemPrompt: string,
  userMessage: string,
  evidence: LlmSearchResult[],
  extractedFacts: string,
): string {
  const goldBlock = buildGoldStandardSynthesisInstruction(userMessage, evidence, extractedFacts);
  if (!goldBlock) {
    return appendPrefetchedSearchContextToPrompt(baseSystemPrompt, evidence, {
      extractedFacts,
      userMessage,
    });
  }
  const marker = '\n\n[WEB SEARCH';
  const goldMarker = '\n\n[GOLD STANDARD';
  let base = baseSystemPrompt;
  if (base.includes(goldMarker)) {
    base = base.slice(0, base.indexOf(goldMarker)).trimEnd();
  } else if (base.includes(marker)) {
    base = base.slice(0, base.indexOf(marker)).trimEnd();
  } else {
    base = base.trimEnd();
  }
  return `${base}\n\n${goldBlock}`;
}

function preferOfficialStatEvidence(
  hits: LlmSearchResult[],
  userMessage: string,
): LlmSearchResult[] {
  const official = filterOfficialSubjectStatHits(hits, userMessage);
  return official.length > 0 ? official : hits;
}

async function applyAcronymInstitutionProbeIfNeeded(
  userMessage: string,
  hits: LlmSearchResult[],
  extractedFacts: string,
): Promise<{ hits: LlmSearchResult[]; extractedFacts: string; figureFound: boolean }> {
  if (hasVerifiableStatSignal(extractedFacts, hits, userMessage)) {
    return { hits, extractedFacts, figureFound: true };
  }

  // Always probe when no verified figure — www.kptm.edu.my often times out from VPS
  // while bangi.kptm.edu.my/sejarah-kptm-copy/ has the published enrollment stat.
  const { hits: probedHits, figureFound } = await probeInstitutionStatEvidenceFromAcronym(
    userMessage,
    { maxUrls: 4, timeoutMs: 6_000 },
  );
  if (probedHits.length === 0) {
    return { hits, extractedFacts, figureFound: false };
  }

  const merged = dedupeSearchHits([...probedHits, ...hits]);
  const withFigure = merged.filter(
    (hit) => extractVerifiedStatFigureFromEvidence([hit], '', userMessage) !== null
      || (hit.snippet?.trim() && extractStatFigureFromHit(hit, userMessage) !== null),
  );
  const official = withFigure.length > 0
    ? withFigure
    : preferOfficialStatEvidence(merged, userMessage);
  const facts = mergeExtractedFactLines(
    extractedFacts,
    extractHeuristicFactsFromSearchHits(probedHits, userMessage),
  );
  return {
    hits:           official,
    extractedFacts: facts,
    figureFound:    figureFound || hasVerifiableStatSignal(facts, official, userMessage),
  };
}

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

function enrichHitsWithExtractedFacts(
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

function formatPrefetchedSearchHitLine(hit: LlmSearchResult, index: number): string {
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
export function shouldStudentUseSearchFirstFlow(
  _isFounder: boolean,
  searchGateReason: string | null,
): boolean {
  if (!searchGateReason) return false;
  return isFactualAdamWebSearchGateReason(searchGateReason);
}

/** Shown in search UI — focused query, not raw salam-prefixed message. */
export function buildAdamSearchDisplayQuery(
  userMessage: string,
  webSearchGateReason?: string | null,
): string {
  const statAsk = isVerifiedDataStatAsk(userMessage)
    || webSearchGateReason === 'verified_data_stat';
  const body = stripLeadingAdamSalutation(userMessage.trim());
  if (statAsk && body) {
    return body.slice(0, 120);
  }
  if (isAdamMarketPricingTurn(body)) {
    return buildMarketPricingSearchDisplayQuery(userMessage);
  }
  if (messageAsksRoleAndSkills(body)) {
    return buildFactualZeroHitSearchDisplayQuery(body);
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
): string {
  const msg = userMessage.trim();
  const searchBody = isAdamCurrentAffairsTurn(msg)
    ? buildCurrentAffairsPrefetchPrompt(msg)
    : isVerifiedDataStatAsk(msg)
      ? buildVerifiedDataStatPrefetchPrompt(msg)
      : isAdamMarketPricingTurn(msg)
        ? buildMarketPricingPrefetchPrompt(msg)
        : messageAsksRoleAndSkills(msg)
          ? buildFactualCareerPrefetchPrompt(msg)
          : msg;
  const recent = recentUserMessages.slice(-2).filter(Boolean);
  if (recent.length === 0) return searchBody;
  return [
    'Recent student messages (context only):',
    ...recent.map((m) => `- ${m}`),
    '',
    `Current message: ${searchBody}`,
  ].join('\n');
}

/** Injected into synthesis system prompt — search already completed. */
export function buildPrefetchedSearchContextBlock(
  results: LlmSearchResult[],
  options?: { searchDropped?: boolean; extractedFacts?: string; userMessage?: string },
): string {
  if (options?.searchDropped) {
    return [
      '[WEB SEARCH — UNAVAILABLE ON THIS TURN]',
      'Prefetch search could not run (platform filter).',
      'Do not invent specs, brands, citations, or parallel product histories.',
      'State the gap honestly or give only non-factual empathy.',
    ].join('\n');
  }
  if (!results.length) {
    return [
      '[WEB SEARCH — NO USABLE HITS]',
      'Prefetch search ran but returned zero hits with verifiable figures for this question.',
      'Reply in TWO short sentences maximum:',
      '1) State that web search completed but no verified figure appeared in hits.',
      '2) Ask the student to paste an official URL or narrow the query (campus, session, year).',
      'FORBIDDEN: naming specific portals, ministries, or parent organisations not in search hits.',
      'FORBIDDEN: step-by-step guides, "Adakah QA ingin saya bantu", offers to search later, or listing where data "usually" lives.',
      'FORBIDDEN: "konteks semasa", long catalogues of possible sources, academic year ranges as filler.',
    ].join('\n');
  }
  const lines = results.map((hit, index) => formatPrefetchedSearchHitLine(hit, index));
  const factBlock = options?.extractedFacts?.trim();
  const hasVerifiedFigure = factBlock ? /\d{1,3}(?:,\d{3})+|\d{4,6}/.test(factBlock) : false;
  const practicalAdvisory = options?.userMessage
    && (isAdamPracticalAdvisoryTurn(options.userMessage) || messageAsksRoleAndSkills(options.userMessage));
  const marketPricing = options?.userMessage && isAdamMarketPricingTurn(options.userMessage);
  const careerFactBlock = practicalAdvisory && factBlock && !hasVerifiedFigure;

  return [
    '[WEB SEARCH RESULTS — MANDATORY GROUND TRUTH]',
    'Fetched BEFORE you write this answer. Use ONLY these hits and extracted facts for factual claims.',
    ...(marketPricing ? [buildMarketPricingSearchWeaveRules(), ''] : []),
    ...(practicalAdvisory && !marketPricing ? [buildPracticalAdvisorySearchWeaveRules(), ''] : []),
    ...(factBlock
      ? [
        '[WEB SEARCH EXTRACTED FACTS — from prefetch analysis of hits]',
        factBlock,
        ...(hasVerifiedFigure
          ? [
            'The verified opener line (SUBJECT: N (verified via web search — domain)) is prepended automatically — do NOT repeat that opener.',
            'Write a complete factual answer in natural ADAM voice — dense like a good reference reply, but ONLY from EXTRACTED FACTS:',
            '1) One sentence: institution profile + verified enrollment total.',
            '2) Bullet list of campuses — every name must appear in EXTRACTED FACTS (e.g. "Kampus:" line).',
            '3) One sentence: graduate/alumni total if listed in facts.',
            'Use markdown bullets for campuses when three or more names are in facts.',
            'FORBIDDEN: figures or campuses not in EXTRACTED FACTS (e.g. 17,600, nine campuses, Semporna, Gua Musang, Sarawak targets — unless explicitly listed above).',
            'FORBIDDEN: "Menurut sumber carian", "Graduan (sumber yang sama)", "Per the search source", "sumber yang sama", or any meta source label.',
            'FORBIDDEN: "konteks semasa", "tidak menemui angka rasmi" when figures are listed above.',
            'FORBIDDEN: truncated fragments (e.g. mid-word openings like "ajian tinggi").',
            'FORBIDDEN: MASA/TENAGA/liqā\'/amānah philosophy, "bukan sekadar statistik" essays, reflective closings ("mencerminkan komitmen", "permulaan bagi setiap jiwa"), or spiritual closing.',
            'FORBIDDEN: "Adakah anda ingin saya terangkan lebih lanjut" or offers to expand — answer fully now.',
            'No reflective philosophy closing — facts and campus list only.',
          ]
          : ['Prefer EXTRACTED FACTS for numbers and dates; cross-check with hit titles/snippets below.']),
        ...(careerFactBlock
          ? [
            'Career/role turn — weave EVERY line in EXTRACTED FACTS into the answer (duties, skills, qualifications).',
            'FORBIDDEN: constitutional jargon or philosophy without facts from EXTRACTED FACTS and hits below.',
          ]
          : []),
      ]
      : []),
    'Titles, URLs, and snippets — do not invent numbers, dates, names, citations, or parent organisations beyond this list.',
    'Office-holder / news: whoever holds the office TODAY per hits — not training-memory predecessors.',
    'Statistics / specs: cite figures that appear in extracted facts or hit snippets — not model memory alone.',
    ...lines,
  ].join('\n');
}

export interface StudentSearchPrefetchResult {
  searchResults:         LlmSearchResult[];
  searchUsed:            boolean;
  searchDroppedByFilter: boolean;
  prefetchMs:            number;
  extractedFacts:        string;
}

export async function runStudentSearchPrefetch(input: {
  userMessage:          string;
  recentUserMessages?:  LlmMessage[];
  webSearchGateReason?: string | null;
  /** Defaults to getStudentSearchPrefetchModel() — turbo for search-only. */
  model?:               string;
  onSearching?:         () => void;
  onSearchDone?:        () => void;
  /** Fires once hits arrive from DashScope — before page enrich / retry (unblocks UI). */
  onSearchHitsReady?:   (hits: LlmSearchResult[]) => void;
}): Promise<StudentSearchPrefetchResult> {
  const started = Date.now();
  const recent = (input.recentUserMessages ?? [])
    .filter((m) => m.role === 'user')
    .map((m) => m.content.replace(/^\[[^\]]+\]:\s*/, '').trim())
    .filter(Boolean);

  const statAsk = isVerifiedDataStatAsk(input.userMessage)
    || input.webSearchGateReason === 'verified_data_stat';
  const useFactExtraction = buildSearchPrefetchSystem(
    input.userMessage,
    input.webSearchGateReason,
  ) === FACT_EXTRACTION_PREFETCH_SYSTEM;
  const prefetchUserPrompt = buildSearchPrefetchUserPrompt(input.userMessage, recent);
  const searchDisplayQuery = buildAdamSearchDisplayQuery(
    input.userMessage,
    input.webSearchGateReason,
  );

  const runPrefetch = async (options?: {
    assignedSites?:       string[];
    searchStrategy?:       string;
    userPrompt?:           string;
    searchDisplayQuery?:   string;
  }) => llmPrefetchWebSearch({
    system:   buildSearchPrefetchSystem(input.userMessage, input.webSearchGateReason),
    messages: [{ role: 'user', content: options?.userPrompt ?? prefetchUserPrompt }],
    model:              input.model ?? getStudentSearchPrefetchModel(),
    maxTokens:          useFactExtraction ? 128 : 32,
    searchAssignedSites: options?.assignedSites,
    searchStrategy:      options?.searchStrategy,
    searchDisplayQuery:  options?.searchDisplayQuery ?? searchDisplayQuery,
  });

  input.onSearching?.();

  console.log('[adam:search-first] prefetch start', JSON.stringify({
    statAsk,
    displayQuery: searchDisplayQuery,
    factExtraction: useFactExtraction,
    model: input.model ?? getStudentSearchPrefetchModel(),
  }));

  try {
    const primarySites = statAsk
      ? buildVerifiedDataStatSearchSites(input.userMessage)
      : isAdamMarketPricingTurn(input.userMessage)
        ? buildMarketPricingSearchSites()
        : buildFactualCareerSearchSites(input.userMessage);
    const statStrategy = statAsk ? resolveVerifiedDataStatSearchStrategy() : undefined;

    let prefetch = await runPrefetch({
      assignedSites:  primarySites,
      searchStrategy: statStrategy,
    });

    let searchResults = filterSearchHitsForMessageLocale(
      dedupeSearchHits(prefetch.searchResults),
      input.userMessage,
    );
    if (searchResults.length > 0) {
      input.onSearchHitsReady?.(searchResults);
    }
    let extractedFacts = useFactExtraction
      ? mergeExtractedFactLines(
        parseExtractedFactsFromPrefetch(prefetch.text),
        extractFactsFromSearchHits(searchResults, input.userMessage),
      )
      : extractFactsFromSearchHits(searchResults, input.userMessage);

    const needsSubjectFocusedRetry = statAsk
      && searchResults.length > 0
      && !searchHitsIncludeSubjectToken(searchResults, input.userMessage);

    if (statAsk && (searchResults.length === 0 || needsSubjectFocusedRetry)
      && !hasVerifiableStatSignal(extractedFacts, searchResults, input.userMessage)) {
      console.log('[adam:search-first] prefetch subject-focused retry', JSON.stringify({
        reason: searchResults.length === 0 ? '0_hits' : 'off_subject_hits',
        firstPassHits: searchResults.length,
        topUrls: searchResults.slice(0, 3).map((h) => h.url?.slice(0, 80)),
        aliases: extractInstitutionAliasesFromMessage(input.userMessage).slice(0, 4),
      }));
      const retry = await runPrefetch({
        assignedSites:      undefined,
        searchStrategy:     'agent',
        userPrompt:         buildSubjectFocusedStatRetryPrompt(input.userMessage),
        searchDisplayQuery: buildSubjectFocusedStatSearchDisplayQuery(input.userMessage),
      });
      searchResults = filterSearchHitsForMessageLocale(
        dedupeSearchHits([...retry.searchResults, ...searchResults]),
        input.userMessage,
      );
      if (searchResults.length > 0) {
        input.onSearchHitsReady?.(searchResults);
      }
      extractedFacts = mergeExtractedFactLines(
        extractedFacts,
        parseExtractedFactsFromPrefetch(retry.text),
        extractHeuristicFactsFromSearchHits(retry.searchResults, input.userMessage),
      );
      const officialAfterRetry = filterOfficialSubjectStatHits(searchResults, input.userMessage);
      if (officialAfterRetry.length > 0) {
        searchResults = officialAfterRetry;
      }
    }

    if (!statAsk
      && searchResults.length === 0
      && isFactualAdamWebSearchGateReason(input.webSearchGateReason ?? null)) {
      const retryDisplay = buildFactualZeroHitSearchDisplayQuery(input.userMessage);
      console.log('[adam:search-first] prefetch factual zero-hit retry', JSON.stringify({
        displayQuery: retryDisplay,
        gate: input.webSearchGateReason ?? null,
      }));
      const retry = await runPrefetch({
        searchStrategy:     'agent',
        userPrompt:         buildFactualZeroHitRetryPrompt(input.userMessage),
        searchDisplayQuery: retryDisplay,
      });
      if (retry.searchResults.length > 0) {
        searchResults = filterSearchHitsForMessageLocale(
          dedupeSearchHits([...retry.searchResults, ...searchResults]),
          input.userMessage,
        );
        input.onSearchHitsReady?.(searchResults);
        extractedFacts = mergeExtractedFactLines(
          extractedFacts,
          parseExtractedFactsFromPrefetch(retry.text),
          extractHeuristicFactsFromSearchHits(retry.searchResults, input.userMessage),
        );
      }
    }

    if (!statAsk
      && searchResults.length === 0
      && buildFactualAuthoritativeProbeUrls(input.userMessage).length > 0) {
      console.log('[adam:search-first] prefetch authoritative probe — DashScope 0 hits');
      const probed = await probeFactualAuthoritativeEvidence(input.userMessage, {
        maxUrls: 4,
        timeoutMs: 8_000,
      });
      if (probed.hits.length > 0) {
        searchResults = dedupeSearchHits(probed.hits);
        input.onSearchHitsReady?.(searchResults);
        extractedFacts = mergeExtractedFactLines(
          extractedFacts,
          extractRichPageStatFactsFromHits(searchResults, input.userMessage),
        );
      }
    }

    if (statAsk) {
      searchResults = preferOfficialStatEvidence(searchResults, input.userMessage);
    }

    const subjectHits = statAsk
      ? filterSearchHitsToSubjectRelevant(searchResults, input.userMessage)
      : searchResults;
    if (statAsk && subjectHits.length > 0) {
      searchResults = subjectHits;
      extractedFacts = mergeExtractedFactLines(
        groundExtractedFactsToSearchHits(extractedFacts, searchResults, input.userMessage),
        extractHeuristicFactsFromSearchHits(searchResults, input.userMessage),
      );
    } else if (statAsk && searchResults.length > 0 && subjectHits.length === 0) {
      extractedFacts = '';
    }

    const needsPageEnrich = searchResults.length > 0
      && !rankHitsForStatPageEnrich(searchResults, input.userMessage)
        .some((h) => snippetHasGoldStandardBody(h.snippet)
          || snippetHasSynthesisGroundingBody(h.snippet));

    if (needsPageEnrich) {
      const enrichStarted = Date.now();
      const { hits: enrichedHits, figureFound, articleFound } = await enrichSearchHitsUntilStatFigure(
        searchResults,
        input.userMessage,
        { maxUrls: 8, timeoutMs: 6_000 },
      );
      console.log('[adam:search-first] prefetch page enrich done', JSON.stringify({
        ms: Date.now() - enrichStarted,
        figureFound,
        articleFound,
        hits: enrichedHits.length,
      }));
      searchResults = dedupeSearchHits(enrichedHits);
      extractedFacts = mergeExtractedFactLines(
        extractedFacts,
        extractFactsFromSearchHits(enrichedHits, input.userMessage),
      );
      if (figureFound) {
        console.log('[adam:search-first] search-hit page enrich', JSON.stringify({
          figureFound,
          hits: searchResults.length,
          userSuppliedDomains: extractDomainsFromMessageUrls(input.userMessage).slice(0, 5),
        }));
      }
    }

    if (statAsk && !hasVerifiableStatSignal(extractedFacts, searchResults, input.userMessage)) {
      const probed = await applyAcronymInstitutionProbeIfNeeded(
        input.userMessage,
        searchResults,
        extractedFacts,
      );
      searchResults = probed.hits;
      extractedFacts = probed.extractedFacts;
    }

    searchResults = enrichHitsWithExtractedFacts(searchResults, extractedFacts);
    extractedFacts = groundExtractedFactsToSearchHits(
      extractedFacts,
      searchResults,
      input.userMessage,
    );

    console.log('[adam:search-audit]', JSON.stringify({
      prefetchMs: Date.now() - started,
      hits: searchResults.length,
      subjectInHits: searchHitsIncludeSubjectToken(searchResults, input.userMessage),
      subjectHitCount: filterSearchHitsToSubjectRelevant(searchResults, input.userMessage).length,
      hasVerifiableStatSignal: hasVerifiableStatSignal(extractedFacts, searchResults, input.userMessage),
      factLines: extractedFacts.split('\n').filter(Boolean).length,
      aliases: extractInstitutionAliasesFromMessage(input.userMessage).slice(0, 4),
      topUrls: searchResults.slice(0, 5).map((h) => h.url?.slice(0, 100)),
      snippetLengths: searchResults.slice(0, 5).map((h) => h.snippet?.length ?? 0),
    }));

    if (searchResults.length === 0) {
      console.warn('[adam:search-first] native prefetch returned 0 hits', JSON.stringify({
        statAsk,
        assignedSites: primarySites,
        searchStrategy: statStrategy,
        displayQuery: searchDisplayQuery,
      }));
    }

    input.onSearchDone?.();
    return {
      searchResults,
      searchUsed:            true,
      searchDroppedByFilter: false,
      prefetchMs:            Date.now() - started,
      extractedFacts,
    };
  } catch (err: unknown) {
    if (isQwenDataInspectionError(err)) {
      input.onSearchDone?.();
      return {
        searchResults:         [],
        searchUsed:            false,
        searchDroppedByFilter: true,
        prefetchMs:            Date.now() - started,
        extractedFacts:        '',
      };
    }
    throw err;
  }
}
