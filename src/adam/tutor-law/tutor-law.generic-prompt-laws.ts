/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Fallback Prompt Laws
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

import type {
  GenericClassifierOutput,
  GenericTurnHandler,
} from './tutor-law.generic-intent.types';
import { GenericDomain, GenericIntent } from './tutor-law.generic-intent.types';

// NOTE: These blocks are behavioural instructions only — write them in English so
// they never seed Malay headings/labels into a non-Malay reply. The student's
// output language is governed solely by the TUTOR LANGUAGE lock (mirror the student).

export const ADAM_TUTOR_GENERIC_EXAM_LAW = `
ADAM TUTOR — EXAM / ASSIGNMENT QUESTION (generic):
- Do not answer directly — use this turn's redirect script.
- Guide the student to identify the concept or skill being tested.
`.trim();

export const ADAM_TUTOR_GENERIC_FACT_LAW = `
ADAM TUTOR — FACT (G_FACT):
- You may give a short, accurate fact matched to the student's level.
- For fixed curriculum lists (principles, pillars, components, elements): follow MOE/KSSR/KSSM — not a general version that differs from the textbook.
- Do not insert fake reference numbers or "verified via search" without real evidence.
- After the fact, you MUST ask a significance question — never stop at memorisation alone.
`.trim();

export const ADAM_TUTOR_GENERIC_ANALYSIS_LAW = `
ADAM TUTOR — ANALYSIS (G_ANALYSIS):
- Do NOT give a finished analysis — there is no single "correct" answer.
- Evaluate the QUALITY of the student's argument, not the accuracy of a final answer.
- Probes allowed: "What evidence supports that?" "Is there another perspective?" "How will you structure your argument?"
`.trim();

export const ADAM_TUTOR_GENERIC_REVIEW_LAW = `
ADAM TUTOR — REVIEW WORK (G_REVIEW):
- Do NOT rewrite the student's sentences.
- Ask the review anchor FIRST if it has not been answered.
- You may name weak parts, ask the student to fix them, and show the principle — not a finished version.
`.trim();

export const ADAM_TUTOR_GENERIC_CONCEPT_LAW = `
ADAM TUTOR — CONCEPT (G_CONCEPT):
- Layer 1 first: a diagnostic question — do not open with a long definition.
- Build intuition before formal terms; follow the 4-layer pedagogy.
`.trim();

export const ADAM_TUTOR_GENERIC_AMBIGUOUS_LAW = `
ADAM TUTOR — GENERIC (unclear signal):
- Ask ONE probe only — do not start answering or analysing yet.
`.trim();

export function buildGenericIntentTurnLaw(
  intent: GenericClassifierOutput | null,
  handler?: GenericTurnHandler | null,
): string {
  if (!intent) return '';

  const parts: string[] = [];
  const resolvedHandler = handler ?? inferHandlerFromIntent(intent);

  switch (intent.intent) {
    case GenericIntent.EXAM_DIRECT:
      parts.push(ADAM_TUTOR_GENERIC_EXAM_LAW);
      if (intent.redirectScript) {
        parts.push(`GENERIC EXAM REDIRECT (this turn):\n${intent.redirectScript}`);
      }
      break;

    case GenericIntent.G_FACT:
      parts.push(ADAM_TUTOR_GENERIC_FACT_LAW);
      if (resolvedHandler === 'FACT_SIGNIFICANCE_ONLY') {
        if (intent.significanceQuestion) {
          parts.push(
            `G_FACT FOLLOW-UP (fact already covered — ask significance only):\n${intent.significanceQuestion}`,
          );
        }
      } else if (intent.significanceQuestion) {
        parts.push(
          'G_FACT TURN: Give a short, accurate fact, then ask the significance question in the same turn.',
        );
        parts.push(`SIGNIFICANCE QUESTION (required after the fact):\n${intent.significanceQuestion}`);
      }
      break;

    case GenericIntent.G_ANALYSIS:
      parts.push(ADAM_TUTOR_GENERIC_ANALYSIS_LAW);
      if (intent.argumentProbe) {
        parts.push(`ARGUMENT PROBE (this turn — do not replace with a finished analysis):\n${intent.argumentProbe}`);
      }
      break;

    case GenericIntent.G_REVIEW:
      parts.push(ADAM_TUTOR_GENERIC_REVIEW_LAW);
      if (resolvedHandler === 'REVIEW_ANCHOR' && intent.reviewAnchor) {
        parts.push(`REVIEW ANCHOR FIRST (required before commenting):\n${intent.reviewAnchor}`);
      } else if (resolvedHandler === 'REVIEW_FEEDBACK') {
        parts.push(
          'REVIEW FEEDBACK MODE: The student already answered the anchor — give focused feedback, do not rewrite.',
        );
      }
      break;

    case GenericIntent.G_CONCEPT:
      parts.push(ADAM_TUTOR_GENERIC_CONCEPT_LAW);
      parts.push(
        'G_CONCEPT TURN: Ask what the student already knows about this term/concept before explaining at length.',
      );
      break;

    case GenericIntent.AMBIGUOUS:
      parts.push(ADAM_TUTOR_GENERIC_AMBIGUOUS_LAW);
      if (intent.probeQuestion) {
        parts.push(`GENERIC PROBE (ask only):\n${intent.probeQuestion}`);
      }
      break;

    default:
      break;
  }

  if (intent.domain !== GenericDomain.UMUM) {
    parts.push(`GENERIC DOMAIN CONTEXT: ${intent.domain}`);
  }

  return parts.filter(Boolean).join('\n\n');
}

function inferHandlerFromIntent(intent: GenericClassifierOutput): GenericTurnHandler {
  switch (intent.intent) {
    case GenericIntent.EXAM_DIRECT:
      return 'REDIRECT';
    case GenericIntent.AMBIGUOUS:
      return 'AMBIGUOUS_PROBE';
    case GenericIntent.G_ANALYSIS:
      return 'ARGUMENT_PROBE';
    case GenericIntent.G_FACT:
      return 'FACT_WITH_SIGNIFICANCE';
    case GenericIntent.G_REVIEW:
      return 'REVIEW_ANCHOR';
    case GenericIntent.G_CONCEPT:
      return 'CONCEPT_DIAGNOSE';
    default:
      return 'AMBIGUOUS_PROBE';
  }
}
