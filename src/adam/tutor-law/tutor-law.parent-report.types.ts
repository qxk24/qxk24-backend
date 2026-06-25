/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Parent Report Types (ERA_2i / ERA_3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { TutorSubjectGroup, TutorSubjectId } from './tutor-law.curriculum-catalog';
import type { LearningInteractionEvent } from './tutor-law.learning-profile.types';

export type ParentReportKind = 'weekly' | 'monthly' | 'snapshot';

export type SubjectMasteryBand = 'strong' | 'improving' | 'needs_focus' | 'not_started';

export interface ParentSubjectSummary {
  subjectId:       TutorSubjectId;
  labelMs:         string;
  labelEn:         string;
  group:           TutorSubjectGroup;
  masteryPct:      number;
  trainingGrade:   string;
  band:            SubjectMasteryBand;
  tracked:         boolean;
  change7d:        number | null;
  weeklyMinutes:   number;
  topTopics:       { tag: string; label: string; percent: number; attempts: number }[];
  focusTopics:     string[];
}

export interface ParentReportInsights {
  strengths:        string[];
  areasForGrowth:   string[];
  patterns:         string[];
  recommendations:  string[];
}

export interface ParentReportOverall {
  trainingGpa:       number;
  totalLearningTime: number;
  activeDays:        number;
  currentStreak:     number;
  velocity7d:        number;
  subjectsCovered:   number;
  subjectsEnrolled:  number;
  placementComplete: boolean;
  estimatedCefr:     string;
}

export interface ParentReportCard {
  version:           1;
  kind:              ParentReportKind;
  generatedAt:       string;
  periodStart:       string;
  periodEnd:         string;
  studentUserId:     string;
  studentName:       string;
  schoolName:        string | null;
  yearLabel:         string | null;
  band:              string | null;
  overall:           ParentReportOverall;
  subjects:          ParentSubjectSummary[];
  insights:          ParentReportInsights;
  recentEvents:      LearningInteractionEvent[];
  disclaimerMs:      string;
  disclaimerEn:      string;
}

export interface ParentDashboardPayload {
  guardianName:      string;
  studentName:       string;
  lastReport:        ParentReportCard;
  parentPortalUrl:   string;
}
