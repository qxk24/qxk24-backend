/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Teaching Recall Context
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

import { founderAsksTeachingRecall } from '../../qxk24brain/adam-teaching-record.service';
import { FORMULA_XYZ_BOOK_ID } from '../../llm-pipeline/formula-xyz-syllabus';
import {
  ALAMTOLOGI_BOOK_CANON,
  isHisalBranchBook,
  mentionsAidilEngine,
  type BookChapterMatch,
} from './types';
import { resolveBookChapter } from './resolve';
import { isAlamtologiCurriculumOverviewQuery } from './curriculum-overview';
import {
  formulaXyzChapterHasConstitutionalBackbone,
  teoriAlaminChapterHasConstitutionalBackbone,
} from './constitutional-backbone';

export function filterTeachingRecordsForChapter<T extends {
  teachingIntent: string;
  episodeSummary: string;
  family: string;
  principle: string;
}>(records: T[], chapterId: string | null | undefined): T[] {
  if (!chapterId) return records;

  if (chapterId === 'bab-1-asas') {
    return records.filter((row) => {
      const blob = `${row.teachingIntent} ${row.episodeSummary} ${row.family} ${row.principle}`;
      if (!/\baidil\b/i.test(blob)) return true;
      return /\basas\s+keilmuan|teori\s+masabayu|formula\s+xyz|keilmuan\s+alamtologi\b/i.test(blob);
    });
  }

  if (chapterId === 'bab-2-faktor-xyz') {
    return records.filter((row) => {
      const blob = `${row.teachingIntent} ${row.episodeSummary} ${row.family} ${row.principle}`;
      const isHisalAsasNoise =
        /\b(?:proses\s+cara\s+kira|pola\s+operasi\s+tambah|operasi\s+tambah|ganda\s+pa|hisal[\s-]*asas|bahagian\s+asas)\b/i.test(blob);
      if (!isHisalAsasNoise) return true;
      return /\bfaktor\s*xyz\b|\bketetapan\s+y\b|\bfaktor\s+x\b/i.test(blob);
    });
  }

  if (chapterId === 'bab-3-hukum') {
    return records.filter((row) => {
      const blob = `${row.teachingIntent} ${row.episodeSummary} ${row.family} ${row.principle}`;
      const isWrongBook =
        /\b(?:cara\s+kira\s+aidil|operasi\s+sunom|nombor\s+20|ganda\s+pa|proses\s+cara\s+kira)\b/i.test(blob);
      if (!isWrongBook) return true;
      return /\bhukum\s+(?:z|x|alamtologi|peleraian)\b|\bempat\s+hukum\b/i.test(blob);
    });
  }

  if (chapterId === 'bab-4-sains') {
    return records.filter((row) => {
      const blob = `${row.teachingIntent} ${row.episodeSummary} ${row.family} ${row.principle}`;
      const isWrongBook =
        /\b(?:nombor\s+20|pola\s+garis|cara\s+kira\s+aidil|operasi\s+sunom|operasi\s+tambah)\b/i.test(blob);
      if (!isWrongBook) return true;
      return /\b(?:sains\s+alamtologi|izwa|sira|rina)\b/i.test(blob);
    });
  }

  if (chapterId === 'bab-5-masa') {
    return records.filter((row) => {
      const blob = `${row.teachingIntent} ${row.episodeSummary} ${row.family} ${row.principle}`;
      const isWrongBook =
        /\b(?:nombor\s+24|aplikasi\s+km|cara\s+kira\s+aidil)\b/i.test(blob);
      if (!isWrongBook) return true;
      return /\b(?:faktor\s+masa|napadu|ruang\s+masa|bekas\s+pada\s+masa)\b/i.test(blob);
    });
  }

  if (chapterId === 'bab-6-tenaga') {
    return records.filter((row) => {
      const blob = `${row.teachingIntent} ${row.episodeSummary} ${row.family} ${row.principle}`;
      const isWrongBook =
        /\b(?:aplikasi\s+graf|operasi\s+tambah|operasi\s+tolak|cara\s+kira\s+aidil|operasi\s+sunom|ganda\s+pa|proses\s+cara\s+kira)\b/i.test(blob);
      if (!isWrongBook) return true;
      return /\b(?:faktor\s+tenaga|pasata|uid\s+tenaga|x\s*=\s*m\s*\/\s*t)\b/i.test(blob);
    });
  }

  return records;
}

export function chapterTeachingSearchTerms(match: BookChapterMatch | null): string[] | undefined {
  if (!match) return undefined;
  return match.searchTerms;
}

export function needsBookAwareTeachingRecall(message: string): boolean {
  if (founderAsksTeachingRecall(message)) return true;
  if (isAlamtologiCurriculumOverviewQuery(message)) return true;
  if (mentionsAidilEngine(message)) return true;
  return resolveBookChapter(message) !== null;
}

export function chapterNeedsFullBrainLoad(message: string): boolean {
  if (isAlamtologiCurriculumOverviewQuery(message)) return true;
  if (mentionsAidilEngine(message)) return true;
  return resolveBookChapter(message) !== null;
}

/** Enriched Mongo text search — book + chapter terms first. */
export function buildChapterSearchQuery(message: string, match: BookChapterMatch | null): string {
  if (!match) return message.trim();
  const terms = [...match.searchTerms, match.bookTitleBm, match.chapterTitleBm, message.trim()];
  return [...new Set(terms.filter(Boolean))].join(' ').slice(0, 512);
}

export function buildChapterRecallFrame(match: BookChapterMatch): string {
  const lines = [
    ALAMTOLOGI_BOOK_CANON,
    '',
    `[P.ALT TEACHING RECALL — ${match.bookTitleBm} · ${match.chapterTitleBm}]`,
    'Jawab dari episod pengajaran P.alt untuk buku dan bab ini sahaja.',
    'Jangan campur bab lain, buku lain, atau template sistem (AMA, SuNom label pada pelajar, dll.).',
  ];

  if (match.bookId === FORMULA_XYZ_BOOK_ID) {
    lines.push('Bab 1 = Asas Keilmuan — bukan 7.1 AIDIL Pengenalan AIDIL.');
  }
  if (match.bookId === 'aidil-engine') {
    lines.push('Ini AIDIL formula (A+B=C) — formula brain ADAM. Bukan 7.1 AIDIL Pengenalan AIDIL.');
  }
  if (match.bookId === 'hisal-main' || isHisalBranchBook(match.bookId)) {
    lines.push('Ikut silibus: Bab 7 — HISAL (7.1 AIDIL, 7.2 ASAS, 7.3 SuNom, 7.4 GANDA).');
  }

  lines.push('Jika episod tidak mencukupi, katakan dengan jujur — jangan cipta.');
  return lines.join('\n');
}

export function buildChapterRecallAck(
  match: BookChapterMatch | null,
  isFounder: boolean,
): string {
  if (!match) {
    return isFounder
      ? 'Bismillahirahmanirahim. P.alt, saya muat rekod pengajaran yang berkaitan. Saya jawab dari situ, bukan cipta sendiri.'
      : 'Saya muat pengajaran P.alt yang berkaitan. Saya jawab dari apa yang diajar, bukan teka-teki.';
  }

  const label = `${match.bookTitleBm} · ${match.chapterTitleBm}`;
  if (match.chapterId === 'bab-1-asas') {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, Bab 1 Formula XYZ ialah Asas Keilmuan — bukan AIDIL. Saya jawab dari CONSTITUTIONAL BACKBONE meterai, SEALED ANCHOR, dan episod ${label} jika ada — tanpa minta P.alt ajar semula.`
      : `Bab 1 Formula XYZ ialah Asas Keilmuan — bukan AIDIL. Saya jawab dari meterai P.alt dan episod ${label} jika ada.`;
  }

  if (match.chapterId === 'bab-2-faktor-xyz') {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, Bab 2 Formula XYZ ialah Faktor (X, Y, Z) — bukan Cara Kira HISAL ASAS. Saya jawab dari CONSTITUTIONAL BACKBONE meterai dan episod ${label} jika ada.`
      : `Bab 2 Formula XYZ ialah Faktor XYZ — bukan HISAL ASAS. Saya jawab dari meterai P.alt dan episod ${label} jika ada.`;
  }

  if (match.chapterId === 'bab-3-hukum') {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, Bab 3 Formula XYZ ialah Hukum Alamtologi — bukan Cara Kira AIDIL atau Operasi SuNom. Saya jawab dari CONSTITUTIONAL BACKBONE meterai dan episod ${label} jika ada.`
      : `Bab 3 Formula XYZ ialah Hukum Alamtologi — bukan HISAL/SuNom Bab 3. Saya jawab dari meterai P.alt dan episod ${label} jika ada.`;
  }

  if (match.chapterId === 'bab-4-sains') {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, Bab 4 Formula XYZ ialah Sains Alamtologi (HISAL, IZWA, SIRA, RINA) — bukan Nombor 20 AIDIL atau Pola Garis SuNom. Saya jawab dari CONSTITUTIONAL BACKBONE meterai dan episod ${label} jika ada.`
      : `Bab 4 Formula XYZ ialah Sains Alamtologi — bukan bab HISAL/SuNom dengan nombor sama. Saya jawab dari meterai P.alt dan episod ${label} jika ada.`;
  }

  if (match.chapterId === 'bab-5-masa') {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, Bab 5 Formula XYZ ialah Faktor Masa — bukan Nombor 24 AIDIL atau Aplikasi KM HISAL ASAS. Saya jawab dari CONSTITUTIONAL BACKBONE meterai dan episod ${label} jika ada.`
      : `Bab 5 Formula XYZ ialah Faktor Masa — bukan bab HISAL dengan nombor sama. Saya jawab dari meterai P.alt dan episod ${label} jika ada.`;
  }

  if (match.chapterId === 'bab-6-tenaga') {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, Bab 6 Formula XYZ ialah Faktor Tenaga — bukan Aplikasi Graf / Operasi Tambah HISAL ASAS atau Operasi Tolak AIDIL. Saya jawab dari CONSTITUTIONAL BACKBONE meterai dan episod ${label} jika ada.`
      : `Bab 6 Formula XYZ ialah Faktor Tenaga — bukan bab HISAL dengan nombor sama. Saya jawab dari meterai P.alt dan episod ${label} jika ada.`;
  }

  if (match.chapterId === 'hisal-chapter-7') {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, Bab 7 ialah HISAL — bab utama Alamtologi. Empat cabang: AIDIL, ASAS, SuNom, GANDA. Saya jawab dari pengajaran HISAL ${label} jika ada.`
      : `Bab 7 ialah HISAL — empat cabang disiplin dengan bab dalaman sendiri. Saya jawab dari pengajaran P.alt untuk ${label}.`;
  }

  if (match.chapterId === 'aidil-bab-1') {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, saya jawab dari Chapter AIDIL dalam HISAL (Bab 7) — ${match.chapterTitleBm}. Saya jawab dari pengajaran ${label} jika ada.`
      : `Saya jawab dari Chapter AIDIL dalam HISAL — ${match.chapterTitleBm}.`;
  }

  if (teoriAlaminChapterHasConstitutionalBackbone(match.chapterId)) {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, saya muat ${label} — ALAMIN ialah disiplin baru berdasarkan Alamtologi; ALAMIN adalah SAINS KOMUNIKASI ALAMTOLOGI. Saya jawab dari meterai Teori ALAMIN, bukan Formula XYZ Bab 2 Faktor XYZ.`
      : `Saya muat ${label} — ALAMIN ialah Sains Komunikasi Alamtologi; bukan Faktor XYZ.`;
  }

  if (formulaXyzChapterHasConstitutionalBackbone(match.chapterId)) {
    return isFounder
      ? `Bismillahirahmanirahim. P.alt, saya muat ${label} — Formula XYZ meterai. Saya jawab dari CONSTITUTIONAL BACKBONE, bukan bab HISAL/AIDIL/SuNom yang sama nombor.`
      : `Saya muat ${label} — Formula XYZ meterai, bukan bab HISAL lain dengan nombor sama.`;
  }

  return isFounder
    ? `Bismillahirahmanirahim. P.alt, saya muat pengajaran ${label}. Saya jawab dari situ — bukan bab lain, bukan cipta sendiri.`
    : `Saya muat pengajaran P.alt: ${label}. Saya jawab dari apa yang diajar untuk bab ini.`;
}

