/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Gold Standard
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
 */

import type { LlmSearchResult } from '../llm/llm-types';
import type { AdamAnswerProfile } from './adam-answer-profile';
import { GRADUATE_STAT_SENTENCE_RE, snippetHasGoldStandardBody, snippetHasSynthesisGroundingBody } from './adam-official-source-enrich';
import {
  extractEnrollmentFigureFromEvidence,
  findRichestStatEvidenceHit,
  findRichestSynthesisEvidenceHit,
} from './adam-alpha-stat-evidence';
import {
  buildAlphaStatFigureLedOpener,
  buildVerifiedSourceOpener,
  repairOpenerDomainTailOrphan,
  stripLeadingDomainTailOrphan,
} from './adam-alpha-stat-opener';
import { isAdamPracticalAdvisoryTurn } from './adam-response-generation';
import { buildPracticalAdvisorySynthesisBodyRules } from './adam-practical-advisory-gold';
import {
  buildMarketPricingSynthesisInstruction,
  isAdamMarketPricingTurn,
  userMessagePrefersBahasaMalaysia,
} from './adam-market-pricing';

function splitEnrollmentAndGraduateBlocks(snippet: string): string[] {
  const blocks = snippet.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (blocks.length >= 2) return blocks;

  const only = blocks[0] ?? snippet.trim();
  GRADUATE_STAT_SENTENCE_RE.lastIndex = 0;
  const gradMatch = GRADUATE_STAT_SENTENCE_RE.exec(only);
  if (!gradMatch?.index || gradMatch.index < 24) return [only];

  const graduate = gradMatch[0].trim();
  const enrollment = only.slice(0, gradMatch.index).trim().replace(/[.;]\s*$/, '.');
  return enrollment ? [enrollment, graduate] : [only];
}

/**
 * Gold Standard body — every paragraph from a page-fetched official HTML article only.
 */
export function assembleVerifiedStatFullBody(
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
): string | null {
  const hit = findRichestStatEvidenceHit(evidence, userMessage);
  if (!hit?.pageFetched) return null;
  const snippet = hit.snippet?.trim().replace(/&nbsp;/gi, ' ');
  if (!snippet || snippet.length < 80) return null;

  const blocks = snippet.split(/\n{2,}/).map((s) => s.trim()).filter((b) => {
    if (!b || /^Laman Web\s*:/i.test(b)) return false;
    return true;
  });

  if (blocks.length >= 2) return blocks.join('\n\n');

  const figure = extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage);
  if (!figure) return null;

  const hasEnrollment = blocks.some(
    (b) => /\b(?:pelajar|students?)\b/i.test(b) && /\d{1,3}(?:,\d{3})+/.test(b),
  );

  if (!hasEnrollment) return null;

  const rawBlocks = splitEnrollmentAndGraduateBlocks(snippet);
  const enrollment = rawBlocks.find(
    (b) => /\b(?:pelajar|students?)\b/i.test(b) && /\d{1,3}(?:,\d{3})+/.test(b),
  );
  if (!enrollment || enrollment.length < 48) return null;

  const paragraphs: string[] = [enrollment];
  const graduate = rawBlocks.find(
    (b) => b !== enrollment && /gradu/i.test(b) && /\d{1,3}(?:,\d{3})+/.test(b),
  );
  if (graduate) paragraphs.push(graduate);

  return paragraphs.join('\n\n');
}

export function evidenceHasGoldStandardArticle(
  evidence: LlmSearchResult[],
  userMessage: string,
): boolean {
  const hit = findRichestSynthesisEvidenceHit(evidence, userMessage);
  if (!hit) return false;
  const snippet = hit.snippet?.trim() ?? '';
  if (isAdamPracticalAdvisoryTurn(userMessage)) {
    if (hit.pageFetched) {
      return snippetHasGoldStandardBody(snippet) || snippetHasSynthesisGroundingBody(snippet);
    }
    return snippet.length >= 120 && snippetHasSynthesisGroundingBody(snippet);
  }
  return hit.pageFetched === true && snippetHasGoldStandardBody(snippet);
}

/** Universal depth invitation — not Alamtologi "other parts" framing. */
export const GOLD_STANDARD_FOLLOW_UP_BM = 'Mahu saya jelaskan lebih lanjut?';
export const GOLD_STANDARD_FOLLOW_UP_EN = 'Would you like me to explain further?';

/** @deprecated Replaced by universal follow-up — kept for normalize/legacy detection. */
export const LEGACY_GOLD_STANDARD_FOLLOW_UP_BM = 'Perlu saya terangkan lagi bahagian lain?';
/** @deprecated Replaced by universal follow-up — kept for normalize/legacy detection. */
export const LEGACY_GOLD_STANDARD_FOLLOW_UP_EN = 'Would you like me to explain another part in more detail?';

export const GOLD_STANDARD_FOLLOW_UP_RE = new RegExp(
  [
    GOLD_STANDARD_FOLLOW_UP_BM,
    GOLD_STANDARD_FOLLOW_UP_EN,
    LEGACY_GOLD_STANDARD_FOLLOW_UP_BM,
    LEGACY_GOLD_STANDARD_FOLLOW_UP_EN,
  ]
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'i',
);

/** Canonical Gold Standard closing — invitation to continue, not a deferred-search offer. */
export function buildGoldStandardFollowUpQuestion(userMessage: string): string {
  return userMessagePrefersBahasaMalaysia(userMessage)
    ? GOLD_STANDARD_FOLLOW_UP_BM
    : GOLD_STANDARD_FOLLOW_UP_EN;
}

/** Replace legacy Alamtologi-framed closings with the universal invitation. */
export function normalizeGoldStandardFollowUpClosing(text: string, userMessage: string): string {
  const closing = buildGoldStandardFollowUpQuestion(userMessage);
  let out = text.trim();
  for (const legacy of [
    LEGACY_GOLD_STANDARD_FOLLOW_UP_BM,
    LEGACY_GOLD_STANDARD_FOLLOW_UP_EN,
    GOLD_STANDARD_FOLLOW_UP_EN,
    GOLD_STANDARD_FOLLOW_UP_BM,
  ]) {
    if (legacy !== closing && out.includes(legacy)) {
      out = out.split(legacy).join(closing);
    }
  }
  return out;
}

export function appendGoldStandardFollowUp(reply: string, userMessage: string): string {
  const trimmed = normalizeGoldStandardFollowUpClosing(reply.trim(), userMessage);
  if (!trimmed) return trimmed;
  const closing = buildGoldStandardFollowUpQuestion(userMessage);
  if (trimmed.includes(closing)) return trimmed;
  return `${trimmed}\n\n${closing}`;
}

/** Full page-fetched official HTML body — mandatory ground truth for Gold Standard synthesis. */
export function extractGoldStandardOfficialPageBody(
  evidence: LlmSearchResult[],
  userMessage: string,
): { body: string; url: string | null } | null {
  const hit = findRichestSynthesisEvidenceHit(evidence, userMessage);
  if (!hit) return null;
  const body = hit.snippet?.trim().replace(/&nbsp;/gi, ' ');
  if (!body || body.length < 80) return null;
  if (isAdamPracticalAdvisoryTurn(userMessage)) {
    if (!hit.pageFetched && body.length < 120) return null;
    if (!snippetHasSynthesisGroundingBody(body) && !snippetHasGoldStandardBody(body)) return null;
  } else if (!hit.pageFetched) {
    return null;
  }
  return { body, url: hit.url?.trim() ?? null };
}

/**
 * Gold Standard synthesis — ADAM writes in full voice from complete official page text.
 * Not mechanical paste; not DashScope snippets.
 */
export function buildGoldStandardSynthesisInstruction(
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
): string | null {
  if (isAdamMarketPricingTurn(userMessage)) {
    return buildMarketPricingSynthesisInstruction(userMessage, evidence, extractedFacts);
  }

  const page = extractGoldStandardOfficialPageBody(evidence, userMessage);
  if (!page) return null;
  const figure = extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage);
  const opener = figure
    ? buildAlphaStatFigureLedOpener(userMessage, figure, evidence)
    : buildVerifiedSourceOpener(userMessage, evidence);
  const closing = buildGoldStandardFollowUpQuestion(userMessage);
  const practicalAdvisory = isAdamPracticalAdvisoryTurn(userMessage);
  const lines = [
    '[GOLD STANDARD — ADAM FULL VOICE]',
    'Official source page fetched in full. Write ADAM\'s complete answer — flowing, dense, natural — grounded ONLY in the official text below.',
    'Every paragraph MUST carry substantive facts from the page — duties, skills, qualifications, contexts. Do NOT answer from model memory alone.',
    '',
    `1) Open with this line verbatim:\n${opener}`,
  ];
  if (practicalAdvisory) {
    lines.push(buildPracticalAdvisorySynthesisBodyRules(userMessage));
    lines.push(`2) Close with this line verbatim:\n${closing}`);
    lines.push('');
    lines.push('FORBIDDEN: thin summaries, skipping skills section, aphorism-only stubs, DashScope snippets without page content.');
  } else {
    lines.push(
      '2) Body: include ALL substantive facts from [OFFICIAL PAGE — FULL TEXT] — role, duties, skills, figures, context. Write in full ADAM voice. Do NOT truncate to a short summary. Do NOT paste mechanically; weave every substantive point from the official page.',
      `3) Close with this line verbatim:\n${closing}`,
      '',
      'FORBIDDEN: thin summaries, skipping whole sections, DashScope snippets without page content, "menurut sumber carian", meta labels about search.',
    );
  }
  lines.push(
    '',
    '[OFFICIAL PAGE — FULL TEXT]',
    page.body,
    ...(page.url ? [`Source URL: ${page.url}`] : []),
  );
  return lines.join('\n');
}

/** Persisted α stat body — opener/follow-up only; never strip streamed paragraphs. */
export function preserveAlphaStatStreamBody(
  text: string,
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
  verifiedFigure: string | null = null,
): string {
  const figure = verifiedFigure
    ?? extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage);
  let body = stripLeadingDomainTailOrphan(text.trim());
  if (figure) {
    body = repairOpenerDomainTailOrphan(body, userMessage, evidence, extractedFacts, figure);
  }
  return applyGoldStandardSurfaceReply(body, userMessage, evidence, extractedFacts);
}

/** Ensure verified opener + follow-up on synthesized Gold Standard replies — never compact the body. */
export function applyGoldStandardSurfaceReply(
  text: string,
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
): string {
  let out = text.trim();
  if (!out) return out;
  if (isAdamMarketPricingTurn(userMessage)) {
    return normalizeGoldStandardFollowUpClosing(out, userMessage);
  }
  const figure = extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage);
  const opener = figure
    ? buildAlphaStatFigureLedOpener(userMessage, figure, evidence)
    : buildVerifiedSourceOpener(userMessage, evidence);
  if (!/verified via web search/i.test(out)) {
    out = `${opener}\n\n${out}`;
  }
  return appendGoldStandardFollowUp(out, userMessage);
}

/**
 * Gold Standard reply — verified opener + full official article body from page enrich.
 * @deprecated Runtime uses buildGoldStandardSynthesisInstruction + ADAM synthesis — not mechanical paste.
 */
export function buildGoldStandardSearchReply(
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
): string | null {
  if (!evidenceHasGoldStandardArticle(evidence, userMessage)) return null;
  const body = assembleVerifiedStatFullBody(userMessage, evidence, extractedFacts);
  if (!body) return null;
  const figure = extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage);
  const opener = figure
    ? buildAlphaStatFigureLedOpener(userMessage, figure, evidence)
    : buildVerifiedSourceOpener(userMessage, evidence);
  return appendGoldStandardFollowUp(`${opener}\n\n${body}`, userMessage);
}

/** @deprecated Use buildGoldStandardSearchReply */
export const buildFullVerifiedStatReply = buildGoldStandardSearchReply;

/** Default Gold Standard surface — full ADAM voice; opener + follow-up only (never compact body). */
export function applyDefaultGoldStandardReplySurface(input: {
  text:             string;
  userMessage:      string;
  evidence:         LlmSearchResult[];
  extractedFacts:   string;
  profile:          AdamAnswerProfile;
  articleReady:     boolean;
  verifiedFigure:   string | null;
}): string {
  const {
    text,
    userMessage,
    evidence,
    extractedFacts,
    profile,
    verifiedFigure,
  } = input;
  const trimmed = text.trim();
  if (!trimmed || profile === 'light') return trimmed;

  if (profile === 'beta') return trimmed;

  if (isAdamMarketPricingTurn(userMessage)) {
    return normalizeGoldStandardFollowUpClosing(trimmed, userMessage);
  }

  return preserveAlphaStatStreamBody(
    trimmed,
    userMessage,
    evidence,
    extractedFacts,
    verifiedFigure,
  );
}
