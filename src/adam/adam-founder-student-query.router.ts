/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Student Query Router
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
 * When P.alt asks about a specific student — inject scoped progress block.
 */

import { getStudentAccounts } from './adam-student.service';
import { FOUNDER_USER_ID } from './adam-student.types';
import type { StudentAccountRecord } from './adam-student.types';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import { getStudentConstitutionalState } from '../qxk24brain/qxk24brain-student.engine';
import { getUserRelationalCBlock } from './adam-user-brain.service';
import { buildStudentTopicRollup } from './adam-student-relational-graph.service';
import { searchTeachingRecords } from '../qxk24brain/adam-teaching-record.service';

const PROGRESS_QUERY_RE = /\b(bagaimana|how\s+is|perkembangan|progress|kemajuan|senarai\s+topik|topik\s+apa|topics?\s+(for|of|yang)|what\s+has|apa\s+yang)\b/i;
const STUDENT_REF_RE = /\b(pelajar|student|user|learner)\b/i;

export function founderAsksStudentProgress(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (PROGRESS_QUERY_RE.test(t)) return true;
  if (STUDENT_REF_RE.test(t) && /\b(bagaimana|how|progress|topik|topics)\b/i.test(t)) return true;
  return false;
}

export function resolveStudentFromFounderQuery(
  message: string,
  accounts: readonly StudentAccountRecord[] = getStudentAccounts(),
): StudentAccountRecord | null {
  const lower = message.toLowerCase();
  let best: StudentAccountRecord | null = null;
  let bestLen = 0;

  for (const a of accounts) {
    const name = a.name.toLowerCase();
    const id = a.userId.toLowerCase();
    if (lower.includes(name) && name.length > bestLen) {
      best = a;
      bestLen = name.length;
    } else if (lower.includes(id) && id.length > bestLen) {
      best = a;
      bestLen = id.length;
    }
  }

  return best;
}

function formatEpisodeLines(
  records: Awaited<ReturnType<typeof searchTeachingRecords>>,
): string {
  if (!records.length) return '  No indexed inquiry episodes yet.';
  return records.slice(0, 6).map((r, i) => {
    const thread = r.priorThreadId ? ` · continues ${r.priorThreadId.slice(-10)}` : '';
    return `  ${i + 1}. ${r.teachingIntent.slice(0, 100)} → ${r.outcomeSummary.slice(0, 120)}${thread}`;
  }).join('\n');
}

/** Founder-only context block when P.alt asks about one student by name. */
export async function buildFounderStudentQueryBlock(message: string): Promise<string | null> {
  if (!founderAsksStudentProgress(message)) return null;

  const student = resolveStudentFromFounderQuery(message);
  if (!student) return null;

  const [constitutional, relationalC, topicRollup, episodes] = await Promise.all([
    getStudentConstitutionalState(student.userId),
    getUserRelationalCBlock(student.userId, student.name),
    buildStudentTopicRollup(student.userId),
    searchTeachingRecords(FOUNDER_USER_ID, student.name, 6, {
      studentId:    student.userId,
      teacherRoles: ['inquiry'],
    }),
  ]);

  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const track = master.studentTracks?.find((t) => t.studentId === student.userId);
  const bridge = track?.usersContinuityBridge;

  const lines = [
    `[FOUNDER STUDENT QUERY — ${student.name} (${student.userId})]`,
    '',
    'P.alt asked about this learner. Answer from crystallised C and episodes — not chat logs.',
    '',
    `Constitutional level: ${constitutional?.constitutionalLevel ?? track?.constitutionalLevel ?? 1}`,
    `Transformations: ${track?.transformationCount ?? constitutional?.transformationCount ?? 0}`,
  ];

  if (constitutional?.masteredTopics?.length) {
    lines.push(`Mastered topics: ${constitutional.masteredTopics.slice(0, 10).join(', ')}`);
  }
  if (constitutional?.openQuestions?.length) {
    lines.push(`Open questions: ${constitutional.openQuestions.slice(0, 5).join('; ')}`);
  }
  if (topicRollup.trim()) {
    lines.push('', 'Topic graph rollup:', topicRollup.trim());
  }
  if (bridge?.relationshipArc?.trim()) {
    lines.push('', `L7 journey arc: ${bridge.relationshipArc.trim()}`);
  }
  if (relationalC.trim()) {
    lines.push('', relationalC.trim());
  }

  lines.push('', 'Recent inquiry episodes:');
  lines.push(formatEpisodeLines(episodes));
  lines.push('', '[END FOUNDER STUDENT QUERY]');

  return lines.join('\n');
}
