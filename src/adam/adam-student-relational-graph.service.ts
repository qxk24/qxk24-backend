/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Relational Graph
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
 * Per-user inquiry episode graph — topic rollup and thread edges.
 */

import { FOUNDER_USER_ID } from './adam-student.types';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import {
  AlamtologiBrainMasterModel,
  type StudentTrack,
} from '../qxk24brain/qxk24brain.schema';
import {
  ensureStudentTrackRow,
  findBestStudentTrackIndex,
} from '../qxk24brain/qxk24brain-student.engine';
import { AdamTeachingRecordModel } from '../qxk24brain/adam-teaching-record.schema';
import type { TeachingRecordRow } from '../qxk24brain/adam-teaching-record.service';

const EPISODE_FETCH_CAP = 40;
const TOPIC_ROLLUP_CAP = 1_200;

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractTopicTokens(records: TeachingRecordRow[]): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];

  const push = (raw: string) => {
    const t = collapse(raw).toLowerCase();
    if (!t || t.length < 3 || seen.has(t)) return;
    seen.add(t);
    topics.push(t);
  };

  for (const r of records) {
    for (const tag of r.relationalTags ?? []) {
      if (!tag.includes('inquiry') && !tag.includes('conventional') && tag.length >= 3) {
        push(tag);
      }
    }
    const intent = collapse(r.teachingIntent);
    if (intent.length >= 8) {
      push(intent.slice(0, 80));
    }
  }

  return topics.slice(0, 24);
}

function formatThreadEdges(records: TeachingRecordRow[]): string[] {
  const ids = new Set(records.map((r) => r.recordId));
  const edges: string[] = [];

  for (const r of records) {
    if (r.priorThreadId && ids.has(r.priorThreadId)) {
      const prior = records.find((p) => p.recordId === r.priorThreadId);
      const from = prior ? collapse(prior.teachingIntent).slice(0, 60) : r.priorThreadId.slice(-12);
      const to = collapse(r.teachingIntent).slice(0, 60);
      edges.push(`  ${from} → ${to}`);
    }
  }

  return edges.slice(-8);
}

/** Build topic rollup + thread edges from scoped inquiry episodes. */
export async function buildStudentTopicRollup(studentId: string): Promise<string> {
  if (!studentId?.trim()) return '';

  const records = await AdamTeachingRecordModel.find({
    founderId: FOUNDER_USER_ID,
    status:    'active',
    teacherRole: 'inquiry',
    'transformMeta.studentId': studentId.trim(),
  })
    .sort({ masa_recorded: -1 })
    .limit(EPISODE_FETCH_CAP)
    .lean() as TeachingRecordRow[];

  if (!records.length) return '';

  const topics = extractTopicTokens(records);
  const edges = formatThreadEdges(records);
  const lines: string[] = [];

  if (topics.length) {
    lines.push(`Topics explored (${topics.length}): ${topics.join(' · ')}`);
  }

  if (edges.length) {
    lines.push('Thread continuity (prior question → next):');
    lines.push(...edges);
  }

  const body = lines.join('\n');
  return body.length > TOPIC_ROLLUP_CAP ? body.slice(-TOPIC_ROLLUP_CAP) : body;
}

/** Persist relationalSummary on student track — no LLM. */
export async function refreshStudentTopicRollup(studentId: string, studentName: string): Promise<void> {
  const rollup = await buildStudentTopicRollup(studentId);
  if (!rollup.trim()) return;

  await ensureStudentTrackRow(studentId, studentName);

  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const tracks = [...(master.studentTracks ?? []).map((t) => ({ ...t }))] as StudentTrack[];
  const idx = findBestStudentTrackIndex(tracks, studentId);
  if (idx < 0) return;

  tracks[idx] = {
    ...tracks[idx],
    relationalSummary: rollup,
    masa_last_updated: new Date(),
  };

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: FOUNDER_USER_ID },
    { studentTracks: tracks, masa_last_updated: new Date() },
  );
}
