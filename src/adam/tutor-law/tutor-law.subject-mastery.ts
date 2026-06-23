/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Subject Mastery Aggregation (ERA_3a)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { AdamTutorLearningProfile } from './tutor-law.learning-profile.types';
import { conceptPercentCorrect } from './tutor-law.learning-profile-bkt';
import { KNOWLEDGE_CONCEPT_GRAPH } from './tutor-law.adaptive-assessment';
import {
  getSubjectCatalogItem,
  masteryToTrainingGrade,
  subjectFromConceptTag,
  type TutorSubjectId,
} from './tutor-law.curriculum-catalog';
import type { LearningInteractionEvent } from './tutor-law.learning-profile.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface SubjectMasteryAggregate {
  subjectId:    TutorSubjectId;
  masteryPct:   number;
  attempts:     number;
  correct:      number;
  change7d:     number | null;
  weeklyEvents: number;
}

function eventsForSubject(
  events: LearningInteractionEvent[],
  subjectId: TutorSubjectId,
): LearningInteractionEvent[] {
  return events.filter((e) => {
    const fromTag = subjectFromConceptTag(e.conceptTag);
    if (fromTag === subjectId) return true;
    if (e.subject === 'english' && subjectId === 'english') return true;
    if (e.subject === 'math' && subjectId === 'math') return true;
    if (e.subject === 'bm' && subjectId === 'bm') return true;
    return false;
  });
}

function masteryFromProfile(
  profile: AdamTutorLearningProfile,
  subjectId: TutorSubjectId,
): { masteryPct: number; attempts: number; correct: number } {
  const tags = Object.entries(profile.conceptMastery)
    .filter(([tag]) => subjectFromConceptTag(tag) === subjectId);

  if (tags.length === 0) {
    if (subjectId === 'english' && profile.placementComplete) {
      const level = profile.subjectLevels?.english ?? 'UNKNOWN';
      const approx = level.includes('KUAT') ? 78 : level.includes('MEMBINA') ? 55 : 40;
      return { masteryPct: approx, attempts: 0, correct: 0 };
    }
    if (subjectId === 'math' && profile.placementComplete) {
      const level = profile.subjectLevels?.math ?? 'UNKNOWN';
      const approx = level.includes('KUAT') ? 75 : level.includes('MEMBINA') ? 52 : 38;
      return { masteryPct: approx, attempts: 0, correct: 0 };
    }
    if (subjectId === 'bm' && profile.placementComplete) {
      const level = profile.subjectLevels?.bm ?? 'UNKNOWN';
      const approx = level.includes('KUAT') ? 74 : level.includes('MEMBINA') ? 50 : 36;
      return { masteryPct: approx, attempts: 0, correct: 0 };
    }
    return { masteryPct: 0, attempts: 0, correct: 0 };
  }

  let totalAttempts = 0;
  let totalCorrect = 0;
  let weighted = 0;
  let weightSum = 0;

  for (const [tag, rec] of tags) {
    const pct = conceptPercentCorrect(rec);
    const w = Math.max(1, rec.attempts);
    weighted += pct * w;
    weightSum += w;
    totalAttempts += rec.attempts;
    totalCorrect += rec.correctCount ?? 0;
  }

  return {
    masteryPct: weightSum > 0 ? Math.round((weighted / weightSum) * 100) : 0,
    attempts:   totalAttempts,
    correct:    totalCorrect,
  };
}

function percentCorrect(events: LearningInteractionEvent[]): number {
  if (events.length === 0) return 0;
  return events.filter((e) => e.correct).length / events.length;
}

export function aggregateSubjectMastery(
  profile: AdamTutorLearningProfile,
  subjectIds: TutorSubjectId[],
  now = new Date(),
): SubjectMasteryAggregate[] {
  const events = profile.interactionLog ?? [];
  const cutoff7 = now.getTime() - 7 * MS_PER_DAY;
  const prevStart = now.getTime() - 14 * MS_PER_DAY;

  return subjectIds.map((subjectId) => {
    const base = masteryFromProfile(profile, subjectId);
    const subjectEvents = eventsForSubject(events, subjectId);
    const last7 = subjectEvents.filter((e) => new Date(e.at).getTime() >= cutoff7);
    const prev7 = subjectEvents.filter((e) => {
      const t = new Date(e.at).getTime();
      return t >= prevStart && t < cutoff7;
    });

    let change7d: number | null = null;
    if (last7.length > 0 || prev7.length > 0) {
      change7d = Math.round((percentCorrect(last7) - percentCorrect(prev7)) * 100);
    }

    let masteryPct = base.masteryPct;
    if (last7.length >= 3) {
      masteryPct = Math.round(percentCorrect(last7) * 100);
    }

    return {
      subjectId,
      masteryPct,
      attempts:     base.attempts,
      correct:      base.correct,
      change7d,
      weeklyEvents: last7.length,
    };
  });
}

export function topTopicsForSubject(
  profile: AdamTutorLearningProfile,
  subjectId: TutorSubjectId,
  limit = 3,
): { tag: string; label: string; percent: number; attempts: number }[] {
  return Object.entries(profile.conceptMastery)
    .filter(([tag]) => subjectFromConceptTag(tag) === subjectId)
    .map(([tag, rec]) => ({
      tag,
      label:    KNOWLEDGE_CONCEPT_GRAPH[tag]?.label ?? tag,
      percent:  Math.round(conceptPercentCorrect(rec) * 100),
      attempts: rec.attempts,
    }))
    .filter((r) => r.attempts > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit);
}

export function masteryBandFromPct(
  pct: number,
  hasActivity: boolean,
): 'strong' | 'improving' | 'needs_focus' | 'not_started' {
  if (!hasActivity && pct <= 0) return 'not_started';
  if (pct >= 80) return 'strong';
  if (pct >= 60) return 'improving';
  return 'needs_focus';
}

export function subjectTrainingGrade(masteryPct: number): string {
  return masteryToTrainingGrade(masteryPct);
}
