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
import type { LlmSearchResult } from '../llm/llm-types';
import { buildFounderZeroHitSearchContextBlock } from './adam-founder-empirical-depth';
import {
  isAdamEducationalWebSearchTurn,
  isAdamPracticalAdvisoryTurn,
} from './adam-response-generation';
import {
  buildEducationalZeroHitSearchContextBlock,
  buildDomainGroundingZeroHitSearchContextBlock,
} from './adam-educational-grounding';
import type { AdamUsersDomainFacet } from './adam-users-domain-router';
import {
  buildMarketPricingSearchWeaveRules,
  isAdamMarketPricingTurn,
} from './adam-market-pricing';
import { messageAsksRoleAndSkills } from './adam-official-source-enrich';
import { buildPracticalAdvisorySearchWeaveRules } from './adam-practical-advisory-gold';
import { formatPrefetchedSearchHitLine } from './adam-search-first.queries';
import { ADAM_EQ_NO_FACT_HOLD } from './adam-eq-virtues';
export function buildPrefetchedSearchContextBlock(
  results: LlmSearchResult[],
  options?: {
    searchDropped?: boolean;
    extractedFacts?: string;
    userMessage?: string;
    isFounder?: boolean;
    gateGroundingFacet?: AdamUsersDomainFacet;
  },
): string {
  if (options?.searchDropped) {
    return [
      '[WEB SEARCH — UNAVAILABLE ON THIS TURN]',
      ADAM_EQ_NO_FACT_HOLD,
      'Prefetch search could not run (platform filter).',
      'Do not invent specs, brands, citations, or parallel product histories.',
      'State the gap honestly or give only non-factual empathy.',
    ].join('\n');
  }
  if (!results.length) {
    if (options?.isFounder) {
      return buildFounderZeroHitSearchContextBlock();
    }
    const domainZeroHit = options?.gateGroundingFacet
      ? buildDomainGroundingZeroHitSearchContextBlock(options.gateGroundingFacet)
      : null;
    if (domainZeroHit) return domainZeroHit;
    if (options?.userMessage && isAdamEducationalWebSearchTurn(options.userMessage)) {
      return buildEducationalZeroHitSearchContextBlock();
    }
    return [
      '[WEB SEARCH — NO USABLE HITS]',
      ADAM_EQ_NO_FACT_HOLD,
      'Prefetch search ran but returned zero usable hits for this question.',
      'This is an absence of retrieved evidence, NOT evidence that the user claim is false.',
      'If the user supplied a news URL or asserted a death/current-affairs claim, do NOT deny the event/person status from zero hits or a single 404.',
      'Reply in TWO short sentences maximum:',
      '1) State that this turn could not verify the claim from retrieved hits.',
      '2) Ask the student to paste another reliable source, headline, or date so ADAM can verify it.',
      'FORBIDDEN: naming specific portals, ministries, or parent organisations not in search hits.',
      'FORBIDDEN: saying a person is alive, an article never existed, or an event did not happen solely because search returned no usable hits or one URL returned 404.',
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
    'News/current affairs/death claims: if hits are missing, inaccessible, contradictory, or only show a 404 page, say the claim is not verified by the retrieved hits; never convert missing/404 search evidence into a denial that the event happened.',
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
