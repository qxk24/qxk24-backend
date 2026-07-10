/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor UID Recall
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import { FOUNDER_USER_ID } from './adam-student.types';
import {
  formatTeachingRecordEpisodeLines,
  searchTeachingRecords,
  type TeachingRecordRow,
} from '../qxk24brain/adam-teaching-record.service';
import { shouldSkipTutorUidRecall } from './adam-user-brain.gate';

/** Context block header when tutor lane loads UID-scoped Brain C recall. */
export const TUTOR_UID_RECALL_HEADER = '[TUTOR UID RECALL]';

function formatTutorUidRecallBlock(
  studentName: string,
  studentId: string,
  records: TeachingRecordRow[],
): string {
  return [
    '[TUTOR UI GUIDE RECALL]',
    '',
    `UID: ${studentId} · ${studentName}`,
    '',
    'Tutor-lane episodes for this student only — synthesise; do not paste chat.',
    '',
    ...formatTeachingRecordEpisodeLines(records),
  ].join('\n');
}

/** Scoped episodic recall — tutor episodes for one student UID only. */
export async function buildTutorUidRecallBlock(
  studentId: string,
  studentName: string,
  userMessage: string,
): Promise<string | null> {
  const q = userMessage.trim();
  if (shouldSkipTutorUidRecall(studentId, q)) return null;

  const records = await searchTeachingRecords(FOUNDER_USER_ID, q, 6, {
    skipRecentFallback: true,
    studentId,
    teacherRoles:       ['tutor'],
    channelLane:        'tutor',
  });

  if (records.length === 0) {
    const recent = await searchTeachingRecords(FOUNDER_USER_ID, q, 4, {
      skipRecentFallback: false,
      studentId,
      teacherRoles:       ['tutor'],
      channelLane:        'tutor',
    });
    if (recent.length === 0) return null;
    return formatTutorUidRecallBlock(studentName, studentId, recent.slice(0, 4));
  }

  return formatTutorUidRecallBlock(studentName, studentId, records);
}
