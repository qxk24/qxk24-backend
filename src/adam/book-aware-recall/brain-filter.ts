/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Brain Lane Filter & Output Locks
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

import { resolveFormulaXyzChapterId } from './chapter-queries';

const AIDIL_BAB1_BRAIN_NOISE: RegExp[] = [
  /\bpengenalan\s+aidil\b/i,
  /\bproses\s+gabung\b/i,
  /\bproses\s+lerai\b/i,
  /\btajall[iī]\b/i,
  /\bsyahadah\s+ritmis\b/i,
  /\bilmu\s+hisab\b/i,
  /\bhisab\b[^.\n]{0,48}\bkehadiran\b/i,
  /\b1\s*\(\s*7\s*\)/i,
  /\bAIDIL\s+bukan\s+ilmu\s+kira/i,
];

const ASAS_KEILMUAN_BRAIN_KEEP: RegExp[] = [
  /\basas\s+keilmuan\b/i,
  /\bteori\s+masabayu\b/i,
  /\bformula\s+xyz\b/i,
  /\bepistemologi\b/i,
  /\bbahasa\s+melayu\b/i,
  /\bkeilmuan\s+alamtologi\b/i,
];

/** Strip HISAL-AIDIL Bab 1 noise from Kotak 2/3 when answering Formula XYZ Bab 1. */
export function filterBrainLaneForBab1Asas(text: string): string {
  return filterBrainLaneForFormulaXyzChapter(text, 'bab-1-asas');
}

/** Strip wrong-book noise from Kotak 2/3 for Formula XYZ chapter recall. */
export function filterBrainLaneForFormulaXyzChapter(text: string, chapterId: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const noisePatterns = [...SHARED_HISAL_CROSSBOOK_BRAIN_NOISE];
  const keepPatterns = [...FORMULA_XYZ_GENERIC_BRAIN_KEEP];

  if (chapterId === 'bab-2-faktor-xyz') {
    noisePatterns.push(...HISAL_ASAS_BAB2_BRAIN_NOISE);
    keepPatterns.push(...FAKTOR_XYZ_BRAIN_KEEP);
  } else if (chapterId === 'bab-3-hukum') {
    noisePatterns.push(...HISAL_BAB3_CROSSBOOK_BRAIN_NOISE);
    keepPatterns.push(...HUKUM_BRAIN_KEEP);
  } else if (chapterId === 'bab-4-sains') {
    noisePatterns.push(...HISAL_BAB4_CROSSBOOK_BRAIN_NOISE);
    keepPatterns.push(...SAINS_BRAIN_KEEP);
  } else if (chapterId === 'bab-5-masa') {
    noisePatterns.push(...HISAL_BAB5_CROSSBOOK_BRAIN_NOISE);
    keepPatterns.push(...MASA_BRAIN_KEEP);
  } else if (chapterId === 'bab-6-tenaga') {
    noisePatterns.push(...HISAL_BAB6_CROSSBOOK_BRAIN_NOISE);
    keepPatterns.push(...TENAGA_BRAIN_KEEP);
  } else if (chapterId === 'bab-1-asas') {
    keepPatterns.push(...ASAS_KEILMUAN_BRAIN_KEEP);
  }

  const chunks = trimmed.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean);
  const kept = chunks.filter((chunk) => {
    const isNoise = noisePatterns.some((re) => re.test(chunk));
    if (!isNoise) return true;
    return keepPatterns.some((re) => re.test(chunk));
  });

  if (!kept.length) return '';
  return kept.join('\n\n');
}

const FORMULA_XYZ_BRAIN_FILTER_CHAPTERS = new Set([
  'bab-1-asas',
  'bab-2-faktor-xyz',
  'bab-3-hukum',
  'bab-4-sains',
  'bab-5-masa',
  'bab-6-tenaga',
]);

const SHARED_HISAL_CROSSBOOK_BRAIN_NOISE: RegExp[] = [
  ...AIDIL_BAB1_BRAIN_NOISE,
  /\bcara\s+kira\s+aidil\b/i,
  /\boperasi\s+sunom\b/i,
  /\bpengenalan\s+pola\b/i,
  /\bnombor\s+(?:20|24)\b/i,
  /\bganda\s+pa\b/i,
  /\bproses\s+cara\s+kira\b/i,
  /\bpola\s+operasi\s+tambah\b/i,
];

const FORMULA_XYZ_GENERIC_BRAIN_KEEP: RegExp[] = [
  /\bformula\s+xyz\b/i,
  /\bteori\s+masabayu\b/i,
];

const HISAL_BAB3_CROSSBOOK_BRAIN_NOISE: RegExp[] = [
  /\bcara\s+kira\b/i,
  /\baidil\s*(?:9|10|15|16)\b/i,
];

const HUKUM_BRAIN_KEEP: RegExp[] = [
  /\bhukum\s+alamtologi\b/i,
  /\bhukum\s+z\b/i,
  /\bhukum\s+x\b/i,
  /\bhukum\s+peleraian\b/i,
  /\bempat\s+hukum\b/i,
  /\bpola\s+kadar\b/i,
];

const HISAL_BAB4_CROSSBOOK_BRAIN_NOISE: RegExp[] = [
  /\bnombor\s+20\b/i,
  /\bpola\s+garis\b/i,
  /\bnombor\s+24\b/i,
];

const SAINS_BRAIN_KEEP: RegExp[] = [
  /\bsains\s+alamtologi\b/i,
  /\bizwa\b/i,
  /\bsira\b/i,
  /\brina\b/i,
  /\bhisal\s*,\s*izwa\b/i,
  /\bkerangka\s+hisal\b/i,
];

const HISAL_BAB5_CROSSBOOK_BRAIN_NOISE: RegExp[] = [
  /\bnombor\s+24\b/i,
  /\baplikasi\s+km\b/i,
  /\b1\s*\(\s*7\s*\)/i,
];

const MASA_BRAIN_KEEP: RegExp[] = [
  /\bfaktor\s+masa\b/i,
  /\bnapadu\b/i,
  /\bruang\s+masa\b/i,
  /\bbekas\s+pada\s+masa\b/i,
  /\bz\s*\[\s*x\s*,\s*t/i,
];

const HISAL_BAB6_CROSSBOOK_BRAIN_NOISE: RegExp[] = [
  /\baplikasi\s+graf\b/i,
  /\boperasi\s+tambah\b/i,
  /\boperasi\s+tolak\b/i,
  /\bpola\s+operasi\s+tambah\b/i,
  /\bproses\s+cara\s+kira\b/i,
];

const TENAGA_BRAIN_KEEP: RegExp[] = [
  /\bfaktor\s+tenaga\b/i,
  /\bpasata\b/i,
  /\buid\s+tenaga\b/i,
  /\bx\s*=\s*m\s*\/\s*t\b/i,
  /\bx\s*\[\s*m\s*,\s*t/i,
  /\btenaga\s+tidak\s+bergerak\s+ke\s+masa\b/i,
];

const HISAL_ASAS_BAB2_BRAIN_NOISE: RegExp[] = [
  /\bproses\s+cara\s+kira\b/i,
  /\bpola\s+operasi\s+tambah\b/i,
  /\boperasi\s+tambah\b/i,
  /\bganda\s+pa\b/i,
  /\bhisal[\s-]*asas\b/i,
  /\bbahagian\s+asas\b/i,
];

const FAKTOR_XYZ_BRAIN_KEEP: RegExp[] = [
  /\bfaktor\s*xyz\b/i,
  /\bfaktor\s*\(\s*x/i,
  /\bketetapan\s+y\b/i,
  /\bformula\s+xyz\b/i,
  /\bteori\s+masabayu\b/i,
  /\bpelaku\s+x\b/i,
];

/** Filter Kotak 2/3 — wrong-book bab noise for Formula XYZ chapters. */
export function shouldFilterBrainLanesForFormulaXyzChapter(message: string): string | null {
  const chapterId = resolveFormulaXyzChapterId(message);
  if (!chapterId || !FORMULA_XYZ_BRAIN_FILTER_CHAPTERS.has(chapterId)) return null;
  return chapterId;
}

/** @deprecated Use shouldFilterBrainLanesForFormulaXyzChapter */
export function shouldFilterBrainLanesForBab1Asas(message: string): boolean {
  return shouldFilterBrainLanesForFormulaXyzChapter(message) === 'bab-1-asas';
}

/** @deprecated Use shouldFilterBrainLanesForFormulaXyzChapter */
export function shouldSuppressEpisodicLaneForBab1Asas(message: string): boolean {
  return Boolean(shouldFilterBrainLanesForFormulaXyzChapter(message));
}

/** Last-turn output lock injected before P.alt's question. */
export function buildBab1AsasOutputLock(): string {
  return buildFormulaXyzOutputLock('bab-1-asas');
}

const FORMULA_XYZ_OUTPUT_LOCKS: Partial<Record<string, string>> = {
  'bab-1-asas': [
    '[OUTPUT LOCK — Formula XYZ Bab 1 / Asas Keilmuan]',
    'JANGAN buka dengan "Bab 1 ialah Pengenalan AIDIL" atau jawab Bab 1 dengan HISAL AIDIL (PG, PL, hisab-kehadiran, 1(7)).',
    'Bab 1 = Asas Keilmuan Alamtologi. Jawab dari CONSTITUTIONAL BACKBONE meterai.',
  ].join('\n'),
  'bab-2-faktor-xyz': [
    '[OUTPUT LOCK — Formula XYZ Bab 2 / Faktor XYZ]',
    'JANGAN jawab Bab 2 dengan Cara Kira / Operasi Tambah / HISAL ASAS.',
    'Bab 2 = Faktor (X, Y, Z). Jawab dari CONSTITUTIONAL BACKBONE meterai.',
  ].join('\n'),
  'bab-3-hukum': [
    '[OUTPUT LOCK — Formula XYZ Bab 3 / Hukum Alamtologi]',
    'JANGAN jawab Bab 3 dengan Cara Kira AIDIL (HISAL AIDIL) atau Operasi SuNom.',
    'Bab 3 = Hukum Alamtologi — Hukum Z, Hukum X, Hukum Peleraian. Jawab dari CONSTITUTIONAL BACKBONE meterai.',
  ].join('\n'),
  'bab-4-sains': [
    '[OUTPUT LOCK — Formula XYZ Bab 4 / Sains Alamtologi]',
    'JANGAN jawab Bab 4 dengan Nombor 20 AIDIL, Pola Garis SuNom, atau modul kira HISAL.',
    'Bab 4 = Sains Alamtologi — HISAL, IZWA, SIRA, RINA (kerangka Formula XYZ, bukan buku HISAL).',
    'Jawab dari CONSTITUTIONAL BACKBONE meterai.',
  ].join('\n'),
  'bab-5-masa': [
    '[OUTPUT LOCK — Formula XYZ Bab 5 / Faktor Masa]',
    'JANGAN jawab Bab 5 dengan Nombor 24 AIDIL atau Aplikasi KM HISAL ASAS.',
    'Bab 5 = Faktor Masa (napadu, ruang masa, bekas pada masa). Jawab dari CONSTITUTIONAL BACKBONE meterai.',
  ].join('\n'),
  'bab-6-tenaga': [
    '[OUTPUT LOCK — Formula XYZ Bab 6 / Faktor Tenaga]',
    'JANGAN jawab Bab 6 dengan Aplikasi Graf / Operasi Tambah HISAL ASAS atau Operasi Tolak AIDIL.',
    'Bab 6 = Faktor Tenaga (pasata, UID tenaga, X[m,t²]). Jawab dari CONSTITUTIONAL BACKBONE meterai.',
  ].join('\n'),
};

export function buildFormulaXyzOutputLock(chapterId: string): string {
  return FORMULA_XYZ_OUTPUT_LOCKS[chapterId] ?? FORMULA_XYZ_OUTPUT_LOCKS['bab-1-asas']!;
}
