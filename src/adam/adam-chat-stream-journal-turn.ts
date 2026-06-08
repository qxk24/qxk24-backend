/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Chat Stream — Journal Turn
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

import {
  buildDailyJournalSegmentPromptBlock,
  getDailyJournalSegmentStatus,
} from './adam-journal-daily-segment';
import {
  buildAdamJournalTransparencyInstruction,
  buildAdamJournalWritingVoiceBlock,
  buildJournalGenAwaitTeachingBlock,
  buildJournalContinuePrompt,
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
import { gatherFounderJournalCorpus } from './adam-journal.service';
import {
  generateFounderJournalBySections,
  buildJournalSectionReviewFooter,
  assembleManuscriptForChatReview,
  formatSingleSectionDisplay,
  nextSectionToWrite,
  JOURNAL_SECTION_ORDER,
} from './adam-journal-section-writer';
import {
  founderWantsJournalParagraphContinue,
  nextParagraphIndex,
  sectionParagraphBlockComplete,
  sectionUsesParagraphStructure,
} from './adam-journal-section-paragraphs';
import {
  founderWantsJournalSectionEdit,
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
import { allJournalSectionsComplete } from './adam-journal-section.types';
import {
  getJournalContinuationConfig,
} from './adam-journal-continuation.config';
import { JOURNAL_TARGET_WORD_MIN } from './adam-journal.constants';
import {
  founderWantsJournalSeal,
  founderWantsJournalDraft,
  founderWantsJournalWrite,
  founderWantsJournalStop,
  founderWantsJournalContinue,
  meetsJournalLengthMinimum,
  adamDeclinesJournalSeal,
  adamMetaOnlyJournalReply,
  adamWroteJournalManifestoInsteadOfV2,
  hasSubstantiveManuscriptProse,
  journalTurnNeedsContinuation,
} from './adam-chat-response-parser';
import { founderJournalReviewPath } from './adam-system-prompts';
import { repairEastAsianScriptLeak } from './adam-language-guard';
import type { LlmMessage } from '../llm/llm-types';
import type { ADAMChatMode } from './adam.types';
import type { JournalSectionId } from './adam-journal-section.types';
import type {
  AdamStreamOnceFn,
  AdamOnEventFn,
  JournalGenContext,
  JournalStreamResult,
  StreamADAMChatOptions,
} from './adam-chat-stream.types';

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
      ||       founderWantsJournalSectionAppend(input.userMessage)
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

/** Persist pasted / prior ADAM addendum into MongoDB and return full accordion — no LLM meta reply. */
async function runJournalAddendumPersistTurn(input: {
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
      sessionId:   input.resolvedSessionId,
      save:        isSave,
      append:      isAppend,
      highlight,
      sectionCount: writtenIds.length,
      persisted:   Boolean(adamTextForPersist.trim().length >= 80),
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

const JOURNAL_WRITE_THEN_SEAL_PROMPT =
  'P.alt tapped Save for review. Write the COMPLETE IMRaD manuscript from this entire session ' +
  '(cover letter topics, Alamtologi seven principles, Hukum Z). ' +
  'Then emit valid <adam_journal_seal> JSON with every field filled. ' +
  'Do not apologize. Do not ask P.alt to paste. Do not refuse.';

const JOURNAL_WRITE_DRAFT_NOW_PROMPT =
  'P.alt ordered the FULL manuscript in THIS reply — not a plan, not promises, not format choices. ' +
  'ADAM Writing Voice: scholar precision + poet sensitivity + messenger humility — reach mind AND heart. ' +
  'Introduction opens with human experience. Unsolved issue feels like loss. Alamtologi as quiet gift. Application as threshold. Conclusion honours the journey. ' +
  'Use the exact title and constitutional requirements from P.alt messages in this session. ' +
  'Write Pengenalan, Latar Belakang, Kaedah, Dapatan, Perbincangan, Kesimpulan, Rujukan with substantive paragraphs. ' +
  'Include seven-principle Alamtologi analysis, Hukum Z tables (Q green, Z blue, X gold), x=m/t, Quran rasm only (no tafsir). ' +
  'FORBIDDEN: "Saya akan tulis", PDF/Word/web offers, invented ALM-J numbers, cold mechanical tone, dry summary endings. Do NOT seal yet.';

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
  const { journal, lockedTopic } = {
    journal: input.journal,
    lockedTopic: input.journal.journalTopic,
  };
  const journalContinuePrompt = lockedTopic
    ? buildJournalContinuePrompt(lockedTopic.topicId)
    : `Continue exactly where you stopped — same manuscript, ADAM Writing Voice (scholar + poet + messenger). ` +
      `Minimum ${JOURNAL_TARGET_WORD_MIN.toLocaleString()} words total. ` +
      'Do not repeat earlier sections. Do not ask PDF/Word. Finish all formula sections B→C→D with substantive paragraphs.';

  let fullResponse: string;
  let sectionJournalComplete = false;
  let sectionDraftMap: Partial<Record<JournalSectionId, string>> | undefined;
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

  const useSectionJournal =
    Boolean(lockedTopic)
    && !founderWantsJournalSeal(input.userMessage)
    && !sectionAppendTarget
    && (
      journal.journalWriteBySections
      || founderWantsJournalWrite(input.userMessage)
      || founderWantsJournalContinue(input.userMessage)
      || Boolean(sectionEditTarget)
    );

  if (useSectionJournal && lockedTopic) {
    const reviewPath = process.env.ADAM_JOURNAL_REVIEW_PATH?.trim() || founderJournalReviewPath();
    const sectionResult = await generateFounderJournalBySections({
      topic:         lockedTopic,
      sessionId:     input.resolvedSessionId,
      systemPrompt:  journal.systemPrompt,
      baseMessages:  input.llmMessages,
      reviewPath,
      maxSectionsPerTurn: 1,
      forceSectionId:       sectionEditTarget ?? undefined,
      forceParagraphIndex,
      expandInstruction:  sectionEditTarget && !forceParagraphIndex ? input.userMessage.trim() : undefined,
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
    fullResponse = sectionResult.manuscript;
    const highlightSection = sectionEditTarget ?? sectionResult.lastSectionWritten;
    if (highlightSection && Object.keys(sectionResult.sections).length > 0) {
      const idx = JOURNAL_SECTION_ORDER.indexOf(highlightSection) + 1;
      fullResponse = assembleManuscriptForChatReview(sectionResult.sections, {
        lastSection: highlightSection,
        index:       idx,
        total:       JOURNAL_SECTION_ORDER.length,
        complete:    sectionResult.allSectionsComplete,
        topic:       lockedTopic ?? undefined,
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
    sectionJournalComplete = sectionResult.allSectionsComplete;
    sectionDraftMap = sectionResult.sections;
    console.log(
      '[adam:journal-section] complete',
      JSON.stringify({
        sessionId: input.resolvedSessionId,
        totalWords: sectionResult.totalWords,
        allSectionsComplete: sectionResult.allSectionsComplete,
      }),
    );
  } else {
    fullResponse = await input.streamOnce(input.llmMessages, input.enableWebSearch);

    if (
      lockedTopic
      && journal.wantsJournalWrite
      && !founderWantsJournalSeal(input.userMessage)
      && adamWroteJournalManifestoInsteadOfV2(fullResponse)
    ) {
      console.log(
        '[adam:journal-section] manifesto drift — rerouting to V2 section writer',
        JSON.stringify({ sessionId: input.resolvedSessionId, topicId: lockedTopic.topicId }),
      );
      input.onEvent(
        'adam_chunk',
        JSON.stringify({ text: '\n\n— V2 journal (Title & Abstract) —\n\n' }),
      );
      const reviewPath = process.env.ADAM_JOURNAL_REVIEW_PATH?.trim() || founderJournalReviewPath();
      const sectionResult = await generateFounderJournalBySections({
        topic:              lockedTopic,
        sessionId:          input.resolvedSessionId,
        systemPrompt:       journal.systemPrompt,
        baseMessages:       input.llmMessages,
        reviewPath,
        maxSectionsPerTurn: 1,
        streamSection:      (messages, withSearch) => input.streamOnce(messages, withSearch),
      });
      if (sectionResult.lastSectionWritten) {
        const idx = JOURNAL_SECTION_ORDER.indexOf(sectionResult.lastSectionWritten) + 1;
        fullResponse = assembleManuscriptForChatReview(sectionResult.sections, {
          lastSection: sectionResult.lastSectionWritten,
          index:       idx,
          total:       JOURNAL_SECTION_ORDER.length,
          complete:    sectionResult.allSectionsComplete,
          topic:       lockedTopic ?? undefined,
        });
      } else {
        fullResponse = sectionResult.manuscript;
      }
      sectionJournalComplete = sectionResult.allSectionsComplete;
      sectionDraftMap = sectionResult.sections;
    }
  }

  const streamMs = Date.now() - streamStarted;

  const continuationConfig = getJournalContinuationConfig({
    isFounder:              input.isFounder,
    mode:                   input.mode,
    journalWriteBySections: journal.journalWriteBySections,
  });

  for (let cont = 0; cont < continuationConfig.maxContinuations; cont++) {
    if (!journalTurnNeedsContinuation(fullResponse, input.userMessage)) break;

    console.log(
      '[adam:journal-continue]',
      JSON.stringify({
        sessionId: input.resolvedSessionId,
        continuation: cont + 1,
        charsSoFar: fullResponse.length,
        ts: new Date().toISOString(),
      }),
    );

    input.onEvent(
      'adam_chunk',
      JSON.stringify({ text: '\n\n— continuing manuscript —\n\n' }),
    );

    const continued = await input.streamOnce(
      [
        ...input.llmMessages,
        { role: 'assistant', content: fullResponse },
        { role: 'user', content: journalContinuePrompt },
      ],
      false,
    );
    fullResponse += continued;
  }

  if (
    input.isFounder
    && input.mode === 'JOURNAL_GEN'
    && !journal.journalWriteBySections
    && (founderWantsJournalWrite(input.userMessage) || founderWantsJournalDraft(input.userMessage))
    && !founderWantsJournalSeal(input.userMessage)
  ) {
    const needsDraftWrite =
      adamMetaOnlyJournalReply(fullResponse)
      || adamWroteJournalManifestoInsteadOfV2(fullResponse)
      || !hasSubstantiveManuscriptProse(fullResponse);
    if (needsDraftWrite) {
      for (let w = 0; w < 2; w++) {
        console.log(
          '[adam:journal-write-draft]',
          JSON.stringify({
            sessionId: input.resolvedSessionId,
            pass: w + 1,
            charsSoFar: fullResponse.length,
            ts: new Date().toISOString(),
          }),
        );
        input.onEvent(
          'adam_chunk',
          JSON.stringify({ text: '\n\n— writing full IMRaD manuscript now —\n\n' }),
        );
        const continued = await input.streamOnce(
          [
            ...input.llmMessages,
            { role: 'assistant', content: fullResponse },
            { role: 'user', content: JOURNAL_WRITE_DRAFT_NOW_PROMPT },
          ],
          false,
        );
        fullResponse += continued;
        if (
          hasSubstantiveManuscriptProse(fullResponse)
          && !adamMetaOnlyJournalReply(fullResponse)
          && meetsJournalLengthMinimum(fullResponse)
        ) {
          break;
        }
      }
    }
  }

  if (
    input.isFounder
    && input.mode === 'JOURNAL_GEN'
    && founderWantsJournalSeal(input.userMessage)
    && !/<\/adam_journal_seal>/.test(fullResponse)
  ) {
    const corpus = await gatherFounderJournalCorpus(input.resolvedSessionId, fullResponse);
    const hasDraft =
      hasSubstantiveManuscriptProse(corpus) || hasSubstantiveManuscriptProse(fullResponse);
    const needsWrite =
      !hasDraft || adamDeclinesJournalSeal(fullResponse) || fullResponse.length < 2200;

    if (needsWrite) {
      for (let w = 0; w < 2; w++) {
        console.log(
          '[adam:journal-write-seal]',
          JSON.stringify({
            sessionId: input.resolvedSessionId,
            pass: w + 1,
            charsSoFar: fullResponse.length,
            ts: new Date().toISOString(),
          }),
        );

        input.onEvent(
          'adam_chunk',
          JSON.stringify({ text: '\n\n— writing IMRaD manuscript for seal —\n\n' }),
        );

        const continued = await input.streamOnce(
          [
            ...input.llmMessages,
            { role: 'assistant', content: fullResponse },
            { role: 'user', content: JOURNAL_WRITE_THEN_SEAL_PROMPT },
          ],
          false,
        );
        fullResponse += continued;
        if (/<\/adam_journal_seal>/.test(fullResponse)) break;
      }
    }
  }

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
