/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Chat Stream — Post Turn (parse, seal, complete)
 * Platform : Backend (TypeScript)
 * ALAMTOLOGI : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { FOUNDER_USER_ID } from './adam-student.types';
import { CONSULT_PHRASE } from './adam-system-prompts';
import { detectLanguage } from './adam-language-mirror.service';
import { sanitizeEastAsianScriptLeaks } from './adam-language-guard';
import {
  founderWantsStudentRelay,
  founderWantsJournalSeal,
  parseBroadcastBlocks,
  parseConsultBlock,
  parseJournalSealBlocks,
  parseJudgmentBlock,
  parseToFounderBlocks,
  studentWantsFounderRelay,
} from './adam-chat-response-parser';
import { processFounderJournalSeal } from './adam-journal.service';
import {
  loadJournalSectionDraft,
  loadLatestJournalSectionDraftForSession,
  loadLatestJournalSectionDraftForTopic,
} from './adam-journal-section-draft';
import {
  assembleManuscriptFromSections,
  assembleManuscriptForChatReview,
} from './adam-journal-section-writer';
import { allJournalSectionsComplete, JOURNAL_SECTION_ORDER, type JournalSectionId } from './adam-journal-section.types';
import {
  resolveJournalTopicIdForDraftAsync,
  tryPersistInteractiveJournalSection,
  founderWantsJournalSectionEdit,
  founderWantsJournalSectionAppend,
  adamReplyIsJournalSectionAddendum,
  founderWantsJournalSaveAddendum,
  adamReplyIsJournalSaveConfirmation,
  founderJournalDisplayTurn,
  isJournalManuscriptDisplay,
  resolveAdamTextForJournalPersist,
  inferJournalSectionFromAdamResponse,
} from './adam-journal-section-detect';
import {
  relayFounderMessageToStudents,
  relayStudentMessageToFounder,
} from './adam-chat-relay.service';
import {
  createConsultFlag,
  markConsultDeliveredToFounder,
} from './adam-consult.service';
import { generateK24Address, loadMessageHistory, saveMessage } from './adam-chat-session.service';
import { checkMemoryHealthCached } from '../qxk24brain/adam-health.service';
import { triggerBrainTransformation } from '../qxk24brain/qxk24brain.engine';
import { shouldAppendEpisodicB } from '../lib/ama/ama-episodic-gate';
import { updateSessionSummary } from '../qxk24brain/adam-anchor.service';
import { appendWorkspaceUnderstanding } from './adam-workspace.service';
import { writeStudentStateAfterTurn } from './student-continuity-bridge';
import { deleteTeachingUploads } from './adam-upload.service';
import type { JournalGenContext } from './adam-chat-stream.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';

export async function persistInteractiveJournalDraft(input: {
  shell:              AdamChatTurnShell;
  fullResponse:       string;
  journal:            JournalGenContext;
  sectionDraftMap?:   Partial<Record<JournalSectionId, string>>;
}): Promise<{
  sections?:     Partial<Record<JournalSectionId, string>>;
  lastSection?:  JournalSectionId;
  mergedDisplay?: string;
} | undefined> {
  if (!input.shell.isFounder) {
    return input.sectionDraftMap
      ? { sections: input.sectionDraftMap }
      : undefined;
  }

  let sections = input.sectionDraftMap;
  let lastSection: JournalSectionId | undefined;

  const pipelineAlreadySaved =
    Boolean(input.sectionDraftMap && Object.keys(input.sectionDraftMap).length > 0)
    && (
      input.journal.journalWriteBySections
      || founderWantsJournalSectionEdit(input.shell.userMessage)
    );

  const addendumPersist =
    adamReplyIsJournalSectionAddendum(input.fullResponse)
    || adamReplyIsJournalSaveConfirmation(input.fullResponse)
    || founderWantsJournalSectionAppend(input.shell.userMessage)
    || founderWantsJournalSaveAddendum(input.shell.userMessage);

  const saveConfirmationOnly =
    adamReplyIsJournalSaveConfirmation(input.fullResponse)
    && !founderWantsJournalSaveAddendum(input.shell.userMessage)
    && !founderWantsJournalSectionAppend(input.shell.userMessage);

  const addendumTurnAlreadySaved =
    Boolean(input.sectionDraftMap && Object.keys(input.sectionDraftMap).length > 0)
    && (
      founderWantsJournalSaveAddendum(input.shell.userMessage)
      || founderWantsJournalSectionAppend(input.shell.userMessage)
    );

  if ((!pipelineAlreadySaved || addendumPersist) && !saveConfirmationOnly && !addendumTurnAlreadySaved) {
    try {
      const recent = await loadMessageHistory(input.shell.resolvedSessionId, 10);
      const adamTextForPersist = resolveAdamTextForJournalPersist({
        userMessage:  input.shell.userMessage,
        adamResponse: input.fullResponse,
        recentAdam:   recent,
      });
      const topicId = await resolveJournalTopicIdForDraftAsync({
        topicId:      input.journal.journalTopic?.topicId ?? input.journal.journalTopicId,
        userMessage:  input.shell.userMessage,
        adamResponse: adamTextForPersist,
        sessionId:    input.shell.resolvedSessionId,
      });
      const persisted = await tryPersistInteractiveJournalSection({
        sessionId:    input.shell.resolvedSessionId,
        userMessage:  input.shell.userMessage,
        adamResponse: adamTextForPersist,
        topicId,
      });
      if (persisted) {
        sections = persisted.sections;
        lastSection = persisted.lastSection;
      }
    } catch (err) {
      console.warn('[journal:draft-save] interactive persist failed', err);
    }
  }

  const topicId = await resolveJournalTopicIdForDraftAsync({
    topicId:      input.journal.journalTopic?.topicId ?? input.journal.journalTopicId,
    userMessage:  input.shell.userMessage,
    adamResponse: input.fullResponse,
    sessionId:    input.shell.resolvedSessionId,
  });
  if (topicId) {
    const draftFromDb = await loadJournalSectionDraft(
      input.shell.resolvedSessionId,
      topicId,
    );
    if (draftFromDb?.sections && Object.keys(draftFromDb.sections).length > 0) {
      sections = draftFromDb.sections;
      lastSection = lastSection ?? draftFromDb.lastSection;
    }
  } else {
    const sessionDraft = await loadLatestJournalSectionDraftForSession(
      input.shell.resolvedSessionId,
    );
    if (sessionDraft?.sections && Object.keys(sessionDraft.sections).length > 0) {
      sections = sessionDraft.sections;
      lastSection = lastSection ?? sessionDraft.lastSection;
    }
  }

  if (!sections || Object.keys(sections).length === 0) {
    return sections ? { sections } : undefined;
  }

  const writtenIds = JOURNAL_SECTION_ORDER.filter(
    (id) => (sections[id]?.trim().length ?? 0) >= 80,
  );
  if (writtenIds.length === 0) {
    return { sections, lastSection };
  }

  const highlight = lastSection ?? writtenIds[writtenIds.length - 1]!;
  let mergedDisplay = assembleManuscriptForChatReview(sections, {
    lastSection: highlight,
    index:       JOURNAL_SECTION_ORDER.indexOf(highlight) + 1,
    total:       JOURNAL_SECTION_ORDER.length,
    complete:    allJournalSectionsComplete(sections),
  });

  const displayTurn = founderJournalDisplayTurn({
    userMessage:  input.shell.userMessage,
    adamResponse: input.fullResponse,
  });

  const shouldMerge =
    mergedDisplay.length >= 80
    && (
      displayTurn
      || pipelineAlreadySaved
    );

  return {
    sections,
    lastSection: highlight,
    mergedDisplay: shouldMerge ? mergedDisplay : undefined,
  };
}

export async function finishAdamChatTurn(input: {
  shell:                  AdamChatTurnShell;
  fullResponse:           string;
  journal:                JournalGenContext;
  sectionJournalComplete: boolean;
  sectionDraftMap?:       Partial<Record<JournalSectionId, string>>;
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
  } = input;
  let sectionDraftMap = input.sectionDraftMap;

  const {
    judgment,
    tahapAkal,
    healthScore,
    principleApplied,
    cleanResponse: judgedResponse,
  } = parseJudgmentBlock(fullResponse);

  const consult = parseConsultBlock(judgedResponse);
  const broadcast = parseBroadcastBlocks(consult.cleanResponse);
  const toFounder = parseToFounderBlocks(broadcast.cleanResponse);
  const journalSeal = parseJournalSealBlocks(toFounder.cleanResponse);
  const speakerLocale = detectLanguage(shell.userMessage).detectedLocale;
  let finalResponse = sanitizeEastAsianScriptLeaks(
    journalSeal.cleanResponse,
    speakerLocale,
  );

  if (!finalResponse?.trim() && fullResponse?.trim()) {
    finalResponse = fullResponse.trim();
  }
  if (isJournalManuscriptDisplay(fullResponse)) {
    finalResponse = sanitizeEastAsianScriptLeaks(fullResponse.trim(), speakerLocale);
  } else if (
    shell.isFounder
    && adamReplyIsJournalSaveConfirmation(finalResponse)
    && sectionDraftMap
    && Object.keys(sectionDraftMap).length > 0
  ) {
    const writtenIds = JOURNAL_SECTION_ORDER.filter(
      (id) => (sectionDraftMap[id]?.trim().length ?? 0) >= 80,
    );
    if (writtenIds.length > 0) {
      const highlight =
        inferJournalSectionFromAdamResponse(finalResponse)
        ?? writtenIds[writtenIds.length - 1]!;
      finalResponse = sanitizeEastAsianScriptLeaks(
        assembleManuscriptForChatReview(sectionDraftMap, {
          lastSection: highlight,
          index:       JOURNAL_SECTION_ORDER.indexOf(highlight) + 1,
          total:       JOURNAL_SECTION_ORDER.length,
          complete:    allJournalSectionsComplete(sectionDraftMap),
        }),
        speakerLocale,
      );
    }
  }
  if (!finalResponse?.trim()) {
    console.warn('[adam:post-turn] empty finalResponse before save', {
      sessionId: shell.resolvedSessionId,
      mode:      shell.mode,
    });
    finalResponse = [
      'Bismillahirahmanirrahim.',
      'P.alt, maaf — pada giliran ini jawapan saya tidak tersimpan.',
      'Sila hantar semula bab itu.',
    ].join(' ');
  }

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
      sealsFromReply:         journalSeal.seals,
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

  let relayedToStudents = 0;
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

  let relayedToFounder = false;
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

  const k24Address = await generateK24Address(shell.mode);
  const messageId = await saveMessage(
    shell.resolvedSessionId,
    'adam',
    finalResponse,
    shell.mode,
    judgment,
    k24Address,
    shell.isGroup ? 'group-alamtologi' : shell.participant.userId,
    {
      speakerId:    'adam',
      speakerName:  'ADAM',
      sessionType:  shell.participant.sessionType,
      needsConsult: consult.needsConsult && !shell.isFounder,
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
    judgment,
    tahapAkal,
    healthScore,
    principleApplied,
    response:       finalResponse,
    mode:           shell.mode,
    needsConsult:   consult.needsConsult && !shell.isFounder,
    model:          modelChoice.model,
    modelTier:      modelChoice.tier,
    modelReason:    modelChoice.reason,
    relayedToStudents: shell.isFounder ? relayedToStudents : undefined,
    relayedToFounder:  !shell.isFounder ? relayedToFounder : undefined,
    sealedJournals:    sealedJournals.length > 0 ? sealedJournals : undefined,
    sealErrors:          sealErrors.length > 0 ? sealErrors : undefined,
    workspaceId:    workspace?.workspaceId,
    memoryHealth,
    healthBadge,
  }));

  if (shell.isFounder) {
    const appendEpisodicB = shouldAppendEpisodicB({
      isFounder:       true,
      message:         shell.normalizedMessage,
      uploadIds:       shell.uploadIds,
      teachingContext: shell.teaching.context,
    });
    void triggerBrainTransformation(
      shell.messageForAdam,
      FOUNDER_USER_ID,
      shell.resolvedSessionId,
      {
        founderMessageId:   shell.userMessageId,
        skipEpisodicAppend: !appendEpisodicB,
      },
    ).catch((err) => console.error('[Alamtologi Brain] Founder transformation:', err));
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

  if (!shell.isFounder) {
    void writeStudentStateAfterTurn(
      shell.participant.userId,
      shell.participant.userName,
      finalResponse,
      shell.userMessage,
    );
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
