/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Student Digest Bridge
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Copies sessionDigest from adam_founder_sessions → studentTracks.lastSessionSummary.
 */

import { ADAMFounderSessionModel } from '../adam/adam.schema';
import { buildSessionDigest } from './adam-tiered-memory.service';
import {
  getStudentConstitutionalState,
  updateStudentConstitutionalState,
} from './qxk24brain-student.engine';

const DIGEST_MIN_CHARS = 20;
const DIGEST_MAX_CHARS = 400;

export function cleanDigestForStudentTrack(raw: string): string {
  return raw
    .replace(/═══.*?═══/gs, '')
    .replace(/═══ SHORT-TERM MEMORY.*?═══/gs, '')
    .replace(/═══ END SHORT-TERM MEMORY ═══/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DIGEST_MAX_CHARS);
}

export async function syncSessionDigestToStudentTrack(
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

    let digest = session.sessionDigest?.trim() ?? '';

    if (digest.length < DIGEST_MIN_CHARS) {
      console.log(`[StudentDigestBridge] No digest for ${sessionId} — generating now`);
      const built = await buildSessionDigest(sessionId, studentId);
      digest = cleanDigestForStudentTrack(built);
    }

    const cleanDigest = cleanDigestForStudentTrack(digest);

    if (cleanDigest.length < DIGEST_MIN_CHARS) {
      return { synced: false, reason: 'Digest too short to be meaningful' };
    }

    const existing = await getStudentConstitutionalState(studentId);
    if (!existing) {
      return { synced: false, reason: 'Student track not found' };
    }

    if (existing.lastSessionSummary === cleanDigest) {
      return { synced: false, reason: 'Digest unchanged' };
    }

    await updateStudentConstitutionalState(studentId, {
      lastSessionSummary: cleanDigest,
    });

    console.log(
      `[StudentDigestBridge] Synced digest for student ${studentId} (${cleanDigest.length} chars)`,
    );
    return { synced: true };
  } catch (err) {
    console.error(`[StudentDigestBridge] Error for student ${studentId}:`, err);
    return { synced: false, reason: String(err) };
  }
}

export async function syncAllIdleStudentDigests(
  idleMinutes = 30,
): Promise<{ processed: number; synced: number }> {
  const cutoff = new Date(Date.now() - idleMinutes * 60 * 1000);

  const idleSessions = await ADAMFounderSessionModel.find({
    sessionType:  'student',
    active:       true,
    lastActiveAt: { $lt: cutoff },
  })
    .select('sessionId founderId sessionDigest digestUpdatedAt')
    .lean();

  let synced = 0;

  for (const session of idleSessions) {
    const result = await syncSessionDigestToStudentTrack(
      session.sessionId,
      session.founderId,
    );
    if (result.synced) synced++;
  }

  console.log(
    `[StudentDigestBridge] Batch sync: ${synced}/${idleSessions.length} synced`,
  );
  return { processed: idleSessions.length, synced };
}

export async function lazySyncPriorSessionDigest(
  studentId: string,
  currentSessionId: string,
): Promise<void> {
  try {
    const existing = await getStudentConstitutionalState(studentId);
    if (!existing) return;

    if (
      existing.lastSessionSummary &&
      existing.lastSessionSummary.length >= DIGEST_MIN_CHARS
    ) {
      return;
    }

    const priorSession = await ADAMFounderSessionModel.findOne({
      founderId:   studentId,
      sessionType: 'student',
      sessionId:   { $ne: currentSessionId },
    })
      .sort({ lastActiveAt: -1 })
      .lean();

    if (!priorSession) return;

    await syncSessionDigestToStudentTrack(priorSession.sessionId, studentId);
  } catch (err) {
    console.error(`[StudentDigestBridge] Lazy sync failed for ${studentId}:`, err);
  }
}
