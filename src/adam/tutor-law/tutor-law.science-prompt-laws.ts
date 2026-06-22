/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Science Prompt Laws
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import {
  ExperimentPhase,
  ScienceClassifierOutput,
  ScienceIntent,
  ScienceSubject,
} from './tutor-law.science-intent.types';

export const ADAM_TUTOR_SCIENCE_EXPERIMENT_LAW = `
ADAM TUTOR — EKSPERIMEN SAINS (turn ini):

- Bimbing melalui kaedah saintifik — hipotesis, pemboleh ubah, prosedur, data, analisis, kesimpulan.
- Jangan hantar laporan siap atau jawapan akhir eksperimen tanpa usaha pelajar.
- Satu langkah / satu soalan fokus setiap turn.
- Galakkan pelajar kenal pasti MV, RV, dan pemboleh ubah dimalarkan sebelum analisis mendalam.
`.trim();

export const ADAM_TUTOR_SCIENCE_AMBIGUOUS_LAW = `
ADAM TUTOR — SAINS (isyarat tidak jelas):

- Tanya SATU soalan penjelasan ringkas sahaja — jangan jawab topik penuh lagi.
- Pilihan: fakta/konsep, pengiraan berangka, atau analisis eksperimen.
`.trim();

export function buildScienceIntentTurnLaw(
  intent: ScienceClassifierOutput | null,
): string {
  if (!intent) return '';

  const parts: string[] = [];

  switch (intent.intent) {
    case ScienceIntent.EXAM_DIRECT:
      if (intent.redirectScript) {
        parts.push(
          `EXAM / ASSIGNMENT REDIRECT (turn ini):\n${intent.redirectScript}`,
        );
      }
      break;
    case ScienceIntent.E_EXPERIMENT:
      parts.push(ADAM_TUTOR_SCIENCE_EXPERIMENT_LAW);
      if (intent.experimentPhase && intent.experimentPhase !== ExperimentPhase.UNKNOWN) {
        parts.push(`EXPERIMENT PHASE FOCUS: ${intent.experimentPhase}`);
      }
      if (intent.variableProbe) {
        parts.push(`VARIABLE PROBE FIRST (wajib sebelum analisis):\n${intent.variableProbe}`);
      }
      break;
    case ScienceIntent.F_FACTUAL:
      if (intent.depthQuestion) {
        parts.push(
          'F_FACTUAL DEPTH (selepas jawapan terus): akhiri dengan SATU soalan susulan ini — bukan blank line:\n'
          + intent.depthQuestion,
        );
      }
      break;
    case ScienceIntent.AMBIGUOUS:
      parts.push(ADAM_TUTOR_SCIENCE_AMBIGUOUS_LAW);
      if (intent.probeQuestion) {
        parts.push(`PROBE QUESTION (tanya sahaja, jangan jawab penuh):\n${intent.probeQuestion}`);
      }
      break;
    case ScienceIntent.C_CALCULATION:
      parts.push(
        'SCIENCE CALCULATION: formula sains dengan nombor — ikut mod matematik (rumus dahulu, langkah ÷/× berbaris).',
      );
      break;
    default:
      break;
  }

  if (intent.subject !== ScienceSubject.UNKNOWN) {
    parts.push(`SCIENCE SUBJECT CONTEXT: ${intent.subject}`);
  }

  return parts.filter(Boolean).join('\n\n');
}
