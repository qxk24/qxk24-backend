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
import { resolveBrainDeepModel } from '../config/llm-models';
import { isLlmConfigured, llmCompleteUserPrompt } from '../llm/llm-client';
import { prependCoreToSystem } from './adam-core';
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

  const sessionText = turns
    .map((t) => {
      const role = t.role === 'student' ? 'Student' : 'ADAM';
      const content = t.content.slice(0, 400);
      return `[${role}]: ${content}`;
    })
    .join('\n\n');

  if (!isLlmConfigured()) {
    const lastStudentTurn = [...turns].reverse().find((t) => t.role === 'student');
    return lastStudentTurn
      ? `Student's last question: ${lastStudentTurn.content.slice(0, 200)}`
      : '';
  }

  try {
    const arc = await llmCompleteUserPrompt(
      prependCoreToSystem(
        `You are generating a student relationship arc — a concise growth narrative 
         for ADAM's memory. Focus on: how the student's understanding shifted during 
         this session, any breakthrough moment, and one unresolved thread to carry forward. 
         Write in third person. Maximum 3 sentences. Constitutional language only.`,
      ),
      `Generate a relationship arc for this student session.

Session turns:
${sessionText}

Write exactly 2–3 sentences covering:
1. Where the student's understanding was at the start
2. The key shift or breakthrough (if any)
3. One open question or thread to carry into the next session

Be specific. Reference actual concepts discussed. Do not use generic phrases.`,
      resolveBrainDeepModel(),
      ARC_LLM_TOKENS,
    );

    return arc.trim().slice(0, ARC_MAX_CHARS);
  } catch (err) {
    console.error('[StudentArcBridge] LLM arc generation failed:', err);
    return '';
  }
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

    console.log(
      `[StudentArcBridge] Arc synced for student ${studentId} ` +
        `(${arc.length} chars${openThread ? ', open thread extracted' : ''})`,
    );

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

  console.log(
    `[StudentArcBridge] Batch arc sync: ${synced}/${idleSessions.length} synced`,
  );
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
