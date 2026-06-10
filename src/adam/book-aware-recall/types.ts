/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Types & Book Cues
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

import { FORMULA_XYZ_BOOK_ID } from '../../llm-pipeline/formula-xyz-syllabus';

import { TEORI_ALAMIN_BOOK_ID } from './bab8-teori-alamin/syllabus';

export type AlamtologiBookId =
  | typeof FORMULA_XYZ_BOOK_ID
  | typeof TEORI_ALAMIN_BOOK_ID
  | 'aidil-engine'
  | 'hisal-main'
  | 'hisal-aidil'
  | 'hisal-asas'
  | 'hisal-sunom'
  | 'hisal-ganda';

/** Silibus P.alt — JANGAN UBAH TAJUK. */
export const SAINS_ALAMTOLOGI_SYLLABUS = `
SAINS ALAMTOLOGI

Bab 1 — Asas Keilmuan
Bab 2 — Faktor XYZ
Bab 3 — Hukum Alamtologi
Bab 4 — Sains Alamtologi
Bab 5 — Faktor Masa
Bab 6 — Faktor Tenaga
Bab 7 — HISAL
  7.1 AIDIL
  7.2 ASAS
  7.3 SuNom
  7.4 GANDA
Bab 8 — Teori ALAMIN (Komunikasi Alamtologi ALAMIN)
`.trim();

/** Silibus dalaman buku Teori ALAMIN — JANGAN UBAH TAJUK P.ALT. */
export { TEORI_ALAMIN_SYLLABUS } from './bab8-teori-alamin/syllabus';

/** Locked book order — ikut SAINS_ALAMTOLOGI_SYLLABUS sahaja. */
export const ALAMTOLOGI_BOOK_CANON = `
[BOOK ORDER — LOCKED — JANGAN UBAH TAJUK P.ALT]

${SAINS_ALAMTOLOGI_SYLLABUS}

DILARANG: campur nombor bab 7.1–7.4 (HISAL dalaman) dengan Bab 1–6.
DILARANG: runtuhkan Bab 1–7 menjadi aliran Pengenalan AIDIL linear.
"Apa itu AIDIL?" = 7.1 AIDIL · Pengenalan AIDIL dalam Bab 7 HISAL — bukan Bab 1 Asas Keilmuan.
`.trim();

export interface BookChapterMatch {
  bookId:          AlamtologiBookId;
  bookTitleBm:     string;
  chapterId:       string;
  chapterTitleBm:  string;
  searchTerms:     string[];
}

const BAB7_HISAL_LABEL = 'Bab 7 — HISAL';

export const BOOK_TITLES: Record<AlamtologiBookId, string> = {
  [FORMULA_XYZ_BOOK_ID]: 'Sains Alamtologi',
  [TEORI_ALAMIN_BOOK_ID]: 'Bab 8 — Teori ALAMIN · Komunikasi Alamtologi ALAMIN',
  'aidil-engine':        'AIDIL formula — brain ADAM (A+B=C)',
  'hisal-main':          BAB7_HISAL_LABEL,
  'hisal-aidil':         `${BAB7_HISAL_LABEL} · 7.1 AIDIL`,
  'hisal-asas':          `${BAB7_HISAL_LABEL} · 7.2 ASAS`,
  'hisal-sunom':         `${BAB7_HISAL_LABEL} · 7.3 SuNom`,
  'hisal-ganda':         `${BAB7_HISAL_LABEL} · 7.4 GANDA`,
};

const HISAL_BRANCH_BOOK_IDS = new Set<AlamtologiBookId>([
  'hisal-aidil',
  'hisal-asas',
  'hisal-sunom',
  'hisal-ganda',
]);

export function isHisalBranchBook(bookId: AlamtologiBookId): boolean {
  return HISAL_BRANCH_BOOK_IDS.has(bookId);
}

export const AIDIL_ENGINE_MATCH: BookChapterMatch = {
  bookId:         'aidil-engine',
  bookTitleBm:    BOOK_TITLES['aidil-engine'],
  chapterId:      'aidil-nucleus',
  chapterTitleBm: 'AIDIL formula (A+B=C) — brain ADAM',
  searchTerms:    ['aidil formula', 'proses gabung', 'a + b = c', 'transform ingatan aidil'],
};

const AIDIL_BRAIN_FORMULA_CUES =
  /\b(?:a\s*\+\s*b\s*=\s*c|proses\s+gabung|transform\s+ingatan|enjin\s+ingatan|formula\s+aidil\s+brain|aidil\s+brain|brain\s+aidil|aidil\s+formula)\b/i;

/** HISAL science pillar in Formula XYZ Bab 4 — not the HISAL main chapter book. */
export function isHisalSciencePillarContext(message: string): boolean {
  const t = message.trim();
  return /\b(?:sains\s+alamtologi|izwa|sira|rina|formula\s+xyz)\b/i.test(t)
    || /\bhisal\s*,\s*izwa\b/i.test(t);
}

/** HISAL · Cabang AIDIL book cues (includes bare "Apa itu AIDIL?"). */
export function isHisalAidilBookText(message: string): boolean {
  const t = message.trim();
  if (AIDIL_BRAIN_FORMULA_CUES.test(t)) return false;
  return /\b(?:hisal[\s-]*aidil|bahagian\s+aidil|cara\s+kira\s+aidil|nombor\s+(?:20|24)|operasi\s+tolak|luman|isi\s+kandungan\s+aidil|pengenalan\s+pola|pengenalan\s+aidil|apa\s+itu\s+aidil|terangkan\s+aidil|jelaskan\s+aidil)\b/i.test(t)
    || /^(?:apa\s+itu\s+)?aidil\s*\??$/i.test(t);
}

/** Explicit AIDIL brain formula (A+B=C) — not HISAL Pengenalan AIDIL. */
export function mentionsAidilEngine(message: string): boolean {
  const t = message.trim();
  if (!/\baidil\b/i.test(t)) return false;
  return AIDIL_BRAIN_FORMULA_CUES.test(t);
}

/** Skip AIDIL Stage Dashboard on teaching turns (not progress audit). */
/** Teori ALAMIN / Komunikasi Alamtologi ALAMIN — bukan Formula XYZ Bab 1–7. */
export function isTeoriAlaminBookContext(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return /\b(?:teori\s+alamin|komunikasi\s+alamtologi\s+alamin|ilmu\s+komunikasi\s+alamtologi|sains\s+komunikasi\s+alamtologi|disiplin\s+(?:baru\s+)?(?:berdasarkan\s+alamtologi|alamin))\b/i.test(t)
    || /^(?:apa\s+itu\s+)?alamin\s*\??$/i.test(t)
    || /\b(?:faktor\s+pola\s+alamin|faktor\s+kadar\s+alamin|formula\s+alamin|falsafah\s+alamin)\b/i.test(t)
    || /\bpe(?:sa|du|ga|pa|ma|na|tu)\b/i.test(t)
    || /\bprolog\s+alamin\b/i.test(t)
    || (/\balamin\b/i.test(t) && /\b(?:bab\s*(?:[1-4]|8|lapan)|prolog|pengenalan\s+alamin|dasar\s+pemikiran)\b/i.test(t))
    || /\bbab\s*(?:8|lapan)\b/i.test(t);
}

export function shouldSkipAidilStageDashboard(message: string): boolean {
  const t = message.trim();
  if (!/\baidil\b/i.test(t)) return false;
  if (/\b(stage|dashboard|1\(7\)|vault|checkpoint|progress|audit|constitutional\s+progress)\b/i.test(t)) {
    return false;
  }
  return true;
}
