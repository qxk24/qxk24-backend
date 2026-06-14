/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Synthesis Turn
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

import { ENV } from '../config/environments';
import {
  resolveAdamChatModel,
  resolveAdamMaxTokens,
  resolveQwenEnableThinking,
} from '../config/llm-models';
import { toLlmMessages } from '../llm/llm-client';
import { sanitizeAdamProseDashBridges } from './adam-prose-sanitize';
import { streamAdamJournalResponse } from './adam-chat-stream-journal-turn';
import {
  finishAdamChatTurn,
  persistInteractiveJournalDraft,
} from './adam-chat-stream-post-turn';
import type { JournalSectionId } from './adam-journal-section.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { AdamTurnContextFetch, FounderTeachingFlags } from './adam-chat-stream-turn-context';
import { buildTurnPromptAndSearchGate } from './adam-chat-stream-turn-prompt';
import {
  injectTurnSearchPrefetch,
  logSearchGateEnabled,
} from './adam-chat-stream-turn-search';
import {
  createAdamLlmStreamOnce,
  repairAdamStreamOutput,
} from './adam-chat-stream-llm';
import { isAdamLightChatTurn } from './adam-response-generation';
import {
  enforceTutorReplyGuards,
  isAdamTutorMode,
} from './adam-tutor-law';
import type { WorkspaceRecord } from './adam-workspace.service';

export async function executeAdamSynthesisTurn(input: {
  shell: AdamChatTurnShell;
  workspace: WorkspaceRecord | null;
  isGuestTrial: boolean;
  turnContext: AdamTurnContextFetch;
  teachingFlags: FounderTeachingFlags;
}): Promise<void> {
  const { shell, workspace, isGuestTrial, turnContext, teachingFlags } = input;
  const {
    resolvedSessionId,
    userMessage,
    mode,
    isFounder,
    onEvent,
    uploadIds,
  } = shell;
  const { founderTeachingLearnerTurn } = teachingFlags;
  const { contextMessages, contextMs, needContinuityBridge } = turnContext;

  const promptBundle = await buildTurnPromptAndSearchGate({
    shell,
    workspace,
    turnContext,
    teachingFlags,
  });

  const {
    systemPrompt: initialPrompt,
    journal,
    recentUserTurns,
    recentAssistantTurns,
    precisionTurn,
    enableWebSearch,
    webSearchGateReason,
    studentSearchFirst,
  } = promptBundle;

  if (enableWebSearch) {
    logSearchGateEnabled({
      resolvedSessionId,
      userMessage,
      webSearchGateReason,
      studentSearchFirst,
      precisionFollowUp: precisionTurn.isFollowUp,
      isGuestTrial,
    });
  }

  const modelChoice = resolveAdamChatModel({
    participant: shell.participant,
    mode,
    message:    userMessage,
    hasUploads: uploadIds.length > 0,
  });

  const llmMessages = toLlmMessages(contextMessages);
  const maxTokens = resolveAdamMaxTokens(modelChoice.tier, isFounder, mode);
  const lightChat = isAdamLightChatTurn(userMessage);
  const enableThinking = resolveQwenEnableThinking(
    modelChoice.tier,
    mode,
    {
      founderTeachingAbsorption: founderTeachingLearnerTurn,
      isStudent:                 !isFounder,
      lightChat,
    },
  );

  const searchBundle = await injectTurnSearchPrefetch({
    systemPrompt:       initialPrompt,
    studentSearchFirst,
    turnContext,
    userMessage,
    llmMessages,
    resolvedSessionId,
    onEvent,
  });

  const streamOnce = createAdamLlmStreamOnce({
    modelChoice,
    maxTokens,
    systemPrompt: searchBundle.systemPrompt,
    enableThinking,
    resolvedSessionId,
    userMessage,
    precisionActive: precisionTurn.isActive,
    webSearchGateReason,
    onEvent,
  });

  let fullResponse: string;
  let sectionJournalComplete = false;
  let sectionDraftMap: Partial<Record<JournalSectionId, string>> | undefined;
  let streamMs = 0;
  let repairMs = 0;
  let syncRepairMs = 0;
  let sanitizedRepairApplied = false;

  if (mode === 'JOURNAL_GEN' && isFounder) {
    const journalResult = await streamAdamJournalResponse({
      resolvedSessionId,
      userMessage,
      mode,
      isFounder,
      journal,
      llmMessages,
      enableWebSearch,
      streamOnce: async (messages, withSearch) => {
        const result = await streamOnce(messages, withSearch);
        return result.text;
      },
      onEvent,
    });
    fullResponse = journalResult.fullResponse;
    sectionJournalComplete = journalResult.sectionJournalComplete;
    sectionDraftMap = journalResult.sectionDraftMap;
    streamMs = journalResult.streamMs;
    repairMs = journalResult.repairMs;
    onEvent('adam_stream_idle', JSON.stringify({ sessionId: resolvedSessionId }));
  } else {
    const streamStarted = Date.now();
    const synthesisWithSearch = enableWebSearch && !studentSearchFirst;
    const streamResult = await streamOnce(llmMessages, synthesisWithSearch);
    if (studentSearchFirst) {
      streamResult.searchResults = searchBundle.prefetchedSearchResults;
      streamResult.searchUsed = searchBundle.prefetchedSearchUsed;
      streamResult.searchDroppedByFilter = searchBundle.prefetchedSearchDropped;
    }
    const rawModelStream = streamResult.text;
    streamMs = Date.now() - streamStarted;
    onEvent('adam_stream_idle', JSON.stringify({ sessionId: resolvedSessionId }));

    const repairResult = await repairAdamStreamOutput({
      shell,
      rawModelStream,
      teachingFlags,
      recentUserTurns,
      recentAssistantTurns,
      mode,
    });
    fullResponse = repairResult.fullResponse;
    repairMs = repairResult.repairMs;
    syncRepairMs = repairResult.syncRepairMs;
    sanitizedRepairApplied = repairResult.sanitizedRepairApplied;
  }

  console.log(
    '[adam:timing]',
    JSON.stringify({
      sessionId: resolvedSessionId,
      role:      shell.participant.role,
      stack:     ENV.QXK24_STACK,
      mode,
      model:     modelChoice.model,
      tier:      modelChoice.tier,
      reason:    modelChoice.reason,
      contextMs,
      searchPrefetchMs: searchBundle.searchPrefetchMs,
      searchPrefetchParallel:
        turnContext.searchPrefetchParallel && Boolean(turnContext.searchPrefetchPromise),
      studentInlineSearch:
        turnContext.studentInlineSearchOnly || ENV.ADAM_STUDENT_INLINE_SEARCH,
      studentFounderStyleStream: turnContext.studentInlineSearchOnly,
      continuityBridge: needContinuityBridge,
      streamMs,
      repairMs,
      syncRepairMs: !isFounder ? syncRepairMs : undefined,
      inputTurns: llmMessages.length,
    }),
  );

  if (fullResponse?.trim()) {
    if (isAdamTutorMode(mode)) {
      const scrubbed = enforceTutorReplyGuards(
        fullResponse,
        shell.options.tutorProfile,
      );
      if (scrubbed !== fullResponse) {
        fullResponse = scrubbed;
        onEvent('adam_stream_done', JSON.stringify({
          sessionId: resolvedSessionId,
          replace:   true,
          response:  fullResponse,
        }));
      }
    }
    fullResponse = sanitizeAdamProseDashBridges(fullResponse);
  }

  const persistResult = await persistInteractiveJournalDraft({
    shell,
    fullResponse,
    journal,
    sectionDraftMap,
  });
  if (persistResult?.sections) {
    sectionDraftMap = persistResult.sections;
  }
  if (persistResult?.mergedDisplay) {
    fullResponse = persistResult.mergedDisplay;
  }
  if (isFounder && fullResponse?.trim()) {
    onEvent('adam_stream_done', JSON.stringify({
      sessionId: resolvedSessionId,
      replace:   true,
      response:  fullResponse,
    }));
  }

  await finishAdamChatTurn({
    shell,
    fullResponse,
    journal,
    sectionJournalComplete,
    sectionDraftMap,
    sanitizedRepairApplied,
    modelChoice,
    workspace,
  });
}
