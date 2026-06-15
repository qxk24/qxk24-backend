/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Sanitize
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
  ALPHA_AGGREGATE_RANGE_RE,
  ALPHA_CONTEXT_REFUSAL_RE,
  ALPHA_FALSE_NO_FIGURE_RE,
  ALPHA_SEARCH_GAP_PARAGRAPH_RE,
  ALPHA_UNVERIFIED_NOTA_RE,
  ENROLLMENT_COUNT_RE,
  INVENTED_REPORT_CITE_RE,
  PLACEMENT_PERCENT_RE,
  UNVERIFIED_CAMPUS_COUNT_RE,
} from './adam-alpha-stat-patterns';
import {
  buildSearchEvidenceBlob,
  extractEnrollmentFigureFromEvidence,
  openingHasVerifiedEnrollmentFigure,
  parseStatInteger,
  statNumberInEvidence,
} from './adam-alpha-stat-evidence';
import {
  repairOrphanStatParagraphs,
  stripAlphaStatFalseNoFigureClaims,
  stripAlphaStatMechanicalSourceLabels,
  stripAlphaStatMetaParagraphs,
  stripAlphaStatUnverifiedInstitutionClaims,
} from './adam-alpha-stat-compact';
import {
  filterPhilosophySentencesFromParagraph,
  paragraphIsAlphaDeferredSearchOffer,
  paragraphIsAlphaStatContextRefusal,
  paragraphIsAlphaStatPhilosophyPadding,
  paragraphIsAlphaStatPortalCatalog,
  paragraphIsOrphanStatFragment,
  paragraphIsUnverifiedStatEstimate,
} from './adam-alpha-stat-paragraph-guard';
import {
  buildAlphaStatFigureLedOpener,
  prependFigureLedOpenerIfMissing,
  repairOpenerDomainTailOrphan,
  stripLeadingDomainTailOrphan,
} from './adam-alpha-stat-opener';
import { isVerifiedDataStatAsk } from './adam-web-search';
import { isAlphaStatFullVoiceBody } from './adam-stat-stream-preserve';

/** Hard-coded terminal snippet paragraphs — never surface to users. */
function paragraphIsAlphaTerminalSnippet(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Carian web selesai —/i.test(t)) return true;
  if (/^Tampal URL rasmi institusi/i.test(t)) return true;
  if (/^Paste an official institution URL/i.test(t)) return true;
  if (/^Sumber teratas:/i.test(t)) return true;
  return false;
}

export interface AlphaStatSanitizeOptions {
  searchUsed?:         boolean;
  searchDropped?:      boolean;
  extractedFacts?:     string;
}

/** Remove "konteks semasa saya" refusal — replace with search-gap framing. */
export function stripAlphaStatContextRefusal(text: string): string {
  const stripSentence = (sentence: string): boolean => {
    const t = sentence.trim();
    if (!t) return false;
    if (ALPHA_CONTEXT_REFUSAL_RE.test(t)) return false;
    if (/^Maklumat\s+jumlah/i.test(t) && /\bkonteks\s+semasa\b/i.test(t)) return false;
    return true;
  };

  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
      const kept = sentences.length > 1
        ? sentences.filter(stripSentence)
        : [paragraph.replace(
          /[^.!?]*\b(?:tidak\s+(?:tersedia|ada)\s+dalam\s+konteks\s+semasa|Maklumat\s+(?:itu\s+)?tidak\s+(?:tersedia|ada)\s+dalam\s+konteks)[^.!?]*[.!?]+/gi,
          ' ',
        )];
      return kept.join(' ').replace(/\s{2,}/g, ' ').trim();
    })
    .filter((p) => p && !paragraphIsAlphaStatContextRefusal(p) && !paragraphIsAlphaDeferredSearchOffer(p))
    .join('\n\n')
    .trim();
}

function shouldRedactStatValue(
  value: number,
  evidence: LlmSearchResult[],
  extractedFacts: string,
  options: AlphaStatSanitizeOptions,
): boolean {
  if (options.searchDropped === true || options.searchUsed !== true) return true;
  const blob = buildSearchEvidenceBlob(evidence, extractedFacts);
  if (!blob.trim()) return true;
  return !statNumberInEvidence(value, evidence, extractedFacts);
}

function redactUnverifiedFiguresInParagraph(
  paragraph: string,
  evidence: LlmSearchResult[],
  extractedFacts: string,
  options: AlphaStatSanitizeOptions,
): { text: string; redacted: boolean } {
  let redacted = false;
  let out = paragraph;

  if (UNVERIFIED_CAMPUS_COUNT_RE.test(paragraph)) {
    const blob = buildSearchEvidenceBlob(evidence, extractedFacts);
    const countMatch = paragraph.match(UNVERIFIED_CAMPUS_COUNT_RE);
    const count = countMatch?.[0]?.match(/\d{2,3}/)?.[0];
    if (count && !blob.includes(count)) {
      out = out.replace(UNVERIFIED_CAMPUS_COUNT_RE, 'beberapa kampus');
      redacted = true;
    }
  }

  out = out.replace(ENROLLMENT_COUNT_RE, (match, rawNum: string) => {
    const value = parseStatInteger(rawNum);
    if (value === null) return match;
    if (!shouldRedactStatValue(value, evidence, extractedFacts, options)) return match;
    redacted = true;
    return 'jumlah pelajar (tiada angka disahkan dalam carian)';
  });

  out = out.replace(PLACEMENT_PERCENT_RE, (match, rawPct: string) => {
    const value = Number.parseFloat(rawPct);
    if (!Number.isFinite(value)) return match;
    if (!shouldRedactStatValue(value, evidence, extractedFacts, options)) return match;
    redacted = true;
    return 'kadar penempatan (tiada peratus disahkan dalam carian)';
  });

  const beforeReport = out;
  out = out.replace(INVENTED_REPORT_CITE_RE, (cite) => {
    const yearMatch = cite.match(/\b(20\d{2})\b/);
    const year = yearMatch?.[1];
    const blob = evidence.map((h) => `${h.title ?? ''} ${h.url ?? ''}`).join(' ').toLowerCase();
    if (year && blob.includes(year)) return cite;
    redacted = true;
    return 'sumber rasmi yang diterbitkan';
  });
  if (out !== beforeReport) redacted = true;

  out = out.replace(/\s{2,}/g, ' ').trim();
  return { text: out, redacted };
}

/**
 * ADAM-α verified-stat post-stream guard — requires search evidence when available.
 * Without evidence, redacts precise enrollment/placement figures and meta preambles.
 */
export function sanitizeAlphaVerifiedStatOutput(
  text: string,
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  options: AlphaStatSanitizeOptions = {},
): string {
  if (!isVerifiedDataStatAsk(userMessage)) return text.trim();

  const extractedFacts = options.extractedFacts ?? '';
  const verifiedFigure = extractEnrollmentFigureFromEvidence(evidence, extractedFacts, userMessage);

  let out = stripLeadingDomainTailOrphan(stripAlphaStatMetaParagraphs(text));
  out = repairOrphanStatParagraphs(out);
  out = stripAlphaStatContextRefusal(out);
  out = stripAlphaStatFalseNoFigureClaims(out, evidence, extractedFacts, userMessage);
  out = stripAlphaStatUnverifiedInstitutionClaims(out, userMessage, evidence);

  const paragraphs = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const kept: string[] = [];

  for (const rawPara of paragraphs) {
    let para = stripLeadingDomainTailOrphan(rawPara);
    if (!para) continue;
    if (paragraphIsAlphaTerminalSnippet(para)) continue;
    if (paragraphIsOrphanStatFragment(para) && para.length < 80) continue;
    if (paragraphIsAlphaDeferredSearchOffer(para)) continue;
    if (paragraphIsAlphaStatPortalCatalog(para, evidence)) continue;
    if (ALPHA_SEARCH_GAP_PARAGRAPH_RE.test(para) || ALPHA_FALSE_NO_FIGURE_RE.test(para)) continue;
    if (!verifiedFigure && ALPHA_AGGREGATE_RANGE_RE.test(para)) continue;
    if (verifiedFigure && ALPHA_UNVERIFIED_NOTA_RE.test(para)) continue;
    if (verifiedFigure && paragraphIsUnverifiedStatEstimate(para)) continue;
    if (paragraphIsAlphaStatPhilosophyPadding(para)) continue;
    para = filterPhilosophySentencesFromParagraph(para);
    if (!para) continue;
    const { text: cleaned } = redactUnverifiedFiguresInParagraph(
      para,
      evidence,
      extractedFacts,
      options,
    );
    if (cleaned && !(verifiedFigure && paragraphIsUnverifiedStatEstimate(cleaned))) {
      kept.push(cleaned);
    }
  }

  out = kept.join('\n\n').trim();
  out = stripAlphaStatMechanicalSourceLabels(out);
  if (verifiedFigure) {
    out = repairOpenerDomainTailOrphan(out, userMessage, evidence, extractedFacts, verifiedFigure);
  } else {
    out = stripLeadingDomainTailOrphan(out);
    out = prependFigureLedOpenerIfMissing(out, userMessage, evidence, extractedFacts);
  }

  if (
    verifiedFigure
    && !openingHasVerifiedEnrollmentFigure(out, verifiedFigure)
  ) {
    out = `${buildAlphaStatFigureLedOpener(userMessage, verifiedFigure, evidence)}\n\n${out}`.trim();
  }

  if (!out.trim()) {
    const fallback = text.trim();
    if (fallback) return fallback;
    if (verifiedFigure) {
      return buildAlphaStatFigureLedOpener(userMessage, verifiedFigure, evidence);
    }
    return '';
  }

  return out.trim();
}

/** Lightweight α repair without search evidence — orphan + meta + context-refusal only. */
export function repairAlphaStatSurface(
  text: string,
  userMessage: string,
  evidence: LlmSearchResult[] = [],
  extractedFacts = '',
): string {
  if (!isVerifiedDataStatAsk(userMessage)) return text.trim();
  let out = stripLeadingDomainTailOrphan(stripAlphaStatMetaParagraphs(text));
  out = repairOrphanStatParagraphs(out);
  out = stripAlphaStatContextRefusal(out);
  out = stripAlphaStatFalseNoFigureClaims(out, evidence, extractedFacts, userMessage);
  out = stripAlphaStatUnverifiedInstitutionClaims(out, userMessage, evidence);

  if (isAlphaStatFullVoiceBody(out)) {
    const fullVoiceParas = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const fullKept: string[] = [];
    for (const rawPara of fullVoiceParas) {
      let para = stripLeadingDomainTailOrphan(rawPara);
      if (!para) continue;
      if (paragraphIsAlphaTerminalSnippet(para)) continue;
      if (paragraphIsOrphanStatFragment(para) && para.length < 80) continue;
      if (paragraphIsAlphaDeferredSearchOffer(para)) continue;
      if (paragraphIsAlphaStatPortalCatalog(para, evidence)) continue;
      if (paragraphIsAlphaStatContextRefusal(para)) continue;
      if (ALPHA_SEARCH_GAP_PARAGRAPH_RE.test(para) || ALPHA_FALSE_NO_FIGURE_RE.test(para)) continue;
      fullKept.push(para);
    }
    out = fullKept.join('\n\n').trim();
    out = stripAlphaStatMechanicalSourceLabels(out);
    return out.trim();
  }

  const paragraphs = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const rawPara of paragraphs) {
    let para = stripLeadingDomainTailOrphan(rawPara);
    if (!para) continue;
    if (paragraphIsAlphaTerminalSnippet(para)) continue;
    if (paragraphIsOrphanStatFragment(para) && para.length < 80) continue;
    if (paragraphIsAlphaDeferredSearchOffer(para)) continue;
    if (paragraphIsAlphaStatPhilosophyPadding(para)) continue;
    para = filterPhilosophySentencesFromParagraph(para);
    if (!para) continue;
    if (paragraphIsAlphaStatPortalCatalog(para, evidence)) continue;
    if (paragraphIsAlphaStatContextRefusal(para)) continue;
    if (ALPHA_SEARCH_GAP_PARAGRAPH_RE.test(para) || ALPHA_FALSE_NO_FIGURE_RE.test(para)) continue;
    kept.push(para);
  }
  out = kept.join('\n\n').trim();

  out = stripAlphaStatMechanicalSourceLabels(out);
  out = prependFigureLedOpenerIfMissing(out, userMessage, evidence, extractedFacts);
  return out.trim();
}
