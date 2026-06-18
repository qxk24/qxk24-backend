/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Search Continuation (thread-topic prefetch)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Thin follow-ups ("bagi jawapan yang lebih lengkap") must search the thread topic,
 * not the continuation phrase alone.
 */

import { isAdamContinuationDepthTurn } from './adam-response-generation';
import { CONSTITUTIONAL_EMPIRICAL_SEEDS, buildConstitutionalEmpiricalSearchSeeds } from './adam-constitutional-search-probe';

export interface AdamThreadSearchContext {
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
}

const CONCEPT_EMPIRICAL_SEEDS: Readonly<Record<string, string>> = {
  ...CONSTITUTIONAL_EMPIRICAL_SEEDS,
  sinaptik: 'synaptic plasticity childhood stress prefrontal cortex study',
};

function extractBoldConcepts(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(/\*\*([^*]{3,48})\*\*/g)) {
    const term = match[1].trim();
    if (term) out.push(term);
  }
  return out;
}

function extractNamedConcepts(text: string): string[] {
  const out = extractBoldConcepts(text);
  for (const term of Object.keys(CONCEPT_EMPIRICAL_SEEDS)) {
    if (new RegExp(term.replace(/\s+/g, '\\s+'), 'i').test(text)) {
      out.push(term);
    }
  }
  for (const term of ['HRV', 'ECG', 'SBX', 'quantum eraser', 'delayed-choice']) {
    if (new RegExp(term, 'i').test(text)) out.push(term);
  }
  return [...new Set(out.map((t) => t.trim()).filter(Boolean))];
}

function mapConceptsToEmpiricalSeeds(concepts: string[]): string[] {
  const seeds: string[] = [];
  for (const concept of concepts) {
    const key = Object.keys(CONCEPT_EMPIRICAL_SEEDS).find(
      (k) => concept.toLowerCase().includes(k) || k.includes(concept.toLowerCase()),
    );
    if (key) seeds.push(CONCEPT_EMPIRICAL_SEEDS[key]);
    else if (concept.length >= 4) seeds.push(concept);
  }
  return [...new Set(seeds)];
}

function lastSubstantiveUserTurn(recentUserMessages: string[]): string {
  for (let i = recentUserMessages.length - 1; i >= 0; i--) {
    const turn = recentUserMessages[i]?.trim() ?? '';
    if (!turn || isAdamContinuationDepthTurn(turn)) continue;
    if (turn.length >= 16) return turn;
  }
  return '';
}

/** Search UI + DashScope query for continuation turns — thread topic, not the thin ask. */
export function resolveAdamThreadSearchTopic(
  userMessage: string,
  context: AdamThreadSearchContext = {},
): string {
  if (!isAdamContinuationDepthTurn(userMessage)) {
    return userMessage.trim().slice(0, 120);
  }

  const users = (context.recentUserMessages ?? []).filter(Boolean).slice(-6);
  const assistants = (context.recentAssistantMessages ?? []).filter(Boolean).slice(-3);
  const anchorUser = lastSubstantiveUserTurn(users);
  const lastAssistant = assistants[assistants.length - 1] ?? '';
  const threadCorpus = [lastAssistant, anchorUser, ...users.slice(-2)].join('\n');
  const concepts = extractNamedConcepts(threadCorpus);
  const empiricalSeeds = mapConceptsToEmpiricalSeeds(concepts);
  const constitutionalSeeds = buildConstitutionalEmpiricalSearchSeeds(userMessage, context);

  const query = [
    ...constitutionalSeeds.slice(0, 2),
    ...empiricalSeeds.slice(0, 3),
    anchorUser.slice(0, 72),
  ].join(' ').replace(/\s+/g, ' ').trim();

  if (query.length >= 12) return query.slice(0, 120);
  return userMessage.trim().slice(0, 120) || 'Searching verified data…';
}

/** Prefetch LLM user block — continuation turns search empirical anchors from the thread. */
export function buildContinuationSearchPrefetchPrompt(
  userMessage: string,
  context: AdamThreadSearchContext = {},
): string {
  const topicQuery = resolveAdamThreadSearchTopic(userMessage, context);
  const users = (context.recentUserMessages ?? []).filter(Boolean).slice(-3);
  const assistants = (context.recentAssistantMessages ?? []).filter(Boolean).slice(-2);

  return [
    'CONTINUATION DEPTH TURN — student/founder asked for a fuller answer on the same thread.',
    `Continuation ask (do NOT search this phrase alone): ${userMessage.trim()}`,
    `Primary search query (empirical anchors): ${topicQuery}`,
    'Find authoritative science pages: peer-reviewed studies, university labs, instruments, measured variables.',
    'Return EXTRACTED_FACTS — one line per verifiable claim with source title and URL.',
    ...(assistants.length
      ? ['Recent ADAM reply (thread topic):', ...assistants.map((m) => `- ${m.slice(0, 400)}`)]
      : []),
    ...(users.length
      ? ['Recent user turns:', ...users.map((m) => `- ${m.slice(0, 200)}`)]
      : []),
  ].join('\n');
}
