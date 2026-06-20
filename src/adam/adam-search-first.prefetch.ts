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
import { isQwenDataInspectionError, llmPrefetchWebSearch } from '../llm/llm-client';
import {
  buildCurrentAffairsPrefetchPrompt,
  isAdamCurrentAffairsTurn,
} from './adam-current-affairs';
import {
  isAdamContinuationDepthTurn,
  isAdamEducationalWebSearchTurn,
} from './adam-response-generation';
import {
  buildContinuationSearchPrefetchPrompt,
  resolveAdamThreadSearchTopic,
} from './adam-search-continuation';
import {
  buildConstitutionalEmpiricalProbeUrls,
  isConstitutionalEmpiricalThread,
  probeConstitutionalEmpiricalEvidence,
} from './adam-constitutional-search-probe';
import {
  buildEducationalPrefetchPrompt,
  buildEducationalSearchDisplayQuery,
} from './adam-educational-grounding';
import {
  buildMarketPricingSearchSites,
  isAdamMarketPricingTurn,
} from './adam-market-pricing';
import {
  buildFactualAuthoritativeProbeUrls,
  enrichSearchHitsUntilStatFigure,
  extractDomainsFromMessageUrls,
  extractInstitutionAliasesFromMessage,
  extractRichPageStatFactsFromHits,
  filterOfficialSubjectStatHits,
  filterSearchHitsForMessageLocale,
  filterSearchHitsToSubjectRelevant,
  probeFactualAuthoritativeEvidence,
  rankHitsForStatPageEnrich,
  searchHitsIncludeSubjectToken,
  snippetHasGoldStandardBody,
  snippetHasSynthesisGroundingBody,
} from './adam-official-source-enrich';
import {
  buildFactualCareerSearchSites,
  buildVerifiedDataStatSearchSites,
  isFactualAdamWebSearchGateReason,
  isVerifiedDataStatAsk,
  resolveVerifiedDataStatSearchStrategy,
} from './adam-web-search';
import {
  FACT_EXTRACTION_PREFETCH_SYSTEM,
  buildSearchPrefetchSystem,
  getStudentSearchPrefetchModel,
} from './adam-search-first.constants';
import {
  extractFactsFromSearchHits,
  extractHeuristicFactsFromSearchHits,
  groundExtractedFactsToSearchHits,
  mergeExtractedFactLines,
  parseExtractedFactsFromPrefetch,
} from './adam-search-first.facts';
import {
  applyAcronymInstitutionProbeIfNeeded,
  preferOfficialStatEvidence,
} from './adam-search-first.gold-reply';
import {
  buildAdamSearchDisplayQuery,
  buildFactualZeroHitRetryPrompt,
  buildFactualZeroHitSearchDisplayQuery,
  buildSearchPrefetchUserPrompt,
  buildSubjectFocusedStatRetryPrompt,
  buildSubjectFocusedStatSearchDisplayQuery,
  dedupeSearchHits,
  enrichHitsWithExtractedFacts,
  hasVerifiableStatSignal,
  recentAssistantStringsFromLlmMessages,
  recentUserStringsFromLlmMessages,
  threadContextFromRecentMessages,
} from './adam-search-first.queries';
import type { StudentSearchPrefetchResult } from './adam-search-first.context';
import { isAdamStableCurriculumSearchSkipTurn } from './adam-stable-curriculum-search-gate';

export async function runUsersSearchPrefetch(input: {
  userMessage:          string;
  recentUserMessages?:  LlmMessage[];
  webSearchGateReason?: string | null;
  /** Turn Gate IQ domain — authoritative when present (Fasa 2). */
  gateDomain?:          import('./adam-users-domain-router').AdamUsersDomainFacet;
  /** Defaults to getStudentSearchPrefetchModel() — turbo for search-only. */
  model?:               string;
  onSearching?:         () => void;
  onSearchDone?:        () => void;
  /** Fires once hits arrive from DashScope — before page enrich / retry (unblocks UI). */
  onSearchHitsReady?:   (hits: LlmSearchResult[]) => void;
}): Promise<StudentSearchPrefetchResult> {
  const started = Date.now();

  if (isAdamStableCurriculumSearchSkipTurn(input.userMessage)) {
    input.onSearchDone?.();
    return {
      searchResults:         [],
      searchUsed:            false,
      searchDroppedByFilter: false,
      prefetchMs:            Date.now() - started,
      extractedFacts:        '',
    };
  }

  const recentUsers = recentUserStringsFromLlmMessages(input.recentUserMessages ?? []);
  const recentAssistants = recentAssistantStringsFromLlmMessages(input.recentUserMessages ?? []);
  const threadContext = threadContextFromRecentMessages(recentUsers, recentAssistants);

  const statAsk = isVerifiedDataStatAsk(input.userMessage)
    || input.webSearchGateReason === 'verified_data_stat';
  const useFactExtraction = buildSearchPrefetchSystem(
    input.userMessage,
    input.webSearchGateReason,
  ) === FACT_EXTRACTION_PREFETCH_SYSTEM;
  const prefetchUserPrompt = buildSearchPrefetchUserPrompt(
    input.userMessage,
    recentUsers,
    recentAssistants,
    input.gateDomain,
  );
  const searchDisplayQuery = buildAdamSearchDisplayQuery(
    input.userMessage,
    input.webSearchGateReason,
    threadContext,
    input.gateDomain,
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
      && isAdamEducationalWebSearchTurn(input.userMessage)) {
      const eduDisplay = buildEducationalSearchDisplayQuery(input.userMessage);
      console.log('[adam:search-first] prefetch educational zero-hit retry', JSON.stringify({
        displayQuery: eduDisplay,
      }));
      const retry = await runPrefetch({
        searchStrategy:     'agent',
        userPrompt:         buildEducationalPrefetchPrompt(input.userMessage),
        searchDisplayQuery: eduDisplay,
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
      && isFactualAdamWebSearchGateReason(input.webSearchGateReason ?? null)
      && !isAdamContinuationDepthTurn(input.userMessage)) {
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
      && isAdamContinuationDepthTurn(input.userMessage)
      && (recentUsers.length > 0 || recentAssistants.length > 0)) {
      const continuationDisplay = resolveAdamThreadSearchTopic(input.userMessage, threadContext);
      console.log('[adam:search-first] prefetch continuation thread-topic retry', JSON.stringify({
        displayQuery: continuationDisplay,
        gate: input.webSearchGateReason ?? null,
      }));
      const retry = await runPrefetch({
        searchStrategy:     'agent',
        userPrompt:         buildContinuationSearchPrefetchPrompt(input.userMessage, threadContext),
        searchDisplayQuery: continuationDisplay,
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
      && isConstitutionalEmpiricalThread(input.userMessage, threadContext)) {
      const probeUrls = buildConstitutionalEmpiricalProbeUrls(input.userMessage, threadContext);
      if (probeUrls.length > 0) {
        console.log('[adam:search-first] prefetch constitutional empirical probe', JSON.stringify({
          urls: probeUrls.slice(0, 4),
        }));
        const probed = await probeConstitutionalEmpiricalEvidence(
          input.userMessage,
          threadContext,
          { maxUrls: 4, timeoutMs: 10_000 },
        );
        if (probed.hits.length > 0) {
          searchResults = dedupeSearchHits(probed.hits);
          input.onSearchHitsReady?.(searchResults);
          extractedFacts = mergeExtractedFactLines(
            extractedFacts,
            extractRichPageStatFactsFromHits(searchResults, input.userMessage),
            extractHeuristicFactsFromSearchHits(searchResults, input.userMessage),
          );
        }
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
