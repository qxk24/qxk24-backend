/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Post Turn Relay
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { CONSULT_PHRASE } from './adam-system-prompts';
import {
  founderWantsStudentRelay,
  studentWantsFounderRelay,
} from './adam-chat-response-parser';
import {
  relayFounderMessageToStudents,
  relayStudentMessageToFounder,
} from './adam-chat-relay.service';
import {
  createConsultFlag,
  markConsultDeliveredToFounder,
} from './adam-consult.service';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { ParsedAdamTurnBlocks } from './adam-chat-stream-post-finalize';

export interface RelayTurnResult {
  relayedToStudents: number;
  relayedToFounder: boolean;
  finalResponse: string;
}

export async function handleAdamTurnRelays(input: {
  shell: AdamChatTurnShell;
  parsed: ParsedAdamTurnBlocks;
  finalResponse: string;
}): Promise<RelayTurnResult> {
  let relayedToStudents = 0;
  let relayedToFounder = false;
  let finalResponse = input.finalResponse;
  const { shell, parsed } = input;
  const { consult, broadcast, toFounder } = parsed;

  if (shell.isFounder) {
    const attachmentIds = shell.teaching.uploadIds;
    const broadcasts =
      broadcast.broadcasts.length > 0
        ? broadcast.broadcasts
        : attachmentIds.length && founderWantsStudentRelay(shell.userMessage)
          ? [{
              message: shell.userMessage.trim() || 'Founder shared teaching data for you.',
              target:  'all',
            }]
          : [];

    for (const b of broadcasts) {
      const result = await relayFounderMessageToStudents(
        b,
        shell.mode,
        attachmentIds,
      );
      relayedToStudents += result.privateCount + (result.groupId ? 1 : 0);
    }
  }

  if (!shell.isFounder) {
    const relayNote = consult.reason || undefined;

    const deliverToFounder = async (text: string) => {
      await relayStudentMessageToFounder({
        studentId:   shell.participant.userId,
        studentName: shell.participant.userName,
        message:     text,
        adamNote:    relayNote,
        mode:        shell.mode,
      });
      relayedToFounder = true;
    };

    for (const r of toFounder.relays) {
      await deliverToFounder(r.message);
    }

    if (consult.needsConsult) {
      if (!finalResponse.includes(CONSULT_PHRASE)) {
        finalResponse = `${CONSULT_PHRASE}.\n\n${finalResponse}`.trim();
      }
      const consultRecord = await createConsultFlag({
        studentId:      shell.participant.userId,
        studentName:    shell.participant.userName,
        sessionId:      shell.resolvedSessionId,
        sessionType:    shell.isGroup ? 'group' : 'student',
        studentMessage: shell.userMessage,
        adamSummary:    consult.reason || finalResponse.slice(0, 500),
      });
      if (!toFounder.relays.length) {
        const relayBody = shell.teaching.fileNames.length
          ? [
              shell.userMessage.trim() || '(attachment only)',
              '',
              `Files: ${shell.teaching.fileNames.join(', ')}`,
            ].join('\n')
          : shell.userMessage.trim();
        await deliverToFounder(relayBody);
      }
      await markConsultDeliveredToFounder(consultRecord.id);
    } else if (!relayedToFounder && studentWantsFounderRelay(shell.userMessage)) {
      const relayBody = shell.teaching.fileNames.length
        ? [
            shell.userMessage.trim() || '(attachment only)',
            '',
            `Files: ${shell.teaching.fileNames.join(', ')}`,
          ].join('\n')
        : shell.userMessage.trim();
      await deliverToFounder(relayBody);
    }
  }

  return { relayedToStudents, relayedToFounder, finalResponse };
}
