/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Theory Classifier (Rule 61 core)
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
 * Decision tree: EXAM_DIRECT → T_PROOF → T_COMPLEXITY → T_TRACE → T_DESIGN → T_CONCEPT → AMBIGUOUS
 */

import {
  THEORY_COMPLEXITY_SIGNALS,
  THEORY_CONCEPT_SIGNALS,
  THEORY_DESIGN_SIGNALS,
  THEORY_EXAM_SIGNALS,
  THEORY_PROOF_SIGNALS,
  THEORY_TRACE_SIGNALS,
  countTheoryHits,
  detectTheoryTopic,
} from './tutor-law.ce-theory.signals';
import {
  COMPLEXITY_PROBES,
  CONCEPT_PROBES,
  DESIGN_SCAFFOLDS,
  EXAM_REDIRECT_BM,
  EXAM_REDIRECT_EN,
  PROOF_PROBES,
  TRACE_ANCHORS,
  isMalayTheoryTurn,
} from './tutor-law.ce-theory.probes';
import {
  TheoryIntent,
  TheoryTopic,
  type TheoryClassifierInput,
  type TheoryClassifierOutput,
} from './tutor-law.ce-theory.types';

/** Rule 61 CE theory & algorithms classifier. */
export function classifyTheoryIntent(
  input: TheoryClassifierInput,
): TheoryClassifierOutput {
  const {
    normText,
    hasEquation,
    hasProofAttempt,
    priorTopic,
  } = input;
  const trace: string[] = [];
  const topic = detectTheoryTopic(normText, priorTopic);
  const isBm = isMalayTheoryTurn(normText);
  trace.push(`topic: ${topic}`);

  if (countTheoryHits(normText, THEORY_EXAM_SIGNALS) >= 1) {
    trace.push('EXAM_DIRECT');
    return {
      intent:          TheoryIntent.EXAM_DIRECT,
      topic,
      confidence:      'HIGH',
      complexityProbe: null,
      proofProbe:      null,
      designScaffold:  null,
      traceAnchor:     null,
      conceptProbe:    null,
      redirectScript:  isBm ? EXAM_REDIRECT_BM : EXAM_REDIRECT_EN,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  const proofHits = countTheoryHits(normText, THEORY_PROOF_SIGNALS);
  if (proofHits >= 1 || hasProofAttempt) {
    trace.push(`T_PROOF: proofHits=${proofHits}`);
    return {
      intent:          TheoryIntent.T_PROOF,
      topic,
      confidence:      proofHits >= 2 ? 'HIGH' : 'MEDIUM',
      complexityProbe: null,
      proofProbe:      PROOF_PROBES[topic] ?? PROOF_PROBES[TheoryTopic.UNKNOWN] ?? null,
      designScaffold:  null,
      traceAnchor:     null,
      conceptProbe:    null,
      redirectScript:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  const complexityHits = countTheoryHits(normText, THEORY_COMPLEXITY_SIGNALS);
  if (complexityHits >= 1 || hasEquation) {
    trace.push(`T_COMPLEXITY: ${complexityHits}`);
    return {
      intent:          TheoryIntent.T_COMPLEXITY,
      topic,
      confidence:      complexityHits >= 2 ? 'HIGH' : 'MEDIUM',
      complexityProbe: COMPLEXITY_PROBES[topic] ?? COMPLEXITY_PROBES[TheoryTopic.UNKNOWN] ?? null,
      proofProbe:      null,
      designScaffold:  null,
      traceAnchor:     null,
      conceptProbe:    null,
      redirectScript:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  const traceHits = countTheoryHits(normText, THEORY_TRACE_SIGNALS);
  if (traceHits >= 1) {
    trace.push(`T_TRACE: ${traceHits}`);
    return {
      intent:          TheoryIntent.T_TRACE,
      topic,
      confidence:      'HIGH',
      complexityProbe: null,
      proofProbe:      null,
      designScaffold:  null,
      traceAnchor:     TRACE_ANCHORS[topic] ?? TRACE_ANCHORS[TheoryTopic.UNKNOWN] ?? null,
      conceptProbe:    null,
      redirectScript:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  const designHits = countTheoryHits(normText, THEORY_DESIGN_SIGNALS);
  if (designHits >= 1) {
    trace.push(`T_DESIGN: ${designHits}`);
    return {
      intent:          TheoryIntent.T_DESIGN,
      topic,
      confidence:      designHits >= 2 ? 'HIGH' : 'MEDIUM',
      complexityProbe: null,
      proofProbe:      null,
      designScaffold:  DESIGN_SCAFFOLDS[topic] ?? DESIGN_SCAFFOLDS[TheoryTopic.UNKNOWN] ?? null,
      traceAnchor:     null,
      conceptProbe:    null,
      redirectScript:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  if (countTheoryHits(normText, THEORY_CONCEPT_SIGNALS) >= 1) {
    trace.push('T_CONCEPT');
    return {
      intent:          TheoryIntent.T_CONCEPT,
      topic,
      confidence:      'MEDIUM',
      complexityProbe: null,
      proofProbe:      null,
      designScaffold:  null,
      traceAnchor:     null,
      conceptProbe:    CONCEPT_PROBES[topic] ?? CONCEPT_PROBES[TheoryTopic.UNKNOWN] ?? null,
      redirectScript:  null,
      probeQuestion:   null,
      _trace:          trace,
    };
  }

  trace.push('AMBIGUOUS');
  return {
    intent:          TheoryIntent.AMBIGUOUS,
    topic,
    confidence:      'LOW',
    complexityProbe: null,
    proofProbe:      null,
    designScaffold:  null,
    traceAnchor:     null,
    conceptProbe:    null,
    redirectScript:  null,
    probeQuestion:   isBm
      ? 'Boleh cerita lebih sikit — kamu nak faham konsep, derive complexity, trace algoritma, design penyelesaian, atau buat proof?'
      : 'Can you tell me more — do you want to understand a concept, derive complexity, trace an algorithm, design a solution, or write a proof?',
    _trace: trace,
  };
}
