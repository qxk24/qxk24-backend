/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Book-Chapter Router
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

import { FORMULA_XYZ_BOOK_ID, getFormulaXyzChapter } from '../../llm-pipeline/formula-xyz-syllabus';
import { TEORI_ALAMIN_BOOK_ID } from './bab8-teori-alamin/syllabus';
import {
  type AlamtologiBookId,
  type BookChapterMatch,
  BOOK_TITLES,
  AIDIL_ENGINE_MATCH,
  mentionsAidilEngine,
  isHisalSciencePillarContext,
  isTeoriAlaminBookContext,
} from './types';
import {
  type ChapterProbe,
  BOOK_PROBE_TABLE,
  FORMULA_XYZ_PROBES,
  TEORI_ALAMIN_PROBES,
  HISAL_MAIN_PROBE,
} from './probes';

function parseBabNumber(text: string): number | null {
  const wordMap: Record<string, number> = {
    satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, lapan: 8, delapan: 8,
  };
  const m = text.match(/\bbab\s*(?:ke\s*)?(\d+|satu|dua|tiga|empat|lima|enam|tujuh)\b/i);
  if (!m) return null;
  const raw = m[1].toLowerCase();
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  return wordMap[raw] ?? null;
}

function probeMatchesChapter(probes: ChapterProbe[], text: string): ChapterProbe | null {
  for (const probe of probes) {
    if (probe.patterns.some((p) => p.test(text))) return probe;
  }
  return null;
}

function buildMatch(bookId: AlamtologiBookId, probe: ChapterProbe): BookChapterMatch {
  const formulaChapter = bookId === FORMULA_XYZ_BOOK_ID
    ? getFormulaXyzChapter(probe.chapterId)
    : undefined;

  return {
    bookId,
    bookTitleBm:    BOOK_TITLES[bookId],
    chapterId:      probe.chapterId,
    chapterTitleBm: formulaChapter?.titleBm ?? probe.chapterTitleBm,
    searchTerms:    probe.searchTerms,
  };
}

function detectBookOrder(text: string): AlamtologiBookId[] {
  const hits: Array<{ bookId: AlamtologiBookId; weight: number }> = [];
  for (const entry of BOOK_PROBE_TABLE) {
    let weight = 0;
    for (const re of entry.detect) {
      if (re.test(text)) weight += 1;
    }
    if (weight > 0) hits.push({ bookId: entry.bookId, weight });
  }
  hits.sort((a, b) => b.weight - a.weight);
  return hits.map((h) => h.bookId);
}

function hasExplicitHisalBranchCue(text: string): boolean {
  return /\b(?:hisal[\s-]*(?:aidil|asas|sunom|ganda)|bahagian\s+(?:aidil|asas|ganda))\b/i.test(text)
    || /\b(?:aidil|asas|sunom|su\s*nom|ganda)\b[^.\n]{0,40}\bbab\s*(?:\d+|satu|dua|tiga|empat|lima|enam|tujuh)\b/i.test(text)
    || /\bbab\s*(?:\d+|satu|dua|tiga|empat|lima|enam|tujuh)\b[^.\n]{0,40}\b(?:aidil|asas|sunom|ganda)\b/i.test(text);
}

function resolveHisalMainIfEligible(text: string, probe: ChapterProbe): BookChapterMatch | null {
  if (isHisalSciencePillarContext(text)) return null;
  if (hasExplicitHisalBranchCue(text)) return null;
  return buildMatch('hisal-main', probe);
}

/** Bare Bab 7 / HISAL topic without cabang cue → HISAL bab utama. */
function resolveBareHisalMainChapter(text: string): BookChapterMatch | null {
  if (isHisalSciencePillarContext(text)) return null;
  if (hasExplicitHisalBranchCue(text)) return null;
  if (/\bformula\s+xyz\b/i.test(text)) return null;
  if (/\bbab\s*(?:ke\s*)?(?:7|tujuh)\b/i.test(text)) {
    return resolveHisalMainIfEligible(text, HISAL_MAIN_PROBE);
  }
  if (/\b(?:apa\s+itu|terangkan|jelaskan)\s+hisal\b/i.test(text)) {
    return resolveHisalMainIfEligible(text, HISAL_MAIN_PROBE);
  }
  return null;
}

/** Resolve book + chapter from user message (book-first disambiguation). */
export function resolveBookChapter(message: string): BookChapterMatch | null {
  const text = message.trim();
  if (!text) return null;

  if (mentionsAidilEngine(text)) {
    return { ...AIDIL_ENGINE_MATCH };
  }

  const books = detectBookOrder(text);
  const bab = parseBabNumber(text);

  for (const bookId of books) {
    const entry = BOOK_PROBE_TABLE.find((e) => e.bookId === bookId);
    if (!entry) continue;

    if (bookId === 'hisal-main' && isHisalSciencePillarContext(text)) continue;

    // Explicit bab number wins over loose book-level pattern (e.g. HISAL ASAS Bab 2 ≠ Bab 1).
    if (bab !== null) {
      const chapterId = entry.babOnly(bab);
      if (chapterId) {
        const probe = entry.probes.find((p) => p.chapterId === chapterId);
        if (!probe) continue;
        if (bookId === 'hisal-main') {
          const main = resolveHisalMainIfEligible(text, probe);
          if (main) return main;
          continue;
        }
        return buildMatch(bookId, probe);
      }
    }

    const byPattern = probeMatchesChapter(entry.probes, text);
    if (!byPattern) continue;
    if (bookId === 'hisal-main') {
      const main = resolveHisalMainIfEligible(text, byPattern);
      if (main) return main;
      continue;
    }
    return buildMatch(bookId, byPattern);
  }

  // Topic-only (no book cue): high-specificity patterns only
  const specificityOrder: AlamtologiBookId[] = [
    TEORI_ALAMIN_BOOK_ID,
    FORMULA_XYZ_BOOK_ID,
    'hisal-sunom',
    'hisal-ganda',
    'hisal-aidil',
    'hisal-asas',
    'hisal-main',
  ];
  for (const bookId of specificityOrder) {
    const entry = BOOK_PROBE_TABLE.find((e) => e.bookId === bookId);
    if (!entry) continue;
    const byPattern = probeMatchesChapter(entry.probes, text);
    if (!byPattern) continue;
    if (bookId === 'hisal-main') {
      const main = resolveHisalMainIfEligible(text, byPattern);
      if (main) return main;
      continue;
    }
    return buildMatch(bookId, byPattern);
  }

  const bareHisal = resolveBareHisalMainChapter(text);
  if (bareHisal) return bareHisal;

  const bareTeoriAlamin = resolveBareTeoriAlaminBab(text);
  if (bareTeoriAlamin) return bareTeoriAlamin;

  const bareFormulaXyz = resolveBareFormulaXyzBab(text);
  if (bareFormulaXyz) return bareFormulaXyz;

  return null;
}

const BARE_FORMULA_XYZ_BOOK_EXCLUSIONS =
  /\b(sunom|hisal[\s-]*asas|hisal[\s-]*aidil|bahagian\s+(?:aidil|asas)|\baidil\b|alamin|teori\s+alamin|pe(?:sa|du|ga|pa|ma|na|tu))/i;

const BARE_BAB_WORD_TO_NUM: Record<string, number> = {
  '1': 1, satu: 1, pertama: 1,
  '2': 2, dua: 2, kedua: 2,
  '3': 3, tiga: 3, ketiga: 3,
  '4': 4, empat: 4, keempat: 4,
  '5': 5, lima: 5, kelima: 5,
  '6': 6, enam: 6, keenam: 6,
};

function parseBareFormulaXyzBabNumber(text: string): number | null {
  const m = text.match(
    /\bbab\s*(?:ke\s*)?(\d+|satu|dua|tiga|empat|lima|enam|pertama|kedua|ketiga|keempat|kelima|keenam)\b/i,
  );
  if (!m) return null;
  return BARE_BAB_WORD_TO_NUM[m[1].toLowerCase()] ?? null;
}

/** Bare Bab 8 / ALAMIN Bab 1–4 → Teori ALAMIN. */
function resolveBareTeoriAlaminBab(text: string): BookChapterMatch | null {
  if (!isTeoriAlaminBookContext(text) && !/\bbab\s*(?:8|lapan)\b/i.test(text)) return null;

  const bab = parseBabNumber(text);
  const entry = BOOK_PROBE_TABLE.find((e) => e.bookId === TEORI_ALAMIN_BOOK_ID);
  if (!entry) return null;

  const chapterId = bab !== null
    ? entry.babOnly(bab)
  : (probeMatchesChapter(entry.probes, text)?.chapterId ?? 'alamin-overview');
  if (!chapterId) return null;

  const probe = TEORI_ALAMIN_PROBES.find((p) => p.chapterId === chapterId)
    ?? TEORI_ALAMIN_PROBES[0];
  return buildMatch(TEORI_ALAMIN_BOOK_ID, probe);
}

/** Bare "Bab N" (1–6) without book cue → Formula XYZ (NOT HISAL/SuNom/AIDIL/ALAMIN). */
function resolveBareFormulaXyzBab(text: string): BookChapterMatch | null {
  if (isTeoriAlaminBookContext(text)) return null;
  const bab = parseBareFormulaXyzBabNumber(text);
  if (bab === null || bab < 1 || bab > 6) return null;
  if (BARE_FORMULA_XYZ_BOOK_EXCLUSIONS.test(text)) return null;
  if (detectBookOrder(text).length > 0) return null;

  const entry = BOOK_PROBE_TABLE.find((e) => e.bookId === FORMULA_XYZ_BOOK_ID);
  const chapterId = entry?.babOnly(bab);
  if (!chapterId) return null;
  const probe = FORMULA_XYZ_PROBES.find((p) => p.chapterId === chapterId);
  return probe ? buildMatch(FORMULA_XYZ_BOOK_ID, probe) : null;
}
