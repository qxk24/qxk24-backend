/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : QXK24Brain Student Contribution Engine
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

import { resolveBrainFastModel } from '../config/anthropic-models';
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
import { getUserWorkspaces } from '../adam/adam-workspace.service';
import { getOrCreateMaster } from './qxk24brain.engine';
import { prependCoreToSystem } from './adam-core';
import { QXK24BrainMasterModel } from './qxk24brain.schema';

const BRAIN_MODEL = () => resolveBrainFastModel();

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
      'You are ADAM QXK24Brain alignment checker. Founder teachings are supreme. Respond JSON only.',
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
    console.error('[QXK24Brain] Student contribution error:', msg);
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
  const idx = tracks.findIndex((t) => t.studentId === studentId);

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
    });
  }

  await QXK24BrainMasterModel.updateOne(
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
  const idx = tracks.findIndex((t) => t.studentId === studentId);

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

  await QXK24BrainMasterModel.updateOne(
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
    'Each student may have a general chat plus separate book/workspace sessions — all are counted here.',
    '',
  ];

  for (const student of getStudentAccounts()) {
    const [sessions, workspaces, track] = await Promise.all([
      ADAMFounderSessionModel.find({
        founderId:   student.userId,
        sessionType: 'student',
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

    lines.push(`## ${student.name} (${student.userId})`);

    if (sessionIds.length === 0) {
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

    lines.push(
      studentMsgCount > 0
        ? `Private + books: HAS COMMUNICATED — ${studentMsgCount} student message(s), ${totalCount} total across ${sessionIds.length} session(s)`
        : 'Sessions exist but no student messages yet',
    );

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

    if (recent.length > 0) {
      lines.push('Recent exchange (all sessions):');
      for (const m of recent) {
        const ws = workspaces.find((w) => w.sessionId === m.sessionId);
        const bookTag = ws ? ` [${ws.title}]` : m.sessionId.includes('WS-') ? ' [book]' : '';
        const who =
          m.role === 'adam'
            ? 'ADAM'
            : m.speakerName || student.name;
        lines.push(`- ${who}${bookTag}: ${messageSnippet(m.content)}`);
      }
    }

    if (track?.understanding) {
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
