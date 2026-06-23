/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Malaysian Curriculum Catalog (ERA_3a)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

export type TutorSubjectGroup =
  | 'STEM'
  | 'LANGUAGE'
  | 'HUMANITIES'
  | 'RELIGION'
  | 'TECHNICAL'
  | 'ARTS';

export type TutorSubjectId =
  | 'bm'
  | 'english'
  | 'math'
  | 'science'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'add_math'
  | 'history'
  | 'geography'
  | 'civic'
  | 'islam'
  | 'moral'
  | 'economics'
  | 'business'
  | 'arabic'
  | 'chinese'
  | 'tamil'
  | 'rbt'
  | 'ask'
  | 'visual_arts'
  | 'music'
  | 'pe';

export interface TutorSubjectCatalogItem {
  id:           TutorSubjectId;
  labelMs:      string;
  labelEn:      string;
  group:        TutorSubjectGroup;
  bands:        TutorSubscriptionLevel[];
  /** ERA_3: tracked via placement/content/event log today */
  tracked:      boolean;
  core?:        boolean;
}

export const TUTOR_SUBJECT_CATALOG: readonly TutorSubjectCatalogItem[] = [
  { id: 'bm',          labelMs: 'Bahasa Melayu',              labelEn: 'Bahasa Melayu',       group: 'LANGUAGE',   bands: ['primary', 'secondary', 'university'], tracked: true,  core: true },
  { id: 'english',     labelMs: 'Bahasa Inggeris',            labelEn: 'English',             group: 'LANGUAGE',   bands: ['primary', 'secondary', 'university'], tracked: true,  core: true },
  { id: 'math',        labelMs: 'Matematik',                  labelEn: 'Mathematics',         group: 'STEM',       bands: ['primary', 'secondary', 'university'], tracked: true,  core: true },
  { id: 'science',     labelMs: 'Sains',                      labelEn: 'Science',             group: 'STEM',       bands: ['primary', 'secondary'],              tracked: false, core: true },
  { id: 'physics',     labelMs: 'Fizik',                      labelEn: 'Physics',             group: 'STEM',       bands: ['secondary'],                         tracked: false },
  { id: 'chemistry',   labelMs: 'Kimia',                      labelEn: 'Chemistry',           group: 'STEM',       bands: ['secondary'],                         tracked: false },
  { id: 'biology',     labelMs: 'Biologi',                    labelEn: 'Biology',             group: 'STEM',       bands: ['secondary'],                         tracked: false },
  { id: 'add_math',    labelMs: 'Matematik Tambahan',         labelEn: 'Additional Mathematics', group: 'STEM',    bands: ['secondary'],                         tracked: false },
  { id: 'history',     labelMs: 'Sejarah',                    labelEn: 'History',             group: 'HUMANITIES', bands: ['secondary'],                         tracked: false, core: true },
  { id: 'geography',   labelMs: 'Geografi',                   labelEn: 'Geography',           group: 'HUMANITIES', bands: ['secondary'],                         tracked: false },
  { id: 'civic',       labelMs: 'Pendidikan Sivik',           labelEn: 'Civic Education',     group: 'HUMANITIES', bands: ['secondary'],                         tracked: false },
  { id: 'islam',       labelMs: 'Pendidikan Islam',           labelEn: 'Islamic Education',   group: 'RELIGION',   bands: ['primary', 'secondary'],              tracked: false, core: true },
  { id: 'moral',       labelMs: 'Pendidikan Moral',           labelEn: 'Moral Education',     group: 'RELIGION',   bands: ['primary', 'secondary'],              tracked: false, core: true },
  { id: 'economics',   labelMs: 'Ekonomi',                    labelEn: 'Economics',           group: 'HUMANITIES', bands: ['secondary'],                         tracked: false },
  { id: 'business',    labelMs: 'Perniagaan',                 labelEn: 'Business',            group: 'HUMANITIES', bands: ['secondary'],                         tracked: false },
  { id: 'arabic',      labelMs: 'Bahasa Arab',                labelEn: 'Arabic',              group: 'LANGUAGE',   bands: ['primary', 'secondary'],              tracked: false },
  { id: 'chinese',     labelMs: 'Bahasa Cina',                labelEn: 'Chinese',             group: 'LANGUAGE',   bands: ['primary', 'secondary'],              tracked: false },
  { id: 'tamil',       labelMs: 'Bahasa Tamil',               labelEn: 'Tamil',               group: 'LANGUAGE',   bands: ['primary', 'secondary'],              tracked: false },
  { id: 'rbt',         labelMs: 'Reka Bentuk & Teknologi',    labelEn: 'Design & Technology', group: 'TECHNICAL',  bands: ['secondary'],                         tracked: false },
  { id: 'ask',         labelMs: 'Asas Sains Komputer',        labelEn: 'Computer Science',    group: 'TECHNICAL',  bands: ['secondary'],                         tracked: false },
  { id: 'visual_arts', labelMs: 'Pendidikan Seni Visual',     labelEn: 'Visual Arts',         group: 'ARTS',       bands: ['primary', 'secondary'],              tracked: false },
  { id: 'music',       labelMs: 'Muzik',                      labelEn: 'Music',               group: 'ARTS',       bands: ['primary', 'secondary'],              tracked: false },
  { id: 'pe',          labelMs: 'Pendidikan Jasmani',         labelEn: 'Physical Education',  group: 'ARTS',       bands: ['primary', 'secondary'],              tracked: false },
] as const;

const CATALOG_BY_ID = new Map(
  TUTOR_SUBJECT_CATALOG.map((item) => [item.id, item]),
);

export function getSubjectCatalogItem(id: TutorSubjectId): TutorSubjectCatalogItem | undefined {
  return CATALOG_BY_ID.get(id);
}

export function listSubjectsForBand(band: TutorSubscriptionLevel): TutorSubjectCatalogItem[] {
  return TUTOR_SUBJECT_CATALOG.filter((s) => s.bands.includes(band));
}

export function listCoreSubjectsForBand(band: TutorSubscriptionLevel): TutorSubjectCatalogItem[] {
  return listSubjectsForBand(band).filter((s) => s.core);
}

export function isValidSubjectId(id: string): id is TutorSubjectId {
  return CATALOG_BY_ID.has(id as TutorSubjectId);
}

/** Map concept tag prefix → subject for tracked mastery aggregation. */
export function subjectFromConceptTag(tag: string): TutorSubjectId | null {
  if (tag.startsWith('math.')) return 'math';
  if (tag.startsWith('bm.')) return 'bm';
  if (
    tag.startsWith('grammar.')
    || tag.startsWith('writing.')
    || tag.startsWith('reading.')
    || tag.startsWith('speaking.')
    || tag.startsWith('vocabulary.')
  ) return 'english';
  if (tag.startsWith('science.')) return 'science';
  if (tag.startsWith('history.')) return 'history';
  if (tag.startsWith('geography.')) return 'geography';
  if (tag.startsWith('islam.')) return 'islam';
  return null;
}

/** SPM-style grade from mastery % — training estimate only, not official exam grade. */
export function masteryToTrainingGrade(masteryPct: number): string {
  const p = Math.max(0, Math.min(100, masteryPct));
  if (p >= 90) return 'A+';
  if (p >= 85) return 'A';
  if (p >= 80) return 'A-';
  if (p >= 75) return 'B+';
  if (p >= 70) return 'B';
  if (p >= 65) return 'B-';
  if (p >= 60) return 'C+';
  if (p >= 55) return 'C';
  if (p >= 50) return 'C-';
  if (p >= 45) return 'D';
  if (p >= 40) return 'E';
  return 'F';
}

export function trainingGradeToGpaPoint(grade: string): number {
  if (grade.startsWith('A')) return 4.0;
  if (grade.startsWith('B')) return 3.0;
  if (grade.startsWith('C')) return 2.0;
  if (grade === 'D') return 1.0;
  return 0.0;
}
