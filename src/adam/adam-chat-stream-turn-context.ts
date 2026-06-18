/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Turn Context
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


import {
  adamWebSearchEnabled,
  getWebSearchGateReason,
  shouldSkipSearchWhenRecallHitStableTopic,
} from './adam-web-search';
import { runUsersSearchPrefetch, buildAdamSearchDisplayQuery, shouldUsersUseSearchFirstFlow } from './adam-search-first';
import { extractRecentUserTurns, extractRecentAssistantTurns } from './adam-factual-grounding';
import { emitAdamSearchDoneEvent } from './adam-chat-search-events';
import { buildSmartContext } from '../qxk24brain/adam-context-builder';
import { isAmaBrainV2Enabled } from '../lib/ama/ama-brain-integration.service';
import { resolveTamatLayer5Block } from '../lib/ama/tamat-generator';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import { FOUNDER_USER_ID } from './adam-student.types';
import { resolveAdamKnowledgeMode, type AdamKnowledgeMode } from './adam-knowledge-mode';
import { detectContextRecallLoaded } from './adam-universal-recall-router';
import {
  buildStudentContinuityForTurn,
} from './student-continuity-bridge';
import { closeInactiveStudentSessions } from './adam-student-sleep-wake.service';
import { closeInactiveFounderSessions } from '../qxk24brain/adam-sleep-wake.service';
import {
  formatPlasBlockedResponse,
  type PlasPrescanResponse,
} from './adam-gateway-client';
import {
  generateK24Address,
  saveMessage,
} from './adam-chat-session.service';
import {
  buildHeadwatersContextOptions,
  resolveBrainRiverBranchPolicy,
  formatBrainRiverLog,
  type AdamBrainRiverTurn,
} from './adam-brain-river';
import type { SSEEventType } from './adam.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import { loadTesterSystemPrefix } from './adam-chat-stream-tester-prefix';
import type { WorkspaceRecord } from './adam-workspace.service';

export type {
  FounderTeachingFlags,
  ResolveTeachingStateInput,
  TeachingPhase,
} from './adam-teaching-state-machine';

export {
  resolveFounderTeachingFlags,
  resolveTeachingPhase,
  loadRecentTeachingTurnTexts,
  adamTeachingMessageHasInquirySection,
  adamTeachingMessageHasSynthesisSection,
} from './adam-teaching-state-machine';

import type { FounderTeachingFlags } from './adam-teaching-state-machine';

export interface AdamTurnContextFetch {
  contextMessages: Awaited<ReturnType<typeof buildSmartContext>>;
  usersContinuityBridge: string | undefined;
  amaTamatBlock: string | undefined;
  testerSystemPrefix: string;
  plasPrescan: PlasPrescanResponse | null;
  contextMs: number;
  needContinuityBridge: boolean;
  searchPrefetchParallel: boolean;
  searchPrefetchPromise: ReturnType<typeof runUsersSearchPrefetch> | null;
  usersInlineSearchOnly: boolean;
  earlyWebSearchReason: string | null;
  brainRecallLoaded: boolean;
  brainRecallStable: boolean;
  knowledgeMode: AdamKnowledgeMode;
  /** River branch resolved once at turn start — headwaters → branch → ocean. */
  river: AdamBrainRiverTurn;
  branchPolicy: ReturnType<typeof resolveBrainRiverBranchPolicy>;
}

export async function fetchAdamTurnContext(input: {
  shell: AdamChatTurnShell;
  workspace: WorkspaceRecord | null;
  isGuestTrial: boolean;
  isTesterGreetingTurn: boolean;
  teachingFlags: FounderTeachingFlags;
  river: AdamBrainRiverTurn;
  plasPrescanPromise: Promise<PlasPrescanResponse | null>;
  onEvent: (event: SSEEventType, data: string) => void;
}): Promise<AdamTurnContextFetch> {
  const {
    shell,
    workspace,
    isGuestTrial,
    isTesterGreetingTurn,
    teachingFlags,
    river,
    plasPrescanPromise,
    onEvent,
  } = input;
  const {
    resolvedSessionId,
    messageForAdam,
    normalizedMessage,
    mode,
    isFounder,
    isGroup,
    participant,
    userMessage,
  } = shell;
  const { founderTeachingLearnerTurn, founderTeachingAbsorption, founderTeachingInquiry, founderTeachingSynthesis } = teachingFlags;

  const knowledgeMode = resolveAdamKnowledgeMode({
    userMessage:              messageForAdam,
    isFounder,
    founderTeachingAbsorption,
    founderTeachingInquiry,
    founderTeachingSynthesis,
    turnGate:                 river.gate,
  });

  const branchPolicy = resolveBrainRiverBranchPolicy(river.channel, {
    knowledgeMode,
    isGuestTrial,
    isFounder,
    userMessage: normalizedMessage,
    answerPlan:  river.answerPlan,
  });

  console.log(formatBrainRiverLog(river, 'headwaters'));

  const contextStarted = Date.now();
  const needContinuityBridge = branchPolicy.needContinuityBridge;

  if (isFounder && participant.sessionType === 'founder') {
    await closeInactiveFounderSessions(FOUNDER_USER_ID).catch(() => {});
  } else if (needContinuityBridge) {
    await closeInactiveStudentSessions(participant.userId).catch(() => {});
  }

  const needTamat = isAmaBrainV2Enabled()
    && branchPolicy.needFounderTamat
    && !isGuestTrial;
  const needTesterPrefix = branchPolicy.needTesterPrefix
    && participant.sessionType === 'student';

  const userUmumChannelGate = river.channel.family === 'users';
  const gateDomain = userUmumChannelGate ? river.gate.iq.domainFacet : undefined;

  const earlyWebSearchReason =
    userUmumChannelGate && adamWebSearchEnabled()
      ? getWebSearchGateReason(messageForAdam, { userUmumChannelGate: true })
      : null;
  const usersInlineSearchOnly = river.channel.family === 'users';

  let searchPrefetchParallel = false;
  let searchPrefetchPromise: ReturnType<typeof runUsersSearchPrefetch> | null = null;

  const [
    contextMessages,
    usersContinuityBridge,
    amaTamatBlock,
    testerSystemPrefix,
    plasPrescan,
  ] = await Promise.all([
    buildSmartContext(
      resolvedSessionId,
      isGroup ? `[${participant.userName}]: ${messageForAdam}` : messageForAdam,
      participant,
      workspace,
      mode,
      buildHeadwatersContextOptions({
        channel:                    river.channel,
        answerPlan:                 river.answerPlan,
        teachingFlags,
        knowledgeMode,
        founderTeachingFreshUpload: shell.teaching.fileNames.length > 0,
        recallProbeMessage:         normalizedMessage,
      }),
    ),
    needContinuityBridge
      ? buildStudentContinuityForTurn(
        participant.userId,
        resolvedSessionId,
        participant.userName,
        messageForAdam,
      )
      : Promise.resolve(undefined),
    needTamat
      ? resolveTamatLayer5Block(
        messageForAdam,
        () => getOrCreateMaster(FOUNDER_USER_ID),
      ).then((t) => t ?? undefined)
      : Promise.resolve(undefined),
    needTesterPrefix
      ? loadTesterSystemPrefix(participant, isTesterGreetingTurn)
      : Promise.resolve(''),
    plasPrescanPromise,
  ]);

  const brainRecallLoaded = detectContextRecallLoaded(contextMessages);
  const brainRecallStable = shouldSkipSearchWhenRecallHitStableTopic({
    message:           messageForAdam,
    brainRecallLoaded,
  });

  const postRecallWebSearchReason = !isFounder && adamWebSearchEnabled()
    ? getWebSearchGateReason(messageForAdam, {
      userUmumChannelGate,
      brainRecallLoaded,
      recentUserMessages: extractRecentUserTurns(contextMessages),
      recentAssistantMessages: extractRecentAssistantTurns(contextMessages),
    })
    : isFounder && !founderTeachingLearnerTurn && adamWebSearchEnabled()
      ? getWebSearchGateReason(userMessage, {
        isFounder,
        hasTeachingUpload: shell.teaching.fileNames.length > 0,
        brainRecallLoaded,
      })
      : null;

  const searchFirstLate = Boolean(postRecallWebSearchReason)
    && shouldUsersUseSearchFirstFlow(isFounder, postRecallWebSearchReason);

  if (searchFirstLate && !brainRecallStable) {
    searchPrefetchParallel = true;
    const recentUserTurns = extractRecentUserTurns(contextMessages);
    const recentAssistantTurns = extractRecentAssistantTurns(contextMessages);
    const parallelSearchQuery = buildAdamSearchDisplayQuery(
      userMessage,
      postRecallWebSearchReason,
      { recentUserMessages: recentUserTurns, recentAssistantMessages: recentAssistantTurns },
      gateDomain,
    );
    const recentPrefetchMessages = [
      ...recentUserTurns.map((content) => ({ role: 'user' as const, content })),
      ...recentAssistantTurns.map((content) => ({ role: 'assistant' as const, content })),
    ];
    searchPrefetchPromise = runUsersSearchPrefetch({
      userMessage,
      webSearchGateReason: postRecallWebSearchReason,
      recentUserMessages: recentPrefetchMessages,
      gateDomain,
      onSearching: () => {
        onEvent(
          'adam_searching',
          JSON.stringify({ query: parallelSearchQuery }),
        );
      },
      onSearchHitsReady: (hits) => {
        emitAdamSearchDoneEvent(onEvent, parallelSearchQuery, hits);
      },
    });
  }

  return {
    contextMessages,
    usersContinuityBridge,
    amaTamatBlock,
    testerSystemPrefix,
    plasPrescan,
    contextMs: Date.now() - contextStarted,
    needContinuityBridge,
    searchPrefetchParallel,
    searchPrefetchPromise,
    usersInlineSearchOnly,
    earlyWebSearchReason: postRecallWebSearchReason ?? earlyWebSearchReason,
    brainRecallLoaded,
    brainRecallStable,
    knowledgeMode,
    river,
    branchPolicy,
  };
}

/** Returns true when PLAS short-circuited the turn (caller should return). */
export async function handlePlasPrescanShortCircuit(
  shell: AdamChatTurnShell,
  plasPrescan: PlasPrescanResponse | null,
): Promise<boolean> {
  if (!plasPrescan?.shortCircuit) return false;

  const {
    resolvedSessionId,
    mode,
    isFounder,
    isGroup,
    participant,
    onEvent,
  } = shell;

  const blockedResponse = formatPlasBlockedResponse(plasPrescan);
  const k24Address = await generateK24Address(mode);
  const messageId = await saveMessage(
    resolvedSessionId,
    'adam',
    blockedResponse,
    mode,
    'WAQF',
    k24Address,
    isGroup ? 'group-alamtologi' : participant.userId,
    {
      speakerId:   'adam',
      speakerName: 'ADAM',
      sessionType: participant.sessionType,
    },
  );

  onEvent('adam_complete', JSON.stringify({
    sessionId:          resolvedSessionId,
    messageId,
    k24Address,
    judgment:           'WAQF',
    response:           blockedResponse,
    mode,
    plasBlocked:        true,
    plasThreat:         plasPrescan.metadata?.threatCategory,
    gatewayUnavailable: plasPrescan.unavailable === true,
  }));
  return true;
}
