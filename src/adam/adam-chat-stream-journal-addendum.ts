/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Journal Addendum
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

import { assembleManuscriptForChatReview, JOURNAL_SECTION_ORDER } from './adam-journal-section-writer';
import {
  founderWantsJournalSectionAppend,
  founderWantsJournalSaveAddendum,
  resolveJournalSectionEditTarget,
  resolveAdamTextForJournalPersist,
  resolveJournalTopicIdForDraftAsync,
  tryPersistInteractiveJournalSection,
  inferJournalSectionFromDisplayIndex,
} from './adam-journal-section-detect';
import {
  loadJournalSectionDraft,
  loadLatestJournalSectionDraftForSession,
} from './adam-journal-section-draft';
import { loadMessageHistory } from './adam-chat-session.service';
import { allJournalSectionsComplete, type JournalSectionId } from './adam-journal-section.types';
import { getTopicById } from './adam-journal-manual-prompt';
import type { JournalGenContext, JournalStreamResult } from './adam-chat-stream.types';

/** Persist pasted / prior ADAM addendum into MongoDB and return full accordion — no LLM meta reply. */
export async function runJournalAddendumPersistTurn(input: {
  resolvedSessionId: string;
  userMessage:       string;
  journal:           JournalGenContext;
}): Promise<JournalStreamResult | null> {
  const isSave   = founderWantsJournalSaveAddendum(input.userMessage);
  const isAppend = founderWantsJournalSectionAppend(input.userMessage);
  if (!isSave && !isAppend) return null;

  const recent = await loadMessageHistory(input.resolvedSessionId, 12);
  const adamTextForPersist = resolveAdamTextForJournalPersist({
    userMessage:  input.userMessage,
    adamResponse: '',
    recentAdam:   recent.map((m) => ({ role: m.role, content: m.content })),
  });

  let sections: Partial<Record<JournalSectionId, string>> | undefined;
  let lastSection: JournalSectionId | undefined;

  if (adamTextForPersist.trim().length >= 80) {
    const topicId = await resolveJournalTopicIdForDraftAsync({
      topicId:      input.journal.journalTopicId ?? input.journal.journalTopic?.topicId,
      userMessage:  input.userMessage,
      adamResponse: adamTextForPersist,
      sessionId:    input.resolvedSessionId,
    });
    const persisted = await tryPersistInteractiveJournalSection({
      sessionId:    input.resolvedSessionId,
      userMessage:  input.userMessage,
      adamResponse: adamTextForPersist,
      topicId,
    });
    if (persisted?.sections) {
      sections = persisted.sections;
      lastSection = persisted.lastSection;
    }
  }

  const topicId = await resolveJournalTopicIdForDraftAsync({
    topicId:      input.journal.journalTopicId ?? input.journal.journalTopic?.topicId,
    userMessage:  input.userMessage,
    adamResponse: adamTextForPersist,
    sessionId:    input.resolvedSessionId,
  });
  if (!sections && topicId) {
    const draft = await loadJournalSectionDraft(input.resolvedSessionId, topicId);
    if (draft?.sections && Object.keys(draft.sections).length > 0) {
      sections = draft.sections;
      lastSection = lastSection ?? draft.lastSection;
    }
  }
  if (!sections) {
    const sessionDraft = await loadLatestJournalSectionDraftForSession(input.resolvedSessionId);
    if (sessionDraft?.sections && Object.keys(sessionDraft.sections).length > 0) {
      sections = sessionDraft.sections;
      lastSection = lastSection ?? sessionDraft.lastSection;
    }
  }

  const writtenIds = JOURNAL_SECTION_ORDER.filter(
    (id) => (sections?.[id]?.trim().length ?? 0) >= 80,
  );
  if (!sections || writtenIds.length === 0) return null;

  const highlight =
    resolveJournalSectionEditTarget(input.userMessage)
    ?? inferJournalSectionFromDisplayIndex(input.userMessage)
    ?? lastSection
    ?? writtenIds[writtenIds.length - 1]!;
  const idx = JOURNAL_SECTION_ORDER.indexOf(highlight) + 1;
  const fullResponse = assembleManuscriptForChatReview(sections, {
    lastSection: highlight,
    index:       idx,
    total:       JOURNAL_SECTION_ORDER.length,
    complete:    allJournalSectionsComplete(sections),
    topic:       (input.journal.journalTopic ?? (topicId ? getTopicById(topicId) : undefined)) ?? undefined,
  });

  console.log(
    '[adam:journal-addendum-persist]',
    JSON.stringify({
      sessionId:    input.resolvedSessionId,
      save:         isSave,
      append:       isAppend,
      highlight,
      sectionCount: writtenIds.length,
      persisted:    Boolean(adamTextForPersist.trim().length >= 80),
    }),
  );

  return {
    fullResponse,
    sectionJournalComplete: allJournalSectionsComplete(sections),
    sectionDraftMap:        sections,
    streamMs:               0,
    repairMs:               0,
  };
}
