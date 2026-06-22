/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Intent Classifier (Rule 61 core)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Fallback for Sejarah, Geografi, Ekonomi, Sastera, Sivik, Seni, etc.
 * Decision tree: EXAM_DIRECT → G_REVIEW → G_ANALYSIS → G_FACT → G_CONCEPT → AMBIGUOUS
 */

import {
  ANALYSIS_SIGNALS,
  CONCEPT_SIGNALS,
  EXAM_DIRECT_SIGNALS,
  FACT_SIGNALS,
  REVIEW_SIGNALS,
  countGenericHits,
  detectGenericDomain,
} from './tutor-law.generic-intent-signals';
import {
  ARGUMENT_PROBE_BY_DOMAIN,
  EXAM_REDIRECT_EN,
  EXAM_REDIRECT_MS,
  REVIEW_ANCHOR,
  SIGNIFICANCE_BY_DOMAIN,
  buildAmbiguousProbe,
} from './tutor-law.generic-intent.probes';
import {
  GenericClassifierInput,
  GenericClassifierOutput,
  GenericIntent,
} from './tutor-law.generic-intent.types';

/** Rule 61 generic fallback classifier. */
export function classifyGenericIntent(
  input: GenericClassifierInput,
): GenericClassifierOutput {
  const { normText, hasDraftContent } = input;
  const trace: string[] = [];
  const domain = detectGenericDomain(normText, input.priorDomain);
  trace.push(`domain: ${domain}`);
  const isMs = /apa|boleh|tak|saya|kamu|macam|kenapa|tolong|soalan|jawab|sejarah|siapa|bila|kenapa|hak|tanggungjawab/.test(normText);

  const examHits = countGenericHits(normText, EXAM_DIRECT_SIGNALS);
  if (examHits >= 1) {
    trace.push(`EXAM_DIRECT: ${examHits} hit(s)`);
    return {
      intent:               GenericIntent.EXAM_DIRECT,
      domain,
      confidence:           'HIGH',
      significanceQuestion: null,
      argumentProbe:        null,
      reviewAnchor:         null,
      redirectScript:       isMs ? EXAM_REDIRECT_MS : EXAM_REDIRECT_EN,
      probeQuestion:        null,
      _trace:               trace,
    };
  }

  const reviewHits = countGenericHits(normText, REVIEW_SIGNALS);
  if (reviewHits >= 1 || hasDraftContent) {
    trace.push(`G_REVIEW: reviewHits=${reviewHits}, hasDraft=${hasDraftContent}`);
    return {
      intent:               GenericIntent.G_REVIEW,
      domain,
      confidence:           hasDraftContent ? 'HIGH' : 'MEDIUM',
      significanceQuestion: null,
      argumentProbe:        null,
      reviewAnchor:         REVIEW_ANCHOR,
      redirectScript:       null,
      probeQuestion:        null,
      _trace:               trace,
    };
  }

  const analysisHits = countGenericHits(normText, ANALYSIS_SIGNALS);
  if (analysisHits >= 1) {
    trace.push(`G_ANALYSIS: ${analysisHits} hit(s)`);
    return {
      intent:               GenericIntent.G_ANALYSIS,
      domain,
      confidence:           analysisHits >= 2 ? 'HIGH' : 'MEDIUM',
      significanceQuestion: null,
      argumentProbe:        ARGUMENT_PROBE_BY_DOMAIN[domain],
      reviewAnchor:         null,
      redirectScript:       null,
      probeQuestion:        null,
      _trace:               trace,
    };
  }

  const factHits = countGenericHits(normText, FACT_SIGNALS);
  if (factHits >= 1) {
    trace.push(`G_FACT: ${factHits} hit(s)`);
    return {
      intent:               GenericIntent.G_FACT,
      domain,
      confidence:           factHits >= 2 ? 'HIGH' : 'MEDIUM',
      significanceQuestion: SIGNIFICANCE_BY_DOMAIN[domain],
      argumentProbe:        null,
      reviewAnchor:         null,
      redirectScript:       null,
      probeQuestion:        null,
      _trace:               trace,
    };
  }

  const conceptHits = countGenericHits(normText, CONCEPT_SIGNALS);
  if (conceptHits >= 1) {
    trace.push(`G_CONCEPT: ${conceptHits} hit(s)`);
    return {
      intent:               GenericIntent.G_CONCEPT,
      domain,
      confidence:           conceptHits >= 2 ? 'HIGH' : 'MEDIUM',
      significanceQuestion: null,
      argumentProbe:        null,
      reviewAnchor:         null,
      redirectScript:       null,
      probeQuestion:        null,
      _trace:               trace,
    };
  }

  trace.push('AMBIGUOUS: no clear signal');
  return {
    intent:               GenericIntent.AMBIGUOUS,
    domain,
    confidence:           'LOW',
    significanceQuestion: null,
    argumentProbe:        null,
    reviewAnchor:         null,
    redirectScript:       null,
    probeQuestion:        buildAmbiguousProbe(isMs),
    _trace:               trace,
  };
}
