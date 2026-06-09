/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM SuNom Pipeline (Phases 2–4 orchestrator)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { LlmSearchResult } from '../llm/llm-types';
import { resolveTechnicalPrecisionTurn } from './adam-factual-grounding';
import { fetchSunomEvidenceSnippets } from './adam-sunom-fingers';
import { readKmStudentSensing, type KmSensingSnapshot } from './adam-sunom-km-sensing';
import type { SunomVerificationInput } from './adam-sunom-verification';

export interface SunomPipelineInput {
  userMessage:         string;
  recentUserMessages?: string[];
  searchResults?:      LlmSearchResult[];
  searchUsed?:         boolean;
  searchDropped?:      boolean;
  /** Skip network fetch (tests / lab). */
  skipFingerFetch?:    boolean;
}

export interface SunomEnrichedVerificationInput extends SunomVerificationInput {
  kmSensing?:          KmSensingSnapshot;
  fingerFetchMs?:      number;
  fingerFetched?:      number;
}

/** Enrich verification input: KM read → Jari fetch → evidence for Lidah/SuNom gate. */
export async function enrichSunomVerificationInput(
  input: SunomPipelineInput,
): Promise<SunomEnrichedVerificationInput> {
  const recent = input.recentUserMessages ?? [];
  const kmSensing = readKmStudentSensing(input.userMessage, recent);
  const precision = resolveTechnicalPrecisionTurn(input.userMessage, recent);
  const baseResults = input.searchResults ?? [];

  let evidence = baseResults.map((hit) => ({ ...hit }));
  let fingerFetchMs = 0;
  let fingerFetched = 0;

  const titlesHaveMeasuredSpecs = baseResults.some((hit) =>
    /\b\d[\d.,]*\s*(?:nm|n·m|ps|hp|mg|ml|cc|rpm|k\b|°c|kw)\b/i.test(hit.title ?? ''),
  );

  const shouldFetch = !input.skipFingerFetch
    && precision.isActive
    && input.searchUsed === true
    && input.searchDropped !== true
    && baseResults.length > 0
    && kmSensing.forceFingerFetch
    && !titlesHaveMeasuredSpecs;

  if (shouldFetch) {
    const finger = await fetchSunomEvidenceSnippets(baseResults, { maxUrls: 3 });
    evidence = finger.evidence;
    fingerFetchMs = finger.durationMs;
    fingerFetched = finger.fetched;
  }

  return {
    userMessage: input.userMessage,
    recentUserMessages: recent,
    searchResults: evidence,
    searchUsed: input.searchUsed,
    searchDropped: input.searchDropped,
    kmSensing,
    fingerFetchMs,
    fingerFetched,
  };
}
