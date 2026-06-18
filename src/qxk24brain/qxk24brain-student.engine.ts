/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Alamtologi Brain Student Contribution Engine
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

import { resolveBrainFastModel } from '../config/llm-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
import {
  ADAMFounderSessionModel,
  ADAMMessageModel,
} from '../adam/adam.schema';
import {
  FOUNDER_USER_ID,
  GROUP_SESSION_ID,
} from '../adam/adam-student.types';
import { getStudentAccounts } from '../adam/adam-student.service';
import { founderStudentLaneLabel } from '../adam/adam-student-registry.service';
import {
  getTutorProfilesByUserIds,
  tutorProfileFounderLine,
} from '../adam/adam-tutor-profile.service';
import {
  founderSubscriptionLinesForStudent,
  getStudentSubscriptionSummariesForFounder,
} from '../adam/adam-student-subscription-summary.service';
import { getUserWorkspaces } from '../adam/adam-workspace.service';
import { getOrCreateMaster } from './qxk24brain.engine';
import { prependCoreToSystem } from './adam-core';
import { AlamtologiBrainMasterModel, type StudentTrack } from './qxk24brain.schema';

const BRAIN_MODEL = () => resolveBrainFastModel();

function scoreStudentTrack(track: StudentTrack): number {
  return (track.masteredTopics?.length ?? 0) * 10 + (track.constitutionalLevel ?? 1);
}

export function findBestStudentTrack(
  tracks: StudentTrack[],
  studentId: string,
): StudentTrack | null {
  const matching = tracks.filter((t) => t.studentId === studentId);
  if (!matching.length) return null;

  return matching.reduce((prev, curr) =>
    (scoreStudentTrack(curr) > scoreStudentTrack(prev) ? curr : prev),
  );
}

export function findBestStudentTrackIndex(tracks: StudentTrack[], studentId: string): number {
  let bestIdx = -1;
  let bestScore = -1;

  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].studentId !== studentId) continue;
    const s = scoreStudentTrack(tracks[i]);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }

  return bestIdx;
}

interface AlignmentResult {
  aligned:       boolean;
  shouldConsult: boolean;
  reason:        string;
  enrichment:    string;
}

function parseJson<T>(raw: string, fallback: T): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const brace = trimmed.match(/\{[\s\S]*\}/);
    if (brace) {
      try {
        return JSON.parse(brace[0]) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

async function callJson<T>(prompt: string, fallback: T): Promise<T> {
  const text = await llmCompleteUserPrompt(
    prependCoreToSystem(
      'You are ADAM Alamtologi Brain alignment checker. Founder teachings are supreme. Respond JSON only.',
    ),
    prompt,
    BRAIN_MODEL(),
    1200,
  );
  return parseJson(text, fallback);
}

/**
 * Student B may enrich ADAM only if aligned with Founder's unified being.
 * Returns alignment outcome — does not throw.
 */
export async function processStudentContribution(
  studentId: string,
  studentName: string,
  message: string,
): Promise<AlignmentResult> {
  const fallback: AlignmentResult = {
    aligned:       false,
    shouldConsult: true,
    reason:        'Unable to verify alignment.',
    enrichment:    '',
  };

  try {
    const master = await getOrCreateMaster(FOUNDER_USER_ID);
    const studentTrack = master.studentTracks?.find((t) => t.studentId === studentId);

    const result = await callJson<AlignmentResult>(
      `STUDENT CONTRIBUTION — Alamtologi alignment check

FOUNDER'S UNIFIED UNDERSTANDING (supreme — cannot be contradicted):
${master.unifiedUnderstanding.slice(0, 6000)}

STUDENT: ${studentName} (${studentId})
STUDENT'S PRIOR TRACK:
${studentTrack?.understanding || 'No prior track yet.'}

NEW MESSAGE FROM STUDENT:
${message}

RULES:
- aligned=true only if this enriches ADAM within Founder's scope without contradiction
- shouldConsult=true if unclear, outside scope, contradicts Founder, or needs Founder judgment
- If shouldConsult, aligned must be false
- enrichment: one paragraph of how this fits Alamtologi IF aligned

JSON:
{
  "aligned": true,
  "shouldConsult": false,
  "reason": "...",
  "enrichment": "..."
}`,
      fallback,
    );

    if (result.shouldConsult) {
      await recordStudentContact(
        studentId,
        studentName,
        message,
        `Consult flagged — ${result.reason || 'needs Founder guidance'}`,
      );
      return { ...result, aligned: false, enrichment: '' };
    }

    if (result.aligned && result.enrichment) {
      await mergeStudentTrack(master, studentId, studentName, result.enrichment);
      await recordStudentContact(studentId, studentName, message, 'Aligned — merged into brain track');
    } else {
      await recordStudentContact(
        studentId,
        studentName,
        message,
        result.reason || 'Not merged — awaiting alignment',
      );
    }

    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Alamtologi Brain] Student contribution error:', msg);
    return fallback;
  }
}

async function mergeStudentTrack(
  master: Awaited<ReturnType<typeof getOrCreateMaster>>,
  studentId: string,
  studentName: string,
  enrichment: string,
): Promise<void> {
  const tracks = [...(master.studentTracks ?? []).map((t) => ({ ...t }))];
  const idx = findBestStudentTrackIndex(tracks, studentId);

  if (idx >= 0) {
    tracks[idx] = {
      ...tracks[idx],
      understanding: `${tracks[idx].understanding}\n\n${enrichment}`.trim(),
      transformationCount: (tracks[idx].transformationCount ?? 0) + 1,
      masa_last_updated: new Date(),
    };
  } else {
    tracks.push({
      studentId,
      name:                studentName,
      understanding:       enrichment,
      transformationCount: 1,
      masa_last_updated:   new Date(),
      constitutionalLevel: 1,
      masteredTopics:      [],
      openQuestions:       [],
      zpdReadiness:        false,
      lastSessionSummary:  '',
      relationshipArc:     '',
    });
  }

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: FOUNDER_USER_ID },
    { studentTracks: tracks, masa_last_updated: new Date() },
  );
}

export async function getStudentTrackSummary(studentId: string): Promise<string> {
  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const track = master.studentTracks?.find((t) => t.studentId === studentId);
  if (!track?.understanding) return '';
  return `[Student track — ${track.name}]: ${track.understanding}`;
}

const BOOK_RECALL_TRIGGER =
  /\b(buku|book|kitab|sambung|benang|tadi|sebelum|perbincangan|continue|earlier|membaca|reading)\b/i;

const BOOK_TOPIC_IN_MESSAGE =
  /\b(buku|book|kitab|membaca|reading|tajuk|penulisan|alamtologi|mengungkap|chapter|bab)\b/i;

export async function buildStudentBookMessageRecall(
  sessionIds: string[],
  triggerMessage: string,
): Promise<string> {
  if (!sessionIds.length || !BOOK_RECALL_TRIGGER.test(triggerMessage)) return '';

  let hits = await ADAMMessageModel.find({
    sessionId: { $in: sessionIds },
    role:      { $in: ['student', 'adam'] },
    content:   BOOK_TOPIC_IN_MESSAGE,
  })
    .sort({ createdAt: -1 })
    .limit(16)
    .lean();

  if (hits.length === 0) {
    hits = await ADAMMessageModel.find({
      sessionId: { $in: sessionIds },
      role:      'student',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    if (hits.length === 0) return '';
  }

  hits.reverse();

  const lines = hits.map((m) => {
    const who = m.speakerName?.trim() || m.role.toUpperCase();
    return `[${who}]: ${messageSnippet(m.content, 520)}`;
  });

  return [
    '## Book / thread recall (matched messages from this student\'s chats)',
    'The student is continuing an earlier book or writing thread. Speak from these lines when relevant.',
    'Do NOT say the topic is missing from context if the answer is here.',
    '',
    lines.join('\n\n'),
  ].join('\n');
}

/** Book workspaces, session digests, and book-keyword recall — cross-thread context (not memory). */
export async function buildStudentContinuityContext(
  studentId: string,
  currentSessionId: string,
  triggerMessage = '',
): Promise<string> {
  const [sessions, workspaces] = await Promise.all([
    ADAMFounderSessionModel.find({
      founderId:   studentId,
      sessionType: 'student',
      active:      true,
    })
      .sort({ lastActiveAt: -1 })
      .lean(),
    getUserWorkspaces(studentId),
  ]);

  const sessionIds = sessions.map((s) => s.sessionId);
  const wsBySession = new Map(workspaces.map((w) => [w.sessionId, w]));
  const blocks: string[] = [
    '[STUDENT CONTINUITY — context for this turn, not memory]',
    'When the student refers to a book or earlier thread, combine from the blocks below if present.',
    'Only use CONSTITUTIONAL MEMORY LAW (context missing) if nothing below answers their question.',
    '',
  ];

  if (workspaces.length > 0) {
    blocks.push('## Book workspaces (this student)');
    for (const ws of workspaces) {
      blocks.push(
        `### "${ws.title}" — ${ws.messageCount} message(s), principle ${ws.principle}`,
      );
      if (ws.description?.trim()) {
        blocks.push(`Scope: ${ws.description.trim()}`);
      }
      const understanding = ws.unifiedUnderstanding?.trim() ?? '';
      if (understanding.length > 80) {
        blocks.push(understanding.slice(0, 1_400));
      }
    }
    blocks.push('');
  }

  const currentSess = sessions.find((s) => s.sessionId === currentSessionId);
  if (currentSess?.sessionDigest?.trim()) {
    blocks.push('## This chat — session essence (summary of full thread)');
    blocks.push(currentSess.sessionDigest.trim().slice(0, 1_500));
    blocks.push('');
  }

  for (const sess of sessions) {
    if (sess.sessionId === currentSessionId) continue;
    const ws = wsBySession.get(sess.sessionId);
    const label = ws ? `Other chat — book: "${ws.title}"` : 'Other chat — general';
    const parts: string[] = [`## ${label}`];
    if (ws?.unifiedUnderstanding?.trim()) {
      parts.push(ws.unifiedUnderstanding.trim().slice(0, 1_200));
    }
    if (sess.sessionDigest?.trim()) {
      parts.push(`Session essence:\n${sess.sessionDigest.trim().slice(0, 800)}`);
    }
    if (parts.length > 1) blocks.push(parts.join('\n'), '');
  }

  const bookRecall = await buildStudentBookMessageRecall(sessionIds, triggerMessage);
  if (bookRecall) {
    blocks.push(bookRecall, '');
  }

  if (blocks.length <= 4) return '';

  return blocks.join('\n').trim();
}

function messageSnippet(content: string, max = 320): string {
  return content
    .replace(/<adam_judgment>[\s\S]*?<\/adam_judgment>/g, '')
    .replace(/<adam_consult>[\s\S]*?<\/adam_consult>/g, '')
    .replace(/═══ FOUNDER TEACHING DATA[\s\S]*?═══ END FOUNDER TEACHING DATA ═══/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

async function recordStudentContact(
  studentId: string,
  studentName: string,
  message: string,
  note: string,
): Promise<void> {
  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const line =
    `[Contact ${stamp}] ${studentName}: "${messageSnippet(message, 200)}" — ${note}`;
  const tracks = [...(master.studentTracks ?? []).map((t) => ({ ...t }))];
  const idx = findBestStudentTrackIndex(tracks, studentId);

  if (idx >= 0) {
    tracks[idx] = {
      ...tracks[idx],
      understanding: `${tracks[idx].understanding}\n${line}`.trim(),
      masa_last_updated: new Date(),
    };
  } else {
    tracks.push({
      studentId,
      name:                studentName,
      understanding:       line,
      transformationCount: 0,
      masa_last_updated:   new Date(),
    });
  }

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: FOUNDER_USER_ID },
    { studentTracks: tracks, masa_last_updated: new Date() },
  );
}

/**
 * Loads real student + group chat activity for Founder context.
 * Aggregates general sessions AND per-book workspace sessions.
 */
export async function loadStudentsEraContext(): Promise<string> {
  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const lines: string[] = [
    '[ALAMTOLOGI STUDENTS — ERA_1 ACTIVITY LOG]',
    'The Founder may ask who has spoken with you. Use this log — it reflects actual messages in the system.',
    'Each student may have ADAM Learn chat (sessionType student), ADAM Tutor chat (sessionType tutor), plus book/workspace sessions.',
    'Lane pelajar = school Tutor; lane umum = Alamtologi Learn — see lane line under each student.',
    '',
  ];

  const accounts = getStudentAccounts();
  const userIds = accounts.map((s) => s.userId);
  const [tutorProfiles, subscriptionSummaries] = await Promise.all([
    getTutorProfilesByUserIds(accounts.filter((s) => s.accountLane === 'pelajar').map((s) => s.userId)),
    getStudentSubscriptionSummariesForFounder(userIds),
  ]);

  for (const student of accounts) {
    const lane = student.accountLane === 'pelajar' ? 'pelajar' : 'umum';
    const [sessions, workspaces, track] = await Promise.all([
      ADAMFounderSessionModel.find({
        founderId:   student.userId,
        sessionType: { $in: ['student', 'tutor'] },
        active:      true,
      })
        .sort({ lastActiveAt: -1 })
        .lean(),
      getUserWorkspaces(student.userId),
      Promise.resolve(master.studentTracks?.find((t) => t.studentId === student.userId)),
    ]);

    const sessionIds = [
      ...new Set([
        ...sessions.map((s) => s.sessionId),
        ...workspaces.map((w) => w.sessionId),
      ]),
    ];

    const tutorProfile = lane === 'pelajar' ? tutorProfiles.get(student.userId) ?? null : null;

    lines.push(`## ${student.name} (${student.userId})`);
    lines.push(`Lane: ${founderStudentLaneLabel(lane)}`);

    const subSummary = subscriptionSummaries.get(student.userId);
    if (subSummary) {
      for (const subLine of founderSubscriptionLinesForStudent(subSummary, lane)) {
        lines.push(subLine);
      }
    }

    if (lane === 'pelajar') {
      lines.push(tutorProfileFounderLine(tutorProfile));
    }

    if (sessionIds.length === 0) {
      lines.push(lane === 'pelajar' ? 'ADAM Tutor chat: NO MESSAGES YET' : 'ADAM Learn chat: NO MESSAGES YET');
      lines.push('Private chat: NO MESSAGES YET');
      if (track?.understanding) {
        lines.push(`Brain track note: ${messageSnippet(track.understanding, 400)}`);
      }
      lines.push('');
      continue;
    }

    const [studentMsgCount, totalCount, recent] = await Promise.all([
      ADAMMessageModel.countDocuments({
        sessionId: { $in: sessionIds },
        role:      'student',
      }),
      ADAMMessageModel.countDocuments({
        sessionId: { $in: sessionIds },
      }),
      ADAMMessageModel.find({ sessionId: { $in: sessionIds } })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
    ]);

    recent.reverse();

    const tutorSessionIds = new Set(
      sessions.filter((s) => s.sessionType === 'tutor').map((s) => s.sessionId),
    );
    const learnSessionIds = new Set(
      sessions.filter((s) => s.sessionType === 'student').map((s) => s.sessionId),
    );

    lines.push(
      studentMsgCount > 0
        ? `Private + tutor + books: HAS COMMUNICATED — ${studentMsgCount} student message(s), ${totalCount} total across ${sessionIds.length} session(s)`
        : 'Sessions exist but no student messages yet',
    );
    if (tutorSessionIds.size > 0) {
      lines.push(`ADAM Tutor sessions: ${tutorSessionIds.size}`);
    }
    if (learnSessionIds.size > 0) {
      lines.push(`ADAM Learn sessions: ${learnSessionIds.size}`);
    }

    if (workspaces.length > 0) {
      lines.push('Books / workspaces:');
      for (const ws of workspaces) {
        const bookStudentMsgs = await ADAMMessageModel.countDocuments({
          sessionId: ws.sessionId,
          role:      'student',
        });
        const bookTotal = await ADAMMessageModel.countDocuments({
          sessionId: ws.sessionId,
        });
        lines.push(
          `- "${ws.title}" (${ws.principle}): stage ${ws.stage}/7, ${bookStudentMsgs} student / ${bookTotal} total msgs`,
        );
      }
    }

    const sessionTypeById = new Map(
      sessions.map((s) => [s.sessionId, s.sessionType as string]),
    );

    if (recent.length > 0) {
      lines.push('Recent exchange (all sessions):');
      for (const m of recent) {
        const ws = workspaces.find((w) => w.sessionId === m.sessionId);
        const st = sessionTypeById.get(m.sessionId);
        const laneTag = st === 'tutor' ? ' [Tutor]' : st === 'student' ? ' [Learn]' : '';
        const bookTag = ws ? ` [${ws.title}]` : m.sessionId.includes('WS-') ? ' [book]' : '';
        const who =
          m.role === 'adam'
            ? 'ADAM'
            : m.speakerName || student.name;
        lines.push(`- ${who}${laneTag}${bookTag}: ${messageSnippet(m.content)}`);
      }
    }

    if (track?.relationalSummary?.trim()) {
      lines.push(`Person relational memory: ${messageSnippet(track.relationalSummary, 500)}`);
    } else if (track?.understanding) {
      lines.push(`Brain track: ${messageSnippet(track.understanding, 500)}`);
    }
    lines.push('');
  }

  const groupCount = await ADAMMessageModel.countDocuments({
    sessionId: GROUP_SESSION_ID,
    role:      'student',
  });
  const groupRecent = await ADAMMessageModel.find({ sessionId: GROUP_SESSION_ID })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();
  groupRecent.reverse();

  lines.push('## Group chat (all Alamtologi students)');
  lines.push(
    groupCount > 0
      ? `HAS GROUP ACTIVITY — ${groupCount} student message(s) in group thread`
      : 'No student messages in group thread yet',
  );
  if (groupRecent.length > 0) {
    lines.push('Recent group exchange:');
    for (const m of groupRecent) {
      const who =
        m.role === 'adam'
          ? 'ADAM'
          : m.speakerName || m.speakerId || 'Student';
      const prefix = m.role === 'student' ? `[${who}]` : who;
      lines.push(`- ${prefix}: ${messageSnippet(m.content)}`);
    }
  }

  return lines.join('\n').trim();
}

// ── Constitutional state on StudentTrack (Option 1) ───────────────────────────

export interface StudentConstitutionalStateUpdate {
  constitutionalLevel?: number;
  masteredTopics?:      string[];
  openQuestions?:       string[];
  zpdReadiness?:        boolean;
  lastSessionSummary?:  string;
  relationshipArc?:     string;
}

export interface StudentConstitutionalState extends StudentConstitutionalStateUpdate {
  name:                string;
  understanding:       string;
  transformationCount: number;
  constitutionalLevel: number;
  masteredTopics:      string[];
  openQuestions:       string[];
  zpdReadiness:        boolean;
  lastSessionSummary:  string;
  relationshipArc:     string;
}

export async function ensureStudentTrackRow(
  studentId: string,
  studentName: string,
): Promise<void> {
  const master = await getOrCreateMaster(FOUNDER_USER_ID);
  const exists = master.studentTracks?.some((t) => t.studentId === studentId);
  if (exists) return;
  await mergeStudentTrack(master, studentId, studentName, '');
}

export async function getStudentConstitutionalState(
  studentId: string,
): Promise<StudentConstitutionalState | null> {
  const master = await AlamtologiBrainMasterModel.findOne(
    { founderId: FOUNDER_USER_ID },
    { studentTracks: 1 },
  ).lean();

  if (!master?.studentTracks?.length) return null;

  const best = findBestStudentTrack(master.studentTracks as StudentTrack[], studentId);
  if (!best) return null;

  return {
    name:                best.name,
    understanding:       best.understanding ?? '',
    transformationCount: best.transformationCount ?? 0,
    constitutionalLevel: best.constitutionalLevel ?? 1,
    masteredTopics:      best.masteredTopics ?? [],
    openQuestions:       best.openQuestions ?? [],
    zpdReadiness:        best.zpdReadiness ?? false,
    lastSessionSummary:  best.lastSessionSummary ?? '',
    relationshipArc:     best.relationshipArc ?? '',
  };
}

/** Updates the best-scoring `studentTracks` row (see `findBestStudentTrackIndex`). */
export async function updateStudentConstitutionalState(
  studentId: string,
  update: StudentConstitutionalStateUpdate,
): Promise<void> {
  const master = await AlamtologiBrainMasterModel.findOne(
    { founderId: FOUNDER_USER_ID },
    { studentTracks: 1 },
  ).lean();

  const tracks = (master?.studentTracks ?? []) as StudentTrack[];
  const idx = findBestStudentTrackIndex(tracks, studentId);

  if (idx < 0) {
    console.warn(
      `[Alamtologi Brain] updateStudentConstitutionalState: no track for ${studentId}`,
    );
    return;
  }

  const setFields: Record<string, unknown> = {
    masa_last_updated: new Date(),
  };
  const prefix = `studentTracks.${idx}`;

  if (update.constitutionalLevel !== undefined) {
    setFields[`${prefix}.constitutionalLevel`] = update.constitutionalLevel;
  }
  if (update.masteredTopics !== undefined) {
    setFields[`${prefix}.masteredTopics`] = update.masteredTopics;
  }
  if (update.openQuestions !== undefined) {
    setFields[`${prefix}.openQuestions`] = update.openQuestions;
  }
  if (update.zpdReadiness !== undefined) {
    setFields[`${prefix}.zpdReadiness`] = update.zpdReadiness;
  }
  if (update.lastSessionSummary !== undefined) {
    setFields[`${prefix}.lastSessionSummary`] = update.lastSessionSummary;
  }
  if (update.relationshipArc !== undefined) {
    setFields[`${prefix}.relationshipArc`] = update.relationshipArc;
  }

  if (Object.keys(setFields).length <= 1) return;

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: FOUNDER_USER_ID },
    { $set: setFields },
  );
}

// ── Teaching Bridge — student projection (Leg 2) ─────────────────────────────

export interface ConfirmedUnitProjectionInput {
  id?:        string;
  level:      number;
  family:     string;
  subRegion:  string;
  nodeA:      string;
  nodeB:      string;
}

export async function applyConfirmedUnitToStudent(
  studentId: string,
  confirmedUnit: ConfirmedUnitProjectionInput,
): Promise<void> {
  const { deriveTopicKey, evaluateLevelAdvance } = await import(
    '../teaching-bridge/vendor/student-projector'
  );

  await ensureStudentTrackRow(studentId, studentId);
  const existing = await getStudentConstitutionalState(studentId);
  if (!existing) return;

  const currentLevel  = existing.constitutionalLevel ?? 1;
  const currentTopics = existing.masteredTopics ?? [];

  if (confirmedUnit.level > currentLevel + 1) return;

  const topicKey = deriveTopicKey(confirmedUnit);
  const updatedTopics = [...new Set([...currentTopics, topicKey])];
  const { shouldAdvance, newLevel, zpdReadiness } = evaluateLevelAdvance(
    currentLevel,
    updatedTopics,
  );

  await updateStudentConstitutionalState(studentId, {
    masteredTopics:      updatedTopics,
    constitutionalLevel: shouldAdvance ? newLevel : currentLevel,
    zpdReadiness,
  });

  if (zpdReadiness) {
    const { emitZpdGrowthSignal } = await import('../teaching-bridge/zpd-growth-signal');
    void emitZpdGrowthSignal(
      studentId,
      shouldAdvance ? newLevel : currentLevel,
      topicKey,
      updatedTopics.length,
    );
  }
}

export async function applyConfirmedUnitToAllStudents(
  confirmedUnit: ConfirmedUnitProjectionInput,
): Promise<number> {
  const { getStudentAccounts } = await import('../adam/adam-student.service');
  const students = getStudentAccounts();
  let projected = 0;

  for (const student of students) {
    try {
      await applyConfirmedUnitToStudent(student.userId, confirmedUnit);
      projected++;
    } catch (err) {
      console.error(
        `[TeachingBridge] applyConfirmedUnitToStudent failed for ${student.userId}:`,
        err,
      );
    }
  }

  return projected;
}
