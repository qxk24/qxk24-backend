/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Relay Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ADAMConsultModel } from './adam.schema';
import {
  getOrCreateGroupSession,
  getOrCreateSession,
  saveMessage,
} from './adam-chat-session.service';
import type { FounderBroadcast } from './adam-chat-response-parser';
import { buildStudentRelayAttachmentSection } from './adam-upload.service';
import {
  createConsultFlag,
  markConsultDeliveredToFounder,
} from './adam-consult.service';
import { getStudentAccount, getStudentAccounts } from './adam-student.service';
import {
  FOUNDER_USER_ID,
  type SessionType,
} from './adam-student.types';
import type { ADAMChatMode } from './adam.types';

const FOUNDER_RELAY_PREFIX = '📜 Message from Founder Masa Bayu (via ADAM):\n\n';
const STUDENT_RELAY_PREFIX = '📩 Message from ';

function formatFounderRelayMessage(message: string, attachmentSection = ''): string {
  const parts = [`${FOUNDER_RELAY_PREFIX}${message.trim()}`];
  if (attachmentSection.trim()) parts.push(attachmentSection.trim());
  return parts.join('\n\n');
}

function formatStudentRelayMessage(studentName: string, message: string, adamNote?: string): string {
  const parts = [
    `${STUDENT_RELAY_PREFIX}${studentName} (via ADAM):`,
    '',
    message.trim(),
  ];
  if (adamNote?.trim()) {
    parts.push('', `[ADAM note: ${adamNote.trim()}]`);
  }
  return parts.join('\n');
}

export async function relayFounderMessageToStudents(
  broadcast: FounderBroadcast,
  mode: ADAMChatMode,
  attachmentUploadIds: string[] = [],
): Promise<{ groupId?: string; privateCount: number }> {
  const attachmentSection = attachmentUploadIds.length
    ? await buildStudentRelayAttachmentSection(attachmentUploadIds)
    : '';
  const formatted = formatFounderRelayMessage(broadcast.message, attachmentSection);
  const target = broadcast.target.toLowerCase();
  let groupId: string | undefined;
  let privateCount = 0;

  const postRelay = (
    sessionId: string,
    sessionType: SessionType,
    ownerId: string,
  ) =>
    saveMessage(sessionId, 'adam', formatted, mode, undefined, undefined, ownerId, {
      speakerId:      'adam',
      speakerName:    'ADAM',
      sessionType,
      isFounderRelay: true,
    });

  if (target === 'group' || target === 'all') {
    const groupSessionId = await getOrCreateGroupSession();
    groupId = await postRelay(groupSessionId, 'group', 'group-alamtologi');
  }

  if (target === 'all') {
    for (const student of getStudentAccounts()) {
      const sessionId = await getOrCreateSession(student.userId, 'student');
      await postRelay(sessionId, 'student', student.userId);
      privateCount += 1;
    }
  } else if (target !== 'group') {
    const account = getStudentAccount(target);
    if (account) {
      const sessionId = await getOrCreateSession(account.userId, 'student');
      await postRelay(sessionId, 'student', account.userId);
      privateCount += 1;
    }
  }

  return { groupId, privateCount };
}

/** Post student message into Founder's private Teaching session */
export async function relayStudentMessageToFounder(params: {
  studentId:   string;
  studentName: string;
  message:     string;
  adamNote?:   string;
  mode?:       ADAMChatMode;
}): Promise<string> {
  const founderSessionId = await getOrCreateSession(FOUNDER_USER_ID, 'founder');
  const formatted = formatStudentRelayMessage(
    params.studentName,
    params.message,
    params.adamNote,
  );

  return saveMessage(
    founderSessionId,
    'adam',
    formatted,
    params.mode ?? 'QUESTIONING',
    undefined,
    undefined,
    FOUNDER_USER_ID,
    {
      speakerId:      params.studentId,
      speakerName:    params.studentName,
      sessionType:    'founder',
      isStudentRelay: true,
    },
  );
}

/** Backfill consults that never reached the Founder Teaching thread */
export async function syncUndeliveredConsultsToFounder(): Promise<number> {
  const docs = await ADAMConsultModel.find({ deliveredToFounder: { $ne: true } })
    .sort({ createdAt: 1 })
    .limit(50)
    .lean();

  let count = 0;
  for (const doc of docs) {
    await relayStudentMessageToFounder({
      studentId:   doc.studentId,
      studentName: doc.studentName,
      message:     doc.studentMessage,
      adamNote:    doc.adamSummary,
    });
    await markConsultDeliveredToFounder(doc.consultId);
    count += 1;
  }
  return count;
}
