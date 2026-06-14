/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Turn Runner
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

import { friendlyLlmError } from '../llm/llm-client';
import { processStudentContribution } from '../qxk24brain/qxk24brain-student.engine';
import { ADAMWorkspaceModel } from './adam-workspace.schema';
import { fetchPlasPrescan } from './adam-gateway-client';
import { handleAdamBuilderTurn } from './adam-chat-stream-builder-turn';
import { executeAdamSynthesisTurn } from './adam-chat-stream-synthesis';
import {
  fetchAdamTurnContext,
  handlePlasPrescanShortCircuit,
  resolveFounderTeachingFlags,
  loadRecentTeachingTurnTexts,
} from './adam-chat-stream-turn-context';
import { isGuestUserId } from '../freemium/adam-freemium-guest.service';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { WorkspaceRecord } from './adam-workspace.service';

export async function runAdamChatTurn(input: {
  shell: AdamChatTurnShell;
  workspace: WorkspaceRecord | null;
  isTesterGreetingTurn: boolean;
}): Promise<void> {
  const { shell, workspace, isTesterGreetingTurn } = input;
  const {
    resolvedSessionId,
    messageForAdam,
    isFounder,
    participant,
    userMessageId,
    onEvent,
  } = shell;
  const isGuestTrial = isGuestUserId(participant.userId);

  onEvent('adam_thinking', JSON.stringify({ sessionId: resolvedSessionId, mode: shell.mode }));

  const plasPrescanPromise = !isFounder && !isGuestTrial
    ? fetchPlasPrescan({
      input: messageForAdam,
      studentId: participant.userId,
      sessionId: resolvedSessionId,
    })
    : Promise.resolve(null);

  if (workspace) {
    await ADAMWorkspaceModel.updateOne(
      { workspaceId: workspace.workspaceId, nucleusUid: null },
      { nucleusUid: userMessageId },
    );
  }

  if (await handleAdamBuilderTurn(shell)) {
    return;
  }

  if (!isFounder && !workspace && !isGuestTrial) {
    void processStudentContribution(
      participant.userId,
      participant.userName,
      shell.messageForAdam,
    ).catch((err) => console.error('[Alamtologi Brain] Student background merge:', err));
  }

  try {
    const recentTeachingTurns =
      isFounder && shell.mode === 'TEACHING'
        ? await loadRecentTeachingTurnTexts(shell.resolvedSessionId)
        : { recentAssistantMessages: [] as string[], recentUserMessages: [] as string[] };

    const teachingFlags = resolveFounderTeachingFlags({
      isFounder,
      mode: shell.mode,
      normalizedMessage: shell.normalizedMessage,
      hasTeachingUpload: shell.teaching.fileNames.length > 0,
      recentAssistantMessages: recentTeachingTurns.recentAssistantMessages,
      recentUserMessages: recentTeachingTurns.recentUserMessages,
    });

    const turnContext = await fetchAdamTurnContext({
      shell,
      workspace,
      isGuestTrial,
      isTesterGreetingTurn,
      teachingFlags,
      plasPrescanPromise,
      onEvent,
    });

    if (await handlePlasPrescanShortCircuit(shell, turnContext.plasPrescan)) {
      return;
    }

    await executeAdamSynthesisTurn({
      shell,
      workspace,
      isGuestTrial,
      turnContext,
      teachingFlags,
    });
  } catch (err: unknown) {
    const message = friendlyLlmError(err);
    console.error('[ADAM] stream error:', err);
    onEvent('adam_error', JSON.stringify({
      error:  message,
      waqf:   true,
      reason: 'Constitutional stream interrupted',
    }));
    throw err;
  }
}
