/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Types
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export interface GuruKelasContext {
  kelasId:    string;
  guruId:     string;
  guruName:   string;
  title:      string;
  subject:    string;
  sessionId:  string;
  adamAwake?: boolean;
}

export interface GuruTurnOptions {
  kelas:       GuruKelasContext;
  isTeachTurn: boolean;
  memberRole:  'guru' | 'student';
}
