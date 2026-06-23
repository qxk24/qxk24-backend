/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Turn Prompt
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
  getAdamWebSearchPrompt,
  getWebSearchGateReason,
  isVerifiedDataStatAsk,
} from './adam-web-search';
import { extractRecentUserTurns, extractRecentAssistantTurns, resolveTechnicalPrecisionTurn } from './adam-factual-grounding';
import { shouldUsersUseSearchFirstFlow } from './adam-search-first';
import { buildQwenLanguageLock } from './adam-language-guard';
import {
  buildTutorSessionLanguageLock,
  buildTutorWebSearchPrompt,
} from './adam-tutor-law';
import { buildMacBridgeContextBlock } from '../agent/mac-bridge-context';
import { userHasMacBridgeTier } from './adam-mac-bridge-access.service';
import { prependCoreToSystem } from '../qxk24brain/adam-core';
import { buildAdamChatSystemPrompt } from './adam-system-prompts';
import { resolveAuthoritativeTutorProfile } from './adam-tutor-profile.service';
import { prepareTutorLearningTurn } from './adam-tutor-learning-profile.service';
import { contextHasRelationalVoice } from './adam-relational-voice';
import { resolveUsersKnowledgeTier } from './adam-three-tier-knowledge';
import { buildFounderStudentsAwarenessBlockAsync } from './adam-student-registry.service';
import { enrichSystemPromptForJournalGen } from './adam-chat-stream-journal-turn';
import type { JournalGenContext } from './adam-chat-stream.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { AdamTurnContextFetch, FounderTeachingFlags } from './adam-chat-stream-turn-context';
import type { WorkspaceRecord } from './adam-workspace.service';
import { buildRdIndustryContextBlock } from '../rd-industry/rd-industry-research-prompt';
import { isAdamNiagaMode } from './adam-niaga-law';

export interface TurnPromptAndSearchGate {
  systemPrompt: string;
  journal: JournalGenContext;
  recentUserTurns: string[];
  recentAssistantTurns: string[];
  precisionTurn: ReturnType<typeof resolveTechnicalPrecisionTurn>;
  webSearchEnabledThisTurn: boolean;
  webSearchGateReason: string | null;
  enableWebSearch: boolean;
  usersSearchFirst: boolean;
  usersKnowledgeTier: ReturnType<typeof resolveUsersKnowledgeTier> | undefined;
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
    founderTeachingInquiry,
    founderTeachingLearnerTurn,
  } = teachingFlags;
  const {
    contextMessages,
    usersContinuityBridge,
    amaTamatBlock,
    testerSystemPrefix,
  } = turnContext;

  const isTutorLane = mode === 'TUTOR';
  const isNiagaLane = isAdamNiagaMode(mode);
  const isResearchLane = mode === 'RESEARCH';

  let tutorProfile = isTutorLane ? options.tutorProfile : undefined;
  if (isTutorLane && shell.participant.userId && !isFounder) {
    tutorProfile = (await resolveAuthoritativeTutorProfile(
      shell.participant.userId,
      options.tutorProfile,
    )) ?? options.tutorProfile;
    if (tutorProfile) {
      shell.options.tutorProfile = tutorProfile;
    }
  }

  const workspacePrompt = workspace
    ? `\n[AIDIL WORKSPACE: "${workspace.title}" — separate family. Do NOT mix with other books or the student's general chat.]`
    : '';

  const macBridgeEligible = isFounder
    || await userHasMacBridgeTier(shell.participant.userId);
  const macBridgeBlock = macBridgeEligible
    ? await buildMacBridgeContextBlock(shell.participant.userId, isFounder)
    : '';
  const recentUserTurns = extractRecentUserTurns(contextMessages);
  const recentAssistantTurns = extractRecentAssistantTurns(contextMessages);
  const precisionTurn = resolveTechnicalPrecisionTurn(messageForAdam, recentUserTurns);
  const webSearchEnabledThisTurn =
    adamWebSearchEnabled()
    && (founderTeachingSynthesis || !founderTeachingLearnerTurn);

  const webSearchGateReason = founderTeachingSynthesis
    ? getWebSearchGateReason(userMessage, {
      isFounder,
      hasTeachingUpload: shell.teaching.fileNames.length > 0,
      founderTeachingSynthesis: true,
      brainRecallLoaded: turnContext.brainRecallLoaded,
    })
    : founderTeachingLearnerTurn
      ? null
      : getWebSearchGateReason(userMessage, {
        isFounder,
        technicalFollowUp: precisionTurn.isFollowUp && !isVerifiedDataStatAsk(messageForAdam),
        userUmumChannelGate: !isFounder && !isTutorLane && !isNiagaLane && !isResearchLane,
        brainRecallLoaded: turnContext.brainRecallLoaded,
        recentUserMessages: recentUserTurns,
        recentAssistantMessages: recentAssistantTurns,
      });

  const enableWebSearch = Boolean(webSearchGateReason);
  const usersSearchFirst = shouldUsersUseSearchFirstFlow(isFounder, webSearchGateReason);
  const usersKnowledgeTier = !isFounder && !isTutorLane && !isNiagaLane && !isResearchLane
    ? resolveUsersKnowledgeTier(messageForAdam, recentUserTurns, recentAssistantTurns)
    : isResearchLane ? 2 as const : undefined;

  let tutorLearningProfile = undefined;
  let tutorPlacementPrompt: string | null = null;
  let tutorCheckpointPrompt: string | null = null;
  if (isTutorLane && shell.participant.userId) {
    const prep = await prepareTutorLearningTurn(
      shell.participant.userId,
      messageForAdam,
      recentUserTurns,
      recentAssistantTurns,
    );
    tutorLearningProfile = prep.profile;
    tutorPlacementPrompt = prep.placementPrompt;
    tutorCheckpointPrompt = prep.checkpointPrompt;
  }

  const builtPrompt = buildAdamChatSystemPrompt({
    mode,
    answerStyle:          options.answerStyle,
    isFounder,
    participantName:      shell.participant.userName,
    userMessage:          messageForAdam,
    recentUserMessages:   recentUserTurns,
    recentAssistantMessages: recentAssistantTurns,
    brainRecallLoaded:    turnContext.brainRecallLoaded,
    workspacePrompt:      isTutorLane || isNiagaLane ? undefined : workspacePrompt,
    founderStudentsBlock: isFounder
      ? await buildFounderStudentsAwarenessBlockAsync()
      : '',
    usersContinuityBridge: isTutorLane || isNiagaLane ? undefined : usersContinuityBridge,
    usersRelationalVoice: !isFounder && !isTutorLane && !isNiagaLane
      && turnContext.river.gate.flags.relationalVoice
      && contextHasRelationalVoice(contextMessages),
    founderTeachingAbsorption,
    founderTeachingInquiry,
    founderTeachingSynthesis,
    amaTamatBlock:        isTutorLane || isNiagaLane ? undefined : amaTamatBlock,
    usersKnowledgeTier,
    knowledgeMode: turnContext.knowledgeMode,
    answerPlan:    turnContext.river.answerPlan,
    turnGate:      turnContext.river.gate,
    tutorProfile:         isTutorLane ? tutorProfile : undefined,
    tutorLearningProfile: isTutorLane ? tutorLearningProfile : undefined,
    tutorPlacementPrompt: isTutorLane ? tutorPlacementPrompt : undefined,
    tutorCheckpointPrompt: isTutorLane ? tutorCheckpointPrompt : undefined,
    viaVoice:             isTutorLane ? options.viaVoice === true : undefined,
    niagaProfile:         isNiagaLane ? options.niagaProfile : undefined,
    webSearchPrompt:      webSearchEnabledThisTurn && webSearchGateReason && isTutorLane
      ? buildTutorWebSearchPrompt(tutorProfile, usersSearchFirst)
      : webSearchEnabledThisTurn && webSearchGateReason && founderTeachingSynthesis
        ? getAdamWebSearchPrompt(isFounder, {
          founderTeachingSynthesis: true,
          userMessage: messageForAdam,
          recentUserMessages: recentUserTurns,
        })
        : webSearchEnabledThisTurn && webSearchGateReason
          ? getAdamWebSearchPrompt(isFounder, {
            userMessage: messageForAdam,
            recentUserMessages: recentUserTurns,
            searchPrefetched: usersSearchFirst,
            verifiedDataStat: webSearchGateReason === 'verified_data_stat',
          })
          : undefined,
  });

  // Layer 0: student consumer gets student core; Founder (including Teaching learner) keeps founder core.
  let systemPrompt = isTutorLane || isNiagaLane
    ? builtPrompt
    : prependCoreToSystem(builtPrompt, !isFounder);

  if (macBridgeBlock) {
    systemPrompt = `${systemPrompt}\n\n${macBridgeBlock}`;
  }
  if (isResearchLane && options.rdIndustryContext) {
    const ctx = options.rdIndustryContext;
    systemPrompt = `${systemPrompt}\n\n${buildRdIndustryContextBlock({
      projectFocus:   ctx.projectFocus,
      deliverable:    ctx.deliverable,
      packId:         ctx.packId,
      technicalDocId: ctx.technicalDocId,
    })}`;
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

  const languageLock = isTutorLane
    ? buildTutorSessionLanguageLock(tutorProfile, recentAssistantTurns)
    : buildQwenLanguageLock({
      journalPhase: mode === 'JOURNAL_GEN' && isFounder ? 'draft' : undefined,
    });
  systemPrompt = `${languageLock}\n\n${systemPrompt}`;

  return {
    systemPrompt,
    journal,
    recentUserTurns,
    recentAssistantTurns,
    precisionTurn,
    webSearchEnabledThisTurn,
    webSearchGateReason,
    enableWebSearch,
    usersSearchFirst,
    usersKnowledgeTier,
  };
}
