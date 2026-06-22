/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Theory Prompt Laws
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
 */

import {
  TheoryIntent,
  TheoryTopic,
  type TheoryClassifierOutput,
} from './tutor-law.ce-theory.types';
import type { CETurnHandler } from './tutor-law.ce-mode.types';
import { ADAM_TUTOR_CE_EXAM_LAW } from './tutor-law.ce-prompt-laws.constants';

export const ADAM_TUTOR_CE_THEORY_CONCEPT_LAW = `
ADAM TUTOR — CE THEORY KONSEP (T_CONCEPT):
- Intuisi dan contoh kecil dulu — definisi formal selepas probe.
`.trim();

export const ADAM_TUTOR_CE_THEORY_COMPLEXITY_LAW = `
ADAM TUTOR — CE THEORY KOMPLEKSITI (T_COMPLEXITY):
- Trace algoritma pada input kecil DAHULU — jangan mula dengan Big-O tanpa usaha.
`.trim();

export const ADAM_TUTOR_CE_THEORY_TRACE_LAW = `
ADAM TUTOR — CE THEORY TRACE (T_TRACE):
- Pelajar trace satu iterasi / satu langkah algoritma sendiri.
`.trim();

export const ADAM_TUTOR_CE_THEORY_PROOF_LAW = `
ADAM TUTOR — CE THEORY BUKTI (T_PROOF):
- JANGAN tulis proof siap — bimbing struktur (base case, inductive step, invariant).
`.trim();

export const ADAM_TUTOR_CE_THEORY_DESIGN_LAW = `
ADAM TUTOR — CE THEORY REKA BENTUK (T_DESIGN):
- Scaffold idea algoritma — bukan pseudokod lengkap atau implementasi penuh.
`.trim();

export function buildCETheoryIntentTurnLaw(
  intent: TheoryClassifierOutput | null | undefined,
  handler?: CETurnHandler | null,
): string {
  if (!intent) return '';

  const parts: string[] = [];

  switch (intent.intent) {
    case TheoryIntent.EXAM_DIRECT:
      parts.push(ADAM_TUTOR_CE_EXAM_LAW);
      if (intent.redirectScript) {
        parts.push(`CE THEORY EXAM REDIRECT (turn ini):\n${intent.redirectScript}`);
      }
      break;
    case TheoryIntent.T_CONCEPT:
      parts.push(ADAM_TUTOR_CE_THEORY_CONCEPT_LAW);
      if (intent.conceptProbe) {
        parts.push(`T_CONCEPT PROBE:\n${intent.conceptProbe}`);
      }
      break;
    case TheoryIntent.T_COMPLEXITY:
      parts.push(ADAM_TUTOR_CE_THEORY_COMPLEXITY_LAW);
      if (intent.complexityProbe) {
        parts.push(`T_COMPLEXITY PROBE:\n${intent.complexityProbe}`);
      }
      break;
    case TheoryIntent.T_TRACE:
      parts.push(ADAM_TUTOR_CE_THEORY_TRACE_LAW);
      if (intent.traceAnchor) {
        parts.push(`T_TRACE ANCHOR:\n${intent.traceAnchor}`);
      }
      break;
    case TheoryIntent.T_PROOF:
      parts.push(ADAM_TUTOR_CE_THEORY_PROOF_LAW);
      if (intent.proofProbe) {
        parts.push(`T_PROOF PROBE:\n${intent.proofProbe}`);
      }
      break;
    case TheoryIntent.T_DESIGN:
      parts.push(ADAM_TUTOR_CE_THEORY_DESIGN_LAW);
      if (intent.designScaffold) {
        parts.push(`T_DESIGN SCAFFOLD:\n${intent.designScaffold}`);
      }
      break;
    case TheoryIntent.AMBIGUOUS:
      if (intent.probeQuestion) {
        parts.push(`CE THEORY PROBE (tanya sahaja):\n${intent.probeQuestion}`);
      }
      break;
    default:
      break;
  }

  if (intent.topic !== TheoryTopic.UNKNOWN) {
    parts.push(`CE THEORY TOPIC: ${intent.topic}`);
  }

  return parts.filter(Boolean).join('\n\n');
}
