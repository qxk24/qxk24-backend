/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Hardware Classifier (Rule 61 core)
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
 * Decision tree: EXAM_DIRECT → H_VERIFY → H_TRACE → H_DESIGN → H_CONCEPT → AMBIGUOUS
 */

import {
  HW_CONCEPT_SIGNALS,
  HW_DESIGN_SIGNALS,
  HW_EXAM_SIGNALS,
  HW_TRACE_SIGNALS,
  HW_VERIFY_SIGNALS,
  countHardwareHits,
  detectHardwareTopic,
} from './tutor-law.ce-hardware.signals';
import {
  CONCEPT_PROBES,
  EXAM_REDIRECT_BM,
  EXAM_REDIRECT_EN,
  TRACE_PROBES,
  VERIFY_ANCHOR_BM,
  VERIFY_ANCHOR_EN,
  buildHardwareDesignScaffold,
  isMalayHardwareTurn,
} from './tutor-law.ce-hardware.probes';
import {
  HardwareIntent,
  HardwareTopic,
  type HardwareClassifierInput,
  type HardwareClassifierOutput,
} from './tutor-law.ce-hardware.types';

/** Rule 61 CE hardware & digital logic classifier. */
export function classifyHardwareIntent(
  input: HardwareClassifierInput,
): HardwareClassifierOutput {
  const {
    normText,
    hasCircuitDesc,
    hasHDLCode,
    priorTopic,
  } = input;
  const trace: string[] = [];
  const topic = detectHardwareTopic(normText, priorTopic);
  const isBm = isMalayHardwareTurn(normText);
  trace.push(`topic: ${topic}`);

  if (countHardwareHits(normText, HW_EXAM_SIGNALS) >= 1) {
    trace.push('EXAM_DIRECT');
    return {
      intent:         HardwareIntent.EXAM_DIRECT,
      topic,
      confidence:     'HIGH',
      conceptProbe:   null,
      designScaffold: null,
      traceProbe:     null,
      verifyAnchor:   null,
      redirectScript: isBm ? EXAM_REDIRECT_BM : EXAM_REDIRECT_EN,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (countHardwareHits(normText, HW_VERIFY_SIGNALS) >= 1) {
    trace.push('H_VERIFY');
    return {
      intent:         HardwareIntent.H_VERIFY,
      topic,
      confidence:     'HIGH',
      conceptProbe:   null,
      designScaffold: null,
      traceProbe:     null,
      verifyAnchor:   isBm ? VERIFY_ANCHOR_BM : VERIFY_ANCHOR_EN,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  const traceHits = countHardwareHits(normText, HW_TRACE_SIGNALS);
  const designHits = countHardwareHits(normText, HW_DESIGN_SIGNALS);
  const conceptHits = countHardwareHits(normText, HW_CONCEPT_SIGNALS);

  if (designHits >= 1) {
    trace.push(`H_DESIGN: designHits=${designHits}`);
    return {
      intent:         HardwareIntent.H_DESIGN,
      topic,
      confidence:     designHits >= 2 ? 'HIGH' : 'MEDIUM',
      conceptProbe:   null,
      designScaffold: buildHardwareDesignScaffold(topic, isBm),
      traceProbe:     null,
      verifyAnchor:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (
    traceHits >= 1
    || ((hasCircuitDesc || hasHDLCode) && conceptHits === 0 && designHits === 0)
  ) {
    trace.push(`H_TRACE: traceHits=${traceHits}`);
    return {
      intent:         HardwareIntent.H_TRACE,
      topic,
      confidence:     traceHits >= 1 ? 'HIGH' : 'MEDIUM',
      conceptProbe:   null,
      designScaffold: null,
      traceProbe:     TRACE_PROBES[topic] ?? TRACE_PROBES[HardwareTopic.UNKNOWN] ?? null,
      verifyAnchor:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  if (conceptHits >= 1) {
    trace.push('H_CONCEPT');
    return {
      intent:         HardwareIntent.H_CONCEPT,
      topic,
      confidence:     'MEDIUM',
      conceptProbe:   CONCEPT_PROBES[topic] ?? CONCEPT_PROBES[HardwareTopic.UNKNOWN] ?? null,
      designScaffold: null,
      traceProbe:     null,
      verifyAnchor:   null,
      redirectScript: null,
      probeQuestion:  null,
      _trace:         trace,
    };
  }

  trace.push('AMBIGUOUS');
  return {
    intent:         HardwareIntent.AMBIGUOUS,
    topic,
    confidence:     'LOW',
    conceptProbe:   null,
    designScaffold: null,
    traceProbe:     null,
    verifyAnchor:   null,
    redirectScript: null,
    probeQuestion:  isBm
      ? 'Boleh cerita sikit — kamu tengah reka litar baru, trace output litar yang ada, atau nak faham konsep komponen?'
      : 'Can you tell me more — are you designing a new circuit, tracing an existing one, or trying to understand a component?',
    _trace: trace,
  };
}
