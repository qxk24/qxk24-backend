/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Syllabus Teaching Progress
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  FORMULA_XYZ_SYLLABUS,
  getFormulaXyzChapter,
  resolveSyllabusChapter,
} from './formula-xyz-syllabus';
import { SyllabusProgressModel } from './syllabus-progress.schema';
import type { SyllabusChapterStatus } from './formula-xyz-syllabus';

const CHAPTER_PATTERNS: Array<{ re: RegExp; chapterId: string }> = [
  { re: /epilog|formula\s+yang\s+tersembunyi/i, chapterId: 'epilog' },
  { re: /bab\s*6|faktor\s*tenaga|pasata/i, chapterId: 'bab-6-tenaga' },
  { re: /bab\s*5|faktor\s*masa|napadu/i, chapterId: 'bab-5-masa' },
  { re: /bab\s*4|sains\s+alamtologi|hisal|izwa|sira|rina/i, chapterId: 'bab-4-sains' },
  { re: /bab\s*3|hukum\s+alamtologi|hukum\s+z/i, chapterId: 'bab-3-hukum' },
  { re: /bab\s*2|faktor\s*xyz|faktor\s*\(\s*x|ketetapan\s+y/i, chapterId: 'bab-2-faktor-xyz' },
  { re: /bab\s*1|asas\s+keilmuan|teori\s+masabayu/i, chapterId: 'bab-1-asas' },
  { re: /prolog/i, chapterId: 'prolog' },
];

/** Highest Formula XYZ chapter mentioned in founder teaching text. */
export function detectHighestSyllabusChapter(text: string): string | null {
  const blob = text.trim();
  if (!blob) return null;

  let best: { chapterId: string; sortOrder: number } | null = null;
  for (const { re, chapterId } of CHAPTER_PATTERNS) {
    if (!re.test(blob)) continue;
    const ch = getFormulaXyzChapter(chapterId);
    const sortOrder = ch?.sortOrder ?? -1;
    if (!best || sortOrder > best.sortOrder) {
      best = { chapterId, sortOrder };
    }
  }

  if (best) return best.chapterId;

  return resolveSyllabusChapter({ family: '', nodeA: blob });
}

/** All syllabus chapters up to and including the given chapter. */
export function chapterIdsThrough(chapterId: string): string[] {
  const target = getFormulaXyzChapter(chapterId);
  if (!target) return [];
  return FORMULA_XYZ_SYLLABUS
    .filter((c) => c.sortOrder <= target.sortOrder)
    .map((c) => c.chapterId);
}

const STATUS_RANK: Record<SyllabusChapterStatus, number> = {
  pending:         0,
  in_progress:     1,
  crystallised:    2,
  training_ready:  3,
};

function maxStatus(a: SyllabusChapterStatus, b: SyllabusChapterStatus): SyllabusChapterStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

/** Mark prolog → target chapter as at least in_progress (long teaching / bab uploads). */
export async function markChaptersTaughtThrough(
  highestChapterId: string,
): Promise<number> {
  const ids = chapterIdsThrough(highestChapterId);
  let updated = 0;

  // Batch query to avoid N+1 issue
  const rows = await SyllabusProgressModel.find({ chapterId: { $in: ids } }).lean();
  const rowMap = new Map<string, any>(rows.map(row => [row.chapterId, row]));

  for (const chapterId of ids) {
    const row = rowMap.get(chapterId);
    if (!row) continue;
    if (row.status === 'training_ready') continue;

    const nextStatus = maxStatus(row.status, 'in_progress');
    if (nextStatus === row.status) continue;

    await SyllabusProgressModel.updateOne(
      { chapterId },
      { $set: { status: nextStatus } },
    );
    updated++;
  }

  if (updated > 0) {

  }

  return updated;
}

export async function markChapterProgressFromTeaching(
  teachingIntent: string,
  meta?: { family?: string; principle?: string },
): Promise<void> {
  const blob = [teachingIntent, meta?.family ?? '', meta?.principle ?? ''].join(' ');
  const highest = detectHighestSyllabusChapter(blob);
  if (!highest) return;
  await markChaptersTaughtThrough(highest);
}

/** One-time style backfill from existing founder teaching records. */
export async function backfillSyllabusFromTeachingRecords(
  founderId = 'masa-bayu',
  limit = 200,
): Promise<{ highestChapter: string | null; chaptersMarked: number }> {
  const { AdamTeachingRecordModel } = await import('../qxk24brain/adam-teaching-record.schema');

  const docs = await AdamTeachingRecordModel.find({ founderId })
    .sort({ masa_recorded: -1 })
    .limit(limit)
    .select({ teachingIntent: 1, family: 1, principle: 1, episodeSummary: 1 })
    .lean();

  let highest: string | null = null;
  let bestOrder = -1;

  for (const doc of docs) {
    const blob = [
      doc.teachingIntent ?? '',
      doc.episodeSummary ?? '',
      doc.family ?? '',
      doc.principle ?? '',
    ].join(' ');
    const ch = detectHighestSyllabusChapter(blob);
    if (!ch) continue;
    const order = getFormulaXyzChapter(ch)?.sortOrder ?? -1;
    if (order > bestOrder) {
      bestOrder = order;
      highest = ch;
    }
  }

  if (!highest) return { highestChapter: null, chaptersMarked: 0 };
  const chaptersMarked = await markChaptersTaughtThrough(highest);
  return { highestChapter: highest, chaptersMarked };
}
