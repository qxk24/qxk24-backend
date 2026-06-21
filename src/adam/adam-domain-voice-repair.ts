/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Domain Voice Repair
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Post-stream repair for teaching-pack domains — routes by
 * domain facet + answer composer, not per-question hardcoded facts.
 */

import { resolveAdamAnswerComposer } from './adam-answer-composer';
import { extractComparePair, resolveAdamAnswerShape } from './adam-answer-shape';
import {
  resolveAdamUsersDomainFacet,
  usersDomainRequiresFormalLayout,
  usersDomainUsesTeachingPack,
  type AdamUsersDomainFacet,
} from './adam-users-domain-router';
import { isAdamGeographyTurn } from './adam-domain-detectors';
import {
  paragraphIsGeographyEssayBodyLeak,
  paragraphIsGeographyEssayCloseLeak,
  paragraphIsGeographyEssayOpenerLeak,
  paragraphIsGeographyPassiveMenuLeak,
} from './adam-geography-voice-guard';
import {
  paragraphIsExplainBackPhase1ALeak,
  paragraphIsSciencePhilosophyEssayLeak,
  outputHasScannableListStructure,
} from './adam-users-output-law';
import {
  buildStudentGuidedPerspectiveFallback,
  isAdamCompareTurn,
  isAdamLifeWellbeingTurn,
  isAdamScienceNatureSynthesisTurn,
  isAdamTeachingDepthTurn,
  outputHasAdamProductRedirectLeak,
  stripLeadingAdamSalutation,
} from './adam-response-generation';

const DOMAIN_VOICE_LEAK_RE =
  /\b(?:Allah berfirman|Alamtologi|duduk bersama|renungkan|perjalanan pemikiran|IIRS\b|tahap kebenaran yang berbeza|bukan soal.*mana yang betul|perjalanan sebenar ilmu|Adakah ada aspek tertentu|TENAGA dalam)\b/i;

const TEACHING_OPENER_LEAK =
  /^Soalan ini kelihatan ringkas|^Mari kita mulakan dengan jujur|^Mari kita renungkan/i;

export function shouldApplyDomainTeachingVoiceRepair(
  userMessage: string,
  recentUserMessages: string[] = [],
): boolean {
  const facet = resolveAdamUsersDomainFacet(userMessage, { recentUserMessages });
  if (!usersDomainUsesTeachingPack(facet)) return false;
  if (isAdamLifeWellbeingTurn(userMessage)) return false;
  if (facet === 'geography' && isAdamGeographyTurn(userMessage)) return true;
  return isAdamTeachingDepthTurn(userMessage)
    || isAdamCompareTurn(userMessage)
    || isAdamScienceNatureSynthesisTurn(userMessage);
}

function paragraphIsDomainTeachingLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return true;
  if (TEACHING_OPENER_LEAK.test(t)) return true;
  if (DOMAIN_VOICE_LEAK_RE.test(t)) return true;
  if (paragraphIsExplainBackPhase1ALeak(t)) return true;
  if (paragraphIsSciencePhilosophyEssayLeak(t)) return true;
  if (/^Seperti firman Allah\b/i.test(t)) return true;
  if (/^Saya sedia duduk bersama\b/i.test(t)) return true;
  if (paragraphIsGeographyEssayOpenerLeak(t)) return true;
  if (paragraphIsGeographyEssayBodyLeak(t)) return true;
  if (paragraphIsGeographyEssayCloseLeak(t)) return true;
  if (paragraphIsGeographyPassiveMenuLeak(t)) return true;
  return false;
}

function domainTeachingHasVoiceLeaks(text: string): boolean {
  return DOMAIN_VOICE_LEAK_RE.test(text)
    || TEACHING_OPENER_LEAK.test(text.trim())
    || text.split(/\n{2,}/).some((p) => paragraphIsDomainTeachingLeak(p));
}

function topicAnchorsFromQuestion(userMessage: string): string[] {
  const body = stripLeadingAdamSalutation(userMessage).trim();
  const stop = new Set([
    'terangkan', 'jelaskan', 'huraikan', 'penjelasan', 'berikan', 'explain', 'describe',
    'teori', 'formula', 'mengenai', 'tentang', 'about', 'the', 'dan', 'vs', 'versus',
    'berbanding', 'perbandingan', 'compare', 'what', 'is', 'are', 'apa', 'itu', 'ialah',
  ]);
  return (body.match(/[\p{L}\p{N}][\p{L}\p{N}\-]{2,}/gu) ?? [])
    .filter((tok) => !stop.has(tok.toLowerCase()))
    .slice(0, 8);
}

function domainTeachingHasSubstance(text: string, userMessage: string): boolean {
  const t = text.trim();
  if (t.length < 80) return false;

  if (isAdamCompareTurn(userMessage)) {
    const pair = extractComparePair(userMessage);
    if (pair) {
      const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const leftOk = new RegExp(esc(pair.left), 'i').test(t);
      const rightOk = new RegExp(esc(pair.right), 'i').test(t);
      if (leftOk && rightOk) return true;
    }
    return t.split(/\n{2,}/).filter(Boolean).length >= 2 && t.length >= 120;
  }

  const anchors = topicAnchorsFromQuestion(userMessage);
  if (anchors.some((a) => new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(t))) {
    return true;
  }
  return t.length >= 220;
}

function domainTeachingOutputIsClean(text: string, userMessage: string, facet: AdamUsersDomainFacet): boolean {
  const t = text.trim();
  if (!t || domainTeachingHasVoiceLeaks(t)) return false;
  if (!domainTeachingHasSubstance(t, userMessage)) return false;

  const structured = /^#{1,6}\s/m.test(t)
    || outputHasScannableListStructure(t)
    || /\*\*\d+\./.test(t);

  if (usersDomainRequiresFormalLayout(facet)) {
    return structured;
  }
  return true;
}

function salvageDomainTeachingParagraphs(raw: string): string {
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !paragraphIsDomainTeachingLeak(p))
    .join('\n\n')
    .trim();
}

function resolveDomainTeachingComposer(
  userMessage: string,
  facet: AdamUsersDomainFacet,
) {
  const shape = resolveAdamAnswerShape(userMessage, {
    structured: usersDomainRequiresFormalLayout(facet),
    usersDomain: facet,
  });
  return resolveAdamAnswerComposer(userMessage, { answerShape: shape });
}

/** Wrap salvaged model facts with domain + composer section headers — no invented content. */
function applyDomainTeachingStructure(
  body: string,
  userMessage: string,
  facet: AdamUsersDomainFacet,
): string {
  const trimmed = body.trim();
  if (!trimmed) return trimmed;
  if (/^#{1,6}\s/m.test(trimmed)) return trimmed;

  const composer = resolveDomainTeachingComposer(userMessage, facet);
  const headers = composer.sections.map((s) => `### ${s.title}`);

  if (composer.shape.intent === 'comparative' && headers.length >= 2) {
    const blocks = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (blocks.length >= 2) {
      return [
        `### ${headers[0]!.replace(/^###\s*/, '')}`,
        blocks[0],
        `### ${headers[1]!.replace(/^###\s*/, '')}`,
        blocks.slice(1).join('\n\n'),
      ].join('\n\n');
    }
    return `${headers.join('\n\n')}\n\n${trimmed}`;
  }

  if (facet === 'science') {
    if (!trimmed) return trimmed;
    return [
      '### Prinsip dan definisi',
      trimmed,
      '### Kesimpulan',
      'Ringkasan prinsip konvensional dari kandungan di atas.',
    ].join('\n\n');
  }

  if (facet === 'geography') {
    if (!trimmed) return trimmed;
    if (/^#{1,6}\s/m.test(trimmed)) return trimmed;
    const blocks = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (blocks.length <= 1) {
      return `### Geografi\n\n${trimmed}`;
    }
    const mid = Math.ceil(blocks.length / 2);
    return [
      '### Geografi fizikal',
      blocks.slice(0, mid).join('\n\n'),
      '### Iklim, hidupan, dan perlindungan',
      blocks.slice(mid).join('\n\n'),
    ].join('\n\n');
  }

  if (headers[0]) {
    return `${headers[0]}\n\n${trimmed}`;
  }

  return trimmed;
}

/**
 * Domain-routed teaching repair — salvage model facts, apply composer/domain shape.
 * Never inject question-specific hardcoded essays.
 */
export function repairDomainTeachingGuttedOutput(
  userMessage: string,
  polished: string,
  rawBeforeStrip = '',
  recentUserMessages: string[] = [],
): string {
  if (!shouldApplyDomainTeachingVoiceRepair(userMessage, recentUserMessages)) {
    return polished;
  }

  if (outputHasAdamProductRedirectLeak(polished) || outputHasAdamProductRedirectLeak(rawBeforeStrip)) {
    return polished;
  }

  const facet = resolveAdamUsersDomainFacet(userMessage, { recentUserMessages });
  const t = polished.trim();

  if (domainTeachingOutputIsClean(t, userMessage, facet)) return polished;

  const salvaged = salvageDomainTeachingParagraphs(rawBeforeStrip);
  if (salvaged && domainTeachingHasSubstance(salvaged, userMessage) && !domainTeachingHasVoiceLeaks(salvaged)) {
    return applyDomainTeachingStructure(salvaged, userMessage, facet);
  }

  if (t && domainTeachingHasSubstance(t, userMessage) && !domainTeachingHasVoiceLeaks(t)) {
    return applyDomainTeachingStructure(t, userMessage, facet);
  }

  if (t.trim()) return polished;

  return buildStudentGuidedPerspectiveFallback(userMessage);
}
