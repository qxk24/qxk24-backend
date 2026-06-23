/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Parent Report Builder (ERA_2i)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * Deterministic report card — numbers from event log + BKT only.
 * ============================================================
 */

import type { AdamTutorLearningProfile } from './tutor-law.learning-profile.types';
import { computeLearningProgress } from './tutor-law.learning-progress';
import {
  getSubjectCatalogItem,
  listSubjectsForBand,
  trainingGradeToGpaPoint,
  type TutorSubjectId,
} from './tutor-law.curriculum-catalog';
import type {
  ParentReportCard,
  ParentReportInsights,
  ParentReportKind,
  ParentSubjectSummary,
} from './tutor-law.parent-report.types';
import {
  aggregateSubjectMastery,
  masteryBandFromPct,
  subjectTrainingGrade,
  topTopicsForSubject,
} from './tutor-law.subject-mastery';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

const DISCLAIMER_MS =
  'Anggaran berdasarkan latihan ADAM — bukan keputusan rasmi peperiksaan. '
  + 'Bandingkan kemajuan anak dengan diri sendiri semalam, bukan dengan pelajar lain.';
const DISCLAIMER_EN =
  'Training estimate from ADAM practice — not an official exam result. '
  + 'Compare your child\'s progress to their own past performance, not other students.';

function periodBounds(kind: ParentReportKind, now: Date): { start: Date; end: Date } {
  const end = new Date(now);
  const start = new Date(now);
  if (kind === 'monthly') {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
  } else {
    start.setTime(end.getTime() - 7 * MS_PER_DAY);
  }
  return { start, end };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function activeDaysInWindow(
  events: { at: string }[],
  start: Date,
  end: Date,
): number {
  const days = new Set<string>();
  for (const e of events) {
    const t = new Date(e.at).getTime();
    if (t >= start.getTime() && t <= end.getTime()) {
      days.add(e.at.slice(0, 10));
    }
  }
  return days.size;
}

function buildInsights(
  subjects: ParentSubjectSummary[],
  progress: ReturnType<typeof computeLearningProgress>,
): ParentReportInsights {
  const strengths: string[] = [];
  const areasForGrowth: string[] = [];
  const patterns: string[] = [];
  const recommendations: string[] = [];

  for (const s of subjects.filter((x) => x.band === 'strong')) {
    strengths.push(`${s.labelMs}: ${s.masteryPct}% (latihan ADAM)`);
  }
  for (const s of subjects.filter((x) => x.band === 'needs_focus' && x.tracked)) {
    areasForGrowth.push(`${s.labelMs}: fokus latihan tambahan`);
  }
  for (const s of subjects.filter((x) => x.band === 'not_started')) {
    areasForGrowth.push(`${s.labelMs}: belum ada rekod latihan ADAM`);
  }

  if (progress.velocity > 0.05) {
    patterns.push('Trend 7 hari positif — lebih banyak jawapan betul minggu ini.');
  } else if (progress.velocity < -0.05) {
    patterns.push('Trend 7 hari perlahan — pertimbangkan sesi lebih pendek dan kerap.');
  }

  if (progress.hintDependency > 0.35) {
    patterns.push('Anak kerap minta hint — galakkan cuba dulu sebelum minta bantuan.');
  }

  if (progress.subjectBalance < 0.5) {
    recommendations.push('Seimbangkan masa latihan antara subjek (EN/Math/BM).');
  }

  const weakest = [...subjects]
    .filter((s) => s.tracked && s.masteryPct > 0)
    .sort((a, b) => a.masteryPct - b.masteryPct)[0];
  if (weakest) {
    recommendations.push(`Fokus minggu ini: ${weakest.labelMs} (${weakest.masteryPct}%).`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Teruskan rutin harian — semak laporan setiap Ahad bersama anak.');
  }

  return { strengths, areasForGrowth, patterns, recommendations };
}

export function buildParentReportCard(input: {
  profile:           AdamTutorLearningProfile;
  studentUserId:     string;
  studentName:       string;
  schoolName?:       string | null;
  yearLabel?:        string | null;
  band:              TutorSubscriptionLevel;
  subjectsTaken:     TutorSubjectId[];
  kind?:             ParentReportKind;
  now?:              Date;
}): ParentReportCard {
  const now = input.now ?? new Date();
  const kind = input.kind ?? 'weekly';
  const { start, end } = periodBounds(kind, now);
  const progress = computeLearningProgress(input.profile, now);

  const enrolled = input.subjectsTaken.length > 0
    ? input.subjectsTaken
    : listSubjectsForBand(input.band)
      .filter((s) => s.core)
      .map((s) => s.id);

  const aggregates = aggregateSubjectMastery(input.profile, enrolled, now);
  const events = input.profile.interactionLog ?? [];

  const subjects: ParentSubjectSummary[] = aggregates.map((agg) => {
    const catalog = getSubjectCatalogItem(agg.subjectId)!;
    const hasActivity = agg.attempts > 0 || agg.weeklyEvents > 0;
    const weeklyMinutes = Math.round(
      events
        .filter((e) => {
          const t = new Date(e.at).getTime();
          return t >= now.getTime() - 7 * MS_PER_DAY;
        })
        .filter((e) => e.subject === agg.subjectId
          || (agg.subjectId === 'english' && e.subject === 'english')
          || (agg.subjectId === 'math' && e.subject === 'math')
          || (agg.subjectId === 'bm' && e.subject === 'bm'))
        .reduce((sum, e) => sum + (e.responseMs ?? 45_000), 0) / 60_000,
    );

    return {
      subjectId:     agg.subjectId,
      labelMs:       catalog.labelMs,
      labelEn:       catalog.labelEn,
      group:         catalog.group,
      masteryPct:    agg.masteryPct,
      trainingGrade: subjectTrainingGrade(agg.masteryPct),
      band:          masteryBandFromPct(agg.masteryPct, hasActivity),
      tracked:       catalog.tracked,
      change7d:      agg.change7d,
      weeklyMinutes,
      topTopics:     topTopicsForSubject(input.profile, agg.subjectId),
      focusTopics:   input.profile.focusAreas.filter(
        (t) => topTopicsForSubject(input.profile, agg.subjectId).every((x) => x.tag !== t),
      ).slice(0, 3),
    };
  });

  const graded = subjects.filter((s) => s.masteryPct > 0 || s.band !== 'not_started');
  const gpa = graded.length > 0
    ? graded.reduce((sum, s) => sum + trainingGradeToGpaPoint(s.trainingGrade), 0) / graded.length
    : 0;

  const covered = subjects.filter(
    (s) => s.band !== 'not_started' || s.weeklyMinutes > 0,
  ).length;

  const insights = buildInsights(subjects, progress);

  return {
    version:       1,
    kind,
    generatedAt:   now.toISOString(),
    periodStart:   start.toISOString(),
    periodEnd:     end.toISOString(),
    studentUserId: input.studentUserId,
    studentName:   input.studentName,
    schoolName:    input.schoolName ?? null,
    yearLabel:     input.yearLabel ?? null,
    band:          input.band,
    overall: {
      trainingGpa:       Math.round(gpa * 100) / 100,
      totalLearningTime: Math.round(
        events.reduce((sum, e) => sum + (e.responseMs ?? 45_000), 0) / 60_000,
      ),
      activeDays:        activeDaysInWindow(events, start, end),
      currentStreak:     input.profile.gamification.streakDays,
      velocity7d:        Math.round(progress.velocity * 100),
      subjectsCovered:   covered,
      subjectsEnrolled:  enrolled.length,
      placementComplete: input.profile.placementComplete,
      estimatedCefr:     input.profile.estimatedCefr,
    },
    subjects,
    insights,
    recentEvents: events.slice(0, 15),
    disclaimerMs: DISCLAIMER_MS,
    disclaimerEn: DISCLAIMER_EN,
  };
}
