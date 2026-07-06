/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Post Turn
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { isUsersGreetingOnlyRepair } from './adam-users-constitution';
import { FOUNDER_USER_ID } from './adam-student.types';
import { founderWantsJournalSeal } from './adam-chat-response-parser';
import { processFounderJournalSeal } from './adam-journal.service';
import {
  loadJournalSectionDraft,
  loadLatestJournalSectionDraftForTopic,
} from './adam-journal-section-draft';
import { assembleManuscriptFromSections } from './adam-journal-section-writer';
import { allJournalSectionsComplete, type JournalSectionId } from './adam-journal-section.types';
import { generateK24Address, saveMessage } from './adam-chat-session.service';
import { checkMemoryHealthCached } from '../qxk24brain/adam-health.service';
import { triggerBrainTransformation } from '../qxk24brain/qxk24brain.engine';
import { ENV } from '../config/environments';
import { shouldAppendEpisodicB } from '../lib/ama/ama-episodic-gate';
import { updateSessionSummary } from '../qxk24brain/adam-anchor.service';
import { appendWorkspaceUnderstanding } from './adam-workspace.service';
import { writeStudentStateAfterTurn } from './student-continuity-bridge';
import { triggerStudentMemoryPostTurn } from './adam-student-memory-post-turn';
import { deleteTeachingUploads } from './adam-upload.service';
import { triggerTransformTurn } from './adam-transform-turn';
import { isGuestUserId } from '../freemium/adam-freemium-guest.service';
import { resolveUsersKnowledgeTier } from './adam-universal-scholar';
import type { JournalGenContext, AdamChatTurnShell } from './adam-chat-stream.types';
import {
  buildFinalResponseForSave,
  parseAdamTurnBlocks,
} from './adam-chat-stream-post-finalize';
import {
  formatBrainRiverLog,
  isFounderOceanSink,
  isStudentOceanSink,
  riverStageForPostTurn,
} from './adam-brain-river';
import type { AdamBrainRiverTurn } from './adam-brain-river';
import { handleAdamTurnRelays } from './adam-chat-stream-post-relay';
import { recordTutorLearningTurn } from './adam-tutor-learning-profile.service';
import { normalizeTutorHeadingLanguage } from './adam-tutor-law';
import { isAdamNiagaMode } from './adam-niaga-law';
import {
  appendNiagaChatFilesToResponse,
  buildNiagaChatFileRefs,
  detectNiagaCashflowTemplateFormats,
  emitAdamFilesEvent,
} from './adam-niaga-chat-files';

export { persistInteractiveJournalDraft } from './adam-chat-stream-journal-persist';

export interface AdamTurnBrainMeta {
  recallLoaded:             boolean;
  webSearchUsed:            boolean;
  rawModelStream?:          string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
}

export async function finishAdamChatTurn(input: {
  shell:                  AdamChatTurnShell;
  fullResponse:           string;
  journal:                JournalGenContext;
  sectionJournalComplete: boolean;
  sectionDraftMap?:       Partial<Record<JournalSectionId, string>>;
  sanitizedRepairApplied?: boolean;
  arithmeticAlphaRepairApplied?: boolean;
  visualDrawRepairApplied?: boolean;
  proseCraftRepairApplied?: boolean;
  usersGreetingRepairApplied?: boolean;
  technicalMediaRepairApplied?: boolean;
  adamProductRedirectRepairApplied?: boolean;
  preserveStreamBody?:     boolean;
  turnBrainMeta?:         AdamTurnBrainMeta;
  river?:                 AdamBrainRiverTurn;
  oceanSink?:             import('./adam-brain-river').AdamOceanSinkKind;
  modelChoice: {
    model:  string;
    tier:   string;
    reason: string;
  };
  workspace?: { workspaceId: string } | null;
}): Promise<void> {
  const {
    shell,
    fullResponse,
    journal,
    sectionJournalComplete,
    modelChoice,
    workspace,
    river,
    oceanSink,
  } = input;
  let sectionDraftMap = input.sectionDraftMap;

  const parsed = parseAdamTurnBlocks(fullResponse);
  let finalResponse = buildFinalResponseForSave({
    shell,
    fullResponse,
    journal,
    sectionDraftMap,
    journalSealCleanResponse: parsed.journalSeal.cleanResponse,
  });

  let sealedJournals: { id: string; title: string }[] = [];
  let sealErrors: string[] = [];

  if (shell.isFounder) {
    let sectionManuscriptForSeal = journal.journalWriteBySections ? fullResponse : undefined;
    let sectionCompleteForSeal = journal.journalWriteBySections ? sectionJournalComplete : undefined;
    let sectionDraftForSeal = sectionDraftMap;
    const lockedTopic = journal.journalTopic;

    if (lockedTopic && !journal.journalWriteBySections && founderWantsJournalSeal(shell.userMessage)) {
      const draft =
        (shell.resolvedSessionId
          ? await loadJournalSectionDraft(shell.resolvedSessionId, lockedTopic.topicId)
          : null)
        ?? await loadLatestJournalSectionDraftForTopic(lockedTopic.topicId);
      if (draft?.sections && Object.keys(draft.sections).length > 0) {
        sectionManuscriptForSeal = assembleManuscriptFromSections(draft.sections);
        sectionCompleteForSeal = allJournalSectionsComplete(draft.sections);
        sectionDraftForSeal = draft.sections;
        console.log(
          '[journal:seal] loaded draft for seal turn',
          JSON.stringify({
            sessionId: shell.resolvedSessionId,
            topicId:   lockedTopic.topicId,
            draftId:   draft.journalId,
            words:     sectionManuscriptForSeal.split(/\s+/).filter(Boolean).length,
          }),
        );
      }
    }

    const sealResult = await processFounderJournalSeal({
      sessionId:              shell.resolvedSessionId,
      userMessage:            shell.userMessage,
      fullResponse,
      finalResponse,
      sealsFromReply:         parsed.journalSeal.seals,
      lockedTopicId:          lockedTopic?.topicId ?? journal.journalTopicId,
      sectionManuscriptOnly:  sectionManuscriptForSeal,
      sectionJournalComplete: sectionCompleteForSeal,
      sectionDraft:           sectionDraftForSeal,
      forceSealAttempt:
        (journal.journalWriteBySections && sectionJournalComplete)
        || founderWantsJournalSeal(shell.userMessage),
    });
    sealedJournals = sealResult.sealedJournals;
    sealErrors = sealResult.sealErrors;
  }

  const relayResult = await handleAdamTurnRelays({
    shell,
    parsed,
    finalResponse,
  });
  finalResponse = relayResult.finalResponse;

  // Final-output language guard. A downstream rewrite/repair pass can re-emit
  // structural scaffold headings (Definisi / Langkah / Contoh / Kesimpulan) in
  // Malay even when the learner asked in English (or vice-versa). The streamed
  // body passes through enforceTutorReplyGuards, but this finalResponse is what
  // adam_complete + saveMessage actually use, so we re-normalize headings here
  // to the resolved session language. Founder turns are left untouched.
  // Tutor / Coaching — streamed body is canonical; no post-stream scaffold swap.
  if (input.preserveStreamBody && input.turnBrainMeta?.rawModelStream?.trim()) {
    finalResponse = input.turnBrainMeta.rawModelStream.trim();
  } else if (!shell.isFounder && finalResponse?.trim()) {
    finalResponse = normalizeTutorHeadingLanguage(
      finalResponse,
      shell.options.tutorProfile,
      input.turnBrainMeta?.recentAssistantMessages ?? [],
      input.turnBrainMeta?.recentUserMessages ?? [],
      shell.userMessage,
    );
  }

  const rawForGreeting = input.turnBrainMeta?.rawModelStream?.trim() ?? '';
  const usersGreetingRepairApplied = input.usersGreetingRepairApplied === true
    || (rawForGreeting.length > 0 && isUsersGreetingOnlyRepair(rawForGreeting, finalResponse));

  // Niaga Fasa B — attach cashflow template cards when the entrepreneur asks for them.
  if (isAdamNiagaMode(shell.mode) && !shell.isFounder) {
    const formats = detectNiagaCashflowTemplateFormats(shell.userMessage);
    if (formats?.length) {
      finalResponse = appendNiagaChatFilesToResponse(finalResponse, formats);
      emitAdamFilesEvent(shell.onEvent, buildNiagaChatFileRefs(formats));
    }
  }

  const k24Address = await generateK24Address(shell.mode);
  const messageId = await saveMessage(
    shell.resolvedSessionId,
    'adam',
    finalResponse,
    shell.mode,
    parsed.judgment,
    k24Address,
    shell.isGroup ? 'group-alamtologi' : shell.participant.userId,
    {
      speakerId:    'adam',
      speakerName:  'ADAM',
      sessionType:  shell.participant.sessionType,
      needsConsult: parsed.consult.needsConsult && !shell.isFounder,
    },
  );

  let memoryHealth: Awaited<ReturnType<typeof checkMemoryHealthCached>> | undefined;
  let healthBadge: string | undefined;
  if (shell.isFounder) {
    memoryHealth = await checkMemoryHealthCached(FOUNDER_USER_ID, shell.resolvedSessionId);
    const emoji = memoryHealth.status === 'HEALTHY' ? '🟢'
      : memoryHealth.status === 'WARNING' ? '🟡'
        : '🔴';
    healthBadge = `${emoji} Memory: ${memoryHealth.status} (${memoryHealth.score}/100)`;
  }

  shell.onEvent('adam_complete', JSON.stringify({
    sessionId:        shell.resolvedSessionId,
    messageId,
    k24Address,
    judgment:         parsed.judgment,
    tahapAkal:        parsed.tahapAkal,
    healthScore:      parsed.healthScore,
    principleApplied: parsed.principleApplied,
    response:         finalResponse,
    sanitizedRepair:  input.sanitizedRepairApplied === true,
    arithmeticAlphaRepair: input.arithmeticAlphaRepairApplied === true,
    visualDrawRepair: input.visualDrawRepairApplied === true,
    proseCraftRepair: input.proseCraftRepairApplied === true,
    usersGreetingRepair: usersGreetingRepairApplied,
    technicalMediaRepair: input.technicalMediaRepairApplied === true,
    adamProductRedirectRepair: input.adamProductRedirectRepairApplied === true,
    preserveStreamBody: input.preserveStreamBody === true,
    mode:             shell.mode,
    needsConsult:     parsed.consult.needsConsult && !shell.isFounder,
    model:            modelChoice.model,
    modelTier:        modelChoice.tier,
    modelReason:      modelChoice.reason,
    relayedToStudents: shell.isFounder ? relayResult.relayedToStudents : undefined,
    relayedToFounder:  !shell.isFounder ? relayResult.relayedToFounder : undefined,
    sealedJournals:    sealedJournals.length > 0 ? sealedJournals : undefined,
    sealErrors:        sealErrors.length > 0 ? sealErrors : undefined,
    workspaceId:       workspace?.workspaceId,
    memoryHealth,
    healthBadge,
  }));

  if (river) {
    console.log(formatBrainRiverLog(river, riverStageForPostTurn()));
  }

  if (isFounderOceanSink(oceanSink ?? 'guest-ephemeral')) {
    const appendEpisodicB = shouldAppendEpisodicB({
      isFounder:       true,
      message:         shell.normalizedMessage,
      uploadIds:       shell.uploadIds,
      teachingContext: shell.teaching.context,
    });
    if (ENV.ADAM_UNIFIED_TRANSFORM) {
      triggerTransformTurn({
        aSource:            'founder',
        isFounder:          true,
        founderId:          FOUNDER_USER_ID,
        sessionId:          shell.resolvedSessionId,
        userMessageId:      shell.userMessageId,
        userMessage:        shell.messageForAdam,
        skipEpisodicAppend: !appendEpisodicB,
      });
    } else {
      void triggerBrainTransformation(
        shell.messageForAdam,
        FOUNDER_USER_ID,
        shell.resolvedSessionId,
        {
          founderMessageId:   shell.userMessageId,
          skipEpisodicAppend: !appendEpisodicB,
        },
      ).catch((err) => console.error('[Alamtologi Brain] Founder transformation:', err));
    }
    void updateSessionSummary(shell.resolvedSessionId, FOUNDER_USER_ID).catch(() => {});
  }

  if (workspace) {
    void appendWorkspaceUnderstanding(
      workspace.workspaceId,
      shell.participant.userName,
      shell.userMessage,
      finalResponse,
    ).catch((err) => console.error('[ADAM Workspace] understanding update:', err));
  }

  if (shell.participant.sessionType === 'tutor' && !isGuestUserId(shell.participant.userId)) {
    void recordTutorLearningTurn({
      userId:                  shell.participant.userId,
      userMessage:             shell.userMessage,
      viaVoice:                shell.options.viaVoice === true,
      responseMs:              typeof shell.options.responseMs === 'number'
        ? shell.options.responseMs
        : undefined,
      recentUserMessages:      input.turnBrainMeta?.recentUserMessages,
      recentAssistantMessages: input.turnBrainMeta?.recentAssistantMessages,
    }).catch((err) => console.error('[ADAM Tutor] learning profile update:', err));
  }

  if (isStudentOceanSink(oceanSink ?? 'guest-ephemeral')) {
    void writeStudentStateAfterTurn(
      shell.participant.userId,
      shell.participant.userName,
      finalResponse,
      shell.userMessage,
    );

    if (!isGuestUserId(shell.participant.userId)) {
      triggerStudentMemoryPostTurn({
        sessionId:   shell.resolvedSessionId,
        studentId:   shell.participant.userId,
        studentName: shell.participant.userName,
      });
    }

    const isGuestTrial = isGuestUserId(shell.participant.userId);
    const isTutorLane = shell.participant.sessionType === 'tutor';
    if (!isTutorLane) {
      const recentUser = input.turnBrainMeta?.recentUserMessages ?? [];
      const recentAssistant = input.turnBrainMeta?.recentAssistantMessages ?? [];
      const tier = resolveUsersKnowledgeTier(
        shell.normalizedMessage,
        recentUser,
        recentAssistant,
      );
      triggerTransformTurn({
        sessionId:            shell.resolvedSessionId,
        userMessageId:        shell.userMessageId,
        studentId:            shell.participant.userId,
        studentName:          shell.participant.userName,
        userMessage:          shell.normalizedMessage,
        finalResponse,
        rawModelStream:       input.turnBrainMeta?.rawModelStream,
        recallLoaded:         input.turnBrainMeta?.recallLoaded === true,
        webSearchUsed:        input.turnBrainMeta?.webSearchUsed === true,
        isGuestTrial,
        isFounder:            false,
        usersKnowledgeTier: tier,
        usersDomainFacet:     river?.answerPlan?.usersDomain,
      });
    }
  }

  if (shell.teaching.uploadIds.length) {
    try {
      await deleteTeachingUploads(shell.teaching.uploadIds);
    } catch (eraseErr: unknown) {
      const msg = eraseErr instanceof Error ? eraseErr.message : String(eraseErr);
      console.error('[Alamtologi Brain] Upload erasure error:', msg);
    }
  }
}
