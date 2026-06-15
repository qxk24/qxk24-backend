/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Opener
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
import {
  extractStatSubjectFromMessage,
  primaryEvidenceDomain,
} from './adam-official-source-enrich';
import { stripLeadingAdamSalutation } from './adam-response-generation';
import {
  extractEnrollmentFigureFromEvidence,
  findEvidenceHitForFigure,
  findRichestStatEvidenceHit,
  openingHasVerifiedEnrollmentFigure,
} from './adam-alpha-stat-evidence';

export function formatVerifiedWebSearchAttribution(domain: string | null): string {
  return `(verified via web search, ${domain ?? 'official source'}).`;
}

/** Gold Standard opener subject — full user question when concise, else parsed label. */
export function extractGoldStandardSubjectLine(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  if (!body) return 'This topic';
  if (body.length <= 200) return body;
  return extractStatSubjectFromMessage(body);
}

/** Opener when a verified figure exists on the turn. */
export function buildAlphaStatFigureLedOpener(
  userMessage: string,
  figureRaw: string,
  evidence: LlmSearchResult[] = [],
): string {
  const n = Number.parseInt(figureRaw.replace(/,/g, ''), 10);
  const formatted = Number.isFinite(n) ? n.toLocaleString('en-US') : figureRaw;
  const subject = extractStatSubjectFromMessage(userMessage);
  const sourceHit = userMessage.trim()
    ? findEvidenceHitForFigure(figureRaw, evidence, userMessage)
    : null;
  const domain = sourceHit
    ? primaryEvidenceDomain([sourceHit], figureRaw)
    : primaryEvidenceDomain(evidence, figureRaw);
  return `${subject}: ${formatted} ${formatVerifiedWebSearchAttribution(domain)}`;
}

/** Source opener for factual turns without a verified numeric figure. */
export function buildVerifiedSourceOpener(
  userMessage: string,
  evidence: LlmSearchResult[] = [],
): string {
  const subject = extractGoldStandardSubjectLine(userMessage);
  const hit = findRichestStatEvidenceHit(evidence, userMessage);
  const domain = primaryEvidenceDomain(hit ? [hit] : evidence, null);
  return `${subject}: ${formatVerifiedWebSearchAttribution(domain)}`;
}

/** Figure-led opener only — body paragraphs come from guarded synthesis, not snippet paste. */
export function buildAlphaStatFigureLedReply(
  userMessage: string,
  figureRaw: string,
  evidence: LlmSearchResult[] = [],
): string {
  return buildAlphaStatFigureLedOpener(userMessage, figureRaw, evidence);
}

/** Strip broken opener tail — e.g. "my). KPTM…" left after stream merge. */
export function stripLeadingDomainTailOrphan(text: string): string {
  return text
    .trim()
    .replace(/^(?:my|edu\.my)\)\.\s*/i, '')
    .replace(/^\w{1,6}\)\.\s+(?=[A-ZÀ-ÿ])/i, '')
    .trim();
}

export function prependFigureLedOpenerIfMissing(
  out: string,
  userMessage: string,
  evidence: LlmSearchResult[],
  extractedFacts: string,
): string {
  const figure = extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage);
  if (!figure || !out.length) return out;
  if (openingHasVerifiedEnrollmentFigure(out, figure)) return out;
  return `${buildAlphaStatFigureLedOpener(userMessage, figure, evidence)}\n\n${out}`.trim();
}

/** Repair opener truncated to domain tail — e.g. "my). KPTM…" from a broken merge. */
export function repairOpenerDomainTailOrphan(
  text: string,
  userMessage: string,
  evidence: LlmSearchResult[],
  extractedFacts: string,
  figureRaw: string,
): string {
  const opener = buildAlphaStatFigureLedOpener(userMessage, figureRaw, evidence);
  const fixLeadingOrphan = (body: string): string => stripLeadingDomainTailOrphan(body);

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return opener;

  if (/^(?:my|edu\.my)\)\./i.test(paragraphs[0]!)) {
    paragraphs[0] = fixLeadingOrphan(paragraphs[0]!);
    return `${opener}\n\n${paragraphs.join('\n\n')}`.trim();
  }

  if (!openingHasVerifiedEnrollmentFigure(text, figureRaw)) {
    return `${opener}\n\n${text.trim()}`.trim();
  }
  return text.trim();
}
