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

export const ADAM_TUTOR_GENERIC_EXAM_LAW = `
ADAM TUTOR — SOALAN PEPERIKSAAN / TUGASAN (generic):
- Jangan jawab terus — guna redirect script turn ini.
- Bimbing pelajar kenal pasti konsep atau kemahiran yang diuji.
`.trim();

export const ADAM_TUTOR_GENERIC_FACT_LAW = `
ADAM TUTOR — FAKTA (G_FACT):
- Boleh jawab fakta ringkas dan tepat mengikut aras pelajar.
- Selepas fakta, WAJIB tanya soalan signifikan — jangan berhenti pada hafalan sahaja.
`.trim();

export const ADAM_TUTOR_GENERIC_ANALYSIS_LAW = `
ADAM TUTOR — ANALISIS (G_ANALYSIS):
- JANGAN beri analisis siap — tiada jawapan tunggal yang "betul".
- Nilai KUALITI HUJAH pelajar, bukan ketepatan jawapan akhir.
- Probe dibenarkan: "Ada bukti untuk sokongan tu?" "Ada perspektif lain?" "Bagaimana kamu nak struktur hujah kamu?"
`.trim();

export const ADAM_TUTOR_GENERIC_REVIEW_LAW = `
ADAM TUTOR — SEMAK KERJA (G_REVIEW):
- JANGAN tulis semula ayat pelajar.
- Tanya review anchor DAHULU jika belum dijawab.
- Boleh namakan bahagian lemah, minta pelajar baiki sendiri, tunjuk prinsip — bukan versi siap.
`.trim();

export const ADAM_TUTOR_GENERIC_CONCEPT_LAW = `
ADAM TUTOR — KONSEP (G_CONCEPT):
- Lapisan 1 dulu: soalan diagnostik — jangan mula dengan definisi panjang.
- Bina intuisi sebelum istilah formal; ikut 4-lapisan pedagogy.
`.trim();

export const ADAM_TUTOR_GENERIC_AMBIGUOUS_LAW = `
ADAM TUTOR — GENERIC (isyarat tidak jelas):
- Tanya SATU probe sahaja — jangan mula menjawab atau menganalisis lagi.
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
        parts.push(`GENERIC EXAM REDIRECT (turn ini):\n${intent.redirectScript}`);
      }
      break;

    case GenericIntent.G_FACT:
      parts.push(ADAM_TUTOR_GENERIC_FACT_LAW);
      if (resolvedHandler === 'FACT_SIGNIFICANCE_ONLY') {
        if (intent.significanceQuestion) {
          parts.push(
            `G_FACT FOLLOW-UP (fakta sudah dibincang — tanya signifikan sahaja):\n${intent.significanceQuestion}`,
          );
        }
      } else if (intent.significanceQuestion) {
        parts.push(
          'G_FACT TURN: Beri jawapan fakta ringkas dan tepat, kemudian tanya signifikan dalam turn yang sama.',
        );
        parts.push(`SIGNIFICANCE QUESTION (wajib selepas fakta):\n${intent.significanceQuestion}`);
      }
      break;

    case GenericIntent.G_ANALYSIS:
      parts.push(ADAM_TUTOR_GENERIC_ANALYSIS_LAW);
      if (intent.argumentProbe) {
        parts.push(`ARGUMENT PROBE (turn ini — jangan ganti dengan analisis siap):\n${intent.argumentProbe}`);
      }
      break;

    case GenericIntent.G_REVIEW:
      parts.push(ADAM_TUTOR_GENERIC_REVIEW_LAW);
      if (resolvedHandler === 'REVIEW_ANCHOR' && intent.reviewAnchor) {
        parts.push(`REVIEW ANCHOR FIRST (wajib sebelum komen):\n${intent.reviewAnchor}`);
      } else if (resolvedHandler === 'REVIEW_FEEDBACK') {
        parts.push(
          'REVIEW FEEDBACK MODE: Pelajar sudah jawab anchor — beri maklum balas tertumpu, jangan tulis semula.',
        );
      }
      break;

    case GenericIntent.G_CONCEPT:
      parts.push(ADAM_TUTOR_GENERIC_CONCEPT_LAW);
      parts.push(
        'G_CONCEPT TURN: Tanya apa yang pelajar dah tahu tentang istilah/konsep ni sebelum terangkan panjang.',
      );
      break;

    case GenericIntent.AMBIGUOUS:
      parts.push(ADAM_TUTOR_GENERIC_AMBIGUOUS_LAW);
      if (intent.probeQuestion) {
        parts.push(`GENERIC PROBE (tanya sahaja):\n${intent.probeQuestion}`);
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
