/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Person Relational Memory — Types
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

/** Minimal handle for a known person in ADAM's relational registry. */
export interface PersonRef {
  personId:    string;
  displayName: string;
}

export interface PersonMessageStats {
  studentMessages: number;
  totalMessages:   number;
  sessionCount:    number;
}

/** Formal relational profile — synthesized from studentTracks + messages. */
export interface PersonRelationalProfile {
  personId:              string;
  displayName:           string;
  accountLane?:          'umum' | 'pelajar' | 'tools' | 'niaga';
  brainTrackUnderstanding: string;
  relationalSummary:     string;
  relationshipArc:       string;
  lastSessionSummary:    string;
  openQuestions:         string[];
  masteredTopics:        string[];
  identityAnchors:       string[];
  constitutionalLevel:   number;
  recentEpisodes:        string[];
  messageStats:          PersonMessageStats;
  lastContactAt?:        Date;
}

export interface PersonContextOptions {
  personSubject?: PersonRef | null;
  knownPersons?:  PersonRef[];
}
