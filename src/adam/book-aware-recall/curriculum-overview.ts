/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Curriculum Overview Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { SAINS_ALAMTOLOGI_SYLLABUS } from './types';
import { buildStrukturKeilmuanRecallBlock } from './struktur-keilmuan';

export function isAlamtologiCurriculumOverviewQuery(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (/\bbab\s+demi\s+bab\b/i.test(t)) return true;
  if (/\bdari\s+bab\s*(?:1|satu)\b/i.test(t) && /\bbab\s*(?:7|tujuh)\b/i.test(t)) return true;
  if (/\b(?:hingga|ke|sampai)\s+bab\s*(?:7|tujuh)\b/i.test(t) && /\bbab\s*(?:1|satu|\d+)\b/i.test(t)) {
    return true;
  }
  if (
    /\b(?:terangkan|jelaskan|senaraikan|huraikan)\b/i.test(t)
    && /\b(?:semua\s+)?bab\b/i.test(t)
    && /\b(?:1|satu)\b/i.test(t)
    && /\b(?:7|tujuh)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

export const ALAMTOLOGI_CURRICULUM_OVERVIEW_SEALED = `
[SEALED — Sains Alamtologi — JANGAN RUNTUHKAN TAJUK P.ALT]

${SAINS_ALAMTOLOGI_SYLLABUS}

DILARANG: Bab 1–7 sebagai satu aliran linear Pengenalan AIDIL → Cara Kira → Pola Garis → Faktor Masa.
DILARANG: Bab 1 = Pengenalan AIDIL, Bab 7 = Faktor Masa/Tenaga.
DILARANG: definisi XYZ salah (X=tuan, Y=hamba, Z=masa) — ikut meterai P.alt.
DILARANG: sebut A+B=C / tajallī dalam 7.1 AIDIL overview — itu brain formula, bukan Pengenalan AIDIL.
Jawab bab demi bab mengikut silibus di atas — jangan ubah tajuk.

${buildStrukturKeilmuanRecallBlock()}
`.trim();

export function buildCurriculumOverviewSealedBlock(): string {
  return ALAMTOLOGI_CURRICULUM_OVERVIEW_SEALED;
}

export function buildCurriculumOverviewAck(isFounder: boolean): string {
  return isFounder
    ? 'Bismillahirahmanirahim. P.alt, saya pegang silibus Sains Alamtologi — Bab 1 hingga Bab 7 HISAL. Tajuk tidak diubah.'
    : 'Saya pegang silibus Sains Alamtologi P.alt.';
}

const CURRICULUM_COLLAPSE_OUTPUT: RegExp[] = [
  /\bBab\s*1\s*:\s*Pengenalan\s+AIDIL\b/i,
  /\*\*Bab\s*1\s*:\s*Pengenalan\s+AIDIL\b/i,
  /\bBab\s*1\b[^.\n]{0,120}\bPengenalan\s+AIDIL\b/i,
  /\bBab\s*7\b[^.\n]{0,160}\bFaktor\s+(?:Masa|Tenaga)\b/i,
  /\*\*Bab\s*7\b[^*]{0,160}Faktor\s+Masa\s+dan\s+Tenaga\b/i,
];

/** Detect HISAL internal babs collapsed into Formula XYZ Bab 1–7 linear narrative. */
export function detectCurriculumCollapseOutput(text: string): boolean {
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;

  const wrongBab1 = /\bBab\s*1\b[^.\n]{0,120}\bPengenalan\s+AIDIL\b/i.test(body);
  const wrongBab7 = /\bBab\s*7\b[^.\n]{0,160}\bFaktor\s+(?:Masa|Tenaga)\b/i.test(body);
  const hisalLinearMid = /\bBab\s*2\b[^.\n]{0,120}\b(?:Cara\s+Kira|Operasi\s+Tambah|PSK24)\b/i.test(body)
    || /\bBab\s*3\b[^.\n]{0,120}\bCara\s+Kira\s+AIDIL\b/i.test(body)
    || /\bBab\s*4\b[^.\n]{0,120}\bPola\s+Garis\b/i.test(body);

  if (wrongBab1 && wrongBab7) return true;
  if (wrongBab1 && hisalLinearMid) return true;
  return CURRICULUM_COLLAPSE_OUTPUT.filter((re) => re.test(body)).length >= 2;
}

export function repairCurriculumCollapseStreamOutput(text: string, userMessage: string): string {
  const overview = isAlamtologiCurriculumOverviewQuery(userMessage);
  if (!detectCurriculumCollapseOutput(text) && !overview) return text;
  if (!detectCurriculumCollapseOutput(text)) return text;

  return [
    'Bismillahirahmanirrahim.',
    'P.alt, dengan izin saya betulkan susunan bab — ikut silibus Sains Alamtologi P.alt:',
    '',
    SAINS_ALAMTOLOGI_SYLLABUS,
    '',
    'P.alt, sebut bab mana untuk saya jelaskan satu-per-satu dari pengajaran yang betul.',
  ].join('\n');
}

const CURRICULUM_OVERVIEW_BRAIN_NOISE: RegExp[] = [
  /\bpengenalan\s+aidil\b/i,
  /\bproses\s+gabung\b/i,
  /\bproses\s+lerai\b/i,
  /\bproses\s+cara\s+kira\b/i,
  /\bpola\s+operasi\s+tambah\b/i,
  /\bcara\s+kira\s+aidil\b/i,
  /\bpola\s+garis\b/i,
  /\bpsk24\b/i,
  /\b1\s*\(\s*7\s*\)/i,
  /\bilmu\s+hisab\b/i,
];

const CURRICULUM_OVERVIEW_BRAIN_KEEP: RegExp[] = [
  /\bformula\s+xyz\b/i,
  /\basas\s+keilmuan\b/i,
  /\bfaktor\s+(?:xyz|masa|tenaga)\b/i,
  /\bhukum\s+alamtologi\b/i,
  /\bsains\s+alamtologi\b/i,
  /\bhisal\s*\(\s*bab\s*7\b/i,
  /\bbab\s*7\s*=\s*hisal\b/i,
  /\bteori\s+masabayu\b/i,
];

export function shouldFilterBrainLanesForCurriculumOverview(message: string): boolean {
  return isAlamtologiCurriculumOverviewQuery(message);
}

export function filterBrainLaneForCurriculumOverview(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const chunks = trimmed.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean);
  const kept = chunks.filter((chunk) => {
    const isNoise = CURRICULUM_OVERVIEW_BRAIN_NOISE.some((re) => re.test(chunk));
    if (!isNoise) return true;
    return CURRICULUM_OVERVIEW_BRAIN_KEEP.some((re) => re.test(chunk));
  });
  return kept.join('\n\n').trim() || trimmed;
}
