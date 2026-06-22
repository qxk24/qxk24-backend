/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE System Classifier (Rule 61 core)
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
 * Decision tree: EXAM_DIRECT → S_VERIFY → S_DESIGN → S_ANALYZE → S_TRACE → S_CONCEPT → AMBIGUOUS
 */

import {
  SYS_ANALYZE_SIGNALS,
  SYS_CONCEPT_SIGNALS,
  SYS_DESIGN_SIGNALS,
  SYS_EXAM_SIGNALS,
  SYS_TRACE_SIGNALS,
  SYS_VERIFY_SIGNALS,
  countSystemHits,
  detectSystemTopic,
} from './tutor-law.ce-system.signals';
import {
  ANALYZE_PROBES,
  CONCEPT_PROBES,
  DESIGN_SCAFFOLDS,
  EXAM_REDIRECT_BM,
  EXAM_REDIRECT_EN,
  TRACE_PROBES,
  VERIFY_ANCHOR_BM,
  VERIFY_ANCHOR_EN,
  isMalaySystemTurn,
} from './tutor-law.ce-system.probes';
import {
  SystemIntent,
  SystemTopic,
  type SystemClassifierInput,
  type SystemClassifierOutput,
} from './tutor-law.ce-system.types';

/** Rule 61 CE systems (OS, concurrency, memory) classifier. */
export function classifySystemIntent(
  input: SystemClassifierInput,
): SystemClassifierOutput {
  const {
    normText,
    hasScenarioDesc,
    hasCodeSnippet,
    hasTimingTrace,
    priorTopic,
  } = input;
  const trace: string[] = [];
  const topic = detectSystemTopic(normText, priorTopic);
  const isBm = isMalaySystemTurn(normText);
  trace.push(`topic: ${topic}`);

  if (countSystemHits(normText, SYS_EXAM_SIGNALS) >= 1) {
    trace.push('EXAM_DIRECT');
    return {
      intent:         SystemIntent.EXAM_DIRECT,
      topic,
      confidence:     'HIGH',
      analyzeProbe:   null,
      traceProbe:     null,
      designScaffold: null,
      verifyAnchor:   null,
      conceptProbe:   null,
      redirectScript: isBm ? EXAM_REDIRECT_BM : EXAM_REDIRECT_EN,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (countSystemHits(normText, SYS_VERIFY_SIGNALS) >= 1) {
    trace.push('S_VERIFY');
    return {
      intent:         SystemIntent.S_VERIFY,
      topic,
      confidence:     'HIGH',
      analyzeProbe:   null,
      traceProbe:     null,
      designScaffold: null,
      verifyAnchor:   isBm ? VERIFY_ANCHOR_BM : VERIFY_ANCHOR_EN,
      conceptProbe:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  const analyzeHits = countSystemHits(normText, SYS_ANALYZE_SIGNALS);
  const designHits = countSystemHits(normText, SYS_DESIGN_SIGNALS);
  const traceHits = countSystemHits(normText, SYS_TRACE_SIGNALS);
  const conceptHits = countSystemHits(normText, SYS_CONCEPT_SIGNALS);
  const mentionsDeadlockOrRace = /\b(?:deadlock|kebuntuan|race condition)\b/.test(normText);
  const asksWhyHow = /\b(?:kenapa|macam mana|why|how does|how do)\b/.test(normText);

  if (designHits >= 1) {
    trace.push(`S_DESIGN: designHits=${designHits}`);
    return {
      intent:         SystemIntent.S_DESIGN,
      topic,
      confidence:     designHits >= 2 ? 'HIGH' : 'MEDIUM',
      analyzeProbe:   null,
      traceProbe:     null,
      designScaffold: DESIGN_SCAFFOLDS[topic] ?? DESIGN_SCAFFOLDS[SystemTopic.UNKNOWN] ?? null,
      verifyAnchor:   null,
      conceptProbe:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (
    analyzeHits >= 1
    || (mentionsDeadlockOrRace && asksWhyHow)
    || (hasScenarioDesc && conceptHits === 0)
  ) {
    trace.push(`S_ANALYZE: analyzeHits=${analyzeHits}`);
    return {
      intent:         SystemIntent.S_ANALYZE,
      topic,
      confidence:     analyzeHits >= 2 ? 'HIGH' : 'MEDIUM',
      analyzeProbe:   ANALYZE_PROBES[topic] ?? ANALYZE_PROBES[SystemTopic.UNKNOWN] ?? null,
      traceProbe:     null,
      designScaffold: null,
      verifyAnchor:   null,
      conceptProbe:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (traceHits >= 1 || hasTimingTrace || (hasCodeSnippet && conceptHits === 0)) {
    trace.push(`S_TRACE: traceHits=${traceHits}`);
    return {
      intent:         SystemIntent.S_TRACE,
      topic,
      confidence:     traceHits >= 1 ? 'HIGH' : 'MEDIUM',
      analyzeProbe:   null,
      traceProbe:     TRACE_PROBES[topic] ?? TRACE_PROBES[SystemTopic.UNKNOWN] ?? null,
      designScaffold: null,
      verifyAnchor:   null,
      conceptProbe:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (conceptHits >= 1) {
    trace.push('S_CONCEPT');
    return {
      intent:         SystemIntent.S_CONCEPT,
      topic,
      confidence:     'MEDIUM',
      analyzeProbe:   null,
      traceProbe:     null,
      designScaffold: null,
      verifyAnchor:   null,
      conceptProbe:   CONCEPT_PROBES[topic] ?? CONCEPT_PROBES[SystemTopic.UNKNOWN] ?? null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  trace.push('AMBIGUOUS');
  return {
    intent:         SystemIntent.AMBIGUOUS,
    topic,
    confidence:     'LOW',
    analyzeProbe:   null,
    traceProbe:     null,
    designScaffold: null,
    verifyAnchor:   null,
    conceptProbe:   null,
    redirectScript: null,
    probeQuestion:  isBm
      ? 'Boleh cerita lebih sikit — kamu nak faham konsep OS, trace execution, analisis deadlock/race, atau reka penyelesaian sync/scheduling?'
      : 'Can you tell me more — do you want to understand an OS concept, trace execution, analyze deadlock/race, or design a sync/scheduling solution?',
    _trace: trace,
  };
}
