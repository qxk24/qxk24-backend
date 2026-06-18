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
import { getFastModel } from '../config/llm-models';
import { ADAM_SCIENTIST_SCHOLAR_IDENTITY } from './adam-universal-voice';
import { isFactualAdamWebSearchGateReason, isVerifiedDataStatAsk } from './adam-web-search';

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
