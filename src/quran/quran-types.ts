/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Quran Corpus Types
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export interface QuranVerseRecord {
  surah:   number;
  ayah:    number;
  key:     string;
  uthmani: string;
  english: string;
}

export interface QuranCorpusMeta {
  arabicSource:      string;
  englishTranslator: string;
  tafsirPolicy:      string;
  fetchedAt?:        string;
}

export interface QuranCorpusFile {
  meta:   QuranCorpusMeta;
  verses: Record<string, QuranVerseRecord>;
}

export interface QuranAyahRef {
  surah: number;
  ayah:  number;
}
