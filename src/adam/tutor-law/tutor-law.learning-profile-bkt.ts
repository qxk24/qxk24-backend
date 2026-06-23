/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Profile BKT (rule-based ERA_2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type {
  AdamTutorLearningProfile,
  ConceptMasteryRecord,
  PlacementSessionState,
  PlacementSubjectScore,
} from './tutor-law.learning-profile.types';
import { placementProgressLabel } from './tutor-law.learning-profile.types';
import { checkpointProgressLabel } from './tutor-law.learning-profile-checkpoint';
import type { VoiceAssessmentResult } from './tutor-law.voice-assessment';
import { KNOWLEDGE_CONCEPT_GRAPH } from './tutor-law.adaptive-assessment';
import {
  abilityToCefr,
  detectBmLevelFromPercent,
  detectEnglishLevelFromAbility,
  detectMathLevelFromPercent,
  getStaticPlacementItemByIndex,
  PLACEMENT_TARGET_QUESTIONS,
  scorePlacementAnswer,
  xpToLevelLabel,
  type PlacementItem,
  type PlacementSubject,
} from './tutor-law.placement-bank';
import type { StealthAssessmentSnapshot } from './tutor-law.adaptive-assessment';
import { LearnerEmotionalSignal, LearnerMasteryBand } from './tutor-law.adaptive-assessment';

const P_LEARN = 0.28;
const P_SLIP  = 0.08;

export function bktUpdateMastery(
  prior: number,
  correct: boolean,
): number {
  if (correct) {
    return Math.min(0.98, prior + (1 - prior) * P_LEARN);
  }
  return Math.max(0.05, prior * (1 - P_SLIP));
}

export function masteryBandFromProbability(p: number): LearnerMasteryBand {
  if (p >= 0.8) return LearnerMasteryBand.MASTERED;
  if (p >= 0.55) return LearnerMasteryBand.LEARNING;
  if (p > 0) return LearnerMasteryBand.STRUGGLING;
  return LearnerMasteryBand.NOT_STARTED;
}

/** Simple knowledge tracking — % betul per topik (MVP Fasa 1). */
export function conceptPercentCorrect(rec: ConceptMasteryRecord): number {
  if (rec.attempts <= 0) return 0;
  const correct = rec.correctCount ?? 0;
  return Math.max(0, Math.min(1, correct / rec.attempts));
}

export interface ConceptMasteryDisplayRow {
  tag:      string;
  label:    string;
  percent:  number;
  correct:  number;
  attempts: number;
}

export function listConceptMasteryDisplay(
  profile: AdamTutorLearningProfile,
  limit = 8,
): ConceptMasteryDisplayRow[] {
  return Object.entries(profile.conceptMastery)
    .map(([tag, rec]) => ({
      tag,
      label:    KNOWLEDGE_CONCEPT_GRAPH[tag]?.label ?? tag,
      percent:  conceptPercentCorrect(rec),
      correct:  rec.correctCount ?? 0,
      attempts: rec.attempts,
    }))
    .filter((row) => row.attempts > 0)
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, limit);
}

export function recordConceptAttempt(
  profile: AdamTutorLearningProfile,
  tag: string,
  correct: boolean,
  now: Date,
): void {
  touchConcept(profile, tag, correct, now);
}

export function recomputeProfileAggregates(profile: AdamTutorLearningProfile): void {
  recomputeOverallMastery(profile);
  recomputeStrengthsAndFocus(profile);
}

function touchConcept(
  profile: AdamTutorLearningProfile,
  tag: string,
  correct: boolean,
  now: Date,
): void {
  const prior = profile.conceptMastery[tag]?.pMastery ?? 0;
  const next = bktUpdateMastery(prior, correct);
  const attempts = (profile.conceptMastery[tag]?.attempts ?? 0) + 1;
  const correctCount = (profile.conceptMastery[tag]?.correctCount ?? 0) + (correct ? 1 : 0);
  profile.conceptMastery[tag] = {
    pMastery:     next,
    attempts,
    correctCount,
    lastUpdated:  now.toISOString(),
  };
}

function bumpSubjectScore(
  placement: PlacementSessionState,
  subject: PlacementSubject,
  correct: boolean,
): void {
  const scores = placement.subjectScores ?? {};
  const prior: PlacementSubjectScore = scores[subject] ?? { correct: 0, total: 0 };
  scores[subject] = {
    correct: prior.correct + (correct ? 1 : 0),
    total:   prior.total + 1,
  };
  placement.subjectScores = scores;
}

function recomputeOverallMastery(profile: AdamTutorLearningProfile): void {
  const values = Object.values(profile.conceptMastery);
  if (values.length === 0) {
    profile.overallMastery = 0;
    return;
  }
  profile.overallMastery = values.reduce(
    (s, v) => s + conceptPercentCorrect(v),
    0,
  ) / values.length;
}

function recomputeStrengthsAndFocus(profile: AdamTutorLearningProfile): void {
  const entries = Object.entries(profile.conceptMastery)
    .map(([tag, rec]) => ({
      tag,
      label: KNOWLEDGE_CONCEPT_GRAPH[tag]?.label ?? tag,
      p:     conceptPercentCorrect(rec),
    }));

  profile.strengths = entries
    .filter((e) => e.p >= 0.75 && profile.conceptMastery[e.tag]!.attempts >= 1)
    .sort((a, b) => b.p - a.p)
    .slice(0, 3)
    .map((e) => e.label);

  profile.focusAreas = entries
    .filter((e) => e.p > 0 && e.p < 0.55)
    .sort((a, b) => a.p - b.p)
    .slice(0, 3)
    .map((e) => e.label);
}

function subjectPercent(scores: PlacementSubjectScore | undefined): number {
  if (!scores || scores.total <= 0) return 0;
  return scores.correct / scores.total;
}

export function finalizeSubjectLevels(profile: AdamTutorLearningProfile): void {
  const scores = profile.placement?.subjectScores ?? {};
  profile.subjectLevels = {
    english: detectEnglishLevelFromAbility(profile.placementAbility),
    math:    detectMathLevelFromPercent(subjectPercent(scores.math)),
    bm:      detectBmLevelFromPercent(subjectPercent(scores.bm)),
  };
  profile.estimatedCefr = profile.subjectLevels.english;
}

function updateStreak(profile: AdamTutorLearningProfile, now: Date): void {
  const today = now.toISOString().slice(0, 10);
  const last = profile.gamification.lastActiveDate;

  if (!last) {
    profile.gamification.streakDays = 1;
  } else if (last === today) {
    // same day
  } else {
    const lastDate = new Date(`${last}T12:00:00Z`);
    const todayDate = new Date(`${today}T12:00:00Z`);
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    profile.gamification.streakDays = diffDays === 1
      ? profile.gamification.streakDays + 1
      : 1;
  }

  profile.gamification.lastActiveDate = today;
}

export function applyStealthTurnUpdate(
  profile: AdamTutorLearningProfile,
  stealth: StealthAssessmentSnapshot,
  emotion: LearnerEmotionalSignal,
  conceptTags: string[],
  now = new Date(),
): AdamTutorLearningProfile {
  const next: AdamTutorLearningProfile = JSON.parse(JSON.stringify(profile));
  next.stealth.totalTurns += 1;

  if (stealth.hintRequest) next.stealth.hintRequests += 1;
  if (stealth.frustrationHit || stealth.giveUp) {
    next.stealth.frustrationSpikes += 1;
    next.stealth.stuckStreak += 1;
  } else {
    next.stealth.stuckStreak = 0;
  }
  if (stealth.longEngaged || stealth.deepQuestion) {
    next.stealth.engagedTurns += 1;
    next.gamification.xp += 10;
  }

  next.emotionalLast = emotion;
  next.gamification.levelLabel = xpToLevelLabel(next.gamification.xp);
  updateStreak(next, now);

  const inferredCorrect = !stealth.frustrationHit && !stealth.giveUp && stealth.longEngaged;
  for (const tag of conceptTags) {
    touchConcept(next, tag, inferredCorrect, now);
  }

  recomputeOverallMastery(next);
  recomputeStrengthsAndFocus(next);
  next.updatedAt = now.toISOString();

  return next;
}

export function startPlacementSession(
  profile: AdamTutorLearningProfile,
): { profile: AdamTutorLearningProfile; item: PlacementItem | null } {
  const next: AdamTutorLearningProfile = JSON.parse(JSON.stringify(profile));
  next.placement = next.placement ?? {
    itemIdsAsked:      [],
    currentItemId:     null,
    questionsAnswered: 0,
    abilityEstimate:   next.placementAbility,
    awaitingAnswer:    false,
    subjectScores:     {},
  };

  const index = next.placement.questionsAnswered;
  const item = getStaticPlacementItemByIndex(index);
  if (item) {
    next.placement.currentItemId = item.id;
    next.placement.awaitingAnswer = false;
    if (!next.placement.itemIdsAsked.includes(item.id)) {
      next.placement.itemIdsAsked.push(item.id);
    }
  }

  return { profile: next, item };
}

export function applyPlacementAnswer(
  profile: AdamTutorLearningProfile,
  item: PlacementItem,
  answer: string,
  now = new Date(),
): AdamTutorLearningProfile {
  const next: AdamTutorLearningProfile = JSON.parse(JSON.stringify(profile));
  const placement: PlacementSessionState = next.placement ?? {
    itemIdsAsked:      [],
    currentItemId:     null,
    questionsAnswered: 0,
    abilityEstimate:   next.placementAbility,
    awaitingAnswer:    false,
    subjectScores:     {},
  };

  const correct = scorePlacementAnswer(item, answer);
  placement.questionsAnswered += 1;
  placement.abilityEstimate = Math.max(
    -3,
    Math.min(3, placement.abilityEstimate + (correct ? 0.5 : -0.5)),
  );
  next.placementAbility = placement.abilityEstimate;
  bumpSubjectScore(placement, item.subject, correct);
  touchConcept(next, item.conceptTag, correct, now);

  const nextItem = getStaticPlacementItemByIndex(placement.questionsAnswered);
  if (nextItem && !placement.itemIdsAsked.includes(nextItem.id)) {
    placement.itemIdsAsked.push(nextItem.id);
  }
  placement.currentItemId = nextItem?.id ?? null;

  if (placement.questionsAnswered >= PLACEMENT_TARGET_QUESTIONS || !nextItem) {
    next.placementComplete = true;
    next.placementCompletedAt = now.toISOString();
    placement.currentItemId = null;
    placement.awaitingAnswer = false;
    finalizeSubjectLevels(next);
  } else {
    placement.currentItemId = nextItem.id;
    placement.awaitingAnswer = false;
    next.estimatedCefr = abilityToCefr(placement.abilityEstimate);
  }

  next.placement = placement;
  recomputeOverallMastery(next);
  recomputeStrengthsAndFocus(next);
  next.updatedAt = now.toISOString();

  return next;
}

export function applyVoiceTurnUpdate(
  profile: AdamTutorLearningProfile,
  assessment: VoiceAssessmentResult,
  now = new Date(),
): AdamTutorLearningProfile {
  const next: AdamTutorLearningProfile = JSON.parse(JSON.stringify(profile));
  const sessions = next.voice.sessions + 1;
  const weight = 1 / sessions;

  next.voice.sessions = sessions;
  next.voice.avgPronunciation = next.voice.avgPronunciation * (1 - weight) + assessment.pronunciationScore * weight;
  next.voice.avgFluency = next.voice.avgFluency * (1 - weight) + assessment.fluencyScore * weight;
  next.voice.lastTargetPhrase = assessment.targetPhrase;

  const record = {
    at:                 now.toISOString(),
    targetPhrase:       assessment.targetPhrase,
    transcript:         assessment.transcript,
    pronunciationScore: assessment.pronunciationScore,
    fluencyScore:       assessment.fluencyScore,
    combinedScore:      assessment.combinedScore,
  };
  next.voice.recent = [record, ...next.voice.recent].slice(0, 5);

  if (assessment.combinedScore >= 0.45) {
    next.gamification.xp += 12;
    next.gamification.levelLabel = xpToLevelLabel(next.gamification.xp);
  }

  const correct = assessment.combinedScore >= 0.55;
  touchConcept(next, 'speaking.pronunciation', correct, now);
  touchConcept(next, 'speaking.fluency', assessment.fluencyScore >= 0.5, now);

  recomputeOverallMastery(next);
  recomputeStrengthsAndFocus(next);
  next.updatedAt = now.toISOString();

  return next;
}

export function listZpdConceptTags(profile: AdamTutorLearningProfile): string[] {
  return Object.entries(profile.conceptMastery)
    .filter(([, rec]) => {
      const p = conceptPercentCorrect(rec);
      return p >= 0.4 && p < 0.8;
    })
    .map(([tag]) => tag);
}

export function buildLearningProfilePromptSummary(
  profile: AdamTutorLearningProfile | null | undefined,
): string {
  if (!profile) return '';

  const zpd = listZpdConceptTags(profile)
    .map((t) => KNOWLEDGE_CONCEPT_GRAPH[t]?.label ?? t)
    .slice(0, 4);

  const parts = [
    `LEARNING PROFILE (tahap semasa — bukan IQ): CEFR≈${profile.estimatedCefr}, `
    + `mastery=${Math.round(profile.overallMastery * 100)}%, `
    + `stuck=${profile.stealth.stuckStreak}, emotion=${profile.emotionalLast}`,
    `Tahap subjek (rule-based): English=${profile.subjectLevels.english}, `
    + `Math=${profile.subjectLevels.math}, BM=${profile.subjectLevels.bm}`,
  ];

  const topicRows = listConceptMasteryDisplay(profile, 4);
  if (topicRows.length) {
    parts.push(
      'Topik (% betul): '
      + topicRows.map((r) => `${r.label} ${Math.round(r.percent * 100)}% (${r.correct}/${r.attempts})`).join('; '),
    );
  }

  if (profile.strengths.length) {
    parts.push(`Kekuatan: ${profile.strengths.join(', ')}`);
  }
  if (profile.focusAreas.length) {
    parts.push(`Fokus ZPD: ${profile.focusAreas.join(', ')}`);
  }
  if (zpd.length) {
    parts.push(`ZPD nodes: ${zpd.join(', ')}`);
  }
  if (profile.gamification.streakDays > 0) {
    parts.push(
      `Streak: ${profile.gamification.streakDays} hari | XP: ${profile.gamification.xp} (${profile.gamification.levelLabel})`,
    );
  }
  if (profile.voice.sessions > 0) {
    parts.push(
      `Voice (STT): ${profile.voice.sessions} sesi | sebutan≈${Math.round(profile.voice.avgPronunciation * 100)}% | fluency≈${Math.round(profile.voice.avgFluency * 100)}%`,
    );
  }
  if (!profile.placementComplete) {
    parts.push(
      `Placement statik: ${placementProgressLabel(profile)} — satu soalan setiap turn sehingga lengkap.`,
    );
  } else if (profile.checkpoint?.active) {
    parts.push(
      `Checkpoint 2 minggu: ${checkpointProgressLabel(profile)} — banding kemajuan vs diri sendiri, bukan pelajar lain.`,
    );
  }

  return parts.join('\n');
}
