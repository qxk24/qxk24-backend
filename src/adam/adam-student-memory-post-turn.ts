/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Memory Post-Turn
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
 * Student session digest — never writes Founder master.sessionContext.
 */

import { refreshSessionDigestIfNeeded } from '../qxk24brain/adam-tiered-memory.service';
import { ensureStudentTrackRow } from '../qxk24brain/qxk24brain-student.engine';
import { syncSessionDigestToStudentTrack } from '../qxk24brain/student-digest-bridge';
import { triggerStudentContinuityBridgeRefresh } from './adam-student-continuity-l7.service';
import { refreshStudentTopicRollup } from './adam-student-relational-graph.service';

/** Fire-and-forget — refresh session digest and sync to student track. */
export function triggerStudentMemoryPostTurn(input: {
  sessionId:   string;
  studentId:   string;
  studentName: string;
}): void {
  void refreshStudentMemoryAfterTurn(input).catch((err) => {
    console.error('[ADAM Student Memory] post-turn failed:', err);
  });
}

export async function refreshStudentMemoryAfterTurn(input: {
  sessionId:   string;
  studentId:   string;
  studentName: string;
}): Promise<void> {
  const { sessionId, studentId, studentName } = input;
  if (!sessionId?.trim() || !studentId?.trim()) return;

  await ensureStudentTrackRow(studentId, studentName);
  await refreshSessionDigestIfNeeded(sessionId, studentId);
  await syncSessionDigestToStudentTrack(sessionId, studentId);

  triggerStudentContinuityBridgeRefresh({ sessionId, studentId, studentName });
  void refreshStudentTopicRollup(studentId, studentName).catch((err) => {
    console.error('[ADAM Student Graph] topic rollup failed:', err);
  });
}
