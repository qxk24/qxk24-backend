/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Market Pricing (Malaysia)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { LlmSearchResult } from '../llm/llm-types';
import { stripLeadingAdamSalutation, isAdamLightChatTurn } from './adam-response-generation';

const MARKET_PRICING_CLOSING_BM = 'Mahu saya jelaskan lebih lanjut?';
const MARKET_PRICING_CLOSING_EN = 'Would you like me to explain further?';

const MARKET_PRICING_ASK =
  /\b(?:harga|kadar|kos|cost|price|pricing|rate|bayaran|fees?|berapa\s+(?:harga|kos|kadar)|standard\s+harga|kadar\s+pasaran)\b/i;

const MARKET_PRICING_TOPIC =
  /\b(?:servis|service|editing|proofread|layout|typesetting|reka\s+bentuk|formatting|penerbitan|publish(?:ing)?|freelanc|manuskrip|buku|book|cover|kulit|quotation|sebut\s+harga|rate\s+card|pasaran|market|editorial)\b/i;

/** Service / publishing market-rate questions — not enrollment stats or career role asks. */
export function isAdamMarketPricingTurn(message: string): boolean {
  const t = stripLeadingAdamSalutation(message.trim());
  if (!t || isAdamLightChatTurn(t)) return false;
  return MARKET_PRICING_ASK.test(t) && MARKET_PRICING_TOPIC.test(t);
}

/** User wrote primarily in Bahasa Melayu — Gold Standard closings follow BM. */
export function userMessagePrefersBahasaMalaysia(message: string): boolean {
  const t = stripLeadingAdamSalutation(message.trim());
  if (!t) return false;
  if (/\b(?:salam|assalamu|waalaikum|bismillah)\b/i.test(t)) return true;
  if (
    /\b(?:berapa|berapakah|maklumat|jumlah|ceritakan|siapa|bagikan|berikan|boleh|kenapa|mengapa|jelaskan|terangkan|sejarah|apakah|mahu|harga|kadar|kos|servis|buku|manuskrip|terkini|standard|pasaran|editing|layout|penerbitan|suntingan|reka)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  const malayMarkers = (t.match(/\b(?:yang|dan|atau|untuk|dengan|adalah|ini|itu|saya|anda|tidak|bagi|dalam)\b/gi) ?? []).length;
  const englishMarkers = (t.match(/\b(?:the|and|or|for|with|what|how|price|service)\b/gi) ?? []).length;
  return malayMarkers > englishMarkers;
}

export function buildMarketPricingSearchSites(): string[] {
  return [
    'msbventures.com.my',
    'acepremier.com',
    'proofreadingmalaysia.com',
    'gov.my',
  ];
}

export function buildMarketPricingPrefetchPrompt(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  return [
    `Find Malaysian market pricing for: ${body}`,
    'Focus: book editing, proofreading, copy editing, layout, typesetting, cover design, publishing packages.',
    'Priority sources: Malaysian editorial providers (.com.my), MSB Ventures, Acepremier, proofreading Malaysia rate pages.',
    'Extract RM ranges per word, per page, or per project when hits contain them.',
    'If one publisher has no public price list, note that — still gather industry ranges from other Malaysian sources.',
    'Output EXTRACTED_FACTS block — one line per verifiable RM range with source title and URL.',
  ].join('\n');
}

export function buildMarketPricingSearchDisplayQuery(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  const core = body.length >= 8 ? body : message.trim();
  return `${core} Malaysia editorial harga`.slice(0, 120);
}

export function buildMarketPricingSearchWeaveRules(): string {
  return [
    'MARKET PRICING SYNTHESIS (Malaysia — mandatory):',
    '- OPEN with one short human BM sentence acknowledging the question — NOT "(verified via web search, domain)".',
    '- BODY: RM range TABLE — editing/proofreading (per word or page), layout/typesetting, packages, cover if relevant.',
    '- There is rarely one national fixed tariff — state that honestly, then give industry ranges from hits.',
    '- If a hit has no public price list, say so — do NOT fill with that publisher\'s marketing brochure (timelines, ISBN promos).',
    '- Synthesize from ALL Malaysian-relevant hits — not one foreign publisher page alone.',
    '- Cite sources in plain prose (domain or provider name).',
    '- FORBIDDEN: English closing when user wrote BM; MASA/TENAGA sermons; Alamtologi labels.',
  ].join('\n');
}

function formatHitLine(hit: LlmSearchResult, index: number): string {
  const title = hit.title?.trim() || 'Untitled';
  const url = hit.url?.trim();
  const snippet = hit.snippet?.trim();
  const head = url ? `${index + 1}. ${title} — ${url}` : `${index + 1}. ${title}`;
  if (!snippet) return head;
  return `${head}\n   Snippet: ${snippet.slice(0, 320)}`;
}

/** Synthesis block for market pricing — bypasses stat/RN Gold Standard opener template. */
export function buildMarketPricingSynthesisInstruction(
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
): string {
  const closing = userMessagePrefersBahasaMalaysia(userMessage)
    ? MARKET_PRICING_CLOSING_BM
    : MARKET_PRICING_CLOSING_EN;
  const lines = [
    '[MARKET PRICING — MALAYSIA — ADAM FULL VOICE]',
    buildMarketPricingSearchWeaveRules(),
    '',
    `Close with this line when inviting follow-up (match user language):\n${closing}`,
    '',
    'FORBIDDEN: verbatim "(verified via web search, …)" opener; single-publisher marketing essay; Would you like me to explain further? when user wrote BM.',
  ];

  const factBlock = extractedFacts.trim();
  if (factBlock) {
    lines.push('', '[EXTRACTED FACTS — from prefetch]', factBlock);
  }

  if (evidence.length > 0) {
    lines.push('', '[WEB SEARCH HITS — ground RM ranges in these]', ...evidence.slice(0, 8).map(formatHitLine));
  } else {
    lines.push(
      '',
      '[WEB SEARCH — NO HITS]',
      'State that search found no verified tariff page — give only cautious industry context if model must, with clear caveat. Do not invent precise RM figures without hits.',
    );
  }

  return lines.join('\n');
}
