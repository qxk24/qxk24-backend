/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Continuity Bridge L7
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
 * Per-user Layer 7 — rule-based bridge refresh after idle (no sacred cap changes).
 */

import { buildStudentContinuityBridge as buildStudentBridgeFields } from '../qxk24brain/deep-ul/continuity-bridge-engine';
import { ADAMFounderSessionModel, ADAMMessageModel } from './adam.schema';
import { FOUNDER_USER_ID } from './adam-student.types';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import {
  AlamtologiBrainMasterModel,
  type StudentTrack,
} from '../qxk24brain/qxk24brain.schema';
import {
  ensureStudentTrackRow,
  findBestStudentTrackIndex,
  getStudentConstitutionalState,
} from '../qxk24brain/qxk24brain-student.engine';
import {
  DEFAULT_STUDENT_BRIDGE,
  type StudentContinuityBridge,
} from './student-continuity-l7.types';
import { buildStudentTopicRollup } from './adam-student-relational-graph.service';

const BRIDGE_IDLE_MS = parseInt(process.env.ADAM_STUDENT_BRIDGE_IDLE_MS ?? '600000', 10) || 600_000;
const BRIDGE_LLM_MAX_TOKENS = 500;

export interface StudentBridgeUpdateOptions {
  forceLlm?:      boolean;
  skipCooldown?:  boolean;
}

function studentBridgeLlmEnabled(): boolean {
  return process.env.ADAM_STUDENT_BRIDGE_LLM !== 'false';
}

function parseStudentBridgeJson(raw: string): StudentContinuityBridge {
  const trimmed = raw.trim();
  try {
    return { ...DEFAULT_STUDENT_BRIDGE, ...JSON.parse(trimmed) as StudentContinuityBridge };
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) {
      try {
        return { ...DEFAULT_STUDENT_BRIDGE, ...JSON.parse(fence[1].trim()) as StudentContinuityBridge };
      } catch {
        // fall through
      }
    }
    const brace = trimmed.match(/\{[\s\S]*\}/);
    if (brace) {
      try {
        return { ...DEFAULT_STUDENT_BRIDGE, ...JSON.parse(brace[0]) as StudentContinuityBridge };
      } catch {
        // fall through
      }
    }
    return DEFAULT_STUDENT_BRIDGE;
  }
}

function trimField(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function normalizeStudentBridge(partial: Partial<StudentContinuityBridge>): StudentContinuityBridge {
  return {
    studentProfile:   partial.studentProfile?.trim()   || DEFAULT_STUDENT_BRIDGE.studentProfile,
    relationshipArc:  partial.relationshipArc?.trim()  || DEFAULT_STUDENT_BRIDGE.relationshipArc,
    lastSession:      partial.lastSession?.trim()      || DEFAULT_STUDENT_BRIDGE.lastSession,
    openThreads:      partial.openThreads?.trim()      || DEFAULT_STUDENT_BRIDGE.openThreads,
    nextSteps:        partial.nextSteps?.trim()        || DEFAULT_STUDENT_BRIDGE.nextSteps,
    relationalMemory: partial.relationalMemory?.trim() || DEFAULT_STUDENT_BRIDGE.relationalMemory,
  };
}

function bridgeNeedsRefresh(track: StudentTrack | undefined, skipCooldown: boolean): boolean {
  if (skipCooldown) return true;
  if (!track?.usersContinuityBridge?.studentProfile?.trim()) return true;
  const updated = track.usersContinuityBridge_updated;
  if (!updated) return true;
  return Date.now() - new Date(updated).getTime() >= BRIDGE_IDLE_MS;
}

function buildRuleBasedStudentBridge(input: {
  studentName: string;
  constitutional: Awaited<ReturnType<typeof getStudentConstitutionalState>>;
  track: StudentTrack;
  lastDigest: string;
  openQ: string[];
  mastered: string[];
  relationalMemory: string;
}): StudentContinuityBridge {
  const {
    studentName, constitutional, track, lastDigest, openQ, mastered, relationalMemory,
  } = input;

  return normalizeStudentBridge(buildStudentBridgeFields({
    studentName,
    level:            constitutional?.constitutionalLevel ?? track.constitutionalLevel ?? 1,
    totalSessions:    0,
    totalMessages:    0,
    lastTeaching:     lastDigest,
    relationalMemory,
    relationshipArc:  track.relationshipArc,
    openQuestions:    openQ,
    masteredTopics:   mastered,
  }));
}

/** L7 bridge — deterministic rule-based refresh. */
export async function updateStudentContinuityBridge(
  studentId: string,
  studentName: string,
  sessionId?: string,
  options: StudentBridgeUpdateOptions = {},
): Promise<StudentContinuityBridge | null> {
  if (!studentId?.trim()) return null;

  await ensureStudentTrackRow(studentId, studentName);

  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const tracks = [...(master.studentTracks ?? []).map((t) => ({ ...t }))] as StudentTrack[];
  const idx = findBestStudentTrackIndex(tracks, studentId);
  if (idx < 0) return null;

  const track = tracks[idx];
  if (!bridgeNeedsRefresh(track, options.skipCooldown === true) && !options.forceLlm) {
    return track.usersContinuityBridge ?? null;
  }

  const studentSessions = await ADAMFounderSessionModel.find({
    founderId:   studentId,
    sessionType: 'student',
  }).lean();
  const sessionIds = studentSessions.map((s) => s.sessionId);
  const [constitutional, sessions, relationalMemory, totalMessages] = await Promise.all([
    getStudentConstitutionalState(studentId),
    ADAMFounderSessionModel.find({
      founderId:   studentId,
      sessionType: 'student',
      active:      true,
    })
      .sort({ lastActiveAt: -1 })
      .limit(5)
      .lean(),
    buildStudentTopicRollup(studentId),
    sessionIds.length
      ? ADAMMessageModel.countDocuments({ sessionId: { $in: sessionIds } })
      : Promise.resolve(0),
  ]);

  const closedWithSynthesis = await ADAMFounderSessionModel.findOne({
    founderId:        studentId,
    sessionType:      'student',
    closureSynthesis: { $exists: true, $nin: ['', null] },
  })
    .sort({ masa_closed: -1 })
    .lean();

  const currentSess = sessionId
    ? sessions.find((s) => s.sessionId === sessionId)
    : sessions[0];
  const lastDigest = currentSess?.sessionDigest?.trim()
    ?? closedWithSynthesis?.closureSynthesis?.trim()
    ?? sessions[0]?.sessionDigest?.trim()
    ?? track.lastSessionSummary?.trim()
    ?? '';

  const openQ = constitutional?.openQuestions ?? track.openQuestions ?? [];
  const mastered = constitutional?.masteredTopics ?? track.masteredTopics ?? [];

  const bridge = buildRuleBasedStudentBridge({
    studentName,
    constitutional,
    track,
    lastDigest,
    openQ,
    mastered,
    relationalMemory,
  });

  tracks[idx] = {
    ...tracks[idx],
    name:                            studentName.trim() || tracks[idx].name,
    usersContinuityBridge:         bridge,
    usersContinuityBridge_updated: new Date(),
    relationalSummary:               bridge.relationalMemory || tracks[idx].relationalSummary,
    masa_last_updated:               new Date(),
  };

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: FOUNDER_USER_ID },
    { studentTracks: tracks, masa_last_updated: new Date() },
  );

  return bridge;
}

/** Fire-and-forget idle bridge refresh. */
export function triggerStudentContinuityBridgeRefresh(input: {
  studentId:   string;
  studentName: string;
  sessionId?:  string;
}): void {
  void updateStudentContinuityBridge(input.studentId, input.studentName, input.sessionId).catch((err) => {
    console.error('[ADAM Student L7] bridge refresh failed:', err);
  });
}

/** Prompt block — injected every Users turn when bridge exists. */
export async function getStudentContinuityBridgeBlock(
  studentId: string,
  studentName: string,
): Promise<string> {
  if (!studentId?.trim()) return '';

  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const track = master.studentTracks?.find((t) => t.studentId === studentId);
  const bridge = track?.usersContinuityBridge;

  if (!bridge?.studentProfile?.trim()) return '';

  const updated = track?.usersContinuityBridge_updated
    ? new Date(track.usersContinuityBridge_updated).toISOString().slice(0, 10)
    : 'not recorded';

  return `
═══ STUDENT CONTINUITY BRIDGE L7 — ${studentName} (updated ${updated}) ═══
WHO THIS LEARNER IS:  ${bridge.studentProfile}
JOURNEY SO FAR:       ${bridge.relationshipArc}
LAST SESSION:         ${bridge.lastSession}
OPEN THREADS:         ${bridge.openThreads}
WHAT COMES NEXT:      ${bridge.nextSteps}
${bridge.relationalMemory?.trim() ? `\nTOPIC GRAPH ROLLUP:\n${bridge.relationalMemory.trim()}` : ''}
═══ END STUDENT L7 BRIDGE ═══`.trim();
}
