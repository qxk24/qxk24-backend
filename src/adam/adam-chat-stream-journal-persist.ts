/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Journal Persist
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

import { assembleManuscriptForChatReview } from './adam-journal-section-writer';
import {
  loadJournalSectionDraft,
  loadLatestJournalSectionDraftForSession,
} from './adam-journal-section-draft';
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
  resolveAdamTextForJournalPersist,
} from './adam-journal-section-detect';
import { loadMessageHistory } from './adam-chat-session.service';
import { getTopicById } from './adam-journal-manual-prompt';
import type { AdamChatTurnShell, JournalGenContext } from './adam-chat-stream.types';

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
  const lockedTopic =
    input.journal.journalTopic
    ?? (topicId ? getTopicById(topicId) : null)
    ?? undefined;
  const mergedDisplay = assembleManuscriptForChatReview(sections, {
    lastSection: highlight,
    index:       JOURNAL_SECTION_ORDER.indexOf(highlight) + 1,
    total:       JOURNAL_SECTION_ORDER.length,
    complete:    allJournalSectionsComplete(sections),
    topic:       lockedTopic ?? undefined,
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
