/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Turn Context
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { adamWebSearchEnabled, getWebSearchGateReason } from './adam-web-search';
import { runStudentSearchPrefetch, shouldStudentUseSearchFirstFlow } from './adam-search-first';
import {
  founderRequestsConstitutionalMirror,
  founderRequestsTeachingSynthesis,
} from './adam-founder-teaching-prompts';
import { buildSmartContext } from '../qxk24brain/adam-context-builder';
import { isAmaBrainV2Enabled } from '../lib/ama/ama-brain-integration.service';
import { resolveTamatLayer5Block } from '../lib/ama/tamat-generator';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import { FOUNDER_USER_ID } from './adam-student.types';
import {
  buildStudentContinuityBridge,
  studentContinuityNeedsFullBridge,
} from './student-continuity-bridge';
import {
  fetchPlasPrescan,
  formatPlasBlockedResponse,
  type PlasPrescanResponse,
} from './adam-gateway-client';
import {
  generateK24Address,
  saveMessage,
} from './adam-chat-session.service';
import { isAdamLightChatTurn } from './adam-response-generation';
import type { ADAMChatMode, SSEEventType } from './adam.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import { loadTesterSystemPrefix } from './adam-chat-stream-tester-prefix';
import type { WorkspaceRecord } from './adam-workspace.service';

export interface FounderTeachingFlags {
  founderTeachingSynthesis:  boolean;
  founderTeachingAbsorption: boolean;
  founderTeachingLearnerTurn: boolean;
}

export function resolveFounderTeachingFlags(
  isFounder: boolean,
  mode: ADAMChatMode,
  normalizedMessage: string,
): FounderTeachingFlags {
  const founderTeachingSynthesis =
    isFounder
    && mode === 'TEACHING'
    && !founderRequestsConstitutionalMirror(normalizedMessage)
    && founderRequestsTeachingSynthesis(normalizedMessage);

  const founderTeachingAbsorption =
    isFounder
    && mode === 'TEACHING'
    && !founderRequestsConstitutionalMirror(normalizedMessage)
    && !founderTeachingSynthesis;

  return {
    founderTeachingSynthesis,
    founderTeachingAbsorption,
    founderTeachingLearnerTurn: founderTeachingAbsorption || founderTeachingSynthesis,
  };
}

export interface AdamTurnContextFetch {
  contextMessages: Awaited<ReturnType<typeof buildSmartContext>>;
  studentContinuityBridge: string | undefined;
  amaTamatBlock: string | undefined;
  testerSystemPrefix: string;
  plasPrescan: PlasPrescanResponse | null;
  contextMs: number;
  needContinuityBridge: boolean;
  searchPrefetchParallel: boolean;
  searchPrefetchPromise: ReturnType<typeof runStudentSearchPrefetch> | null;
  studentInlineSearchOnly: boolean;
  earlyWebSearchReason: string | null;
}

export async function fetchAdamTurnContext(input: {
  shell: AdamChatTurnShell;
  workspace: WorkspaceRecord | null;
  isGuestTrial: boolean;
  isTesterGreetingTurn: boolean;
  teachingFlags: FounderTeachingFlags;
  plasPrescanPromise: Promise<PlasPrescanResponse | null>;
  onEvent: (event: SSEEventType, data: string) => void;
}): Promise<AdamTurnContextFetch> {
  const {
    shell,
    workspace,
    isGuestTrial,
    isTesterGreetingTurn,
    teachingFlags,
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
  const { founderTeachingLearnerTurn } = teachingFlags;

  const contextStarted = Date.now();
  const needContinuityBridge = !isFounder
    && !isGuestTrial
    && studentContinuityNeedsFullBridge(messageForAdam);
  const needTamat = isAmaBrainV2Enabled()
    && isFounder
    && !founderTeachingLearnerTurn
    && mode !== 'JOURNAL_GEN'
    && !isGuestTrial;
  const needTesterPrefix = !isFounder && participant.sessionType === 'student';

  const earlyWebSearchReason =
    !isFounder && adamWebSearchEnabled()
      ? getWebSearchGateReason(messageForAdam, { studentFounderParity: true })
      : null;
  const studentInlineSearchOnly = !isFounder;
  const studentSearchFirstEarly = !isFounder
    && Boolean(earlyWebSearchReason)
    && shouldStudentUseSearchFirstFlow(false, earlyWebSearchReason);

  let searchPrefetchParallel = false;
  let searchPrefetchPromise: ReturnType<typeof runStudentSearchPrefetch> | null = null;
  if (
    studentSearchFirstEarly
    && !ENV.ADAM_STUDENT_INLINE_SEARCH
  ) {
    searchPrefetchParallel = true;
    searchPrefetchPromise = runStudentSearchPrefetch({
      userMessage,
      recentUserMessages: [],
      onSearching: () => {
        onEvent(
          'adam_searching',
          JSON.stringify({ query: userMessage.slice(0, 80) || 'Mencari data sebenar…' }),
        );
      },
      onSearchDone: () => {
        onEvent('adam_search_done', JSON.stringify({ query: '' }));
      },
    });
  }

  const [
    contextMessages,
    studentContinuityBridge,
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
      {
        recallProbeMessage: normalizedMessage,
        founderTeachingAbsorption: founderTeachingLearnerTurn,
        studentStreamlined: !isFounder && isAdamLightChatTurn(normalizedMessage),
      },
    ),
    needContinuityBridge
      ? buildStudentContinuityBridge(
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

  return {
    contextMessages,
    studentContinuityBridge,
    amaTamatBlock,
    testerSystemPrefix,
    plasPrescan,
    contextMs: Date.now() - contextStarted,
    needContinuityBridge,
    searchPrefetchParallel,
    searchPrefetchPromise,
    studentInlineSearchOnly,
    earlyWebSearchReason,
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
