/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Code Prompt Laws
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
  CodeIntent,
  type CodeClassifierOutput,
} from './tutor-law.code-intent-classifier';
import type { CETurnHandler } from './tutor-law.ce-mode.types';

export const ADAM_TUTOR_CODE_TRAP_LAW = `
ADAM TUTOR — CODE / ASSIGNMENT TRAP:
- Jangan tulis projek penuh atau jawapan tugasan siap salin.
- Guna redirect script — pecahkan masalah, satu langkah setiap turn.
`.trim();

export const ADAM_TUTOR_CODE_DEBUG_LAW = `
ADAM TUTOR — DEBUG (D_DEBUG):
- Bimbing pelajar baca mesej error dan trace root cause — jangan betulkan kod penuh tanpa usaha.
- Satu hipotesis / satu langkah setiap turn.
`.trim();

export const ADAM_TUTOR_CODE_BUILD_LAW = `
ADAM TUTOR — BUILD (B_BUILD):
- JANGAN tulis program lengkap — scaffold input/output dan struktur dulu.
- Snippet kecil dibenarkan untuk ilustrasi satu konsep.
`.trim();

export const ADAM_TUTOR_CODE_REVIEW_LAW = `
ADAM TUTOR — CODE REVIEW (R_REVIEW):
- Jangan tulis semula kod pelajar.
- Tanya apa yang pelajar dah cuba; komen prinsip, bukan versi siap.
`.trim();

export const ADAM_TUTOR_CODE_CONCEPT_LAW = `
ADAM TUTOR — CODE CONCEPT (C_CONCEPT):
- Intuisi dan analogi dulu — definisi formal selepas pelajar cuba probe.
`.trim();

export function buildCodeIntentTurnLaw(
  output: CodeClassifierOutput | null,
  handler?: CETurnHandler | null,
): string {
  if (!output) return '';

  const parts: string[] = [];
  const resolved = handler ?? inferCodeHandler(output);

  switch (output.intent) {
    case CodeIntent.TRAP:
      parts.push(ADAM_TUTOR_CODE_TRAP_LAW);
      if (output.redirectScript) {
        parts.push(`CODE TRAP REDIRECT (turn ini):\n${output.redirectScript}`);
      }
      break;
    case CodeIntent.D_DEBUG:
      parts.push(ADAM_TUTOR_CODE_DEBUG_LAW);
      if (output.probeQuestion) {
        parts.push(`DEBUG PROBE:\n${output.probeQuestion}`);
      }
      break;
    case CodeIntent.B_BUILD:
      parts.push(ADAM_TUTOR_CODE_BUILD_LAW);
      if (output.probeQuestion) {
        parts.push(`BUILD SCAFFOLD:\n${output.probeQuestion}`);
      }
      break;
    case CodeIntent.R_REVIEW:
      parts.push(ADAM_TUTOR_CODE_REVIEW_LAW);
      if (resolved === 'CODE_REVIEW' && output.probeQuestion) {
        parts.push(`REVIEW PROBE:\n${output.probeQuestion}`);
      }
      break;
    case CodeIntent.C_CONCEPT:
      parts.push(ADAM_TUTOR_CODE_CONCEPT_LAW);
      if (output.probeQuestion) {
        parts.push(`CONCEPT PROBE:\n${output.probeQuestion}`);
      }
      break;
    case CodeIntent.AMBIGUOUS:
      if (output.probeQuestion) {
        parts.push(`CODE CLARIFICATION (tanya sahaja):\n${output.probeQuestion}`);
      }
      break;
    default:
      break;
  }

  if (output.language) {
    parts.push(`PROGRAMMING LANGUAGE CONTEXT: ${output.language}`);
  }

  return parts.filter(Boolean).join('\n\n');
}

function inferCodeHandler(output: CodeClassifierOutput): CETurnHandler {
  switch (output.intent) {
    case CodeIntent.TRAP: return 'REDIRECT';
    case CodeIntent.D_DEBUG: return 'CODE_DEBUG';
    case CodeIntent.B_BUILD: return 'CODE_BUILD';
    case CodeIntent.R_REVIEW: return 'CODE_REVIEW';
    case CodeIntent.C_CONCEPT: return 'CODE_CONCEPT';
    default: return 'AMBIGUOUS_PROBE';
  }
}
