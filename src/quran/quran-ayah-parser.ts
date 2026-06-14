/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Quran Ayah Reference Parser
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { QuranAyahRef } from './quran-types';
import { SURAH_NAME_TO_NUMBER } from './quran-surah-names';

const MAX_REFS_PER_MESSAGE = 8;

function isValidRef(surah: number, ayah: number): boolean {
  return surah >= 1 && surah <= 114 && ayah >= 1;
}

function pushRef(refs: QuranAyahRef[], seen: Set<string>, surah: number, ayah: number): void {
  if (!isValidRef(surah, ayah)) return;
  const key = `${surah}:${ayah}`;
  if (seen.has(key) || refs.length >= MAX_REFS_PER_MESSAGE) return;
  seen.add(key);
  refs.push({ surah, ayah });
}

/** Extract surah:ayah references from founder/student message text. */
export function parseQuranAyahRefs(text: string): QuranAyahRef[] {
  const refs: QuranAyahRef[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(/\b(\d{1,3})\s*:\s*(\d{1,3})\b/g)) {
    pushRef(refs, seen, Number(match[1]), Number(match[2]));
  }

  for (const match of text.matchAll(
    /\b(?:surah|surat|sura)\s+(\d{1,3})\s*[,:\-]?\s*(?:ayat|verse|ayah|verses)?\s*(\d{1,3})\b/gi,
  )) {
    pushRef(refs, seen, Number(match[1]), Number(match[2]));
  }

  for (const match of text.matchAll(
    /\b(?:surah|surat|sura)\s+(al[\s-][a-z'\u00C0-\u024F-]+|\d{1,3})\s*[,:\-]?\s*(?:ayat|verse|ayah)?\s*(\d{1,3})\b/gi,
  )) {
    const namePart = match[1].toLowerCase().replace(/\s+/g, '-');
    const surahNum = /^\d+$/.test(namePart)
      ? Number(namePart)
      : SURAH_NAME_TO_NUMBER[namePart];
    if (surahNum) pushRef(refs, seen, surahNum, Number(match[2]));
  }

  return refs;
}
