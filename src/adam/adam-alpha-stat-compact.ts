/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Compact
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
  ALPHA_FALSE_NO_FIGURE_RE,
  ALPHA_MECHANICAL_SOURCE_LABEL_RE,
  ALPHA_SEARCH_GAP_PARAGRAPH_RE,
  ALPHA_UNVERIFIED_NOTA_RE,
  BRANCH_CAMPUS_CLAIM_RE,
  INSTITUTION_PLACE_CLAIM_RE,
  PARENT_ORG_CLAIM_RE,
} from './adam-alpha-stat-patterns';
import {
  buildSearchEvidenceBlob,
  extractEnrollmentFigureFromEvidence,
  parseStatInteger,
  statNumberInEvidence,
} from './adam-alpha-stat-evidence';
import {
  paragraphIsAlphaDeferredSearchOffer,
  paragraphIsAlphaStatMetaPreamble,
  paragraphIsAlphaStatPhilosophyPadding,
  paragraphIsOrphanStatFragment,
  sentenceIsAlphaStatPhilosophyPadding,
} from './adam-alpha-stat-paragraph-guard';
import {
  prependFigureLedOpenerIfMissing,
  repairOpenerDomainTailOrphan,
} from './adam-alpha-stat-opener';
import { extractCampusNamesFromStatText } from './adam-official-source-enrich';

/** Strip mechanical source labels — synthesis must use natural ADAM voice. */
export function stripAlphaStatMechanicalSourceLabels(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => para.trim().replace(ALPHA_MECHANICAL_SOURCE_LABEL_RE, '').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function campusNamesFromEvidence(
  evidence: LlmSearchResult[],
  extractedFacts: string,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (name: string) => {
    const key = name.toLowerCase();
    if (key.length < 3 || seen.has(key)) return;
    seen.add(key);
    out.push(key);
  };
  for (const block of [
    extractedFacts,
    ...evidence.map((h) => h.snippet ?? ''),
  ]) {
    for (const name of extractCampusNamesFromStatText(block)) add(name);
  }
  return out;
}

function sentenceHasVerifiedStatFact(
  sentence: string,
  evidence: LlmSearchResult[],
  extractedFacts: string,
): boolean {
  if (sentenceIsAlphaStatPhilosophyPadding(sentence)) return false;

  const blob = buildSearchEvidenceBlob(evidence, extractedFacts);
  const lower = sentence.toLowerCase();
  const campuses = campusNamesFromEvidence(evidence, extractedFacts);

  for (const match of sentence.matchAll(/\d{1,3}(?:,\d{3})+/g)) {
    const value = parseStatInteger(match[0]);
    if (value !== null && statNumberInEvidence(value, evidence, extractedFacts)) return true;
  }

  const bulletCampus = sentence.replace(/^[-*•]\s+/, '').trim().toLowerCase();
  if (campuses.some((c) => bulletCampus.includes(c) && blob.includes(c))) return true;

  if (!/\b(?:pelajar|kampus|graduan|graduat|students?)\b/i.test(sentence)) return false;
  return campuses.some((c) => lower.includes(c) && blob.includes(c));
}

function paragraphIsVerifiedCampusBulletList(
  paragraph: string,
  evidence: LlmSearchResult[],
  extractedFacts: string,
): boolean {
  const lines = paragraph.split('\n').map((l) => l.trim()).filter((l) => /^[-*•]\s+\S/.test(l));
  if (lines.length < 2) return false;
  return lines.every((line) => sentenceHasVerifiedStatFact(line, evidence, extractedFacts));
}

/**
 * Verified stat turn — keep opener + factual sentences only; drop philosophy and follow-up offers.
 */
export function compactAlphaStatVerifiedBody(
  text: string,
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
): string {
  const figure = extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage);
  if (!figure) return text.trim();

  let out = repairOpenerDomainTailOrphan(text, userMessage, evidence, extractedFacts, figure);
  const paragraphs = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const kept: string[] = [];

  for (const para of paragraphs) {
    if (/verified via web search/i.test(para) && para.length < 220) {
      kept.push(para);
      continue;
    }
    if (paragraphIsAlphaDeferredSearchOffer(para)) continue;
    if (paragraphIsAlphaStatPhilosophyPadding(para)) continue;
    if (paragraphIsVerifiedCampusBulletList(para, evidence, extractedFacts)) {
      kept.push(para);
      continue;
    }

    const sentences = para.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    const factual = sentences.filter(
      (s) => !sentenceIsAlphaStatPhilosophyPadding(s)
        && sentenceHasVerifiedStatFact(s, evidence, extractedFacts),
    );
    if (factual.length > 0) kept.push(factual.join(' '));
  }

  out = kept.join('\n\n').trim();
  out = stripAlphaStatMechanicalSourceLabels(out);
  return prependFigureLedOpenerIfMissing(out, userMessage, evidence, extractedFacts);
}

export function stripAlphaStatFalseNoFigureClaims(
  text: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
  userMessage = '',
): string {
  if (!extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage)) return text.trim();
  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      if (ALPHA_UNVERIFIED_NOTA_RE.test(paragraph.trim())) return '';
      if (ALPHA_SEARCH_GAP_PARAGRAPH_RE.test(paragraph)) return '';
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
      return sentences.filter((s) => !ALPHA_FALSE_NO_FIGURE_RE.test(s)).join(' ').trim();
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function claimPhraseInEvidence(phrase: string, blob: string): boolean {
  const norm = phrase.toLowerCase().replace(/\s+/g, ' ').trim();
  if (norm.length < 3) return true;
  if (blob.includes(norm)) return true;
  const tokens = norm.split(/\s+/).filter((t) => t.length >= 4);
  if (tokens.length === 0) return blob.includes(norm);
  return tokens.some((t) => blob.includes(t));
}

function sentenceHasUnverifiedInstitutionClaim(
  sentence: string,
  evidence: LlmSearchResult[],
): boolean {
  const blob = buildSearchEvidenceBlob(evidence);
  const hasEvidence = blob.trim().length > 0;

  for (const match of sentence.matchAll(new RegExp(PARENT_ORG_CLAIM_RE.source, 'gi'))) {
    const claim = match[1]?.trim();
    if (!claim) continue;
    if (!hasEvidence || !claimPhraseInEvidence(claim, blob)) return true;
  }

  for (const match of sentence.matchAll(BRANCH_CAMPUS_CLAIM_RE)) {
    const place = match[1]?.trim();
    if (!place) continue;
    if (!hasEvidence || !claimPhraseInEvidence(place, blob)) return true;
  }

  for (const match of sentence.matchAll(INSTITUTION_PLACE_CLAIM_RE)) {
    const place = match[2]?.trim();
    if (place && place.length >= 4 && (!hasEvidence || !claimPhraseInEvidence(place, blob))) {
      return true;
    }
  }

  return false;
}

/** Drop institution/campus/parent-org claims not backed by search hits — any entity. */
export function stripAlphaStatUnverifiedInstitutionClaims(
  text: string,
  _userMessage: string,
  evidence: LlmSearchResult[] = [],
): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
      const kept = sentences.filter(
        (sentence) => !sentenceHasUnverifiedInstitutionClaim(sentence, evidence),
      );
      return kept.join(' ').trim();
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function stripAlphaStatMetaParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !paragraphIsAlphaStatMetaPreamble(p))
    .join('\n\n')
    .trim();
}

export function repairOrphanStatParagraphs(text: string): string {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const kept: string[] = [];

  for (const para of paragraphs) {
    if (paragraphIsOrphanStatFragment(para)) {
      if (kept.length > 0) {
        const prev = kept[kept.length - 1] ?? '';
        if (!prev.endsWith('.') && !prev.endsWith('!') && !prev.endsWith('?')) {
          kept[kept.length - 1] = `${prev} ${para}`;
          continue;
        }
      }
      continue;
    }
    kept.push(para);
  }

  return kept.join('\n\n').trim();
}
