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
import {
  buildGoldStandardSynthesisInstruction,
  evidenceHasGoldStandardArticle,
  extractVerifiedStatFigureFromEvidence,
} from './adam-alpha-output-guard';
import {
  buildFactualAuthoritativeProbeUrls,
  enrichSearchHitsUntilStatFigure,
  extractRichPageStatFactsFromHits,
  extractStatFigureFromHit,
  extractStatSubjectFromMessage,
  filterOfficialSubjectStatHits,
  probeFactualAuthoritativeEvidence,
  probeInstitutionStatEvidenceFromAcronym,
  searchHitsIncludeSubjectToken,
} from './adam-official-source-enrich';
import { isVerifiedDataStatAsk } from './adam-web-search';
import {
  extractFactsFromSearchHits,
  extractHeuristicFactsFromSearchHits,
  extractRoleSkillFactsFromSearchHits,
  mergeExtractedFactLines,
} from './adam-search-first.facts';
import {
  buildPrefetchedSearchContextBlock,
} from './adam-search-first.context';
import {
  dedupeSearchHits,
  hasVerifiableStatSignal,
} from './adam-search-first.queries';

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

export function preferOfficialStatEvidence(
  hits: LlmSearchResult[],
  userMessage: string,
): LlmSearchResult[] {
  const official = filterOfficialSubjectStatHits(hits, userMessage);
  return official.length > 0 ? official : hits;
}

export async function applyAcronymInstitutionProbeIfNeeded(
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
