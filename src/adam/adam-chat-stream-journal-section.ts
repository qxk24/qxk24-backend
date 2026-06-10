/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Journal Section Writer
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
  generateFounderJournalBySections,
  buildJournalSectionReviewFooter,
  assembleManuscriptForChatReview,
  formatSingleSectionDisplay,
  JOURNAL_SECTION_ORDER,
} from './adam-journal-section-writer';
import {
  founderWantsJournalSeal,
  founderWantsJournalWrite,
  founderWantsJournalContinue,
  adamWroteJournalManifestoInsteadOfV2,
} from './adam-chat-response-parser';
import { founderJournalReviewPath } from './adam-system-prompts';
import type { LlmMessage } from '../llm/llm-types';
import type { JournalSectionId } from './adam-journal-section.types';
import type { UniversityKnowledgeTopic } from './adam-university-knowledge';
import type {
  AdamOnEventFn,
  AdamStreamOnceFn,
  JournalGenContext,
} from './adam-chat-stream.types';

export interface SectionJournalStreamResult {
  fullResponse: string;
  sectionJournalComplete: boolean;
  sectionDraftMap: Partial<Record<JournalSectionId, string>>;
}

export async function streamJournalBySections(input: {
  resolvedSessionId: string;
  userMessage: string;
  lockedTopic: UniversityKnowledgeTopic;
  journal: JournalGenContext;
  llmMessages: LlmMessage[];
  sectionEditTarget: JournalSectionId | null;
  forceParagraphIndex?: number;
  streamOnce: AdamStreamOnceFn;
  onEvent: AdamOnEventFn;
}): Promise<SectionJournalStreamResult> {
  const reviewPath = process.env.ADAM_JOURNAL_REVIEW_PATH?.trim() || founderJournalReviewPath();
  const sectionResult = await generateFounderJournalBySections({
    topic:                input.lockedTopic,
    sessionId:            input.resolvedSessionId,
    systemPrompt:         input.journal.systemPrompt,
    baseMessages:         input.llmMessages,
    reviewPath,
    maxSectionsPerTurn:   1,
    forceSectionId:       input.sectionEditTarget ?? undefined,
    forceParagraphIndex:  input.forceParagraphIndex,
    expandInstruction:
      input.sectionEditTarget && !input.forceParagraphIndex
        ? input.userMessage.trim()
        : undefined,
    streamSection: (messages, withSearch) => input.streamOnce(messages, withSearch),
    onSectionStart: (section, index, total) => {
      input.onEvent(
        'adam_chunk',
        JSON.stringify({
          text: `\n\n— ${section.replace(/_/g, ' ')} (${index}/${total}) —\n\n`,
        }),
      );
    },
    onSectionDone: (section, stats) => {
      input.onEvent(
        'adam_chunk',
        JSON.stringify({
          text: `\n\n✓ ${section.replace(/_/g, ' ')} — ${stats.sectionWords.toLocaleString()} words (total ${stats.accumulatedWords.toLocaleString()})\n\n`,
        }),
      );
    },
  });

  let fullResponse = sectionResult.manuscript;
  const highlightSection = input.sectionEditTarget ?? sectionResult.lastSectionWritten;
  if (highlightSection && Object.keys(sectionResult.sections).length > 0) {
    const idx = JOURNAL_SECTION_ORDER.indexOf(highlightSection) + 1;
    fullResponse = assembleManuscriptForChatReview(sectionResult.sections, {
      lastSection: highlightSection,
      index:       idx,
      total:       JOURNAL_SECTION_ORDER.length,
      complete:    sectionResult.allSectionsComplete,
      topic:       input.lockedTopic,
    });
  } else if (sectionResult.lastSectionWritten) {
    const idx = JOURNAL_SECTION_ORDER.indexOf(sectionResult.lastSectionWritten) + 1;
    const body = sectionResult.sections[sectionResult.lastSectionWritten] ?? '';
    fullResponse =
      formatSingleSectionDisplay(sectionResult.lastSectionWritten, body)
      + buildJournalSectionReviewFooter({
        lastSection: sectionResult.lastSectionWritten,
        index:       idx,
        total:       JOURNAL_SECTION_ORDER.length,
        complete:    sectionResult.allSectionsComplete,
      });
  }

  console.log(
    '[adam:journal-section] complete',
    JSON.stringify({
      sessionId:           input.resolvedSessionId,
      totalWords:          sectionResult.totalWords,
      allSectionsComplete: sectionResult.allSectionsComplete,
    }),
  );

  return {
    fullResponse,
    sectionJournalComplete: sectionResult.allSectionsComplete,
    sectionDraftMap:        sectionResult.sections,
  };
}

export async function rerouteManifestoToSectionWriter(input: {
  resolvedSessionId: string;
  lockedTopic: UniversityKnowledgeTopic;
  journal: JournalGenContext;
  llmMessages: LlmMessage[];
  streamOnce: AdamStreamOnceFn;
  onEvent: AdamOnEventFn;
}): Promise<SectionJournalStreamResult> {
  console.log(
    '[adam:journal-section] manifesto drift — rerouting to V2 section writer',
    JSON.stringify({ sessionId: input.resolvedSessionId, topicId: input.lockedTopic.topicId }),
  );
  input.onEvent(
    'adam_chunk',
    JSON.stringify({ text: '\n\n— V2 journal (Title & Abstract) —\n\n' }),
  );
  const reviewPath = process.env.ADAM_JOURNAL_REVIEW_PATH?.trim() || founderJournalReviewPath();
  const sectionResult = await generateFounderJournalBySections({
    topic:              input.lockedTopic,
    sessionId:          input.resolvedSessionId,
    systemPrompt:       input.journal.systemPrompt,
    baseMessages:       input.llmMessages,
    reviewPath,
    maxSectionsPerTurn: 1,
    streamSection:      (messages, withSearch) => input.streamOnce(messages, withSearch),
  });

  let fullResponse: string;
  if (sectionResult.lastSectionWritten) {
    const idx = JOURNAL_SECTION_ORDER.indexOf(sectionResult.lastSectionWritten) + 1;
    fullResponse = assembleManuscriptForChatReview(sectionResult.sections, {
      lastSection: sectionResult.lastSectionWritten,
      index:       idx,
      total:       JOURNAL_SECTION_ORDER.length,
      complete:    sectionResult.allSectionsComplete,
      topic:       input.lockedTopic,
    });
  } else {
    fullResponse = sectionResult.manuscript;
  }

  return {
    fullResponse,
    sectionJournalComplete: sectionResult.allSectionsComplete,
    sectionDraftMap:        sectionResult.sections,
  };
}

export function shouldUseSectionJournal(input: {
  lockedTopic: UniversityKnowledgeTopic | null;
  journal: JournalGenContext;
  userMessage: string;
  sectionAppendTarget: JournalSectionId | null;
  sectionEditTarget: JournalSectionId | null;
}): boolean {
  return Boolean(input.lockedTopic)
    && !founderWantsJournalSeal(input.userMessage)
    && !input.sectionAppendTarget
    && (
      input.journal.journalWriteBySections
      || founderWantsJournalWrite(input.userMessage)
      || founderWantsJournalContinue(input.userMessage)
      || Boolean(input.sectionEditTarget)
    );
}

export function journalNeedsManifestoReroute(
  lockedTopic: UniversityKnowledgeTopic | null,
  journal: JournalGenContext,
  userMessage: string,
  fullResponse: string,
): boolean {
  return Boolean(
    lockedTopic
    && journal.wantsJournalWrite
    && !founderWantsJournalSeal(userMessage)
    && adamWroteJournalManifestoInsteadOfV2(fullResponse),
  );
}
