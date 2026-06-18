/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM User Relational Brain (C per user)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Per-user relational C — crystallised A+B=C, not chat logs.
 * Founder master.unifiedUnderstanding remains supreme ceiling.
 */

import { getAdamMemoryConfig } from '../config/adam-memory.config';
import { FOUNDER_USER_ID } from './adam-student.types';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import {
  ensureStudentTrackRow,
  findBestStudentTrackIndex,
} from '../qxk24brain/qxk24brain-student.engine';
import { AlamtologiBrainMasterModel } from '../qxk24brain/qxk24brain.schema';
import {
  searchTeachingRecords,
  formatTeachingRecordEpisodeLines,
  type TeachingRecordRow,
} from '../qxk24brain/adam-teaching-record.service';
import {
  shouldSkipStudentInquiryRecall,
  shouldSkipUserRelationalCBlock,
} from './adam-user-brain.gate';
import { refreshStudentTopicRollup } from './adam-student-relational-graph.service';

export interface RelationalCEpisodeSlice {
  recordId?:       string;
  episodeSummary:  string;
  teachingIntent:  string;
  outcomeSummary:  string;
  relationalTags?: string[];
}

function relationalCCharCap(): number {
  return getAdamMemoryConfig('student', false).BRAIN_CHARS;
}

function formatEpisodeLine(ep: RelationalCEpisodeSlice): string {
  const tags = ep.relationalTags?.length
    ? ` · tags: ${ep.relationalTags.slice(0, 6).join(', ')}`
    : '';
  const id = ep.recordId ? `[${ep.recordId}] ` : '';
  return [
    `${id}Asked: ${ep.teachingIntent.trim().slice(0, 200)}`,
    `Understood: ${ep.outcomeSummary.trim().slice(0, 400)}${tags}`,
  ].join('\n');
}

/** Merge crystallised episode into per-user relational C (async, idempotent append). */
export async function mergeRelationalCToUserBrain(
  studentId: string,
  studentName: string,
  episode: RelationalCEpisodeSlice,
): Promise<void> {
  if (!studentId?.trim()) return;
  const intent = episode.teachingIntent?.trim();
  const outcome = episode.outcomeSummary?.trim();
  if (!intent && !outcome) return;

  await ensureStudentTrackRow(studentId, studentName);

  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const tracks = [...(master.studentTracks ?? []).map((t) => ({ ...t }))];
  const idx = findBestStudentTrackIndex(tracks, studentId);
  if (idx < 0) return;

  const line = formatEpisodeLine(episode);
  const prior = tracks[idx].relationalUnderstanding?.trim() ?? '';
  const merged = prior ? `${prior}\n\n${line}` : line;
  const cap = relationalCCharCap();
  const capped = merged.length > cap ? merged.slice(-cap) : merged;

  tracks[idx] = {
    ...tracks[idx],
    name:                  studentName.trim() || tracks[idx].name,
    relationalUnderstanding: capped,
    masa_last_updated:     new Date(),
    lastContactAt:         new Date(),
    transformationCount:   (tracks[idx].transformationCount ?? 0) + 1,
  };

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: FOUNDER_USER_ID },
    { studentTracks: tracks, masa_last_updated: new Date() },
  );

  void refreshStudentTopicRollup(studentId, studentName).catch((err) => {
    console.error('[ADAM User Brain] topic rollup failed:', err);
  });
}

/** Long-term relational C block for buildSmartContext — user-scoped only. */
export async function getUserRelationalCBlock(
  studentId: string,
  studentName: string,
): Promise<string> {
  if (shouldSkipUserRelationalCBlock(studentId)) return '';

  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const track = master.studentTracks?.find((t) => t.studentId === studentId);
  const c = track?.relationalUnderstanding?.trim();
  if (!c) return '';

  const name = studentName.trim() || track?.name?.trim() || 'pelajar';
  return `
═══ RELATIONAL C — ${name} (ADAM + user journey — not chat logs) ═══
Speak from this crystallised becoming when continuing threads. Reference topics naturally
("pada perjalanan kita…", "awak pernah sentuh…") — never "ingatan saya" / "I remember".
${c}
═══ END RELATIONAL C ═══`.trim();
}

function formatStudentInquiryRecallBlock(
  studentName: string,
  records: TeachingRecordRow[],
): string {
  return [
    `[RELATIONAL INQUIRY RECALL — ${studentName}]`,
    '',
    'Episodes from this user\'s prior questions — synthesise only; do not paste chat.',
    '',
    ...formatTeachingRecordEpisodeLines(records),
  ].join('\n');
}

/** Scoped episodic recall for one student — inquiry / conventional episodes only. */
export async function buildStudentInquiryRecallBlock(
  studentId: string,
  studentName: string,
  userMessage: string,
): Promise<string | null> {
  const q = userMessage.trim();
  if (shouldSkipStudentInquiryRecall(studentId, q)) return null;

  const records = await searchTeachingRecords(FOUNDER_USER_ID, q, 6, {
    skipRecentFallback: true,
    studentId,
    teacherRoles:       ['inquiry'],
  });

  if (records.length === 0) {
    const recent = await searchTeachingRecords(FOUNDER_USER_ID, q, 4, {
      skipRecentFallback: false,
      studentId,
      teacherRoles:       ['inquiry'],
    });
    if (recent.length === 0) return null;
    return formatStudentInquiryRecallBlock(studentName, recent.slice(0, 4));
  }

  return formatStudentInquiryRecallBlock(studentName, records);
}
