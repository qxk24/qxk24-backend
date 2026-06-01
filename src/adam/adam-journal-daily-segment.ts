/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Journal Daily Topic (University Knowledge Map)
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
import {
  getDailyUniversityKnowledgeTopic,
  getUniversityKnowledgeTopicCount,
  knowledgeTopicIndexForDate,
  type UniversityKnowledgeTopic,
} from './adam-university-knowledge';

/** @deprecated use university map rotation — kept for Alamtologi lens labels */
export const ALAMTOLOGI_KNOWLEDGE_SEGMENTS = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG',
] as const;

const MS_PER_DAY = 86_400_000;
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
  return new Date(startOfMalaysiaDay(date).getTime() + MS_PER_DAY - 1);
}

export interface DailyJournalTopicStatus {
  date:              string;
  topicIndex:        number;
  topicCount:        number;
  cycleDay:          number;
  todaysTopic:       UniversityKnowledgeTopic;
  /** Primary Alamtologi lens for today's major category */
  todaysSegment:     AlamtologiPrinciple;
  sealedToday:       boolean;
  sealedTodayTitles: string[];
}

export async function getDailyJournalSegmentStatus(
  date = new Date(),
): Promise<DailyJournalTopicStatus> {
  const todaysTopic = getDailyUniversityKnowledgeTopic(date);
  const topicCount = getUniversityKnowledgeTopicCount();
  const dayStart = startOfMalaysiaDay(date);
  const dayEnd = endOfMalaysiaDay(date);

  const todayDocs = await ADAMJournalModel.find({
    submittedAt: { $gte: dayStart, $lte: dayEnd },
    knowledgeTopicId: todaysTopic.topicId,
    status:           { $in: ['PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'] },
  })
    .sort({ submittedAt: -1 })
    .limit(5)
    .select('title status submittedAt')
    .lean();

  return {
    date:              malaysiaCalendarDate(date),
    topicIndex:        knowledgeTopicIndexForDate(date),
    topicCount,
    cycleDay:          Math.floor(knowledgeTopicIndexForDate(date)) + 1,
    todaysTopic,
    todaysSegment:     todaysTopic.alamtologiLens,
    sealedToday:       todayDocs.length > 0,
    sealedTodayTitles: todayDocs.map((d) => d.title),
  };
}

export function buildDailyJournalSegmentPromptBlock(status: DailyJournalTopicStatus): string {
  const t = status.todaysTopic;
  const already = status.sealedToday
    ? `Today's subfield already has a manuscript: ${status.sealedTodayTitles.join('; ')}. Extend only if P.alt explicitly asks.`
    : `Today's subfield has NO sealed manuscript yet — write ONE IMRaD article on this subfield only.`;

  return [
    '[JOURNAL DAILY TOPIC — UNIVERSITY KNOWLEDGE MAP]',
    `Calendar ${status.date} · topic ${status.topicIndex + 1}/${status.topicCount} (~${Math.ceil(status.topicCount / 365)}-year full cycle).`,
    `TODAY'S SUBFIELD (sole thesis of the manuscript):`,
    `  ${t.label}`,
    `knowledgeTopicId MUST be "${t.topicId}" in <adam_journal_seal> JSON.`,
    `principlesFocus[0] SHOULD be ${t.alamtologiLens} (Alamtologi lens for ${t.majorName}).`,
    'Include all seven principles in alamtologiAnalysis — depth on the subfield above, not a survey of unrelated fields.',
    'Do NOT write about a different university subfield than today\'s assignment unless P.alt explicitly overrides.',
    already,
    '[/JOURNAL DAILY TOPIC]',
  ].join('\n');
}

export function sealMatchesDailyTopic(
  knowledgeTopicId: string | undefined,
  date = new Date(),
): boolean {
  if (!knowledgeTopicId?.trim()) return false;
  return knowledgeTopicId === getDailyUniversityKnowledgeTopic(date).topicId;
}

/** @deprecated alias */
export function getDailyJournalSegment(date = new Date()): AlamtologiPrinciple {
  return getDailyUniversityKnowledgeTopic(date).alamtologiLens;
}

/** @deprecated alias */
export function sealMatchesDailySegment(
  principlesFocus: string[] | undefined,
  date = new Date(),
): boolean {
  return sealMatchesDailyTopic(undefined, date) || Boolean(principlesFocus?.[0]);
}
