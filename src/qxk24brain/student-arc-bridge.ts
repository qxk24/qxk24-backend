/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Student Relationship Arc Bridge (C1)
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
 *
 * Digest (Action 1) = what was discussed. Arc (C1) = how understanding shifted.
 */

import {
  ARC_IDLE_MINUTES,
  ARC_MAX_CHARS,
  ARC_MIN_CHARS,
  ARC_MIN_TURNS,
  extractOpenThreadFromArc,
} from '../continuity-bridge/vendor/student-arc-core';
import { ADAMFounderSessionModel, ADAMMessageModel } from '../adam/adam.schema';
import { buildStudentRelationshipArc as buildArcDeterministic } from './deep-ul/arc-engine';
import {
  getStudentConstitutionalState,
  updateStudentConstitutionalState,
} from './qxk24brain-student.engine';

export {
  ARC_IDLE_MINUTES,
  ARC_MAX_CHARS,
  ARC_MIN_CHARS,
  ARC_MIN_TURNS,
  extractOpenThreadFromArc,
} from '../continuity-bridge/vendor/student-arc-core';

const ARC_LLM_TOKENS = 800;

export async function buildStudentRelationshipArc(
  sessionId: string,
  _studentId: string,
): Promise<string> {
  const turns = await ADAMMessageModel.find({
    sessionId,
    role: { $in: ['student', 'adam'] },
  })
    .sort({ createdAt: 1 })
    .lean();

  if (turns.length < ARC_MIN_TURNS) return '';

  return buildArcDeterministic(
    turns.map((t) => ({ role: t.role, content: t.content })),
  ).slice(0, ARC_MAX_CHARS);
}

export async function syncSessionArcToStudentTrack(
  sessionId: string,
  studentId: string,
): Promise<{ synced: boolean; reason?: string }> {
  try {
    const session = await ADAMFounderSessionModel.findOne({
      sessionId,
      founderId:   studentId,
      sessionType: 'student',
    }).lean();

    if (!session) {
      return { synced: false, reason: 'Session not found' };
    }

    const arc = await buildStudentRelationshipArc(sessionId, studentId);

    if (arc.length < ARC_MIN_CHARS) {
      return { synced: false, reason: 'Arc too short or session too thin' };
    }

    await ADAMFounderSessionModel.updateOne(
      { sessionId },
      {
        $set: {
          relationshipArc: arc,
          arcUpdatedAt:    new Date(),
          arcMessageCount: session.messageCount ?? 0,
        },
      },
    );

    const openThread = extractOpenThreadFromArc(arc);

    const existing = await getStudentConstitutionalState(studentId);
    if (!existing) {
      return { synced: false, reason: 'Student track not found' };
    }

    const updatedQuestions = openThread
      ? [...new Set([...(existing.openQuestions ?? []), openThread])].slice(-5)
      : existing.openQuestions ?? [];

    await updateStudentConstitutionalState(studentId, {
      relationshipArc: arc,
      openQuestions: updatedQuestions,
    });

    return { synced: true };
  } catch (err) {
    console.error(`[StudentArcBridge] Error for student ${studentId}:`, err);
    return { synced: false, reason: String(err) };
  }
}

export async function syncAllIdleStudentArcs(
  idleMinutes = ARC_IDLE_MINUTES,
): Promise<{ processed: number; synced: number }> {
  const cutoff = new Date(Date.now() - idleMinutes * 60 * 1000);

  const idleSessions = await ADAMFounderSessionModel.find({
    sessionType:  'student',
    active:       true,
    lastActiveAt: { $lt: cutoff },
    $or: [
      { relationshipArc: { $exists: false } },
      { relationshipArc: '' },
      { relationshipArc: null },
    ],
  })
    .select('sessionId founderId messageCount')
    .lean();

  let synced = 0;

  for (const session of idleSessions) {
    const result = await syncSessionArcToStudentTrack(
      session.sessionId,
      session.founderId,
    );
    if (result.synced) synced++;
  }

  return { processed: idleSessions.length, synced };
}

export async function lazySyncPriorSessionArc(
  studentId: string,
  currentSessionId: string,
): Promise<void> {
  try {
    const existing = await getStudentConstitutionalState(studentId);
    if (!existing) return;

    if (existing.relationshipArc && existing.relationshipArc.length >= ARC_MIN_CHARS) {
      return;
    }

    const priorSession = await ADAMFounderSessionModel.findOne({
      founderId:   studentId,
      sessionType: 'student',
      sessionId:   { $ne: currentSessionId },
      $or: [
        { relationshipArc: { $exists: false } },
        { relationshipArc: '' },
      ],
    })
      .sort({ lastActiveAt: -1 })
      .lean();

    if (!priorSession) return;

    void syncSessionArcToStudentTrack(priorSession.sessionId, studentId).catch((err) => {
      console.error('[StudentArcBridge] Lazy arc sync failed:', err);
    });
  } catch (err) {
    console.error(`[StudentArcBridge] Lazy sync error for ${studentId}:`, err);
  }
}
