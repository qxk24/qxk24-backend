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
  buildTutorClosingLanguageReminder,
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
  const isCoachingLane = mode === 'COACHING';
  const isToolsLane = mode === 'TOOLS';
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
        userUmumChannelGate: !isFounder && !isTutorLane && !isCoachingLane && !isNiagaLane && !isResearchLane,
        gateGroundingFacet: turnContext.river.gate.iq.groundingFacet,
        domainTeachingPack: turnContext.river.gate.flags.domainTeachingPack,
        brainRecallLoaded: turnContext.brainRecallLoaded,
        recentUserMessages: recentUserTurns,
        recentAssistantMessages: recentAssistantTurns,
      });

  const enableWebSearch = Boolean(webSearchGateReason);
  const usersSearchFirst = shouldUsersUseSearchFirstFlow(isFounder, webSearchGateReason);
  const usersKnowledgeTier = !isFounder && !isTutorLane && !isCoachingLane && !isNiagaLane && !isResearchLane
    ? resolveUsersKnowledgeTier(messageForAdam, recentUserTurns, recentAssistantTurns)
    : isResearchLane ? 2 as const : undefined;

  let tutorLearningProfile = undefined;
  let tutorPlacementPrompt: string | null = null;
  let tutorCheckpointPrompt: string | null = null;
  let tutorContentPrompt: string | null = null;
  let tutorContentId: string | null = null;
  if (isTutorLane && shell.participant.userId) {
    const prep = await prepareTutorLearningTurn(
      shell.participant.userId,
      messageForAdam,
      recentUserTurns,
      recentAssistantTurns,
      typeof options.responseMs === 'number' && options.responseMs >= 0
        ? options.responseMs
        : undefined,
    );
    tutorLearningProfile = prep.profile;
    tutorPlacementPrompt = prep.placementPrompt;
    tutorCheckpointPrompt = prep.checkpointPrompt;
    tutorContentPrompt = prep.contentPrompt;
    tutorContentId = prep.contentId;
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
    workspacePrompt:      isTutorLane || isNiagaLane || isToolsLane ? undefined : workspacePrompt,
    founderStudentsBlock: isFounder
      ? await buildFounderStudentsAwarenessBlockAsync()
      : '',
    usersContinuityBridge: isTutorLane || isNiagaLane || isToolsLane ? undefined : usersContinuityBridge,
    usersRelationalVoice: !isFounder && !isTutorLane && !isNiagaLane && !isToolsLane
      && turnContext.river.gate.flags.relationalVoice
      && contextHasRelationalVoice(contextMessages),
    founderTeachingAbsorption,
    founderTeachingInquiry,
    founderTeachingSynthesis,
    amaTamatBlock:        isTutorLane || isNiagaLane || isToolsLane ? undefined : amaTamatBlock,
    usersKnowledgeTier,
    knowledgeMode: turnContext.knowledgeMode,
    answerPlan:    turnContext.river.answerPlan,
    turnGate:      turnContext.river.gate,
    tutorProfile:         isTutorLane ? tutorProfile : undefined,
    tutorLearningProfile: isTutorLane ? tutorLearningProfile : undefined,
    tutorPlacementPrompt: isTutorLane ? tutorPlacementPrompt : undefined,
    tutorCheckpointPrompt: isTutorLane ? tutorCheckpointPrompt : undefined,
    tutorContentPrompt: isTutorLane ? tutorContentPrompt : undefined,
    tutorContentId: isTutorLane ? tutorContentId ?? undefined : undefined,
    viaVoice:             isTutorLane ? options.viaVoice === true : undefined,
    niagaProfile:         isNiagaLane ? options.niagaProfile : undefined,
    docsTaskId:           isToolsLane ? options.docsTaskId : undefined,
    webSearchPrompt:      webSearchEnabledThisTurn && webSearchGateReason && isTutorLane
      ? buildTutorWebSearchPrompt(
        tutorProfile,
        usersSearchFirst,
        webSearchGateReason,
        messageForAdam,
        recentUserTurns,
        recentAssistantTurns,
      )
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
  // Tutor / Niaga / Tools carry their own lane law — do not prepend student core.
  let systemPrompt = isTutorLane || isNiagaLane || isToolsLane
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
  if (isNiagaLane && options.businessCoachDomain) {
    const { buildBusinessCoachDomainPromptBlock } = await import(
      '../business-coach/business-coach-domain-guards'
    );
    systemPrompt = `${systemPrompt}\n\n${buildBusinessCoachDomainPromptBlock({
      domain:        options.businessCoachDomain.professionalDomain,
      domainProfile: options.businessCoachDomain.domainProfile,
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
    ? buildTutorSessionLanguageLock(
      tutorProfile,
      recentAssistantTurns,
      recentUserTurns,
      messageForAdam,
    )
    : buildQwenLanguageLock({
      journalPhase: mode === 'JOURNAL_GEN' && isFounder ? 'draft' : undefined,
    });
  systemPrompt = `${languageLock}\n\n${systemPrompt}`;

  if (isTutorLane) {
    const closingLanguageReminder = buildTutorClosingLanguageReminder(
      tutorProfile,
      recentAssistantTurns,
      recentUserTurns,
      messageForAdam,
    );
    systemPrompt = `${systemPrompt}\n\n${closingLanguageReminder}`;
  }

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
