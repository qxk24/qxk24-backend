/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { normalizeUserMessage } from './adam-context-budget';
import {
  buildTeachingContext,
  composeFounderMessage,
  composeStudentMessage,
} from './adam-upload.service';
import { withFounderLock } from '../qxk24brain/adam-concurrency.service';
import {
  getWorkspaceBySession,
  touchWorkspace,
} from './adam-workspace.service';
import {
  FOUNDER_USER_ID,
  type ChatParticipant,
} from './adam-student.types';
import type { ADAMChatMode, SSEEventType } from './adam.types';
import { founderTeachingStoredUserContent } from './adam-founder-teaching-prompts';
import {
  ensureSession,
  loadMessageHistory,
  saveMessage,
} from './adam-chat-session.service';
import { isTesterAccount } from '../tester/alm-tester.service';
import {
  founderWantsJournalDraft,
  founderWantsJournalStop,
  founderWantsJournalWrite,
  founderWantsJournalContinue,
} from './adam-chat-response-parser';
import {
  founderWantsJournalSectionEdit,
  founderWantsJournalSectionAppend,
  founderWantsJournalSaveAddendum,
} from './adam-journal-section-detect';
import { founderWantsJournalParagraphContinue } from './adam-journal-section-paragraphs';
import { runAdamChatTurn } from './adam-chat-stream-turn';
import type {
  StreamADAMChatOptions,
  AdamChatTurnShell,
} from './adam-chat-stream.types';

export type { StreamADAMChatOptions } from './adam-chat-stream.types';

function resolveJournalGenMode(
  isFounder: boolean,
  mode: ADAMChatMode,
  normalizedMessage: string,
): ADAMChatMode {
  if (
    isFounder
    && mode === 'TEACHING'
    && !founderWantsJournalStop(normalizedMessage)
    && (
      founderWantsJournalWrite(normalizedMessage)
      || founderWantsJournalDraft(normalizedMessage)
      || founderWantsJournalContinue(normalizedMessage)
      || founderWantsJournalSectionEdit(normalizedMessage)
      || founderWantsJournalSectionAppend(normalizedMessage)
      || founderWantsJournalSaveAddendum(normalizedMessage)
      || founderWantsJournalParagraphContinue(normalizedMessage)
    )
  ) {
    return 'JOURNAL_GEN';
  }
  return mode;
}

function buildStoredUserContent(input: {
  isGroup: boolean;
  isFounder: boolean;
  participant: ChatParticipant;
  normalizedMessage: string;
  teachingFileNames: string[];
  attachmentNote: string;
}): string {
  const {
    isGroup,
    isFounder,
    participant,
    normalizedMessage,
    teachingFileNames,
    attachmentNote,
  } = input;

  if (isGroup) {
    return [
      `[${participant.userName}]: ${normalizedMessage.trim() || (teachingFileNames.length ? 'Shared attachment(s).' : '')}`,
      attachmentNote,
    ].filter(Boolean).join('\n');
  }

  if (isFounder && teachingFileNames.length) {
    return founderTeachingStoredUserContent(normalizedMessage, teachingFileNames);
  }

  if (teachingFileNames.length) {
    return [
      normalizedMessage.trim() || `${participant.userName} shared attachment(s).`,
      '',
      attachmentNote,
    ].join('\n');
  }

  return normalizedMessage.trim() || 'P.alt shared teaching material.';
}

export async function streamADAMChat(
  sessionId: string,
  userMessage: string,
  mode: ADAMChatMode,
  onEvent: (event: SSEEventType, data: string) => void,
  uploadIds: string[] = [],
  participant: ChatParticipant = {
    userId:      FOUNDER_USER_ID,
    userName:    'Masa Bayu',
    role:        'founder',
    sessionType: 'founder',
  },
  options: StreamADAMChatOptions = {},
): Promise<void> {
  const isFounder = participant.role === 'founder';
  const isGroup = participant.sessionType === 'group';

  const resolvedSessionId = await ensureSession(
    sessionId,
    participant.userId,
    participant.sessionType,
  );

  const workspace =
    participant.role === 'student'
    && participant.sessionType === 'student'
    && !isGroup
      ? await getWorkspaceBySession(resolvedSessionId)
      : null;

  if (workspace && workspace.userId !== participant.userId) {
    throw new Error('Workspace access denied.');
  }

  if (workspace) {
    await touchWorkspace(workspace.workspaceId);
  }

  const normalizedMessage = normalizeUserMessage(userMessage);
  mode = resolveJournalGenMode(isFounder, mode, normalizedMessage);

  const teaching = uploadIds.length
    ? await buildTeachingContext(uploadIds, {
        scope:           isFounder ? 'founder' : 'student',
        studentName:     participant.userName,
        ownerUserId:     isFounder ? undefined : participant.userId,
        maxContextChars: ENV.ADAM_CHAT_TEACHING_CHARS,
      })
    : { context: '', fileNames: [], uploadIds: [] };

  const messageForAdam = isFounder
    ? composeFounderMessage(normalizedMessage, teaching.context)
    : composeStudentMessage(normalizedMessage, teaching.context, participant.userName);

  const attachmentNote = teaching.fileNames.length
    ? `[Attached: ${teaching.fileNames.join(', ')} — processed per AIDIL]`
    : '';

  const storedUserContent = buildStoredUserContent({
    isGroup,
    isFounder,
    participant,
    normalizedMessage,
    teachingFileNames: teaching.fileNames,
    attachmentNote,
  });

  const userRole = isFounder ? 'founder' : 'student';

  let isTesterGreetingTurn = false;
  if (
    !isFounder
    && participant.sessionType === 'student'
    && normalizedMessage.trim() === ''
    && await isTesterAccount(participant.userId)
  ) {
    const histBeforeTurn = await loadMessageHistory(resolvedSessionId, 5);
    isTesterGreetingTurn = histBeforeTurn.length === 0;
  }

  const runChatTurn = async (): Promise<void> => {
    const userMessageId = await saveMessage(
      resolvedSessionId,
      userRole,
      storedUserContent,
      mode,
      undefined,
      undefined,
      isGroup ? 'group-alamtologi' : participant.userId,
      {
        speakerId:   participant.userId,
        speakerName: participant.userName,
        sessionType: participant.sessionType,
      },
    );

    const shell: AdamChatTurnShell = {
      resolvedSessionId,
      userMessage,
      normalizedMessage,
      messageForAdam,
      mode,
      isFounder,
      isGroup,
      participant,
      options,
      onEvent,
      uploadIds,
      teaching,
      userMessageId,
    };

    await runAdamChatTurn({
      shell,
      workspace,
      isTesterGreetingTurn,
    });
  };

  const lockOwner = isFounder
    ? FOUNDER_USER_ID
    : `student:${participant.userId}`;

  try {
    await withFounderLock(lockOwner, runChatTurn);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('memory lock')) {
      onEvent('adam_error', JSON.stringify({
        error:  message,
        waqf:   false,
        reason: 'Concurrent access — another request is being processed first',
      }));
      return;
    }
    throw err;
  }
}
