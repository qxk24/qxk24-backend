/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Language & Writing Prompt Laws
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import {
  LanguageClassifierOutput,
  LanguageIntent,
  WritingType,
} from './tutor-law.language-writing.types';

export const ADAM_TUTOR_WRITING_TRAP_LAW = `
ADAM TUTOR — PENULISAN / TRAP (hard block):

- Jangan tulis karangan, esei, laporan, surat, puisi, atau jawapan siap untuk pelajar.
- Guna redirect script turn ini — tegas tapi hormat; arahkan ke idea / struktur pelajar sendiri.
`.trim();

export const ADAM_TUTOR_WRITING_REVIEW_LAW = `
ADAM TUTOR — SEMAK DRAF (W_REVIEW):

- JANGAN tulis semula ayat pelajar — jangan hantar versi "diperbaiki" siap salin.
- Tanya feedback anchor DAHULU sebelum komen mendalam.
- Boleh: namakan bahagian lemah, tanya pelajar baiki bahagian tertentu, tunjuk prinsip — bukan ayat siap.
`.trim();

export const ADAM_TUTOR_WRITING_GRAMMAR_LAW = `
ADAM TUTOR — TATABAHASA / GRAMMAR (G_GRAMMAR):

- Ikut Mod A/B/C matematik: probe dulu, satu langkah, jangan sahkan tanpa usaha.
- Tunjuk kesilapan jenis (ejaan, imbuhan, tanda baca) — jangan tulis semula perenggan penuh.
`.trim();

export const ADAM_TUTOR_WRITING_AMBIGUOUS_LAW = `
ADAM TUTOR — PENULISAN (isyarat tidak jelas):

- Tanya SATU soalan probe sahaja — jangan mula menulis atau semak draf lagi.
`.trim();

export function buildLanguageIntentTurnLaw(
  intent: LanguageClassifierOutput | null,
): string {
  if (!intent) return '';

  const parts: string[] = [];

  switch (intent.intent) {
    case LanguageIntent.TRAP:
      parts.push(ADAM_TUTOR_WRITING_TRAP_LAW);
      if (intent.redirectScript) {
        parts.push(`WRITING TRAP REDIRECT (turn ini):\n${intent.redirectScript}`);
      }
      break;
    case LanguageIntent.G_GRAMMAR:
      parts.push(ADAM_TUTOR_WRITING_GRAMMAR_LAW);
      break;
    case LanguageIntent.W_REVIEW:
      parts.push(ADAM_TUTOR_WRITING_REVIEW_LAW);
      if (intent.feedbackAnchor) {
        parts.push(`FEEDBACK ANCHOR FIRST (wajib sebelum komen):\n${intent.feedbackAnchor}`);
      }
      break;
    case LanguageIntent.W_STRUCTURE:
      if (intent.scaffoldPrompt) {
        parts.push(`WRITING STRUCTURE SCAFFOLD (turn ini):\n${intent.scaffoldPrompt}`);
      }
      break;
    case LanguageIntent.W_IDEA:
      if (intent.ideationProbe) {
        parts.push(`WRITING IDEATION PROBE (turn ini):\n${intent.ideationProbe}`);
      }
      break;
    case LanguageIntent.AMBIGUOUS:
      parts.push(ADAM_TUTOR_WRITING_AMBIGUOUS_LAW);
      if (intent.probeQuestion) {
        parts.push(`PROBE QUESTION (tanya sahaja):\n${intent.probeQuestion}`);
      }
      break;
    default:
      break;
  }

  if (intent.writingType !== WritingType.UNKNOWN) {
    parts.push(`WRITING TYPE CONTEXT: ${intent.writingType}`);
  }

  return parts.filter(Boolean).join('\n\n');
}
