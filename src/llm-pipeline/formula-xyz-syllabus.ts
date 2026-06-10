/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Formula XYZ Syllabus Backbone
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export type SyllabusChapterStatus =
  | 'pending'
  | 'in_progress'
  | 'crystallised'
  | 'training_ready';

export interface FormulaXyzChapter {
  chapterId:   string;
  bookId:      string;
  title:       string;
  titleBm:     string;
  sortOrder:   number;
  /** Chapters that must reach training_ready before this one */
  dependsOn:   string[];
}

export const FORMULA_XYZ_BOOK_ID = 'formula-xyz';

/** Official Formula XYZ teaching sequence — finish line = all training_ready */
export const FORMULA_XYZ_SYLLABUS: FormulaXyzChapter[] = [
  {
    chapterId: 'prolog',
    bookId:    FORMULA_XYZ_BOOK_ID,
    title:     'Prolog',
    titleBm:   'Prolog',
    sortOrder: 0,
    dependsOn: [],
  },
  {
    chapterId: 'bab-1-asas',
    bookId:    FORMULA_XYZ_BOOK_ID,
    title:     'Bab 1 — Asas Keilmuan',
    titleBm:   'Bab 1 — Asas Keilmuan',
    sortOrder: 1,
    dependsOn: ['prolog'],
  },
  {
    chapterId: 'bab-2-faktor-xyz',
    bookId:    FORMULA_XYZ_BOOK_ID,
    title:     'Bab 2 — Faktor XYZ',
    titleBm:   'Bab 2 — Faktor (X, Y, Z)',
    sortOrder: 2,
    dependsOn: ['bab-1-asas'],
  },
  {
    chapterId: 'bab-3-hukum',
    bookId:    FORMULA_XYZ_BOOK_ID,
    title:     'Bab 3 — Hukum Alamtologi',
    titleBm:   'Bab 3 — Hukum Alamtologi',
    sortOrder: 3,
    dependsOn: ['bab-2-faktor-xyz'],
  },
  {
    chapterId: 'bab-4-sains',
    bookId:    FORMULA_XYZ_BOOK_ID,
    title:     'Bab 4 — Sains Alamtologi',
    titleBm:   'Bab 4 — Sains Alamtologi',
    sortOrder: 4,
    dependsOn: ['bab-3-hukum'],
  },
  {
    chapterId: 'bab-5-masa',
    bookId:    FORMULA_XYZ_BOOK_ID,
    title:     'Bab 5 — Faktor Masa',
    titleBm:   'Bab 5 — Faktor Masa',
    sortOrder: 5,
    dependsOn: ['bab-4-sains'],
  },
  {
    chapterId: 'bab-6-tenaga',
    bookId:    FORMULA_XYZ_BOOK_ID,
    title:     'Bab 6 — Faktor Tenaga',
    titleBm:   'Bab 6 — Faktor Tenaga',
    sortOrder: 6,
    dependsOn: ['bab-5-masa'],
  },
  {
    chapterId: 'epilog',
    bookId:    FORMULA_XYZ_BOOK_ID,
    title:     'Epilog — Formula Yang Tersembunyi',
    titleBm:   'Epilog — Formula Yang Tersembunyi',
    sortOrder: 7,
    dependsOn: ['bab-6-tenaga'],
  },
];

const CHAPTER_BY_ID = new Map(FORMULA_XYZ_SYLLABUS.map((c) => [c.chapterId, c]));

export function getFormulaXyzChapter(chapterId: string): FormulaXyzChapter | undefined {
  return CHAPTER_BY_ID.get(chapterId);
}

/** Map confirmed unit metadata → syllabus chapter (best effort). */
export function resolveSyllabusChapter(input: {
  family:     string;
  subRegion?: string;
  nodeA?:     string;
  level?:     number;
}): string {
  const blob = `${input.family} ${input.subRegion ?? ''} ${input.nodeA ?? ''}`.toLowerCase();

  if (/hukum|ketetapan|bab\s*3|bab3|chapter\s*3/.test(blob)) return 'bab-3-hukum';
  if (/faktor\s*xyz|bab\s*2|bab2|chapter\s*2|struktur\s*z|ketetapan\s*y/.test(blob)) {
    return 'bab-2-faktor-xyz';
  }
  if (/sains|hisal|izwa|sira|rina|bab\s*4|bab4/.test(blob)) return 'bab-4-sains';
  if (/masa|napadu|bab\s*5|bab5|faktor\s*masa/.test(blob)) return 'bab-5-masa';
  if (/tenaga|bab\s*6|bab6|faktor\s*tenaga|pasata/.test(blob)) return 'bab-6-tenaga';
  if (/epilog|tersembunyi/.test(blob)) return 'epilog';
  if (/prolog|pengenalan\s*asas/.test(blob)) return 'prolog';
  if (/asas|bab\s*1|bab1|keilmuan|masabayu|formula\s*xyz|epistem/.test(blob)) {
    return 'bab-1-asas';
  }

  return 'bab-1-asas';
}
