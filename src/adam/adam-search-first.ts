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
import { ENV } from '../config/environments';
import { getFastModel } from '../config/llm-models';
import { ADAM_SCIENTIST_SCHOLAR_IDENTITY } from './adam-universal-voice';
import {
  buildCurrentAffairsPrefetchPrompt,
  isAdamCurrentAffairsTurn,
} from './adam-current-affairs';

/** Search-only phase — fast tier; synthesis keeps deep model and full token budget. */
export function getStudentSearchPrefetchModel(): string {
  return getFastModel();
}

/** Canonical student reply pipeline — prompt + registry reference. */
export const ADAM_STUDENT_REPLY_PIPELINE = `
STUDENT REPLY PIPELINE (substantive turns — mandatory):
1. User soalan — read intent and student state.
2. Web search — prefetch completed; ground truth in [WEB SEARCH RESULTS].
3. Analisa — extract mechanisms, statistics, formulas, penemuan, and consensus from credible hits only.
4. Jawab — fakta & teori konvensional mengikat synthesis ADAM (Phase 1B); bukan pandangan kosong.
Skip pipeline only for salam, thanks, or pure reflection without substantive ask.

${ADAM_SCIENTIST_SCHOLAR_IDENTITY}
`.trim();

export const SEARCH_PREFETCH_SYSTEM = `
WEB SEARCH PREFETCH PHASE — mandatory.

Run web search for the student's question using current web data.
Do NOT answer the question in this phase.
After search completes, reply with exactly: OK
`.trim();

const BLOCKING_SEARCH_FIRST_REASONS = new Set([
  'technical_precision',
  'technical_follow_up',
  'entity_correction',
  'explicit_search',
  'current_affairs',
]);

/** Blocking prefetch when specs or current office-holders must be verified before synthesis. */
export function shouldStudentUseSearchFirstFlow(
  isFounder: boolean,
  searchGateReason: string | null,
): boolean {
  if (isFounder || !searchGateReason) return false;
  if (!BLOCKING_SEARCH_FIRST_REASONS.has(searchGateReason)) return false;
  // Office-holders and news — always prefetch; inline agent search is not enough.
  if (searchGateReason === 'current_affairs') return true;
  if (ENV.ADAM_STUDENT_INLINE_SEARCH) return false;
  return true;
}

/** User block for the prefetch LLM call — includes short thread context when present. */
export function buildSearchPrefetchUserPrompt(
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  const msg = userMessage.trim();
  const searchBody = isAdamCurrentAffairsTurn(msg)
    ? buildCurrentAffairsPrefetchPrompt(msg)
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
  options?: { searchDropped?: boolean },
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
      'Search ran before this answer but returned no usable results.',
      'Do not invent numbers, brands, sources, or document IDs.',
      'Say clearly that verified data was not found — do not guess.',
    ].join('\n');
  }
  const lines = results.map((hit, index) => {
    const title = hit.title?.trim() || 'Untitled';
    const url = hit.url?.trim();
    return url ? `${index + 1}. ${title} — ${url}` : `${index + 1}. ${title}`;
  });
  return [
    '[WEB SEARCH RESULTS — MANDATORY GROUND TRUTH]',
    'Fetched BEFORE you write this answer. Use ONLY these hits for factual claims.',
    'Office-holder / news: whoever holds the office TODAY per hits — not training-memory predecessors.',
    'Do not invent numbers, sources, or histories beyond this list.',
    ...lines,
  ].join('\n');
}

export interface StudentSearchPrefetchResult {
  searchResults:         LlmSearchResult[];
  searchUsed:            boolean;
  searchDroppedByFilter: boolean;
  prefetchMs:            number;
}

export async function runStudentSearchPrefetch(input: {
  userMessage:          string;
  recentUserMessages?:  LlmMessage[];
  /** Defaults to getStudentSearchPrefetchModel() — turbo for search-only. */
  model?:               string;
  onSearching?:         () => void;
  onSearchDone?:        () => void;
}): Promise<StudentSearchPrefetchResult> {
  const started = Date.now();
  const recent = (input.recentUserMessages ?? [])
    .filter((m) => m.role === 'user')
    .map((m) => m.content.replace(/^\[[^\]]+\]:\s*/, '').trim())
    .filter(Boolean);

  input.onSearching?.();

  try {
    const prefetch = await llmPrefetchWebSearch({
      system:   SEARCH_PREFETCH_SYSTEM,
      messages: [{
        role:    'user',
        content: buildSearchPrefetchUserPrompt(input.userMessage, recent),
      }],
      model:     input.model ?? getStudentSearchPrefetchModel(),
      maxTokens: 32,
    });
    input.onSearchDone?.();
    return {
      searchResults:         prefetch.searchResults,
      searchUsed:            true,
      searchDroppedByFilter: false,
      prefetchMs:            Date.now() - started,
    };
  } catch (err: unknown) {
    if (isQwenDataInspectionError(err)) {
      input.onSearchDone?.();
      return {
        searchResults:         [],
        searchUsed:            false,
        searchDroppedByFilter: true,
        prefetchMs:            Date.now() - started,
      };
    }
    throw err;
  }
}
