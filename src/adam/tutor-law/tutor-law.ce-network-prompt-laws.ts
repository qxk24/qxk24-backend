/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Network Prompt Laws
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
  NetworkIntent,
  NetworkTopic,
  type NetworkClassifierOutput,
} from './tutor-law.ce-network.types';
import type { CETurnHandler } from './tutor-law.ce-mode.types';
import { ADAM_TUTOR_CE_EXAM_LAW } from './tutor-law.ce-prompt-laws.constants';

export const ADAM_TUTOR_CE_NETWORK_CONCEPT_LAW = `
ADAM TUTOR — CE NETWORK KONSEP (N_CONCEPT):
- OSI / lapisan protokol dulu — satu lapisan setiap turn.
`.trim();

export const ADAM_TUTOR_CE_NETWORK_ANALYZE_LAW = `
ADAM TUTOR — CE NETWORK ANALISIS (N_ANALYZE):
- Kenal pasti host, link, dan protokol DAHULU — jangan beri diagnosis siap.
`.trim();

export const ADAM_TUTOR_CE_NETWORK_TRACE_LAW = `
ADAM TUTOR — CE NETWORK TRACE (N_TRACE):
- Trace satu packet / satu fasa handshake — pelajar buat langkah pertama.
`.trim();

export const ADAM_TUTOR_CE_NETWORK_DESIGN_LAW = `
ADAM TUTOR — CE NETWORK REKA BENTUK (N_DESIGN):
- JANGAN tulis konfigurasi router/switch penuh — scaffold topology dan subnet dulu.
`.trim();

export const ADAM_TUTOR_CE_NETWORK_VERIFY_LAW = `
ADAM TUTOR — CE NETWORK SEMAK (N_VERIFY):
- Tanya verify anchor sebelum sahkan subnet atau routing pelajar.
`.trim();

export function buildCENetworkIntentTurnLaw(
  intent: NetworkClassifierOutput | null | undefined,
  handler?: CETurnHandler | null,
): string {
  if (!intent) return '';

  const parts: string[] = [];

  switch (intent.intent) {
    case NetworkIntent.EXAM_DIRECT:
      parts.push(ADAM_TUTOR_CE_EXAM_LAW);
      if (intent.redirectScript) {
        parts.push(`CE NETWORK EXAM REDIRECT (turn ini):\n${intent.redirectScript}`);
      }
      break;
    case NetworkIntent.N_CONCEPT:
      parts.push(ADAM_TUTOR_CE_NETWORK_CONCEPT_LAW);
      if (intent.conceptProbe) {
        parts.push(`N_CONCEPT PROBE:\n${intent.conceptProbe}`);
      }
      break;
    case NetworkIntent.N_ANALYZE:
      parts.push(ADAM_TUTOR_CE_NETWORK_ANALYZE_LAW);
      if (intent.analyzeProbe) {
        parts.push(`N_ANALYZE PROBE:\n${intent.analyzeProbe}`);
      }
      break;
    case NetworkIntent.N_TRACE:
      parts.push(ADAM_TUTOR_CE_NETWORK_TRACE_LAW);
      if (intent.traceProbe) {
        parts.push(`N_TRACE PROBE:\n${intent.traceProbe}`);
      }
      break;
    case NetworkIntent.N_DESIGN:
      parts.push(ADAM_TUTOR_CE_NETWORK_DESIGN_LAW);
      if (intent.designScaffold) {
        parts.push(`N_DESIGN SCAFFOLD:\n${intent.designScaffold}`);
      }
      break;
    case NetworkIntent.N_VERIFY:
      parts.push(ADAM_TUTOR_CE_NETWORK_VERIFY_LAW);
      if (handler === 'VERIFY_ANCHOR' && intent.verifyAnchor) {
        parts.push(`N_VERIFY ANCHOR FIRST:\n${intent.verifyAnchor}`);
      } else if (handler === 'VERIFY_FEEDBACK') {
        parts.push(
          'N_VERIFY FEEDBACK: Semak kaedah pelajar — jangan tulis konfigurasi siap.',
        );
      }
      break;
    case NetworkIntent.AMBIGUOUS:
      if (intent.probeQuestion) {
        parts.push(`CE NETWORK PROBE (tanya sahaja):\n${intent.probeQuestion}`);
      }
      break;
    default:
      break;
  }

  if (intent.topic !== NetworkTopic.UNKNOWN) {
    parts.push(`CE NETWORK TOPIC: ${intent.topic}`);
  }

  return parts.filter(Boolean).join('\n\n');
}
