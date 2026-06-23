/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Profile Types (ERA_2)
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
 *
 * Tahap pembelajaran semasa + ZPD — NOT intelligence/IQ labels.
 */

import type { PlacementSubject } from './tutor-law.placement-bank';
import { PLACEMENT_TARGET_QUESTIONS } from './tutor-law.placement-bank';

export const MAX_INTERACTION_LOG = 100;

export type PlacementMode = 'static' | 'irt';

export type LearningInteractionKind = 'placement' | 'checkpoint' | 'drill' | 'probe' | 'reading' | 'voice';

export interface LearningInteractionEvent {
  at:           string;
  kind:         LearningInteractionKind;
  contentId:    string;
  conceptTag:   string;
  subject:      PlacementSubject;
  correct:      boolean;
  responseMs?:  number;
  thetaAfter?:  number;
}

export interface ConceptMasteryRecord {
  pMastery:      number;
  attempts:      number;
  correctCount:  number;
  lastUpdated:   string;
}

export interface PlacementSubjectScore {
  correct:  number;
  total:    number;
}

export interface PlacementSessionState {
  itemIdsAsked:       string[];
  currentItemId:      string | null;
  questionsAnswered:  number;
  abilityEstimate:    number;
  awaitingAnswer:     boolean;
  mode?:              PlacementMode;
  abilitySe?:         number;
  perSubjectTheta?:   Partial<Record<PlacementSubject, number>>;
  subjectScores?:     Partial<Record<PlacementSubject, PlacementSubjectScore>>;
}

export interface CheckpointSessionState {
  active:              boolean;
  itemIds:             string[];
  currentItemId:       string | null;
  questionsAnswered:   number;
  awaitingAnswer:      boolean;
  subjectScores?:      Partial<Record<PlacementSubject, PlacementSubjectScore>>;
  abilityDelta?:       number;
  priorSubjectLevels?: TutorSubjectLevels;
}

export interface CheckpointHistoryRecord {
  at:          string;
  itemIds:     string[];
  correct:     number;
  total:       number;
  priorLevels: TutorSubjectLevels;
  nextLevels:  TutorSubjectLevels;
}

export interface TutorSubjectLevels {
  english:  string;
  math:     string;
  bm:       string;
}

export interface TutorGamificationState {
  xp:             number;
  levelLabel:     string;
  streakDays:     number;
  lastActiveDate: string | null;
}

export interface TutorStealthCounters {
  hintRequests:       number;
  frustrationSpikes:  number;
  engagedTurns:       number;
  totalTurns:         number;
  stuckStreak:        number;
}

export interface VoiceAssessmentRecord {
  at:                 string;
  targetPhrase:       string | null;
  transcript:         string;
  pronunciationScore: number;
  fluencyScore:       number;
  combinedScore:      number;
}

export interface TutorVoiceAssessmentState {
  sessions:         number;
  avgPronunciation: number;
  avgFluency:       number;
  lastTargetPhrase: string | null;
  recent:           VoiceAssessmentRecord[];
}

export interface ContentSessionState {
  lastContentId:     string | null;
  lastContentAt:     string | null;
  recentContentIds:  string[];
  weeklyBySubject:   Partial<Record<PlacementSubject, number>>;
  /** ISO date (YYYY-MM-DD) of Monday for current weekly bucket — ERA_2h */
  weeklyWeekStart?:  string | null;
  currentContentId:  string | null;
  awaitingAnswer:    boolean;
}

export interface AdamTutorLearningProfile {
  version:              1 | 2;
  placementComplete:      boolean;
  placementAbility:     number;
  estimatedCefr:        string;
  subjectLevels:        TutorSubjectLevels;
  overallMastery:       number;
  conceptMastery:       Record<string, ConceptMasteryRecord>;
  strengths:            string[];
  focusAreas:           string[];
  selfReportedConfidence?: number;
  selfReportedGoals?:     string[];
  selfReportedWeaknesses?: string[];
  emotionalLast:          string;
  stealth:                TutorStealthCounters;
  gamification:           TutorGamificationState;
  voice:                  TutorVoiceAssessmentState;
  placement?:             PlacementSessionState;
  placementCompletedAt?:  string;
  checkpoint?:            CheckpointSessionState;
  checkpointHistory?:     CheckpointHistoryRecord[];
  lastCheckpointAt?:      string;
  interactionLog?:        LearningInteractionEvent[];
  content?:               ContentSessionState;
  updatedAt:              string;
}

export function appendInteractionEvent(
  profile: AdamTutorLearningProfile,
  event: LearningInteractionEvent,
): void {
  const log = profile.interactionLog ?? [];
  profile.interactionLog = [event, ...log].slice(0, MAX_INTERACTION_LOG);
}

export function isPlacementIrtMode(placement?: PlacementSessionState): boolean {
  return placement?.mode !== 'static';
}

export function defaultContentSession(): ContentSessionState {
  return {
    lastContentId:     null,
    lastContentAt:     null,
    recentContentIds:  [],
    weeklyBySubject:   {},
    weeklyWeekStart:   null,
    currentContentId:  null,
    awaitingAnswer:    false,
  };
}

export function defaultTutorLearningProfile(now = new Date()): AdamTutorLearningProfile {
  const iso = now.toISOString();
  return {
    version:           2,
    placementComplete: false,
    placementAbility:  0,
    estimatedCefr:     'UNKNOWN',
    subjectLevels: {
      english: 'UNKNOWN',
      math:    'UNKNOWN',
      bm:      'UNKNOWN',
    },
    overallMastery:    0,
    conceptMastery:    {},
    strengths:         [],
    focusAreas:        [],
    emotionalLast:     'NEUTRAL',
    stealth: {
      hintRequests:      0,
      frustrationSpikes: 0,
      engagedTurns:      0,
      totalTurns:        0,
      stuckStreak:       0,
    },
    gamification: {
      xp:             0,
      levelLabel:     'Novice',
      streakDays:     0,
      lastActiveDate: null,
    },
    voice: {
      sessions:         0,
      avgPronunciation: 0,
      avgFluency:       0,
      lastTargetPhrase: null,
      recent:           [],
    },
    placement: {
      itemIdsAsked:        [],
      currentItemId:       null,
      questionsAnswered:   0,
      abilityEstimate:     0,
      awaitingAnswer:      false,
      mode:                'irt',
      abilitySe:           1,
      perSubjectTheta:     {},
      subjectScores:       {},
    },
    interactionLog:        [],
    content:               defaultContentSession(),
    updatedAt: iso,
  };
}

export function placementProgressLabel(profile: AdamTutorLearningProfile): string {
  const answered = profile.placement?.questionsAnswered ?? 0;
  return `${answered}/${PLACEMENT_TARGET_QUESTIONS}`;
}
