/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Turn Prompt
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

import {
  adamWebSearchEnabled,
  getAdamWebSearchPrompt,
  getWebSearchGateReason,
} from './adam-web-search';
import { extractRecentUserTurns, resolveTechnicalPrecisionTurn } from './adam-factual-grounding';
import { shouldStudentUseSearchFirstFlow } from './adam-search-first';
import { buildQwenLanguageLock } from './adam-language-guard';
import { buildMacBridgeContextBlock } from '../agent/mac-bridge-context';
import { prependCoreToSystem } from '../qxk24brain/adam-core';
import { buildAdamChatSystemPrompt } from './adam-system-prompts';
import { resolveStudentKnowledgeTier } from './adam-three-tier-knowledge';
import { buildFounderStudentsAwarenessBlockAsync } from './adam-student-registry.service';
import { enrichSystemPromptForJournalGen } from './adam-chat-stream-journal-turn';
import type { JournalGenContext } from './adam-chat-stream.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { AdamTurnContextFetch, FounderTeachingFlags } from './adam-chat-stream-turn-context';
import type { WorkspaceRecord } from './adam-workspace.service';

export interface TurnPromptAndSearchGate {
  systemPrompt: string;
  journal: JournalGenContext;
  recentUserTurns: string[];
  precisionTurn: ReturnType<typeof resolveTechnicalPrecisionTurn>;
  webSearchEnabledThisTurn: boolean;
  webSearchGateReason: string | null;
  enableWebSearch: boolean;
  studentSearchFirst: boolean;
  studentKnowledgeTier: ReturnType<typeof resolveStudentKnowledgeTier> | undefined;
}

export async function buildTurnPromptAndSearchGate(input: {
  shell: AdamChatTurnShell;
  workspace: WorkspaceRecord | null;
  turnContext: AdamTurnContextFetch;
  teachingFlags: FounderTeachingFlags;
}): Promise<TurnPromptAndSearchGate> {
  const { shell, workspace, turnContext, teachingFlags } = input;
  const {
    mode,
    isFounder,
    messageForAdam,
    userMessage,
    options,
    resolvedSessionId,
  } = shell;
  const {
    founderTeachingSynthesis,
    founderTeachingAbsorption,
    founderTeachingLearnerTurn,
  } = teachingFlags;
  const {
    contextMessages,
    studentContinuityBridge,
    amaTamatBlock,
    testerSystemPrefix,
  } = turnContext;

  const isTutorLane = mode === 'TUTOR';

  const workspacePrompt = workspace
    ? `\n[AIDIL WORKSPACE: "${workspace.title}" — separate family. Do NOT mix with other books or the student's general chat.]`
    : '';

  const macBridgeBlock = isFounder ? buildMacBridgeContextBlock() : '';
  const recentUserTurns = extractRecentUserTurns(contextMessages);
  const precisionTurn = resolveTechnicalPrecisionTurn(messageForAdam, recentUserTurns);
  const webSearchEnabledThisTurn = adamWebSearchEnabled() && !founderTeachingAbsorption;

  const webSearchGateReason = founderTeachingSynthesis
    ? getWebSearchGateReason(userMessage, {
      isFounder,
      hasTeachingUpload: shell.teaching.fileNames.length > 0,
      founderTeachingSynthesis: true,
    })
    : founderTeachingAbsorption
      ? null
      : getWebSearchGateReason(userMessage, {
        isFounder,
        technicalFollowUp: precisionTurn.isFollowUp,
        studentFounderParity: !isFounder,
      });

  const enableWebSearch = Boolean(webSearchGateReason);
  const studentSearchFirst =
    !isFounder && shouldStudentUseSearchFirstFlow(false, webSearchGateReason);
  const studentKnowledgeTier = !isFounder && !isTutorLane
    ? resolveStudentKnowledgeTier(messageForAdam, recentUserTurns)
    : undefined;

  const builtPrompt = buildAdamChatSystemPrompt({
    mode,
    answerStyle:          options.answerStyle,
    isFounder,
    participantName:      shell.participant.userName,
    userMessage:          messageForAdam,
    workspacePrompt:      isTutorLane ? undefined : workspacePrompt,
    founderStudentsBlock: isFounder
      ? await buildFounderStudentsAwarenessBlockAsync()
      : '',
    studentContinuityBridge: isTutorLane ? undefined : studentContinuityBridge,
    founderTeachingAbsorption,
    founderTeachingSynthesis,
    amaTamatBlock:        isTutorLane ? undefined : amaTamatBlock,
    studentKnowledgeTier,
    tutorProfile:         isTutorLane ? options.tutorProfile : undefined,
    webSearchPrompt:      webSearchEnabledThisTurn && founderTeachingSynthesis
      ? getAdamWebSearchPrompt(isFounder, {
        founderTeachingSynthesis: true,
        userMessage: messageForAdam,
        recentUserMessages: recentUserTurns,
      })
      : webSearchEnabledThisTurn
        ? getAdamWebSearchPrompt(isFounder, {
          userMessage: messageForAdam,
          recentUserMessages: recentUserTurns,
          searchPrefetched: studentSearchFirst,
        })
        : undefined,
  });

  let systemPrompt = isTutorLane
    ? builtPrompt
    : prependCoreToSystem(builtPrompt, founderTeachingLearnerTurn);

  if (macBridgeBlock) {
    systemPrompt = `${systemPrompt}\n\n${macBridgeBlock}`;
  }
  if (testerSystemPrefix) {
    systemPrompt = `${testerSystemPrefix}\n\n${systemPrompt}`;
  }

  let journal: JournalGenContext = {
    journalTopic:           null,
    journalTopicId:         undefined,
    wantsJournalWrite:      false,
    journalWriteBySections: false,
    systemPrompt,
  };

  if (isFounder && mode === 'JOURNAL_GEN') {
    journal = await enrichSystemPromptForJournalGen({
      baseSystemPrompt: systemPrompt,
      userMessage:      shell.userMessage,
      contextMessages,
      options,
      sessionId:        resolvedSessionId,
    });
    systemPrompt = journal.systemPrompt;
  }

  systemPrompt = `${buildQwenLanguageLock({
    journalPhase: mode === 'JOURNAL_GEN' && isFounder ? 'draft' : undefined,
  })}\n\n${systemPrompt}`;

  return {
    systemPrompt,
    journal,
    recentUserTurns,
    precisionTurn,
    webSearchEnabledThisTurn,
    webSearchGateReason,
    enableWebSearch,
    studentSearchFirst,
    studentKnowledgeTier,
  };
}
