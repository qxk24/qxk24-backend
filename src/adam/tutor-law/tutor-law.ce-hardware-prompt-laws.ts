/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Hardware Prompt Laws
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
  HardwareIntent,
  HardwareTopic,
  type HardwareClassifierOutput,
} from './tutor-law.ce-hardware.types';
import type { CETurnHandler } from './tutor-law.ce-mode.types';
import { ADAM_TUTOR_CE_EXAM_LAW } from './tutor-law.ce-prompt-laws.constants';

export const ADAM_TUTOR_CE_HARDWARE_CONCEPT_LAW = `
ADAM TUTOR — CE HARDWARE KONSEP (H_CONCEPT):
- Truth table / definisi gate dulu — jangan terus lukis litar panjang.
- Satu konsep setiap turn; bina intuisi sebelum istilah formal.
`.trim();

export const ADAM_TUTOR_CE_HARDWARE_DESIGN_LAW = `
ADAM TUTOR — CE HARDWARE REKA BENTUK (H_DESIGN):
- JANGAN lukis litar siap — ikut scaffold langkah demi langkah.
- Truth table → Boolean expression → ringkasan → barulah gate.
`.trim();

export const ADAM_TUTOR_CE_HARDWARE_TRACE_LAW = `
ADAM TUTOR — CE HARDWARE TRACE (H_TRACE):
- Pelajar trace satu baris / satu clock cycle sendiri dulu.
- ADAM semak langkah, bukan hantar trace penuh tanpa usaha.
`.trim();

export const ADAM_TUTOR_CE_HARDWARE_VERIFY_LAW = `
ADAM TUTOR — CE HARDWARE SEMAK (H_VERIFY):
- JANGAN sahkan jawapan tanpa truth table atau cara kerja pelajar.
- Tanya verify anchor DAHULU jika belum dijawab.
`.trim();

export function buildCEHardwareIntentTurnLaw(
  intent: HardwareClassifierOutput | null | undefined,
  handler?: CETurnHandler | null,
): string {
  if (!intent) return '';

  const parts: string[] = [];

  switch (intent.intent) {
    case HardwareIntent.EXAM_DIRECT:
      parts.push(ADAM_TUTOR_CE_EXAM_LAW);
      if (intent.redirectScript) {
        parts.push(`CE HARDWARE EXAM REDIRECT (turn ini):\n${intent.redirectScript}`);
      }
      break;
    case HardwareIntent.H_CONCEPT:
      parts.push(ADAM_TUTOR_CE_HARDWARE_CONCEPT_LAW);
      if (intent.conceptProbe) {
        parts.push(`H_CONCEPT PROBE:\n${intent.conceptProbe}`);
      }
      break;
    case HardwareIntent.H_DESIGN:
      parts.push(ADAM_TUTOR_CE_HARDWARE_DESIGN_LAW);
      if (intent.designScaffold) {
        parts.push(`H_DESIGN SCAFFOLD:\n${intent.designScaffold}`);
      }
      break;
    case HardwareIntent.H_TRACE:
      parts.push(ADAM_TUTOR_CE_HARDWARE_TRACE_LAW);
      if (intent.traceProbe) {
        parts.push(`H_TRACE PROBE:\n${intent.traceProbe}`);
      }
      break;
    case HardwareIntent.H_VERIFY:
      parts.push(ADAM_TUTOR_CE_HARDWARE_VERIFY_LAW);
      if (handler === 'VERIFY_ANCHOR' && intent.verifyAnchor) {
        parts.push(`H_VERIFY ANCHOR FIRST:\n${intent.verifyAnchor}`);
      } else if (handler === 'VERIFY_FEEDBACK') {
        parts.push(
          'H_VERIFY FEEDBACK: Pelajar sudah tunjuk kerja — semak kaedah dan logic, bukan beri litar siap.',
        );
      }
      break;
    case HardwareIntent.AMBIGUOUS:
      if (intent.probeQuestion) {
        parts.push(`CE HARDWARE PROBE (tanya sahaja):\n${intent.probeQuestion}`);
      }
      break;
    default:
      break;
  }

  if (intent.topic !== HardwareTopic.UNKNOWN) {
    parts.push(`CE HARDWARE TOPIC: ${intent.topic}`);
  }

  return parts.filter(Boolean).join('\n\n');
}
