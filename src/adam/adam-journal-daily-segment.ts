/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Journal Daily Segment (Alamtologi)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ADAMJournalModel } from './adam.schema';
import type { AlamtologiPrinciple } from './adam.types';

/** Seven knowledge segments — one manuscript topic per calendar day. */
export const ALAMTOLOGI_KNOWLEDGE_SEGMENTS: readonly AlamtologiPrinciple[] = [
  'MASA',
  'TENAGA',
  'AIR',
  'API',
  'BUMI',
  'CAHAYA',
  'RUANG',
] as const;

const CONSTITUTIONAL_EPOCH_MS = Date.parse('2026-01-01T00:00:00+08:00');
const MS_PER_DAY = 86_400_000;

export function segmentIndexForDate(date = new Date()): number {
  const day = Math.floor((date.getTime() - CONSTITUTIONAL_EPOCH_MS) / MS_PER_DAY);
  const idx = ((day % 7) + 7) % 7;
  return idx;
}

export function getDailyJournalSegment(date = new Date()): AlamtologiPrinciple {
  return ALAMTOLOGI_KNOWLEDGE_SEGMENTS[segmentIndexForDate(date)];
}

const TZ_KL = 'Asia/Kuala_Lumpur';

function malaysiaCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_KL,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(date);
}

function startOfMalaysiaDay(date: Date): Date {
  const ymd = malaysiaCalendarDate(date);
  return new Date(`${ymd}T00:00:00+08:00`);
}

function endOfMalaysiaDay(date: Date): Date {
  const start = startOfMalaysiaDay(date);
  return new Date(start.getTime() + MS_PER_DAY - 1);
}

export interface DailySegmentStatus {
  date:              string;
  todaysSegment:     AlamtologiPrinciple;
  segmentIndex:      number;
  sealedToday:       boolean;
  sealedTodayTitles: string[];
  recentBySegment:   Partial<Record<AlamtologiPrinciple, { title: string; status: string; submittedAt: string }>>;
}

/** Coverage for founder pulse / journal mode prompts. */
export async function getDailyJournalSegmentStatus(
  date = new Date(),
): Promise<DailySegmentStatus> {
  const todaysSegment = getDailyJournalSegment(date);
  const dayStart = startOfMalaysiaDay(date);
  const dayEnd = endOfMalaysiaDay(date);

  const todayDocs = await ADAMJournalModel.find({
    submittedAt: { $gte: dayStart, $lte: dayEnd },
    status:      { $in: ['PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'] },
    principlesFocus: todaysSegment,
  })
    .sort({ submittedAt: -1 })
    .limit(5)
    .select('title status submittedAt')
    .lean();

  const weekDocs = await ADAMJournalModel.find({
    submittedAt: { $gte: new Date(dayStart.getTime() - 7 * MS_PER_DAY) },
    status:      { $in: ['PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'] },
  })
    .sort({ submittedAt: -1 })
    .limit(40)
    .select('title status submittedAt principlesFocus')
    .lean();

  const recentBySegment: DailySegmentStatus['recentBySegment'] = {};
  for (const seg of ALAMTOLOGI_KNOWLEDGE_SEGMENTS) {
    const hit = weekDocs.find((d) =>
      Array.isArray(d.principlesFocus) && d.principlesFocus.includes(seg),
    );
    if (hit) {
      recentBySegment[seg] = {
        title:       hit.title,
        status:      hit.status,
        submittedAt: hit.submittedAt?.toISOString?.() ?? '',
      };
    }
  }

  return {
    date:              malaysiaCalendarDate(date),
    todaysSegment,
    segmentIndex:      segmentIndexForDate(date),
    sealedToday:       todayDocs.length > 0,
    sealedTodayTitles: todayDocs.map((d) => d.title),
    recentBySegment,
  };
}

export function buildDailyJournalSegmentPromptBlock(status: DailySegmentStatus): string {
  const seg = status.todaysSegment;
  const already = status.sealedToday
    ? `Today's segment (${seg}) already has a manuscript in review or published: ${status.sealedTodayTitles.join('; ')}. Extend only if P.alt explicitly asks — do not start a second unrelated topic for ${seg} today.`
    : `Today's segment (${seg}) has NO sealed manuscript yet — this session must produce ONE focused IMRaD topic led by ${seg}.`;

  return [
    '[JOURNAL DAILY SEGMENT — CONSTITUTIONAL]',
    `Calendar day ${status.date} · segment ${status.segmentIndex + 1}/7 · knowledge segment: ${seg}.`,
    'Rule: exactly ONE topical manuscript per segment per day — not seven topics in one article.',
    `principlesFocus[0] MUST be "${seg}". Title and introduction must centre ${seg} as the day's knowledge segment.`,
    'Still include all seven principles in alamtologiAnalysis — but depth and thesis belong to today\'s segment.',
    already,
    '[/JOURNAL DAILY SEGMENT]',
  ].join('\n');
}

export function sealMatchesDailySegment(
  principlesFocus: string[] | undefined,
  date = new Date(),
): boolean {
  const today = getDailyJournalSegment(date);
  const focus = principlesFocus?.[0] ?? principlesFocus?.find((p) =>
    ALAMTOLOGI_KNOWLEDGE_SEGMENTS.includes(p as AlamtologiPrinciple),
  );
  return focus === today;
}
