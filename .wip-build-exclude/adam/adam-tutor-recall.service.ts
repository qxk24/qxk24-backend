/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor UID Recall (F3 — UI Guide)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Tutor lane recall — UID-scoped UI Guide episodes + Founder ceiling only.
 * See docs/ADAM_TUTOR_C_UID_SPEC.md §VII
 */

import { FOUNDER_USER_ID } from './adam-student.types';
import type { BrainRecallExportSurface } from './adam-brain-recall-filter';
import { shouldSkipTutorUidRecall } from './adam-user-brain.gate';
import {
  buildFounderCeilingTeachingRecallBlock,
  formatTeachingRecordEpisodeLines,
  searchTeachingRecords,
  type TeachingRecordRow,
} from '../qxk24brain/adam-teaching-record.service';

export const TUTOR_UID_RECALL_HEADER = '[TUTOR UI GUIDE RECALL — UID-scoped crystallised C]';

function formatTutorUidRecallBlock(
  studentName: string,
  studentId: string,
  records: TeachingRecordRow[],
): string {
  return [
    TUTOR_UID_RECALL_HEADER,
    `Pelajar: ${studentName.trim() || 'pelajar'} · UID: ${studentId.trim()}`,
    '',
    'Episod UI Guide pelajar ini sahaja — sintesis C, bukan transkrip chat. Jangan campur UID lain.',
    '',
    ...formatTeachingRecordEpisodeLines(records),
  ].join('\n');
}

/** Episodic recall — transformMeta.studentId + channelLane=tutor + teacherRole=tutor. */
export async function buildTutorUidRecallBlock(
  studentId: string,
  studentName: string,
  userMessage: string,
): Promise<string | null> {
  const q = userMessage.trim();
  if (shouldSkipTutorUidRecall(studentId, q)) return null;

  const uid = studentId.trim();
  const scoped = {
    skipRecentFallback: true as const,
    studentId:          uid,
    teacherRoles:       ['tutor'],
    channelLane:        'tutor' as const,
  };

  let records = await searchTeachingRecords(FOUNDER_USER_ID, q, 6, scoped);
  if (records.length === 0) {
    records = await searchTeachingRecords(FOUNDER_USER_ID, q, 4, {
      ...scoped,
      skipRecentFallback: false,
    });
  }
  if (records.length === 0) return null;

  return formatTutorUidRecallBlock(studentName, uid, records.slice(0, 6));
}

/** Universal ceiling for Tutor — Founder teaching episodes only. */
export async function buildFounderCeilingRecallBlock(
  userMessage: string,
  exportSurface: BrainRecallExportSurface = 'sintesis',
): Promise<string | null> {
  return buildFounderCeilingTeachingRecallBlock(
    FOUNDER_USER_ID,
    userMessage,
    exportSurface,
  );
}
