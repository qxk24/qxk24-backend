/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Section Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export const JOURNAL_SECTION_ORDER = [
  'title_and_abstract',
  'movement_1_human_opening',
  'movement_2_achievement',
  'movement_3_honest_wall',
  'movement_4_quran',
  'movement_5_alamtologi',
  'movement_6_application',
  'movement_7_invitation',
  'references',
] as const;

export type JournalSectionId = (typeof JOURNAL_SECTION_ORDER)[number];

export interface JournalSectionDraft {
  journalId:    string;
  sections:     Partial<Record<JournalSectionId, string>>;
  lastSection?: JournalSectionId;
}

export const JOURNAL_SECTION_HEADINGS: Record<JournalSectionId, string> = {
  title_and_abstract:       'Title & Abstract',
  movement_1_human_opening: 'Introduction — Human Opening',
  movement_2_achievement:   'Convention Knowledge — Achievement',
  movement_3_honest_wall:   'Convention Knowledge — The Honest Wall',
  movement_4_quran:         'Al-Quran — Topic Ayat',
  movement_5_alamtologi:    'Alamtologi Framework — Discipline & Syllabus',
  movement_6_application:   'Application',
  movement_7_invitation:    'Conclusion — Invitation',
  references:               'References',
};

const MIN_SECTION_CHARS = 80;

/** All nine sections written with substantive content. */
export function allJournalSectionsComplete(
  sections: Partial<Record<JournalSectionId, string>>,
  minCharsPerSection: number = MIN_SECTION_CHARS,
): boolean {
  return JOURNAL_SECTION_ORDER.every(
    (id) => (sections[id]?.trim().length ?? 0) >= minCharsPerSection,
  );
}
