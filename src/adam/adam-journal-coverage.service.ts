/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Journal Coverage by Major
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
import { endOfMalaysiaDay, startOfMalaysiaDay } from './adam-journal-daily-segment';
import { loadUniversityKnowledgeTopics } from './adam-university-knowledge';

const ACTIVE_STATUSES = ['PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'] as const;

export interface MajorCoverageRow {
  majorName:       string;
  expected:        number;
  sealedDistinct:  number;
  pendingReview:   number;
  approved:        number;
  published:       number;
  gap:             number;
}

export interface JournalCoverageReport {
  date:              string;
  topicCount:        number;
  sealedDistinct:    number;
  pendingReview:     number;
  approved:          number;
  published:         number;
  gap:               number;
  majors:            MajorCoverageRow[];
}

function expectedByMajor(): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of loadUniversityKnowledgeTopics()) {
    map.set(t.majorName, (map.get(t.majorName) ?? 0) + 1);
  }
  return map;
}

export async function getJournalCoverageByMajor(date = new Date()): Promise<JournalCoverageReport> {
  const dayStart = startOfMalaysiaDay(date);
  const dayEnd = endOfMalaysiaDay(date);
  const dateLabel = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(date);

  const expected = expectedByMajor();
  const topicCount = [...expected.values()].reduce((a, b) => a + b, 0);

  const rows = await ADAMJournalModel.aggregate<{
    _id: { major: string; status: string };
    count: number;
  }>([
    {
      $match: {
        submittedAt:      { $gte: dayStart, $lte: dayEnd },
        knowledgeMajor:   { $exists: true, $ne: '' },
        status:           { $in: [...ACTIVE_STATUSES] },
      },
    },
    {
      $group: {
        _id:   { major: '$knowledgeMajor', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const distinctRows = await ADAMJournalModel.aggregate<{
    _id: string;
    topics: string[];
  }>([
    {
      $match: {
        submittedAt:      { $gte: dayStart, $lte: dayEnd },
        knowledgeTopicId: { $exists: true, $ne: '' },
        status:           { $in: [...ACTIVE_STATUSES] },
      },
    },
    {
      $group: {
        _id:    '$knowledgeMajor',
        topics: { $addToSet: '$knowledgeTopicId' },
      },
    },
  ]);

  const distinctByMajor = new Map(
    distinctRows.map((r) => [r._id, r.topics.filter(Boolean).length]),
  );

  const statusByMajor = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const major = row._id.major;
    if (!statusByMajor.has(major)) statusByMajor.set(major, {});
    statusByMajor.get(major)![row._id.status] = row.count;
  }

  const majorNames = new Set([...expected.keys(), ...statusByMajor.keys()]);

  let sealedDistinct = 0;
  let pendingReview = 0;
  let approved = 0;
  let published = 0;

  const majors: MajorCoverageRow[] = [...majorNames].sort().map((majorName) => {
    const exp = expected.get(majorName) ?? 0;
    const sealed = distinctByMajor.get(majorName) ?? 0;
    const st = statusByMajor.get(majorName) ?? {};
    const pr = st.PENDING_REVIEW ?? 0;
    const ap = st.APPROVED ?? 0;
    const pub = st.PUBLISHED ?? 0;

    sealedDistinct += sealed;
    pendingReview += pr;
    approved += ap;
    published += pub;

    return {
      majorName,
      expected:       exp,
      sealedDistinct: sealed,
      pendingReview:  pr,
      approved:       ap,
      published:      pub,
      gap:            Math.max(0, exp - sealed),
    };
  });

  return {
    date:           dateLabel,
    topicCount,
    sealedDistinct,
    pendingReview,
    approved,
    published,
    gap:            Math.max(0, topicCount - sealedDistinct),
    majors,
  };
}
