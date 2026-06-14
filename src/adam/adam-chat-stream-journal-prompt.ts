/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Journal Prompt
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

import { buildDailyJournalSegmentPromptBlock, getDailyJournalSegmentStatus } from './adam-journal-daily-segment';
import {
  buildAdamJournalTransparencyInstruction,
  buildAdamJournalWritingVoiceBlock,
  buildJournalGenAwaitTeachingBlock,
  buildNaturalJournalPrompt,
  buildNaturalJournalTopicBlock,
  buildJournalV2FormatBlock,
  buildJournalFounderStepGuideBlock,
  buildSessionTeachingGuardBlock,
  extractLockedTopicIdFromMessage,
  getTopicById,
} from './adam-journal-manual-prompt';
import {
  adamSelectsBestTopic,
  extractLockedTopicIdFromSession,
  getSyncJournalTopicFallback,
  shouldSelectNewJournalTopic,
} from './adam-journal-topic-selector';
import {
  founderWantsJournalParagraphContinue,
} from './adam-journal-section-paragraphs';
import {
  founderWantsJournalSectionEdit,
  founderWantsJournalSectionAppend,
  founderWantsJournalSaveAddendum,
} from './adam-journal-section-detect';
import { loadLatestJournalSectionDraftForSession } from './adam-journal-section-draft';
import {
  founderWantsJournalSeal,
  founderWantsJournalDraft,
  founderWantsJournalWrite,
  founderWantsJournalStop,
  founderWantsJournalContinue,
} from './adam-chat-response-parser';
import { founderJournalReviewPath } from './adam-system-prompts';
import type { LlmMessage } from '../llm/llm-types';
import type { JournalGenContext, StreamADAMChatOptions } from './adam-chat-stream.types';

export async function enrichSystemPromptForJournalGen(input: {
  baseSystemPrompt: string;
  userMessage:      string;
  contextMessages:  LlmMessage[];
  options:          StreamADAMChatOptions;
  sessionId?:       string;
}): Promise<JournalGenContext> {
  let systemPrompt = `${input.baseSystemPrompt}\n\n${buildAdamJournalWritingVoiceBlock()}`;
  let journalTopic = null;
  let journalTopicId: string | undefined;
  let wantsJournalWrite = false;
  let journalWriteBySections = false;

  wantsJournalWrite =
    !founderWantsJournalStop(input.userMessage)
    && (
      founderWantsJournalWrite(input.userMessage)
      || founderWantsJournalDraft(input.userMessage)
      || founderWantsJournalContinue(input.userMessage)
      || founderWantsJournalSectionEdit(input.userMessage)
      || founderWantsJournalSectionAppend(input.userMessage)
      || founderWantsJournalSaveAddendum(input.userMessage)
      || founderWantsJournalParagraphContinue(input.userMessage)
    );
  const sessionTopicId = extractLockedTopicIdFromSession(input.contextMessages);
  const msgTopicId = extractLockedTopicIdFromMessage(input.userMessage);

  let draftTopicId: string | undefined;
  if (input.sessionId) {
    const sessionDraft = await loadLatestJournalSectionDraftForSession(input.sessionId);
    draftTopicId = sessionDraft?.topicId;
  }

  const lockedTopicId = msgTopicId ?? sessionTopicId ?? draftTopicId;

  if (input.options.journalAutonomous === true) {
    journalTopicId = lockedTopicId;
    journalTopic = journalTopicId ? getTopicById(journalTopicId) : null;
    try {
      const segmentStatus = await getDailyJournalSegmentStatus(
        new Date(),
        journalTopic?.topicId,
      );
      systemPrompt = `${systemPrompt}\n\n${buildDailyJournalSegmentPromptBlock(segmentStatus)}`;
    } catch (err) {
      console.warn('[adam:journal-segment] autonomous quota unavailable', err);
    }
  } else if (shouldSelectNewJournalTopic(input.userMessage, lockedTopicId)) {
    try {
      journalTopic = await adamSelectsBestTopic(
        input.contextMessages,
        new Date(),
        input.userMessage,
      );
      journalTopicId = journalTopic.topicId;
      console.log(
        '[adam:journal-topic] ADAM selected',
        JSON.stringify({ topicId: journalTopicId, label: journalTopic.label }),
      );
    } catch (err) {
      console.warn('[adam:journal-topic] selection failed', err);
      journalTopic = await getSyncJournalTopicFallback(new Date());
      journalTopicId = journalTopic?.topicId;
    }
  } else {
    journalTopic = lockedTopicId ? getTopicById(lockedTopicId) : null;
    journalTopicId = journalTopic?.topicId ?? lockedTopicId;
    if (lockedTopicId && !journalTopic) {
      console.warn(
        '[adam:journal-topic] locked topicId not in map',
        JSON.stringify({ topicId: lockedTopicId, sessionId: input.sessionId }),
      );
    }
  }

  if (journalTopic) {
    systemPrompt = `${systemPrompt}\n\n${buildNaturalJournalTopicBlock(journalTopic)}`;
    if (wantsJournalWrite) {
      journalWriteBySections = !founderWantsJournalSeal(input.userMessage);
      if (!journalWriteBySections) {
        systemPrompt = `${systemPrompt}\n\n${buildAdamJournalTransparencyInstruction(journalTopic)}`;
        const reviewHint = process.env.ADAM_JOURNAL_REVIEW_PATH?.trim() || founderJournalReviewPath();
        systemPrompt = `${systemPrompt}\n\n${buildNaturalJournalPrompt(journalTopic, reviewHint)}`;
      } else {
        systemPrompt = `${systemPrompt}\n\n${buildJournalV2FormatBlock()}\n\n${buildJournalFounderStepGuideBlock()}\n\n[JOURNAL SECTION MODE]
P.alt ordered journal writing. The platform writes **ONE section per turn** (9 sections total) — never the full manuscript in one reply.
Session teaching is the seed — do NOT ask P.alt to upload or re-paste content. Write draft movements in **Bahasa Melayu Malaysia** only.
Each section saves to MongoDB immediately. Use [FORMULA] tags for math in Movement 5 only. Prose only — no JSON/XML seals.
English publication manuscript is generated automatically when P.alt approves/publishes — not during draft movements.
After each section P.alt reviews the accordion, then replies **continue** for the next movement (2/9, 3/9, …), or names a movement (e.g. **Convention Knowledge — Achievement (3/9)**) to expand/edit it.
Do NOT switch topicId — it is locked for all 9 movements.`;
      }
      const founderTeachingChars = input.contextMessages
        .filter((m) => m.role === 'user')
        .reduce((n, m) => n + m.content.length, 0);
      const guard = buildSessionTeachingGuardBlock(founderTeachingChars);
      if (guard) systemPrompt = `${systemPrompt}\n\n${guard}`;
    }
  } else if (wantsJournalWrite) {
    systemPrompt = `${systemPrompt}\n\n${buildJournalFounderStepGuideBlock()}`;
  } else {
    systemPrompt = `${systemPrompt}\n\n${buildJournalGenAwaitTeachingBlock()}`;
  }

  return {
    journalTopic,
    journalTopicId,
    wantsJournalWrite,
    journalWriteBySections,
    systemPrompt,
  };
}
