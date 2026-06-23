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

export interface ConceptMasteryRecord {
  pMastery:     number;
  attempts:     number;
  lastUpdated:  string;
}

export interface PlacementSessionState {
  itemIdsAsked:       string[];
  currentItemId:      string | null;
  questionsAnswered:    number;
  abilityEstimate:    number;
  awaitingAnswer:     boolean;
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

export interface AdamTutorLearningProfile {
  version:              1;
  placementComplete:      boolean;
  placementAbility:     number;
  estimatedCefr:        string;
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
  lastCheckpointAt?:      string;
  updatedAt:              string;
}

export function defaultTutorLearningProfile(now = new Date()): AdamTutorLearningProfile {
  const iso = now.toISOString();
  return {
    version:           1,
    placementComplete: false,
    placementAbility:  0,
    estimatedCefr:     'UNKNOWN',
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
    },
    updatedAt: iso,
  };
}
