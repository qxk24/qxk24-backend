/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Post Turn Finalize
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
  buildStudentGreetingFallback,
  buildStudentGuidedPerspectiveFallback,
  isAdamLightChatTurn,
  isAdamSubstantiveTurn,
} from './adam-response-generation';
import { detectLanguage } from './adam-language-mirror.service';
import { sanitizeEastAsianScriptLeaks } from './adam-language-guard';
import {
  parseBroadcastBlocks,
  parseConsultBlock,
  parseJournalSealBlocks,
  parseJudgmentBlock,
  parseToFounderBlocks,
} from './adam-chat-response-parser';
import { assembleManuscriptForChatReview } from './adam-journal-section-writer';
import { allJournalSectionsComplete, JOURNAL_SECTION_ORDER, type JournalSectionId } from './adam-journal-section.types';
import {
  adamReplyIsJournalSaveConfirmation,
  isJournalManuscriptDisplay,
  inferJournalSectionFromAdamResponse,
} from './adam-journal-section-detect';
import type { AdamChatTurnShell, JournalGenContext } from './adam-chat-stream.types';

export interface ParsedAdamTurnBlocks {
  judgment: ReturnType<typeof parseJudgmentBlock>['judgment'];
  tahapAkal: ReturnType<typeof parseJudgmentBlock>['tahapAkal'];
  healthScore: ReturnType<typeof parseJudgmentBlock>['healthScore'];
  principleApplied: ReturnType<typeof parseJudgmentBlock>['principleApplied'];
  consult: ReturnType<typeof parseConsultBlock>;
  broadcast: ReturnType<typeof parseBroadcastBlocks>;
  toFounder: ReturnType<typeof parseToFounderBlocks>;
  journalSeal: ReturnType<typeof parseJournalSealBlocks>;
}

export function parseAdamTurnBlocks(fullResponse: string): ParsedAdamTurnBlocks {
  const judgmentParsed = parseJudgmentBlock(fullResponse);
  const {
    judgment,
    tahapAkal,
    healthScore,
    principleApplied,
    cleanResponse: judgedResponse,
  } = judgmentParsed;

  const consult = parseConsultBlock(judgedResponse);
  const broadcast = parseBroadcastBlocks(consult.cleanResponse);
  const toFounder = parseToFounderBlocks(broadcast.cleanResponse);
  const journalSeal = parseJournalSealBlocks(toFounder.cleanResponse);

  return {
    judgment,
    tahapAkal,
    healthScore,
    principleApplied,
    consult,
    broadcast,
    toFounder,
    journalSeal,
  };
}

export function buildFinalResponseForSave(input: {
  shell: AdamChatTurnShell;
  fullResponse: string;
  journal: JournalGenContext;
  sectionDraftMap?: Partial<Record<JournalSectionId, string>>;
  journalSealCleanResponse: string;
}): string {
  const speakerLocale = detectLanguage(input.shell.userMessage).detectedLocale;
  let finalResponse = sanitizeEastAsianScriptLeaks(
    input.journalSealCleanResponse,
    speakerLocale,
  );

  if (!finalResponse?.trim() && input.fullResponse?.trim()) {
    finalResponse = input.fullResponse.trim();
  }
  if (isJournalManuscriptDisplay(input.fullResponse)) {
    finalResponse = sanitizeEastAsianScriptLeaks(input.fullResponse.trim(), speakerLocale);
  } else if (
    input.shell.isFounder
    && adamReplyIsJournalSaveConfirmation(finalResponse)
    && input.sectionDraftMap
    && Object.keys(input.sectionDraftMap).length > 0
  ) {
    const writtenIds = JOURNAL_SECTION_ORDER.filter(
      (id) => (input.sectionDraftMap![id]?.trim().length ?? 0) >= 80,
    );
    if (writtenIds.length > 0) {
      const highlight =
        inferJournalSectionFromAdamResponse(finalResponse)
        ?? writtenIds[writtenIds.length - 1]!;
      finalResponse = sanitizeEastAsianScriptLeaks(
        assembleManuscriptForChatReview(input.sectionDraftMap!, {
          lastSection: highlight,
          index:       JOURNAL_SECTION_ORDER.indexOf(highlight) + 1,
          total:       JOURNAL_SECTION_ORDER.length,
          complete:    allJournalSectionsComplete(input.sectionDraftMap!),
          topic:       input.journal.journalTopic ?? undefined,
        }),
        speakerLocale,
      );
    }
  }

  if (!finalResponse?.trim()) {
    if (input.shell.isFounder) {
      console.warn('[adam:post-turn] empty founder finalResponse before save', {
        sessionId: input.shell.resolvedSessionId,
        mode:      input.shell.mode,
      });
      finalResponse = [
        'Bismillahirahmanirrahim.',
        'P.alt, maaf — pada giliran ini jawapan saya tidak tersimpan.',
        'Sila hantar semula bab itu.',
      ].join(' ');
    } else if (isAdamLightChatTurn(input.shell.userMessage)) {
      finalResponse = buildStudentGreetingFallback(
        input.shell.userMessage,
        input.shell.participant.userName,
      );
    } else if (isAdamSubstantiveTurn(input.shell.userMessage)) {
      finalResponse = buildStudentGuidedPerspectiveFallback(input.shell.userMessage);
    } else {
      console.warn('[adam:post-turn] student silent gate — empty finalResponse', {
        sessionId: input.shell.resolvedSessionId,
        mode:      input.shell.mode,
      });
    }
  }

  return finalResponse;
}
