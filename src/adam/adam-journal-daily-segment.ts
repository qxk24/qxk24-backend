/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Daily Quota (University Knowledge Map)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * FOUNDER RULE (P.alt):
 * Every Malaysia calendar day → one IMRaD journal per subfield.
 * 659 subfields → 659 journals required each day (not one per day).
 */

import { ADAMJournalModel } from './adam.schema';
import type { AlamtologiPrinciple } from './adam.types';
import {
  findUniversityTopicById,
  getUniversityKnowledgeTopicCount,
  loadUniversityKnowledgeTopics,
  type UniversityKnowledgeTopic,
} from './adam-university-knowledge';

export const ALAMTOLOGI_KNOWLEDGE_SEGMENTS = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG',
] as const;

const MS_PER_DAY = 86_400_000;
const TZ_KL = 'Asia/Kuala_Lumpur';

const ACTIVE_STATUSES = ['PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'] as const;

function malaysiaCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_KL,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(date);
}

export function startOfMalaysiaDay(date: Date): Date {
  const ymd = malaysiaCalendarDate(date);
  return new Date(`${ymd}T00:00:00+08:00`);
}

export function endOfMalaysiaDay(date: Date): Date {
  return new Date(startOfMalaysiaDay(date).getTime() + MS_PER_DAY - 1);
}

export interface DailyJournalQuotaStatus {
  date:                 string;
  topicCount:           number;
  /** Constitutional target: one journal per subfield per day */
  journalsRequiredToday: number;
  sealedCountToday:     number;
  pendingCountToday:    number;
  /** Distinct subfields already sealed today */
  sealedTopicIds:       string[];
  /** Next subfield still missing today's journal (for draft/seal prompts) */
  nextPendingTopic:     UniversityKnowledgeTopic | null;
  /** Sample of pending labels (cap 12) for UI */
  pendingPreview:       string[];
  /** When sealing one subfield in this turn, focus here */
  focusTopic:           UniversityKnowledgeTopic | null;
  todaysSegment:        AlamtologiPrinciple;
  /** @deprecated use focusTopic — first pending lens */
  todaysTopic:          UniversityKnowledgeTopic;
  sealedToday:          boolean;
  sealedTodayTitles:    string[];
}

async function sealedTopicIdsForDay(date: Date): Promise<Set<string>> {
  const dayStart = startOfMalaysiaDay(date);
  const dayEnd = endOfMalaysiaDay(date);

  const docs = await ADAMJournalModel.find({
    submittedAt:      { $gte: dayStart, $lte: dayEnd },
    knowledgeTopicId: { $exists: true, $ne: '' },
    status:           { $in: [...ACTIVE_STATUSES] },
  })
    .select('knowledgeTopicId title')
    .lean();

  return new Set(
    docs.map((d) => d.knowledgeTopicId).filter((id): id is string => Boolean(id)),
  );
}

/** Resolve one map row by topicId (manual mode — P.alt selection). */
export function getTopicById(topicId: string): UniversityKnowledgeTopic | null {
  const topic = findUniversityTopicById(topicId?.trim() ?? '');
  return topic ?? null;
}

/** Next subfield that still needs today's journal (autonomous batch only). */
export function getNextPendingDailyTopic(
  sealedIds: Set<string>,
): UniversityKnowledgeTopic | null {
  for (const topic of loadUniversityKnowledgeTopics()) {
    if (!sealedIds.has(topic.topicId)) return topic;
  }
  return null;
}

export async function getDailyJournalSegmentStatus(
  date = new Date(),
  focusTopicId?: string,
): Promise<DailyJournalQuotaStatus> {
  const topicCount = getUniversityKnowledgeTopicCount();
  const sealedSet = await sealedTopicIdsForDay(date);
  const sealedTopicIds = [...sealedSet];
  const sealedCountToday = sealedTopicIds.length;
  const pendingCountToday = Math.max(0, topicCount - sealedCountToday);

  const focusFromId = focusTopicId ? findUniversityTopicById(focusTopicId) : undefined;
  const nextPendingTopic = focusFromId ?? getNextPendingDailyTopic(sealedSet);
  const focusTopic = focusFromId ?? nextPendingTopic;

  const allTopics = loadUniversityKnowledgeTopics();
  const pendingPreview = allTopics
    .filter((t) => !sealedSet.has(t.topicId))
    .slice(0, 12)
    .map((t) => t.label);

  const dayStart = startOfMalaysiaDay(date);
  const dayEnd = endOfMalaysiaDay(date);
  const todayTitles = await ADAMJournalModel.find({
    submittedAt: { $gte: dayStart, $lte: dayEnd },
    status:      { $in: [...ACTIVE_STATUSES] },
  })
    .sort({ submittedAt: -1 })
    .limit(20)
    .select('title')
    .lean();

  const fallbackTopic = allTopics[0]!;
  const activeTopic = focusTopic ?? fallbackTopic;

  return {
    date:                  malaysiaCalendarDate(date),
    topicCount,
    journalsRequiredToday: topicCount,
    sealedCountToday,
    pendingCountToday,
    sealedTopicIds,
    nextPendingTopic,
    pendingPreview,
    focusTopic,
    todaysTopic:           activeTopic,
    todaysSegment:         activeTopic.alamtologiLens,
    sealedToday:           sealedCountToday >= topicCount,
    sealedTodayTitles:     todayTitles.map((d) => d.title),
  };
}

export function buildDailyJournalSegmentPromptBlock(status: DailyJournalQuotaStatus): string {
  const focus = status.focusTopic;
  const focusBlock = focus
    ? [
      `CURRENT SUBFIELD (this seal / draft):`,
      `  ${focus.label}`,
      `knowledgeTopicId MUST be "${focus.topicId}".`,
      `principlesFocus[0] SHOULD be ${focus.alamtologiLens}.`,
    ].join('\n')
    : 'All subfields sealed for today — only extend if P.alt requests.';

  const quotaLine = status.sealedToday
    ? `Today's quota COMPLETE: ${status.sealedCountToday}/${status.journalsRequiredToday} subfields sealed.`
    : `Today's quota IN PROGRESS: ${status.sealedCountToday}/${status.journalsRequiredToday} sealed — ${status.pendingCountToday} subfields still need one journal each before end of day (MY).`;

  return [
    '[JOURNAL DAILY QUOTA — UNIVERSITY KNOWLEDGE MAP]',
    'CONSTITUTIONAL RULE (P.alt): Every Malaysia calendar day, EACH of the 659 university subfields receives exactly ONE IMRaD journal.',
    'That is 659 journals per day (one per subfield), NOT one journal per day.',
    quotaLine,
    focusBlock,
    'Each manuscript: one subfield only; full seven-principle alamtologiAnalysis; unique knowledgeTopicId per seal.',
    'After sealing this subfield, continue with the next pending subfield until 659/659 for the day.',
    '[/JOURNAL DAILY QUOTA]',
  ].join('\n');
}

/** Valid if topic exists in map and is not already sealed today (duplicate). */
export async function validateDailyTopicSeal(
  knowledgeTopicId: string | undefined,
  date = new Date(),
): Promise<{ ok: boolean; reason?: string; topic?: UniversityKnowledgeTopic }> {
  const id = knowledgeTopicId?.trim();
  if (!id) {
    return { ok: false, reason: 'knowledgeTopicId is required on every daily journal seal.' };
  }

  const topic = findUniversityTopicById(id);
  if (!topic) {
    return { ok: false, reason: `Unknown knowledgeTopicId: ${id}` };
  }

  const sealed = await sealedTopicIdsForDay(date);
  if (sealed.has(id)) {
    return {
      ok:      false,
      reason:  `Subfield already has today's journal: ${topic.label}. Use another topicId or extend in review.`,
      topic,
    };
  }

  return { ok: true, topic };
}

/** @deprecated — seals must match a real map topic, not a single rotating topic */
export function sealMatchesDailyTopic(
  knowledgeTopicId: string | undefined,
): boolean {
  if (!knowledgeTopicId?.trim()) return false;
  return Boolean(findUniversityTopicById(knowledgeTopicId));
}

export function getDailyJournalSegment(date = new Date()): AlamtologiPrinciple {
  const topics = loadUniversityKnowledgeTopics();
  if (topics.length === 0) return 'MASA';
  return topics[0]!.alamtologiLens;
}

export function sealMatchesDailySegment(
  principlesFocus: string[] | undefined,
): boolean {
  return Boolean(principlesFocus?.[0]);
}
