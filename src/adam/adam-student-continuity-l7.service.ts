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

import { resolveBrainDeepModel } from '../config/llm-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
import { prependCoreToSystem } from '../qxk24brain/adam-core';
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

  return normalizeStudentBridge({
    studentProfile: `${studentName.trim()} — ERA_1 learner with ADAM (level ${constitutional?.constitutionalLevel ?? track.constitutionalLevel ?? 1}).`,
    relationshipArc: trimField(
      track.relationshipArc?.trim()
      || track.relationalUnderstanding?.split('\n').slice(-1)[0]?.trim()
      || constitutional?.understanding?.trim()
      || DEFAULT_STUDENT_BRIDGE.relationshipArc,
      400,
    ),
    lastSession: trimField(lastDigest || 'Recent session not summarised yet.', 500),
    openThreads: openQ.length
      ? trimField(openQ.slice(0, 5).join('; '), 400)
      : trimField(
        mastered.length ? `Consolidating: ${mastered.slice(0, 6).join(', ')}` : DEFAULT_STUDENT_BRIDGE.openThreads,
        400,
      ),
    nextSteps: trimField(
      openQ[0] ?? 'Continue from the learner\'s current question.',
      200,
    ),
    relationalMemory: relationalMemory || track.relationalSummary?.trim() || '',
  });
}

async function synthesizeStudentBridgeLLM(input: {
  studentId:        string;
  studentName:      string;
  sessionId?:       string;
  track:            StudentTrack;
  constitutional:   Awaited<ReturnType<typeof getStudentConstitutionalState>>;
  lastTeaching:     string;
  relationalMemory: string;
  totalSessions:    number;
  totalMessages:    number;
}): Promise<StudentContinuityBridge> {
  const {
    studentId, studentName, track, constitutional, lastTeaching,
    relationalMemory, totalSessions, totalMessages,
  } = input;

  const relationalC = track.relationalUnderstanding?.trim().slice(0, 800) ?? '';

  try {
    const raw = await llmCompleteUserPrompt(
      prependCoreToSystem(
        'ADAM Student Continuity Bridge — compact relationship memory per learner. Respond JSON only.',
      ),
      `Build a compact STUDENT CONTINUITY BRIDGE for ADAM and one learner.
Read at the start of sessions — maximum 300 words total for the five core fields.
Conventional voice only — no Alamtologi framework labels in output.

Learner: ${studentName} (${studentId})
Total sessions: ${totalSessions}
Total messages: ${totalMessages}
Last session essence: ${lastTeaching.slice(0, 600)}
Constitutional level: ${constitutional?.constitutionalLevel ?? track.constitutionalLevel ?? 1}

TOPIC GRAPH ROLLUP:
${relationalMemory.slice(0, 1800)}

RELATIONAL C (crystallised journey excerpt):
${relationalC || 'Early journey — few episodes indexed yet.'}

Build with these exact JSON fields:
{
  "studentProfile": "Who this learner is in 2 sentences",
  "relationshipArc": "How their learning journey with ADAM has progressed in 2-3 sentences",
  "lastSession": "What was most recently explored in 2 sentences",
  "openThreads": "Unresolved questions or frontiers in 2 sentences",
  "nextSteps": "What ADAM expects to explore next in 1 sentence"
}
Do NOT include relationalMemory in JSON — it is stored separately.`,
      resolveBrainDeepModel(),
      BRIDGE_LLM_MAX_TOKENS,
    );

    return normalizeStudentBridge({
      ...parseStudentBridgeJson(raw),
      relationalMemory,
    });
  } catch (err) {
    console.error('[ADAM Student L7] LLM bridge synthesis failed:', err);
    return buildRuleBasedStudentBridge({
      studentName,
      constitutional,
      track,
      lastDigest: lastTeaching,
      openQ: constitutional?.openQuestions ?? track.openQuestions ?? [],
      mastered: constitutional?.masteredTopics ?? track.masteredTopics ?? [],
      relationalMemory,
    });
  }
}

/** L7 bridge — rule-based on idle; LLM on sleep/first build when enabled. */
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

  const useLlm = studentBridgeLlmEnabled()
    && (options.forceLlm === true || !track.usersContinuityBridge?.studentProfile?.trim());

  const bridge = useLlm
    ? await synthesizeStudentBridgeLLM({
      studentId,
      studentName,
      sessionId,
      track,
      constitutional,
      lastTeaching: lastDigest,
      relationalMemory,
      totalSessions: studentSessions.length,
      totalMessages,
    })
    : buildRuleBasedStudentBridge({
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
