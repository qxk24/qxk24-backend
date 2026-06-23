/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Profile Checkpoint (ERA_2e)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type {
  AdamTutorLearningProfile,
  CheckpointHistoryRecord,
  CheckpointSessionState,
  PlacementSubjectScore,
} from './tutor-law.learning-profile.types';
import {
  CHECKPOINT_TARGET_QUESTIONS,
  getCheckpointItemByIndex,
  selectCheckpointItemIds,
} from './tutor-law.checkpoint-bank';
import {
  detectBmLevelFromPercent,
  detectEnglishLevelFromAbility,
  detectMathLevelFromPercent,
  scorePlacementAnswer,
  type PlacementItem,
  type PlacementSubject,
} from './tutor-law.placement-bank';
import {
  recordConceptAttempt,
  recomputeProfileAggregates,
} from './tutor-law.learning-profile-bkt';

function bumpSubjectScore(
  scores: Partial<Record<PlacementSubject, PlacementSubjectScore>>,
  subject: PlacementSubject,
  correct: boolean,
): Partial<Record<PlacementSubject, PlacementSubjectScore>> {
  const next = { ...scores };
  const prior: PlacementSubjectScore = next[subject] ?? { correct: 0, total: 0 };
  next[subject] = {
    correct: prior.correct + (correct ? 1 : 0),
    total:   prior.total + 1,
  };
  return next;
}

function subjectPercent(scores: PlacementSubjectScore | undefined): number {
  if (!scores || scores.total <= 0) return 0;
  return scores.correct / scores.total;
}

export function checkpointProgressLabel(profile: AdamTutorLearningProfile): string {
  const answered = profile.checkpoint?.questionsAnswered ?? 0;
  return `${answered}/${CHECKPOINT_TARGET_QUESTIONS}`;
}

export function finalizeCheckpointLevels(
  profile: AdamTutorLearningProfile,
  now: Date,
): void {
  const checkpoint = profile.checkpoint;
  if (!checkpoint) return;

  const scores = checkpoint.subjectScores ?? {};
  const priorLevels = checkpoint.priorSubjectLevels ?? { ...profile.subjectLevels };

  const nextAbility = Math.max(
    -3,
    Math.min(3, profile.placementAbility + (checkpoint.abilityDelta ?? 0)),
  );

  profile.placementAbility = nextAbility;
  profile.subjectLevels = {
    english: detectEnglishLevelFromAbility(nextAbility),
    math:    detectMathLevelFromPercent(subjectPercent(scores.math)),
    bm:      detectBmLevelFromPercent(subjectPercent(scores.bm)),
  };
  profile.estimatedCefr = profile.subjectLevels.english;

  const record: CheckpointHistoryRecord = {
    at:          now.toISOString(),
    itemIds:     [...checkpoint.itemIds],
    correct:     Object.values(scores).reduce((s, v) => s + (v?.correct ?? 0), 0),
    total:       checkpoint.questionsAnswered,
    priorLevels,
    nextLevels:  { ...profile.subjectLevels },
  };

  profile.checkpointHistory = [record, ...(profile.checkpointHistory ?? [])].slice(0, 5);
  profile.lastCheckpointAt = now.toISOString();
  profile.checkpoint = {
    ...checkpoint,
    active:         false,
    currentItemId:  null,
    awaitingAnswer: false,
  };
}

export function startCheckpointSession(
  profile: AdamTutorLearningProfile,
): { profile: AdamTutorLearningProfile; item: PlacementItem | null } {
  const next: AdamTutorLearningProfile = JSON.parse(JSON.stringify(profile));
  const itemIds = selectCheckpointItemIds(next);

  next.checkpoint = {
    active:             true,
    itemIds,
    currentItemId:      itemIds[0] ?? null,
    questionsAnswered:  0,
    awaitingAnswer:     false,
    subjectScores:      {},
    abilityDelta:       0,
    priorSubjectLevels: { ...next.subjectLevels },
  };

  const item = getCheckpointItemByIndex(itemIds, 0);
  return { profile: next, item };
}

export function applyCheckpointAnswer(
  profile: AdamTutorLearningProfile,
  item: PlacementItem,
  answer: string,
  now = new Date(),
): AdamTutorLearningProfile {
  const next: AdamTutorLearningProfile = JSON.parse(JSON.stringify(profile));
  const checkpoint: CheckpointSessionState = next.checkpoint ?? {
    active:             true,
    itemIds:            [],
    currentItemId:      null,
    questionsAnswered:  0,
    awaitingAnswer:     false,
    subjectScores:      {},
    abilityDelta:       0,
    priorSubjectLevels: { ...next.subjectLevels },
  };

  const correct = scorePlacementAnswer(item, answer);
  checkpoint.questionsAnswered += 1;
  checkpoint.subjectScores = bumpSubjectScore(
    checkpoint.subjectScores ?? {},
    item.subject,
    correct,
  );
  if (item.subject === 'english') {
    checkpoint.abilityDelta = (checkpoint.abilityDelta ?? 0) + (correct ? 0.35 : -0.35);
  }

  recordConceptAttempt(next, item.conceptTag, correct, now);

  const nextItem = getCheckpointItemByIndex(
    checkpoint.itemIds,
    checkpoint.questionsAnswered,
  );
  checkpoint.currentItemId = nextItem?.id ?? null;

  if (checkpoint.questionsAnswered >= CHECKPOINT_TARGET_QUESTIONS || !nextItem) {
    next.checkpoint = checkpoint;
    finalizeCheckpointLevels(next, now);
    next.gamification.xp += 25;
  } else {
    checkpoint.currentItemId = nextItem.id;
    checkpoint.awaitingAnswer = false;
    next.checkpoint = checkpoint;
  }

  recomputeProfileAggregates(next);
  next.updatedAt = now.toISOString();
  return next;
}
