/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Student Continuity Bridge
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
 * Mirrors Founder [ALAMTOLOGI STUDENTS — ERA_1 ACTIVITY LOG] for one student.
 * Context injection per turn — not memory. Uses existing Mongo collections.
 */

import {
  ADAMFounderSessionModel,
  ADAMMessageModel,
} from './adam.schema';
import { getUserWorkspaces } from './adam-workspace.service';
import { FOUNDER_USER_ID } from './adam-student.types';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import {
  buildStudentBookMessageRecall,
  getStudentConstitutionalState,
  ensureStudentTrackRow,
  updateStudentConstitutionalState,
} from '../qxk24brain/qxk24brain-student.engine';

const CURRENT_SESSION_TURNS = 20;
const TURN_CHAR_CAP = 6_000;
const PRIOR_SESSIONS_COUNT = 5;
const PRIOR_TOPIC_CAP = 200;
const PRIOR_SESSION_SUMMARY_CHARS = 200;
const OPEN_QUESTIONS_CAP = 5;

function trimText(text: string, maxChars: number): string {
  if (!text) return '';
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > maxChars ? `${t.slice(0, maxChars)}…` : t;
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

function minimalBridge(studentName: string): string {
  return [
    `[STUDENT CONTINUITY BRIDGE — ${studentName}]`,
    'Status: Historical context could not be loaded this turn. Continue from the current message only.',
    'If a topic is absent, use CONSTITUTIONAL MEMORY LAW — do not claim ingatan or forgetting.',
    '[AKHIR STUDENT CONTINUITY BRIDGE / END STUDENT CONTINUITY BRIDGE]',
  ].join('\n');
}

async function getCurrentSessionTurnLines(sessionId: string): Promise<string[]> {
  const docs = await ADAMMessageModel.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(CURRENT_SESSION_TURNS * 2)
    .lean();

  docs.reverse();

  const lines: string[] = [];
  for (const m of docs.slice(-CURRENT_SESSION_TURNS * 2)) {
    const who =
      m.role === 'adam'
        ? 'ADAM'
        : m.speakerName?.trim() || 'Pelajar';
    const label = m.role === 'student' ? 'Pelajar' : 'ADAM';
    lines.push(`  ${label} (${who}): ${trimText(m.content, TURN_CHAR_CAP)}`);
    if (m.judgment && m.role === 'adam') {
      lines.push(`  [${m.judgment}]`);
    }
  }
  return lines;
}

async function getPriorSessionSummaries(
  studentId: string,
  currentSessionId: string,
  workspaces: Awaited<ReturnType<typeof getUserWorkspaces>>,
): Promise<string[]> {
  const sessions = await ADAMFounderSessionModel.find({
    founderId:   studentId,
    sessionType: 'student',
    active:      true,
    sessionId:   { $ne: currentSessionId },
  })
    .sort({ lastActiveAt: -1 })
    .limit(PRIOR_SESSIONS_COUNT)
    .lean();

  const wsBySession = new Map(workspaces.map((w) => [w.sessionId, w]));
  const out: string[] = [];

  for (const sess of sessions) {
    const ws = wsBySession.get(sess.sessionId);
    const label = ws ? `book "${ws.title}"` : 'general chat';
    const [turnCount, firstStudent] = await Promise.all([
      ADAMMessageModel.countDocuments({ sessionId: sess.sessionId }),
      ADAMMessageModel.findOne({
        sessionId: sess.sessionId,
        role:      'student',
      })
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const date = sess.lastActiveAt
      ? new Date(sess.lastActiveAt).toLocaleDateString('ms-MY')
      : '—';
    const topic = trimText(firstStudent?.content ?? 'Sesi pembelajaran', PRIOR_TOPIC_CAP);
    const digest = sess.sessionDigest?.trim()
      ? ` — ${trimText(sess.sessionDigest, 120)}`
      : '';

    out.push(
      `  ${date}: ${label} — "${topic}" — ${turnCount} message(s)${digest}`,
    );
  }

  return out;
}

function formatConstitutionalStateBlock(
  studentName: string,
  state: Awaited<ReturnType<typeof getStudentConstitutionalState>>,
  trackFallback: {
    constitutionalLevel?: number;
    masteredTopics?: string[];
    openQuestions?: string[];
    zpdReadiness?: boolean;
    lastSessionSummary?: string;
    understanding?: string;
    transformationCount?: number;
  } | undefined,
): string[] {
  const level = state?.constitutionalLevel ?? trackFallback?.constitutionalLevel ?? 1;
  const mastered = state?.masteredTopics ?? trackFallback?.masteredTopics ?? [];
  const openQ = state?.openQuestions ?? trackFallback?.openQuestions ?? [];
  const zpd = state?.zpdReadiness ?? trackFallback?.zpdReadiness ?? false;
  const lastSummary =
    state?.lastSessionSummary ?? trackFallback?.lastSessionSummary ?? '';
  const understanding =
    state?.understanding ?? trackFallback?.understanding ?? 'Not yet assessed';
  const transforms =
    state?.transformationCount ?? trackFallback?.transformationCount ?? 0;

  return [
    'Constitutional Knowledge State:',
    `- Knowledge Level : Level ${level} of 6`,
    `- Mastered Topics : ${mastered.length ? mastered.join(', ') : 'None yet'}`,
    `- ZPD Status      : ${zpd ? 'Ready to advance to next level' : 'Consolidating current level'}`,
    `- Transformation  : ${transforms} verified transformation(s)`,
    `- Understanding   : ${trimText(understanding, 500)}`,
    '',
    'Open Questions (carry forward):',
    openQ.length
      ? openQ.slice(0, OPEN_QUESTIONS_CAP).map((q) => `  - ${trimText(q, 120)}`).join('\n')
      : '  None recorded',
    '',
    'Last Session Summary (fast read):',
    lastSummary.trim()
      ? `  ${trimText(lastSummary, PRIOR_SESSION_SUMMARY_CHARS)}`
      : '  No prior session summary yet',
    '',
  ];
}

/**
 * Post-reply hook: persist open questions + last session summary on StudentTrack.
 */
export async function writeStudentStateAfterTurn(
  studentId: string,
  studentName: string,
  adamReply: string,
  studentMessage: string,
): Promise<void> {
  try {
    await ensureStudentTrackRow(studentId, studentName);

    const existing = await getStudentConstitutionalState(studentId);
    if (!existing) return;

    const isQuestion = studentMessage.trim().endsWith('?');
    const existingOpen = existing.openQuestions ?? [];

    const appearsUnresolved =
      isQuestion &&
      /tidak ada dalam konteks|boleh.*kongsikan|please share|tidak pasti|not in my current context/i.test(
        adamReply,
      );

    const updatedOpen = appearsUnresolved
      ? [...new Set([...existingOpen, studentMessage.trim().slice(0, 120)])].slice(
          -OPEN_QUESTIONS_CAP,
        )
      : existingOpen;

    const lastSessionSummary = trimText(adamReply.replace(/\s+/g, ' '), PRIOR_SESSION_SUMMARY_CHARS);

    await updateStudentConstitutionalState(studentId, {
      openQuestions: updatedOpen,
      lastSessionSummary,
    });
  } catch (err) {
    console.error('[StudentContinuityBridge] writeStudentStateAfterTurn:', err);
  }
}

/**
 * Build [STUDENT CONTINUITY BRIDGE] for system prompt (student turns only).
 * Fail-open: returns minimal bridge on error — never breaks chat.
 */
export async function buildStudentContinuityBridge(
  studentId: string,
  sessionId: string,
  studentName: string,
  triggerMessage = '',
): Promise<string> {
  try {
    const [master, sessions, workspaces, constitutionalState] = await Promise.all([
      getOrCreateMaster(FOUNDER_USER_ID),
      ADAMFounderSessionModel.find({
        founderId:   studentId,
        sessionType: 'student',
        active:      true,
      }).lean(),
      getUserWorkspaces(studentId),
      getStudentConstitutionalState(studentId),
    ]);

    const track = master.studentTracks?.find((t) => t.studentId === studentId);
    const sessionIds = [
      ...new Set([
        ...sessions.map((s) => s.sessionId),
        ...workspaces.map((w) => w.sessionId),
      ]),
    ];

    const lines: string[] = [
      `[STUDENT CONTINUITY BRIDGE — ${studentName}]`,
      'This block is context for this turn — not memory. Speak from what is here.',
      'When the student refers to a book or earlier thread, use book workspaces and session lines below.',
      'Do NOT say ingatan / forgot / short-term memory. Use CONSTITUTIONAL MEMORY LAW only if absent below.',
      '',
      ...formatConstitutionalStateBlock(studentName, constitutionalState, track),
      'Status Ilmu Semasa (current learning context):',
    ];

    if (sessionIds.length === 0) {
      lines.push('- No prior messages in system yet — first conversation.');
    } else {
      const [studentMsgCount, totalCount] = await Promise.all([
        ADAMMessageModel.countDocuments({
          sessionId: { $in: sessionIds },
          role:      'student',
        }),
        ADAMMessageModel.countDocuments({
          sessionId: { $in: sessionIds },
        }),
      ]);
      lines.push(
        `- Messages: ${studentMsgCount} from student, ${totalCount} total across ${sessionIds.length} session(s)`,
      );
    }

    if (track?.understanding?.trim() && !constitutionalState?.understanding) {
      lines.push(`- Brain track: ${messageSnippet(track.understanding, 500)}`);
    }
    lines.push('');

    if (workspaces.length > 0) {
      lines.push('Buku / Book workspaces:');
      for (const ws of workspaces) {
        lines.push(
          `  - "${ws.title}" (${ws.principle}): stage ${ws.stage}/7, ${ws.messageCount} message(s)`,
        );
        if (ws.description?.trim()) {
          lines.push(`    Scope: ${trimText(ws.description, 200)}`);
        }
        const u = ws.unifiedUnderstanding?.trim();
        if (u && u.length > 80) {
          lines.push(`    ${trimText(u, 900)}`);
        }
      }
      lines.push('');
    }

    if (triggerMessage.trim() && sessionIds.length > 0) {
      const bookRecall = await buildStudentBookMessageRecall(sessionIds, triggerMessage);
      if (bookRecall) {
        lines.push(bookRecall, '');
      }
    }

    const currentSess = sessions.find((s) => s.sessionId === sessionId);
    if (currentSess?.sessionDigest?.trim()) {
      lines.push('Ringkasan sesi semasa / Current session essence:');
      lines.push(`  ${trimText(currentSess.sessionDigest, 1_500)}`);
      lines.push('');
    }

    const turnLines = await getCurrentSessionTurnLines(sessionId);
    if (turnLines.length > 0) {
      lines.push(`Sesi semasa — recent turns (up to ${CURRENT_SESSION_TURNS} exchanges):`);
      lines.push(...turnLines);
      lines.push('');
    }

    const prior = await getPriorSessionSummaries(studentId, sessionId, workspaces);
    if (prior.length > 0) {
      lines.push('Sesi lepas / Prior sessions:');
      lines.push(...prior);
      lines.push('');
    }

    const recentAll = await ADAMMessageModel.find({
      sessionId: { $in: sessionIds.filter((id) => id !== sessionId) },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    recentAll.reverse();
    if (recentAll.length > 0) {
      lines.push('Recent exchange (other chats — books + general):');
      for (const m of recentAll) {
        const ws = workspaces.find((w) => w.sessionId === m.sessionId);
        const tag = ws ? ` [${ws.title}]` : '';
        const who = m.role === 'adam' ? 'ADAM' : m.speakerName || studentName;
        lines.push(`  - ${who}${tag}: ${messageSnippet(m.content)}`);
      }
      lines.push('');
    }

    lines.push('[AKHIR STUDENT CONTINUITY BRIDGE / END STUDENT CONTINUITY BRIDGE]');
    return lines.join('\n');
  } catch (err) {
    console.warn('[StudentContinuityBridge] build failed:', err);
    return minimalBridge(studentName);
  }
}
