/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : BM Malaysia Lexicon Types
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export type BmLexiconCategory = 'id_drift' | 'spelling' | 'register';

export interface BmLexiconEntry {
  id:       string;
  wrong:    string;
  correct:  string;
  category: BmLexiconCategory;
  note?:    string;
}

export interface BmLexiconFile {
  version:          string;
  source:           string;
  maxInjectPerTurn: number;
  entries:          BmLexiconEntry[];
}
