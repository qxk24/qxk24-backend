/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Parent Activity Metrics (ERA_2j)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * Deterministic engagement signals for parent report — no LLM.
 * ============================================================
 */

import type { AdamTutorLearningProfile, LearningInteractionEvent } from './tutor-law.learning-profile.types';
import type { ParentReportKind } from './tutor-law.parent-report.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** ~10 min/day — parent-facing weekly goal for KPM students. */
export const PARENT_WEEKLY_GOAL_MINUTES = 70;

export type ParentActivityBand =
  | 'very_active'
  | 'active'
  | 'low'
  | 'inactive'
  | 'dormant'
  | 'never';

export type ParentActivityAlertCode =
  | 'no_activity_period'
  | 'dormant'
  | 'low_engagement'
  | 'goal_not_met'
  | 'streak_lost';

export type ParentActivityAlertSeverity = 'info' | 'warning' | 'critical';

export interface ParentActivityAlert {
  code:      ParentActivityAlertCode;
  severity:  ParentActivityAlertSeverity;
  messageMs: string;
  messageEn: string;
}

export interface ParentActivityReport {
  band:                 ParentActivityBand;
  periodDays:           number;
  activeDays:           number;
  periodMinutes:        number;
  periodInteractions:   number;
  daysSinceLastActive:  number | null;
  lastActiveAt:         string | null;
  goalMinutes:          number;
  goalProgressPct:      number;
  currentStreak:        number;
  alerts:               ParentActivityAlert[];
}

function periodDaysForKind(kind: ParentReportKind): number {
  return kind === 'monthly' ? 30 : 7;
}

function goalMinutesForKind(kind: ParentReportKind): number {
  return kind === 'monthly'
    ? PARENT_WEEKLY_GOAL_MINUTES * 4
    : PARENT_WEEKLY_GOAL_MINUTES;
}

function eventsInPeriod(
  events: LearningInteractionEvent[],
  start: Date,
  end: Date,
): LearningInteractionEvent[] {
  return events.filter((e) => {
    const t = new Date(e.at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
}

function sumPeriodMinutes(events: LearningInteractionEvent[]): number {
  return Math.round(
    events.reduce((sum, e) => sum + (e.responseMs ?? 45_000), 0) / 60_000,
  );
}

function activeDaysFromEvents(
  events: LearningInteractionEvent[],
  lastActiveDate: string | null,
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
  if (lastActiveDate) {
    const t = new Date(`${lastActiveDate}T12:00:00Z`).getTime();
    if (t >= start.getTime() && t <= end.getTime()) {
      days.add(lastActiveDate);
    }
  }
  return days.size;
}

function resolveLastActiveAt(
  events: LearningInteractionEvent[],
  lastActiveDate: string | null,
): string | null {
  const latestEvent = events[0]?.at ?? null;
  if (!latestEvent && !lastActiveDate) return null;
  if (!latestEvent) return `${lastActiveDate}T12:00:00.000Z`;
  if (!lastActiveDate) return latestEvent;
  const eventMs = new Date(latestEvent).getTime();
  const dateMs = new Date(`${lastActiveDate}T12:00:00Z`).getTime();
  return eventMs >= dateMs ? latestEvent : `${lastActiveDate}T12:00:00.000Z`;
}

function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const diff = now.getTime() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY));
}

function classifyBand(input: {
  activeDays:          number;
  periodMinutes:       number;
  daysSinceLastActive: number | null;
  periodDays:          number;
  hasEverEngaged:      boolean;
}): ParentActivityBand {
  if (!input.hasEverEngaged) return 'never';

  const { activeDays, periodMinutes, daysSinceLastActive, periodDays } = input;

  if (daysSinceLastActive != null && daysSinceLastActive >= periodDays) {
    return 'dormant';
  }
  if (activeDays === 0) {
    return daysSinceLastActive != null && daysSinceLastActive >= 3
      ? 'dormant'
      : 'inactive';
  }
  if (activeDays >= 5 || periodMinutes >= 90) return 'very_active';
  if (activeDays >= 3 || periodMinutes >= 45) return 'active';
  return 'low';
}

function formatLastActiveMs(days: number | null): string {
  if (days == null) return 'belum pernah aktif';
  if (days === 0) return 'hari ini';
  if (days === 1) return 'semalam';
  return `${days} hari lalu`;
}

function formatLastActiveEn(days: number | null): string {
  if (days == null) return 'never active';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function buildActivityAlerts(input: {
  band:                ParentActivityBand;
  activeDays:          number;
  periodDays:          number;
  periodMinutes:       number;
  goalMinutes:         number;
  goalProgressPct:     number;
  daysSinceLastActive: number | null;
  currentStreak:       number;
}): ParentActivityAlert[] {
  const alerts: ParentActivityAlert[] = [];

  if (input.band === 'never') {
    alerts.push({
      code:      'no_activity_period',
      severity:  'critical',
      messageMs: 'Anak belum mula menggunakan ADAM — tiada rekod latihan langsung.',
      messageEn: 'Your child has not started using ADAM — no practice recorded yet.',
    });
    return alerts;
  }

  if (input.band === 'dormant') {
    alerts.push({
      code:      'dormant',
      severity:  'critical',
      messageMs: `Anak tidak aktif di ADAM — terakhir ${formatLastActiveMs(input.daysSinceLastActive)}. `
        + 'Ini perlu perhatian ibu bapa.',
      messageEn: `Your child is inactive on ADAM — last seen ${formatLastActiveEn(input.daysSinceLastActive)}. `
        + 'Parent follow-up recommended.',
    });
  } else if (input.activeDays === 0) {
    alerts.push({
      code:      'no_activity_period',
      severity:  'critical',
      messageMs: `Tiada latihan ADAM dalam ${input.periodDays} hari lepas — anak mungkin tidak guna platform.`,
      messageEn: `No ADAM practice in the last ${input.periodDays} days — your child may not be using the platform.`,
    });
  }

  if (input.band === 'low' || input.band === 'inactive') {
    alerts.push({
      code:      'low_engagement',
      severity:  'warning',
      messageMs: `Aktiviti rendah: ${input.activeDays}/${input.periodDays} hari aktif, `
        + `${input.periodMinutes} minit latihan.`,
      messageEn: `Low engagement: ${input.activeDays}/${input.periodDays} active days, `
        + `${input.periodMinutes} minutes of practice.`,
    });
  }

  if (input.goalProgressPct < 50 && input.band !== 'very_active') {
    alerts.push({
      code:      'goal_not_met',
      severity:  'warning',
      messageMs: `Sasaran latihan: ${input.goalProgressPct}% daripada ${input.goalMinutes} minit/minggu.`,
      messageEn: `Practice goal: ${input.goalProgressPct}% of ${input.goalMinutes} min/week target.`,
    });
  }

  if (input.currentStreak === 0 && input.daysSinceLastActive != null && input.daysSinceLastActive >= 2) {
    alerts.push({
      code:      'streak_lost',
      severity:  'info',
      messageMs: 'Streak latihan terputus — galakkan rutin harian pendek (10–15 minit).',
      messageEn: 'Practice streak broken — encourage a short daily routine (10–15 minutes).',
    });
  }

  return alerts;
}

export function computeParentActivity(
  profile: AdamTutorLearningProfile,
  kind: ParentReportKind,
  periodStart: Date,
  periodEnd: Date,
  now = new Date(),
): ParentActivityReport {
  const events = profile.interactionLog ?? [];
  const periodDays = periodDaysForKind(kind);
  const goalMinutes = goalMinutesForKind(kind);
  const periodEvents = eventsInPeriod(events, periodStart, periodEnd);
  const lastActiveDate = profile.gamification.lastActiveDate;
  const lastActiveAt = resolveLastActiveAt(events, lastActiveDate);
  const daysSinceLastActive = daysSince(lastActiveAt, now);
  const activeDays = activeDaysFromEvents(events, lastActiveDate, periodStart, periodEnd);
  const periodMinutes = sumPeriodMinutes(periodEvents);
  const hasEverEngaged = events.length > 0
    || lastActiveDate != null
    || profile.stealth.totalTurns > 0
    || profile.placementComplete;

  const goalProgressPct = goalMinutes > 0
    ? Math.min(100, Math.round((periodMinutes / goalMinutes) * 100))
    : 0;

  const band = classifyBand({
    activeDays,
    periodMinutes,
    daysSinceLastActive,
    periodDays,
    hasEverEngaged,
  });

  const alerts = buildActivityAlerts({
    band,
    activeDays,
    periodDays,
    periodMinutes,
    goalMinutes,
    goalProgressPct,
    daysSinceLastActive,
    currentStreak: profile.gamification.streakDays,
  });

  return {
    band,
    periodDays,
    activeDays,
    periodMinutes,
    periodInteractions: periodEvents.length,
    daysSinceLastActive,
    lastActiveAt,
    goalMinutes,
    goalProgressPct,
    currentStreak: profile.gamification.streakDays,
    alerts,
  };
}

export function activityInsightsForParent(activity: ParentActivityReport): {
  patterns:        string[];
  recommendations: string[];
  areasForGrowth:  string[];
} {
  const patterns: string[] = [];
  const recommendations: string[] = [];
  const areasForGrowth: string[] = [];

  for (const alert of activity.alerts) {
    if (alert.severity === 'critical' || alert.severity === 'warning') {
      patterns.push(alert.messageMs);
    }
  }

  if (activity.band === 'dormant' || activity.band === 'inactive' || activity.activeDays === 0) {
    areasForGrowth.push('Kehadiran ADAM: anak tidak konsisten menggunakan platform latihan.');
    recommendations.push(
      'Bincang dengan anak — kenapa ADAM tidak digunakan? Semak WiFi/peranti.',
    );
    recommendations.push(
      'Cadangan: 10–15 minit selepas makan malam, buka ADAM bersama-sama minggu ini.',
    );
  } else if (activity.band === 'low') {
    areasForGrowth.push('Aktiviti ADAM di bawah sasaran — perlu rutin lebih kerap.');
    recommendations.push(
      `Tingkatkan dari ${activity.activeDays} kepada sekurang-kurangnya 4 hari aktif minggu depan.`,
    );
  } else if (activity.band === 'very_active' || activity.band === 'active') {
    patterns.push(
      `Aktiviti baik: ${activity.activeDays} hari aktif, ${activity.periodMinutes} minit latihan.`,
    );
  }

  return { patterns, recommendations, areasForGrowth };
}
