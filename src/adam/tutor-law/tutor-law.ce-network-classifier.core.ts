/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Network Classifier (Rule 61 core)
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
 * Decision tree: EXAM_DIRECT → N_VERIFY → N_DESIGN → N_ANALYZE → N_TRACE → N_CONCEPT → AMBIGUOUS
 */

import {
  NET_ANALYZE_SIGNALS,
  NET_CONCEPT_SIGNALS,
  NET_DESIGN_SIGNALS,
  NET_EXAM_SIGNALS,
  NET_TRACE_SIGNALS,
  NET_VERIFY_SIGNALS,
  countNetworkHits,
  detectNetworkTopic,
} from './tutor-law.ce-network.signals';
import {
  ANALYZE_PROBES,
  CONCEPT_PROBES,
  DESIGN_SCAFFOLDS,
  EXAM_REDIRECT_BM,
  EXAM_REDIRECT_EN,
  TRACE_PROBES,
  VERIFY_ANCHOR_BM,
  VERIFY_ANCHOR_EN,
  isMalayNetworkTurn,
} from './tutor-law.ce-network.probes';
import {
  NetworkIntent,
  NetworkTopic,
  type NetworkClassifierInput,
  type NetworkClassifierOutput,
} from './tutor-law.ce-network.types';

/** Rule 61 CE networking classifier. */
export function classifyNetworkIntent(
  input: NetworkClassifierInput,
): NetworkClassifierOutput {
  const {
    normText,
    hasPacketDesc,
    hasTopologyDesc,
    priorTopic,
  } = input;
  const trace: string[] = [];
  const topic = detectNetworkTopic(normText, priorTopic);
  const isBm = isMalayNetworkTurn(normText);
  trace.push(`topic: ${topic}`);

  if (countNetworkHits(normText, NET_EXAM_SIGNALS) >= 1) {
    trace.push('EXAM_DIRECT');
    return {
      intent:         NetworkIntent.EXAM_DIRECT,
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

  if (countNetworkHits(normText, NET_VERIFY_SIGNALS) >= 1) {
    trace.push('N_VERIFY');
    return {
      intent:         NetworkIntent.N_VERIFY,
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

  const analyzeHits = countNetworkHits(normText, NET_ANALYZE_SIGNALS);
  const designHits = countNetworkHits(normText, NET_DESIGN_SIGNALS);
  const traceHits = countNetworkHits(normText, NET_TRACE_SIGNALS);
  const conceptHits = countNetworkHits(normText, NET_CONCEPT_SIGNALS);
  const mentionsFailure = /\b(?:loss|hilang|timeout|reset|down|gagal|fail|not working)\b/.test(normText);
  const asksWhyHow = /\b(?:kenapa|macam mana|why|how does|how do)\b/.test(normText);

  if (designHits >= 1) {
    trace.push(`N_DESIGN: designHits=${designHits}`);
    return {
      intent:         NetworkIntent.N_DESIGN,
      topic,
      confidence:     designHits >= 2 ? 'HIGH' : 'MEDIUM',
      analyzeProbe:   null,
      traceProbe:     null,
      designScaffold: DESIGN_SCAFFOLDS[topic] ?? DESIGN_SCAFFOLDS[NetworkTopic.UNKNOWN] ?? null,
      verifyAnchor:   null,
      conceptProbe:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (
    analyzeHits >= 1
    || (mentionsFailure && asksWhyHow)
    || (hasTopologyDesc && conceptHits === 0)
  ) {
    trace.push(`N_ANALYZE: analyzeHits=${analyzeHits}`);
    return {
      intent:         NetworkIntent.N_ANALYZE,
      topic,
      confidence:     analyzeHits >= 2 ? 'HIGH' : 'MEDIUM',
      analyzeProbe:   ANALYZE_PROBES[topic] ?? ANALYZE_PROBES[NetworkTopic.UNKNOWN] ?? null,
      traceProbe:     null,
      designScaffold: null,
      verifyAnchor:   null,
      conceptProbe:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (
    traceHits >= 1
    || hasPacketDesc
    || /\bhandshake\b/.test(normText)
  ) {
    trace.push(`N_TRACE: traceHits=${traceHits}`);
    return {
      intent:         NetworkIntent.N_TRACE,
      topic,
      confidence:     traceHits >= 1 ? 'HIGH' : 'MEDIUM',
      analyzeProbe:   null,
      traceProbe:     TRACE_PROBES[topic] ?? TRACE_PROBES[NetworkTopic.UNKNOWN] ?? null,
      designScaffold: null,
      verifyAnchor:   null,
      conceptProbe:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (conceptHits >= 1) {
    trace.push('N_CONCEPT');
    return {
      intent:         NetworkIntent.N_CONCEPT,
      topic,
      confidence:     'MEDIUM',
      analyzeProbe:   null,
      traceProbe:     null,
      designScaffold: null,
      verifyAnchor:   null,
      conceptProbe:   CONCEPT_PROBES[topic] ?? CONCEPT_PROBES[NetworkTopic.UNKNOWN] ?? null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  trace.push('AMBIGUOUS');
  return {
    intent:         NetworkIntent.AMBIGUOUS,
    topic,
    confidence:     'LOW',
    analyzeProbe:   null,
    traceProbe:     null,
    designScaffold: null,
    verifyAnchor:   null,
    conceptProbe:   null,
    redirectScript: null,
    probeQuestion:  isBm
      ? 'Boleh cerita lebih sikit — kamu nak faham konsep protocol, trace packet, analisis masalah rangkaian, atau reka topology/subnet?'
      : 'Can you tell me more — do you want to understand a protocol, trace packets, analyze a network problem, or design topology/subnets?',
    _trace: trace,
  };
}
