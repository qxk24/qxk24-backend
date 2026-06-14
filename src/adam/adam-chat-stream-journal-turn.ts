/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Journal Turn
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

import { repairEastAsianScriptLeak } from './adam-language-guard';
import {
  founderWantsJournalParagraphContinue,
  nextParagraphIndex,
  sectionParagraphBlockComplete,
  sectionUsesParagraphStructure,
} from './adam-journal-section-paragraphs';
import {
  founderWantsJournalSectionEdit,
  founderWantsJournalSectionAppend,
  resolveJournalSectionEditTarget,
} from './adam-journal-section-detect';
import { loadJournalSectionDraft } from './adam-journal-section-draft';
import { nextSectionToWrite } from './adam-journal-section-writer';
import { founderWantsJournalContinue } from './adam-chat-response-parser';
import type { LlmMessage } from '../llm/llm-types';
import type { ADAMChatMode } from './adam.types';
import type { JournalSectionId } from './adam-journal-section.types';
import type {
  AdamOnEventFn,
  AdamStreamOnceFn,
  JournalGenContext,
  JournalStreamResult,
} from './adam-chat-stream.types';
import { runJournalAddendumPersistTurn } from './adam-chat-stream-journal-addendum';
import { runJournalContinuationPasses } from './adam-chat-stream-journal-continuation';
import {
  journalNeedsManifestoReroute,
  rerouteManifestoToSectionWriter,
  shouldUseSectionJournal,
  streamJournalBySections,
} from './adam-chat-stream-journal-section';

export { enrichSystemPromptForJournalGen } from './adam-chat-stream-journal-prompt';

export async function streamAdamJournalResponse(input: {
  resolvedSessionId: string;
  userMessage:       string;
  mode:              ADAMChatMode;
  isFounder:         boolean;
  journal:           JournalGenContext;
  llmMessages:       LlmMessage[];
  enableWebSearch:   boolean;
  streamOnce:        AdamStreamOnceFn;
  onEvent:           AdamOnEventFn;
}): Promise<JournalStreamResult> {
  const { journal } = input;
  const lockedTopic = journal.journalTopic;
  const streamStarted = Date.now();

  const addendumPersistResult = await runJournalAddendumPersistTurn({
    resolvedSessionId: input.resolvedSessionId,
    userMessage:       input.userMessage,
    journal:           input.journal,
  });
  if (addendumPersistResult) {
    return addendumPersistResult;
  }

  const sectionAppendTarget = founderWantsJournalSectionAppend(input.userMessage)
    ? resolveJournalSectionEditTarget(input.userMessage)
    : null;
  let sectionEditTarget =
    !sectionAppendTarget && founderWantsJournalSectionEdit(input.userMessage)
      ? resolveJournalSectionEditTarget(input.userMessage)
      : null;
  let forceParagraphIndex: number | undefined;

  if (lockedTopic && (founderWantsJournalParagraphContinue(input.userMessage) || founderWantsJournalContinue(input.userMessage))) {
    const draft = await loadJournalSectionDraft(input.resolvedSessionId, lockedTopic.topicId);
    const activeSection =
      sectionEditTarget
      ?? draft?.lastSection
      ?? nextSectionToWrite(draft);
    if (activeSection && sectionUsesParagraphStructure(activeSection)) {
      const body = draft?.sections[activeSection]?.trim() ?? '';
      if (
        founderWantsJournalParagraphContinue(input.userMessage)
        || !sectionParagraphBlockComplete(body)
      ) {
        sectionEditTarget = activeSection;
        forceParagraphIndex = nextParagraphIndex(body);
      }
    }
  }

  let fullResponse: string;
  let sectionJournalComplete = false;
  let sectionDraftMap: Partial<Record<JournalSectionId, string>> | undefined;

  const useSectionJournal = shouldUseSectionJournal({
    lockedTopic,
    journal,
    userMessage:         input.userMessage,
    sectionAppendTarget,
    sectionEditTarget,
  });

  if (useSectionJournal && lockedTopic) {
    const sectionResult = await streamJournalBySections({
      resolvedSessionId:   input.resolvedSessionId,
      userMessage:         input.userMessage,
      lockedTopic,
      journal,
      llmMessages:         input.llmMessages,
      sectionEditTarget,
      forceParagraphIndex,
      streamOnce:          input.streamOnce,
      onEvent:             input.onEvent,
    });
    fullResponse = sectionResult.fullResponse;
    sectionJournalComplete = sectionResult.sectionJournalComplete;
    sectionDraftMap = sectionResult.sectionDraftMap;
  } else {
    fullResponse = await input.streamOnce(input.llmMessages, input.enableWebSearch);

    if (journalNeedsManifestoReroute(lockedTopic, journal, input.userMessage, fullResponse) && lockedTopic) {
      const rerouted = await rerouteManifestoToSectionWriter({
        resolvedSessionId: input.resolvedSessionId,
        lockedTopic,
        journal,
        llmMessages: input.llmMessages,
        streamOnce:  input.streamOnce,
        onEvent:     input.onEvent,
      });
      fullResponse = rerouted.fullResponse;
      sectionJournalComplete = rerouted.sectionJournalComplete;
      sectionDraftMap = rerouted.sectionDraftMap;
    }
  }

  const streamMs = Date.now() - streamStarted;

  fullResponse = await runJournalContinuationPasses({
    resolvedSessionId: input.resolvedSessionId,
    userMessage:       input.userMessage,
    isFounder:         input.isFounder,
    mode:              input.mode,
    journal,
    lockedTopic,
    llmMessages:       input.llmMessages,
    streamOnce:        input.streamOnce,
    onEvent:           input.onEvent,
    initialResponse:   fullResponse,
  });

  const repairStarted = Date.now();
  fullResponse = await repairEastAsianScriptLeak(fullResponse, input.userMessage);
  const repairMs = Date.now() - repairStarted;

  return {
    fullResponse,
    sectionJournalComplete,
    sectionDraftMap,
    streamMs,
    repairMs,
  };
}
