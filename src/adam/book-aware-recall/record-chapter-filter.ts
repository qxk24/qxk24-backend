/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Record Chapter Filter
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Leaf filter — no qxk24brain imports (breaks barrel circular dep).
 */

import { recordLooksLikeFounderCanonicalBiography } from '../adam-knowledge-prompts';

export function filterTeachingRecordsForChapter<T extends {
  teachingIntent: string;
  episodeSummary: string;
  family: string;
  principle: string;
}>(records: T[], chapterId: string | null | undefined): T[] {
  if (!chapterId) return records;

  if (chapterId.startsWith('alamin')) {
    return records.filter((row) => !recordLooksLikeFounderCanonicalBiography(row));
  }

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
