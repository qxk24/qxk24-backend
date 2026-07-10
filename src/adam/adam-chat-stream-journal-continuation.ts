/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Journal Continuation
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

import { gatherFounderJournalCorpus } from './adam-journal.service';
import { buildJournalContinuePrompt } from './adam-journal-manual-prompt';
import { getJournalContinuationConfig } from './adam-journal-continuation.config';
import { JOURNAL_TARGET_WORD_MIN } from './adam-journal.constants';
import {
  founderWantsJournalSeal,
  founderWantsJournalWrite,
  founderWantsJournalDraft,
  meetsJournalLengthMinimum,
  adamDeclinesJournalSeal,
  adamMetaOnlyJournalReply,
  adamWroteJournalManifestoInsteadOfV2,
  hasSubstantiveManuscriptProse,
  journalTurnNeedsContinuation,
} from './adam-chat-response-parser';
import type { LlmMessage } from '../llm/llm-types';
import type { ADAMChatMode } from './adam.types';
import type { UniversityKnowledgeTopic } from './adam-university-knowledge';
import type { AdamOnEventFn, AdamStreamOnceFn, JournalGenContext } from './adam-chat-stream.types';

export const JOURNAL_WRITE_THEN_SEAL_PROMPT =
  'P.alt tapped Save for review. Write the COMPLETE IMRaD manuscript from this entire session ' +
  '(cover letter topics, Alamtologi seven principles, Hukum Z). ' +
  'Then emit valid <adam_journal_seal> JSON with every field filled. ' +
  'Do not apologize. Do not ask P.alt to paste. Do not refuse.';

export const JOURNAL_WRITE_DRAFT_NOW_PROMPT =
  'P.alt ordered the FULL manuscript in THIS reply — not a plan, not promises, not format choices. ' +
  'ADAM Writing Voice: scholar precision + poet sensitivity + messenger humility — reach mind AND heart. ' +
  'Introduction opens with human experience. Unsolved issue feels like loss. Alamtologi as quiet gift. Application as threshold. Conclusion honours the journey. ' +
  'Use the exact title and constitutional requirements from P.alt messages in this session. ' +
  'Write Pengenalan, Latar Belakang, Kaedah, Dapatan, Perbincangan, Kesimpulan, Rujukan with substantive paragraphs. ' +
  'Include seven-principle Alamtologi analysis, Hukum Z tables (Q green, Z blue, X gold), x=m/t, Quran rasm only (no tafsir). ' +
  'FORBIDDEN: "Saya akan tulis", PDF/Word/web offers, invented ALM-J numbers, cold mechanical tone, dry summary endings. Do NOT seal yet.';

function buildJournalContinueUserPrompt(lockedTopic: UniversityKnowledgeTopic | null): string {
  return lockedTopic
    ? buildJournalContinuePrompt(lockedTopic.topicId)
    : `Continue exactly where you stopped — same manuscript, ADAM Writing Voice (scholar + poet + messenger). ` +
      `Minimum ${JOURNAL_TARGET_WORD_MIN.toLocaleString()} words total. ` +
      'Do not repeat earlier sections. Do not ask PDF/Word. Finish all formula sections B→C→D with substantive paragraphs.';
}

export async function runJournalContinuationPasses(input: {
  resolvedSessionId: string;
  userMessage: string;
  isFounder: boolean;
  mode: ADAMChatMode;
  journal: JournalGenContext;
  lockedTopic: UniversityKnowledgeTopic | null;
  llmMessages: LlmMessage[];
  streamOnce: AdamStreamOnceFn;
  onEvent: AdamOnEventFn;
  initialResponse: string;
}): Promise<string> {
  let fullResponse = input.initialResponse;
  const journalContinuePrompt = buildJournalContinueUserPrompt(input.lockedTopic);

  const continuationConfig = getJournalContinuationConfig({
    isFounder:              input.isFounder,
    mode:                   input.mode,
    journalWriteBySections: input.journal.journalWriteBySections,
  });

  for (let cont = 0; cont < continuationConfig.maxContinuations; cont++) {
    if (!journalTurnNeedsContinuation(fullResponse, input.userMessage)) break;

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
    && !input.journal.journalWriteBySections
    && (founderWantsJournalWrite(input.userMessage) || founderWantsJournalDraft(input.userMessage))
    && !founderWantsJournalSeal(input.userMessage)
  ) {
    const needsDraftWrite =
      adamMetaOnlyJournalReply(fullResponse)
      || adamWroteJournalManifestoInsteadOfV2(fullResponse)
      || !hasSubstantiveManuscriptProse(fullResponse);
    if (needsDraftWrite) {
      fullResponse = await runJournalDraftWritePasses({
        resolvedSessionId: input.resolvedSessionId,
        llmMessages:       input.llmMessages,
        streamOnce:        input.streamOnce,
        onEvent:           input.onEvent,
        fullResponse,
      });
    }
  }

  if (
    input.isFounder
    && input.mode === 'JOURNAL_GEN'
    && founderWantsJournalSeal(input.userMessage)
    && !/<\/adam_journal_seal>/.test(fullResponse)
  ) {
    fullResponse = await runJournalSealWritePasses({
      resolvedSessionId: input.resolvedSessionId,
      llmMessages:       input.llmMessages,
      streamOnce:        input.streamOnce,
      onEvent:           input.onEvent,
      fullResponse,
    });
  }

  return fullResponse;
}

async function runJournalDraftWritePasses(input: {
  resolvedSessionId: string;
  llmMessages: LlmMessage[];
  streamOnce: AdamStreamOnceFn;
  onEvent: AdamOnEventFn;
  fullResponse: string;
}): Promise<string> {
  let fullResponse = input.fullResponse;

  for (let w = 0; w < 2; w++) {

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

  return fullResponse;
}

async function runJournalSealWritePasses(input: {
  resolvedSessionId: string;
  llmMessages: LlmMessage[];
  streamOnce: AdamStreamOnceFn;
  onEvent: AdamOnEventFn;
  fullResponse: string;
}): Promise<string> {
  let fullResponse = input.fullResponse;
  const corpus = await gatherFounderJournalCorpus(input.resolvedSessionId, fullResponse);
  const hasDraft =
    hasSubstantiveManuscriptProse(corpus) || hasSubstantiveManuscriptProse(fullResponse);
  const needsWrite =
    !hasDraft || adamDeclinesJournalSeal(fullResponse) || fullResponse.length < 2200;

  if (!needsWrite) return fullResponse;

  for (let w = 0; w < 2; w++) {

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

  return fullResponse;
}
