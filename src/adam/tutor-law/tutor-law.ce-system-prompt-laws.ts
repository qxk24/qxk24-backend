/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE System Prompt Laws
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
  SystemIntent,
  SystemTopic,
  type SystemClassifierOutput,
} from './tutor-law.ce-system.types';
import type { CETurnHandler } from './tutor-law.ce-mode.types';
import { ADAM_TUTOR_CE_EXAM_LAW } from './tutor-law.ce-prompt-laws.constants';

export const ADAM_TUTOR_CE_SYSTEM_CONCEPT_LAW = `
ADAM TUTOR — CE SYSTEM KONSEP (S_CONCEPT):
- State dan definisi OS dulu — analogi sebelum formalism.
`.trim();

export const ADAM_TUTOR_CE_SYSTEM_ANALYZE_LAW = `
ADAM TUTOR — CE SYSTEM ANALISIS (S_ANALYZE):
- Kenal pasti state sistem, proses, dan sumber DAHULU — jangan beri diagnosis siap.
`.trim();

export const ADAM_TUTOR_CE_SYSTEM_TRACE_LAW = `
ADAM TUTOR — CE SYSTEM TRACE (S_TRACE):
- Trace satu langkah scheduling / sync / page fault — pelajar buat dulu.
`.trim();

export const ADAM_TUTOR_CE_SYSTEM_DESIGN_LAW = `
ADAM TUTOR — CE SYSTEM REKA BENTUK (S_DESIGN):
- JANGAN tulis kod penuh — scaffold policy, struktur data, dan invariant dulu.
`.trim();

export const ADAM_TUTOR_CE_SYSTEM_VERIFY_LAW = `
ADAM TUTOR — CE SYSTEM SEMAK (S_VERIFY):
- Tanya verify anchor sebelum sahkan jawapan pelajar.
`.trim();

export function buildCESystemIntentTurnLaw(
  intent: SystemClassifierOutput | null | undefined,
  handler?: CETurnHandler | null,
): string {
  if (!intent) return '';

  const parts: string[] = [];

  switch (intent.intent) {
    case SystemIntent.EXAM_DIRECT:
      parts.push(ADAM_TUTOR_CE_EXAM_LAW);
      if (intent.redirectScript) {
        parts.push(`CE SYSTEM EXAM REDIRECT (turn ini):\n${intent.redirectScript}`);
      }
      break;
    case SystemIntent.S_CONCEPT:
      parts.push(ADAM_TUTOR_CE_SYSTEM_CONCEPT_LAW);
      if (intent.conceptProbe) {
        parts.push(`S_CONCEPT PROBE:\n${intent.conceptProbe}`);
      }
      break;
    case SystemIntent.S_ANALYZE:
      parts.push(ADAM_TUTOR_CE_SYSTEM_ANALYZE_LAW);
      if (intent.analyzeProbe) {
        parts.push(`S_ANALYZE PROBE:\n${intent.analyzeProbe}`);
      }
      break;
    case SystemIntent.S_TRACE:
      parts.push(ADAM_TUTOR_CE_SYSTEM_TRACE_LAW);
      if (intent.traceProbe) {
        parts.push(`S_TRACE PROBE:\n${intent.traceProbe}`);
      }
      break;
    case SystemIntent.S_DESIGN:
      parts.push(ADAM_TUTOR_CE_SYSTEM_DESIGN_LAW);
      if (intent.designScaffold) {
        parts.push(`S_DESIGN SCAFFOLD:\n${intent.designScaffold}`);
      }
      break;
    case SystemIntent.S_VERIFY:
      parts.push(ADAM_TUTOR_CE_SYSTEM_VERIFY_LAW);
      if (handler === 'VERIFY_ANCHOR' && intent.verifyAnchor) {
        parts.push(`S_VERIFY ANCHOR FIRST:\n${intent.verifyAnchor}`);
      } else if (handler === 'VERIFY_FEEDBACK') {
        parts.push(
          'S_VERIFY FEEDBACK: Semak reasoning pelajar — jangan tulis penyelesaian penuh.',
        );
      }
      break;
    case SystemIntent.AMBIGUOUS:
      if (intent.probeQuestion) {
        parts.push(`CE SYSTEM PROBE (tanya sahaja):\n${intent.probeQuestion}`);
      }
      break;
    default:
      break;
  }

  if (intent.topic !== SystemTopic.UNKNOWN) {
    parts.push(`CE SYSTEM TOPIC: ${intent.topic}`);
  }

  return parts.filter(Boolean).join('\n\n');
}
