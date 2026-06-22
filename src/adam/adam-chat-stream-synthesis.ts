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
import { isAdamProseCraftTurn } from './adam-prose-craft';
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
  resolveGoldStandardSearchFirstReply,
  appendGoldStandardSynthesisContextToPrompt,
} from './adam-search-first';
import {
  createAdamLlmStreamOnce,
  repairAdamStreamOutput,
} from './adam-chat-stream-llm';
import { resolveAdamTurnDisplayForSave } from './adam-stream-display-merge';
import { alphaStatPersistedStreamBody } from './adam-stat-stream-preserve';
import { evidenceHasGoldStandardArticle } from './adam-alpha-output-guard';
import { isAdamLightChatTurn, isAdamSimpleFactualTurn } from './adam-response-generation';
import { isFounderChannel, isUsersTechnicalChannel } from './adam-channel-router';
import {
  ensureUsersProductRedirectFree,
  outputHasAdamProductRedirectLeak,
} from './adam-response-generation';
import {
  formatBrainRiverLog,
  riverStageForSynthesis,
  isStudentOceanSink,
} from './adam-brain-river';
import { resolveFounderTurnDisplayForSave } from './adam-founder-stream-repair';
import { finalizeUsersTechnicalDisplay } from './adam-users-stream-repair';
import { isAdamMediaSearchTurn } from './adam-media-search';
import { outputHasAdamChatMedia } from './adam-media-guard';
import { isAdamCurrentAffairsTurn, isFactualAdamWebSearchGateReason, isVerifiedDataStatAsk } from './adam-web-search';
import {
  enforceTutorReplyGuards,
  isAdamTutorMode,
  shouldApplyAcademicIntentRouting,
} from './adam-tutor-law';
import type { WorkspaceRecord } from './adam-workspace.service';
import { detectContextRecallLoaded } from './adam-universal-recall-router';

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
  const { contextMessages, contextMs, needContinuityBridge, knowledgeMode, river, branchPolicy } = turnContext;
  const channel = river.channel;

  console.log(formatBrainRiverLog(river, riverStageForSynthesis()));

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
    usersSearchFirst,
  } = promptBundle;

  if (enableWebSearch) {
    logSearchGateEnabled({
      resolvedSessionId,
      userMessage,
      webSearchGateReason,
      usersSearchFirst,
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

  const searchBundle = await injectTurnSearchPrefetch({
    systemPrompt:       initialPrompt,
    usersSearchFirst,
    webSearchGateReason,
    turnContext,
    userMessage,
    llmMessages,
    resolvedSessionId,
    isFounder,
    onEvent,
  });

  const goldStandardSearchFirst = usersSearchFirst
    && isFactualAdamWebSearchGateReason(webSearchGateReason)
    && searchBundle.prefetchedSearchUsed
    && !searchBundle.prefetchedSearchDropped;

  const enableThinking = resolveQwenEnableThinking(
    modelChoice.tier,
    mode,
    {
      founderTeachingAbsorption: founderTeachingLearnerTurn,
      isStudent:                 !isFounder,
      lightChat,
      simpleFactualTurn:         isAdamSimpleFactualTurn(userMessage),
      searchFirstSynthesis:      goldStandardSearchFirst,
    },
  );

  let goldStandardVerifiedFigure: string | null = null;
  let goldStandardArticleReady = false;
  if (goldStandardSearchFirst) {
    const fastResult = await resolveGoldStandardSearchFirstReply({
      userMessage,
      searchResults:  searchBundle.prefetchedSearchResults,
      extractedFacts: searchBundle.extractedFacts,
    });
    searchBundle.prefetchedSearchResults = fastResult.evidence;
    searchBundle.extractedFacts = fastResult.extractedFacts;
    goldStandardArticleReady = evidenceHasGoldStandardArticle(fastResult.evidence, userMessage);
    goldStandardVerifiedFigure = fastResult.verifiedFigure;
    searchBundle.systemPrompt = appendGoldStandardSynthesisContextToPrompt(
      initialPrompt,
      userMessage,
      fastResult.evidence,
      fastResult.extractedFacts,
    );
  }

  const bufferUntilRepair = branchPolicy.bufferStreamUntilRepair;

  const streamOnce = createAdamLlmStreamOnce({
    modelChoice,
    maxTokens,
    systemPrompt: searchBundle.systemPrompt,
    enableThinking,
    resolvedSessionId,
    userMessage,
    precisionActive: precisionTurn.isActive,
    webSearchGateReason,
    bufferChunksUntilRepair: bufferUntilRepair,
    onEvent,
  });

  let fullResponse = '';
  let sectionJournalComplete = false;
  let sectionDraftMap: Partial<Record<JournalSectionId, string>> | undefined;
  let streamMs = 0;
  let repairMs = 0;
  let syncRepairMs = 0;
  let sanitizedRepairApplied = false;
  let arithmeticAlphaRepairApplied = false;
  let visualDrawRepairApplied = false;
  let proseCraftRepairApplied = false;
  let usersGreetingRepairApplied = false;
  let technicalMediaRepairApplied = false;
  let adamProductRedirectRepairApplied = false;
  let rawModelStreamForBrain = '';
  let webSearchUsedThisTurn = false;
  let preserveStreamBody = false;

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
    if (goldStandardSearchFirst && goldStandardArticleReady) {
      console.log('[adam:search-first] gold standard — ADAM full-voice synthesis', JSON.stringify({
        sessionId: resolvedSessionId,
        hits:      searchBundle.prefetchedSearchResults.length,
        hasFigure: goldStandardVerifiedFigure !== null,
      }));
    } else if (goldStandardSearchFirst && goldStandardVerifiedFigure) {
      console.log('[adam:search-first] gold standard — synthesis with verified opener', JSON.stringify({
        sessionId: resolvedSessionId,
        figure:    goldStandardVerifiedFigure,
        hits:      searchBundle.prefetchedSearchResults.length,
      }));
    } else if (goldStandardSearchFirst) {
      console.log('[adam:search-first] gold standard — guarded synthesis fallback', JSON.stringify({
        sessionId: resolvedSessionId,
        hits:      searchBundle.prefetchedSearchResults.length,
      }));
    }

    if (!fullResponse) {
      const streamStarted = Date.now();
      const synthesisWithSearch = enableWebSearch && !usersSearchFirst;
      const streamResult = await streamOnce(llmMessages, synthesisWithSearch);
      if (usersSearchFirst) {
        streamResult.searchResults = searchBundle.prefetchedSearchResults;
        streamResult.searchUsed = searchBundle.prefetchedSearchUsed;
        streamResult.searchDroppedByFilter = searchBundle.prefetchedSearchDropped;
      }
      webSearchUsedThisTurn = Boolean(
        enableWebSearch
        && (streamResult.searchUsed || searchBundle.prefetchedSearchUsed),
      );
      const rawModelStream = streamResult.text;
      rawModelStreamForBrain = rawModelStream;
      streamMs = Date.now() - streamStarted;
      if (!bufferUntilRepair) {
        onEvent('adam_stream_idle', JSON.stringify({ sessionId: resolvedSessionId }));
      } else {
        onEvent('adam_repairing', JSON.stringify({ sessionId: resolvedSessionId }));
      }

      const searchEvidence = searchBundle.prefetchedSearchResults.length > 0
        ? searchBundle.prefetchedSearchResults
        : streamResult.searchResults;

      const repairResult = await repairAdamStreamOutput({
        shell,
        rawModelStream,
        teachingFlags,
        recentUserTurns,
        recentAssistantTurns,
        mode,
        channel,
        answerPlan: river.answerPlan,
        turnGate: river.gate,
        searchResults: searchEvidence,
        searchUsed: streamResult.searchUsed || searchBundle.prefetchedSearchUsed,
        searchDroppedByFilter: streamResult.searchDroppedByFilter
          || searchBundle.prefetchedSearchDropped,
        extractedFacts: searchBundle.extractedFacts,
        mediaHits: searchBundle.mediaHits,
      });
      fullResponse = repairResult.fullResponse;
      repairMs = repairResult.repairMs;
      syncRepairMs = repairResult.syncRepairMs;
      sanitizedRepairApplied = repairResult.sanitizedRepairApplied;
      arithmeticAlphaRepairApplied = repairResult.arithmeticAlphaRepairApplied;
      visualDrawRepairApplied = repairResult.visualDrawRepairApplied;
      proseCraftRepairApplied = repairResult.proseCraftRepairApplied;
      usersGreetingRepairApplied = repairResult.usersGreetingRepairApplied;
      technicalMediaRepairApplied = repairResult.technicalMediaRepairApplied;
      const adamProductRedirectRepairAppliedFromRepair = repairResult.adamProductRedirectRepairApplied;
      adamProductRedirectRepairApplied = adamProductRedirectRepairAppliedFromRepair;

      const alphaStatTurn = isVerifiedDataStatAsk(userMessage);
      const searchRan = searchBundle.prefetchedSearchUsed && !searchBundle.prefetchedSearchDropped;

      if (alphaStatTurn && searchRan) {
        preserveStreamBody = true;
        fullResponse = alphaStatPersistedStreamBody(rawModelStream);
      } else if (isFounderChannel(channel)) {
        fullResponse = resolveFounderTurnDisplayForSave(rawModelStream, fullResponse);
      } else {
        fullResponse = resolveAdamTurnDisplayForSave(rawModelStream, fullResponse, {
          forceReplace: sanitizedRepairApplied && isAdamCurrentAffairsTurn(userMessage),
          userMessage,
          arithmeticAlphaRepair: arithmeticAlphaRepairApplied,
          visualDrawRepair: visualDrawRepairApplied,
          proseCraftRepair: proseCraftRepairApplied,
          usersGreetingRepair: usersGreetingRepairApplied,
          technicalMediaRepair: technicalMediaRepairApplied,
          adamProductRedirectRepair: adamProductRedirectRepairApplied,
        });
        const dashCleaned = sanitizeAdamProseDashBridges(fullResponse);
        if (dashCleaned !== fullResponse) {
          fullResponse = dashCleaned;
          if (isAdamProseCraftTurn(userMessage)) {
            proseCraftRepairApplied = true;
            sanitizedRepairApplied = true;
            onEvent('adam_stream_done', JSON.stringify({
              sessionId:       resolvedSessionId,
              replace:         true,
              sanitizedRepair: true,
              proseCraftRepair: true,
              briefTier1Repair: true,
              response:        fullResponse,
            }));
          }
        }
        if (branchPolicy.usersTechnicalFinalize) {
          const finalized = finalizeUsersTechnicalDisplay({
            fullResponse,
            userMessage,
            channel,
            participantName: shell.participant.userName,
            mediaHits: searchBundle.mediaHits,
            answerPlan: river.answerPlan,
          });
          fullResponse = finalized.fullResponse;
          if (finalized.technicalMediaRepairApplied) {
            sanitizedRepairApplied = true;
            technicalMediaRepairApplied = true;
          }
        }
      }

      if (!isFounderChannel(channel) && !isAdamTutorMode(mode)) {
        const beforeProductRedirect = fullResponse;
        fullResponse = ensureUsersProductRedirectFree(fullResponse, userMessage, recentUserTurns);
        if (outputHasAdamProductRedirectLeak(beforeProductRedirect) && !outputHasAdamProductRedirectLeak(fullResponse)) {
          adamProductRedirectRepairApplied = true;
          sanitizedRepairApplied = true;
        }
      }

      const mustReplaceStream = bufferUntilRepair
        || adamProductRedirectRepairApplied
        || (
          outputHasAdamProductRedirectLeak(rawModelStream)
          && !outputHasAdamProductRedirectLeak(fullResponse)
        );

      if (mustReplaceStream && fullResponse?.trim()) {
        onEvent('adam_stream_done', JSON.stringify({
          sessionId:            resolvedSessionId,
          replace:              true,
          response:             fullResponse,
          sanitizedRepair:      true,
          adamProductRedirectRepair: adamProductRedirectRepairApplied,
          briefTier1Repair:     bufferUntilRepair || adamProductRedirectRepairApplied,
          technicalMediaRepair:   !isFounderChannel(channel) && (
            outputHasAdamChatMedia(fullResponse)
            || isUsersTechnicalChannel(channel)
            || isAdamMediaSearchTurn(userMessage, false)
          ),
        }));
      }

      if (bufferUntilRepair) {
        onEvent('adam_stream_idle', JSON.stringify({ sessionId: resolvedSessionId }));
      }
    }
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
      usersInlineSearch:
        turnContext.usersInlineSearchOnly || ENV.ADAM_STUDENT_INLINE_SEARCH,
      studentFounderStyleStream: turnContext.usersInlineSearchOnly,
      continuityBridge: needContinuityBridge,
      streamMs,
      repairMs,
      syncRepairMs: !isFounder ? syncRepairMs : undefined,
      inputTurns: llmMessages.length,
    }),
  );

  if (fullResponse?.trim()) {
    if (shouldApplyAcademicIntentRouting(mode, { founderTeachingLearnerTurn })) {
      const scrubbed = enforceTutorReplyGuards(
        fullResponse,
        shell.options.tutorProfile,
        shell.userMessage,
        shell.participant.userName,
        recentAssistantTurns,
        recentUserTurns,
      );
      if (scrubbed !== fullResponse) {
        fullResponse = scrubbed;
        onEvent('adam_stream_done', JSON.stringify({
          sessionId: resolvedSessionId,
          replace:   true,
          response:  fullResponse,
          tutorGuardRepair: true,
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
  if (persistResult?.mergedDisplay && !preserveStreamBody) {
    fullResponse = persistResult.mergedDisplay;
  }

  await finishAdamChatTurn({
    shell,
    fullResponse,
    journal,
    sectionJournalComplete,
    sectionDraftMap,
    sanitizedRepairApplied,
    arithmeticAlphaRepairApplied,
    visualDrawRepairApplied,
    proseCraftRepairApplied,
    usersGreetingRepairApplied,
    technicalMediaRepairApplied,
    adamProductRedirectRepairApplied,
    preserveStreamBody,
    modelChoice,
    workspace,
    river,
    oceanSink: branchPolicy.oceanSink,
    turnBrainMeta: isStudentOceanSink(branchPolicy.oceanSink) && mode !== 'JOURNAL_GEN'
      ? {
        recallLoaded: detectContextRecallLoaded(turnContext.contextMessages),
        webSearchUsed: webSearchUsedThisTurn,
        rawModelStream: rawModelStreamForBrain || undefined,
        recentUserMessages: recentUserTurns,
        recentAssistantMessages: recentAssistantTurns,
      }
      : undefined,
  });
}
