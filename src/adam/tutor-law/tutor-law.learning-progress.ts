/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Progress Metrics (ERA_2g)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type {
  AdamTutorLearningProfile,
  LearningInteractionEvent,
} from './tutor-law.learning-profile.types';
import { conceptPercentCorrect } from './tutor-law.learning-profile-bkt';
import type { PlacementSubject } from './tutor-law.placement-bank';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface TutorLearningProgressMetrics {
  velocity:          number;
  retention:         number;
  zpdOccupancy:      number;
  hintDependency:    number;
  subjectBalance:    number;
  weeklyBySubject:   Partial<Record<PlacementSubject, number>>;
  recentEvents:      LearningInteractionEvent[];
}

function eventsInWindow(
  events: LearningInteractionEvent[],
  days: number,
  now: Date,
): LearningInteractionEvent[] {
  const cutoff = now.getTime() - days * MS_PER_DAY;
  return events.filter((e) => new Date(e.at).getTime() >= cutoff);
}

function percentCorrect(events: LearningInteractionEvent[]): number {
  if (events.length === 0) return 0;
  const scored = events.filter((e) => e.kind !== 'voice' || e.correct !== undefined);
  if (scored.length === 0) return 0;
  return scored.filter((e) => e.correct).length / scored.length;
}

function computeVelocity(
  events: LearningInteractionEvent[],
  now: Date,
): number {
  const last7 = eventsInWindow(events, 7, now);
  const prev7 = events.filter((e) => {
    const t = new Date(e.at).getTime();
    const start = now.getTime() - 14 * MS_PER_DAY;
    const end = now.getTime() - 7 * MS_PER_DAY;
    return t >= start && t < end;
  });

  if (last7.length === 0 && prev7.length === 0) return 0;
  return percentCorrect(last7) - percentCorrect(prev7);
}

function computeRetention(
  profile: AdamTutorLearningProfile,
  events: LearningInteractionEvent[],
  now: Date,
): number {
  const masteredTags = Object.entries(profile.conceptMastery)
    .filter(([, rec]) => conceptPercentCorrect(rec) >= 0.75 && rec.attempts >= 2)
    .map(([tag]) => tag);

  if (masteredTags.length === 0) return 0;

  const recent = eventsInWindow(events, 7, now)
    .filter((e) => masteredTags.includes(e.conceptTag));

  if (recent.length === 0) return 0;
  return percentCorrect(recent);
}

function computeZpdOccupancy(
  profile: AdamTutorLearningProfile,
  events: LearningInteractionEvent[],
  now: Date,
): number {
  const recent = eventsInWindow(events, 7, now);
  if (recent.length === 0) return 0;

  let zpdHits = 0;
  for (const event of recent) {
    const rec = profile.conceptMastery[event.conceptTag];
    const p = rec ? conceptPercentCorrect(rec) : 0.35;
    if (p >= 0.4 && p < 0.8) zpdHits += 1;
  }
  return zpdHits / recent.length;
}

function computeSubjectBalance(
  weekly: Partial<Record<PlacementSubject, number>>,
): number {
  const counts = [
    weekly.english ?? 0,
    weekly.math ?? 0,
    weekly.bm ?? 0,
  ];
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts);
  return min / max;
}

export function computeLearningProgress(
  profile: AdamTutorLearningProfile,
  now = new Date(),
): TutorLearningProgressMetrics {
  const events = profile.interactionLog ?? [];
  const stealth = profile.stealth;

  return {
    velocity:       computeVelocity(events, now),
    retention:      computeRetention(profile, events, now),
    zpdOccupancy:   computeZpdOccupancy(profile, events, now),
    hintDependency: stealth.totalTurns > 0
      ? stealth.hintRequests / stealth.totalTurns
      : 0,
    subjectBalance: computeSubjectBalance(profile.content?.weeklyBySubject ?? {}),
    weeklyBySubject: profile.content?.weeklyBySubject ?? {},
    recentEvents:   events.slice(0, 20),
  };
}
