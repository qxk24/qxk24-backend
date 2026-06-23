/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Stream Repair
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Founder-only post-stream repair — never imports student technical guards.
 */

import type { ADAMChatMode } from './adam.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { FounderTeachingFlags } from './adam-chat-stream-turn-context';
import type { FounderChannelId } from './adam-channel-router';
import { repairEastAsianScriptLeak } from './adam-language-guard';
import { repairFormulaXyzStreamOutput } from './adam-book-aware-recall';
import { stripMisplacedPracticalCareerDoor } from './adam-universal-scholar';
import { restoreFounderPaltAddress, founderOutputHasAddressDrift } from './adam-founder-address-guard';
import { repairFounderTeachingRecallEssay } from './adam-founder-teaching-recall-guard';
import { repairFounderKonvensionalSurface } from './adam-founder-konvensional-surface';
import {
  repairFounderInventedEmpiricalClaims,
  repairFounderEmpiricalVoice,
  stripFounderContinuationMetaOpener,
  stripFounderRevisionMetaLoop,
  stripFounderTeachingInquiryLeak,
} from './adam-founder-empirical-guard';
import { isFounderReplyRevisionDirective } from './adam-response-generation';
import type { LlmSearchResult } from '../llm/llm-types';
import { repairStaleOfficeHolderOutput } from './adam-current-affairs';
import { isArithmeticAlphaCollapsedRepair } from './adam-arithmetic-alpha-guard';
import { sanitizeFounderTeachingQuranFormat } from './adam-founder-teaching-prompts';
import {
  detectFounderTeachingOutputLeak,
  repairFounderTeachingOutputLeak,
  syncSanitizeFounderTeachingOutput,
} from './adam-founder-teaching-output-guard';
import { ensureFounderTeachingInquiryClose } from './adam-teaching-inquiry-repair';
import { ensureFounderTeachingSynthesisSections } from './adam-teaching-synthesis-repair';
import {
  adamTeachingMessageHasInquirySection,
  adamTeachingMessageHasSynthesisSection,
} from './adam-teaching-state-machine';
import type { StreamRepairResult } from './adam-chat-stream-llm';

const KONVENSIONAL_MEDIA_TAG_RE = /<adam-(?:chat-image|chat-video|technical-diagram)\b/i;

/** Never persist student-channel shape over a substantive founder stream. */
export function resolveFounderTurnDisplayForSave(streamed: string, repaired: string): string {
  const prev = streamed.trim();
  const next = repaired.trim();
  if (!next) return prev;
  if (!prev) return next;

  if (KONVENSIONAL_MEDIA_TAG_RE.test(next) && !KONVENSIONAL_MEDIA_TAG_RE.test(prev)) {
    return prev;
  }
  if (/^#{1,6}\s/m.test(next) && !/^#{1,6}\s/m.test(prev) && prev.length > 180) {
    return prev;
  }
  if (/berikut penjelasan tentang/i.test(next) && !/berikut penjelasan tentang/i.test(prev)) {
    return prev;
  }
  if (prev.length > 200 && next.length / prev.length < 0.5) {
    return prev;
  }
  return next.length >= 40 ? next : prev;
}

export async function repairFounderStreamOutput(input: {
  shell: AdamChatTurnShell;
  rawModelStream: string;
  teachingFlags: FounderTeachingFlags;
  recentUserTurns: string[];
  recentAssistantTurns?: string[];
  channelId: FounderChannelId;
  mode: ADAMChatMode;
  searchResults?: LlmSearchResult[];
  extractedFacts?: string;
}): Promise<StreamRepairResult> {
  const {
    shell,
    rawModelStream,
    teachingFlags,
    recentUserTurns,
    recentAssistantTurns = [],
    channelId,
    mode,
    searchResults = [],
    extractedFacts = '',
  } = input;
  const {
    userMessage,
    normalizedMessage,
    teaching,
    resolvedSessionId,
    onEvent,
  } = shell;
  const { founderTeachingSynthesis, founderTeachingAbsorption, founderTeachingLearnerTurn } = teachingFlags;

  const repairStarted = Date.now();
  let sanitizedRepairApplied = false;
  let arithmeticAlphaRepairApplied = false;

  let fullResponse = await repairEastAsianScriptLeak(rawModelStream, userMessage);

  if (channelId === 'founder-command') {
    fullResponse = repairFormulaXyzStreamOutput(fullResponse, userMessage);
    fullResponse = stripMisplacedPracticalCareerDoor(
      fullResponse,
      userMessage,
      recentUserTurns,
    );
    fullResponse = restoreFounderPaltAddress(fullResponse);
    fullResponse = repairStaleOfficeHolderOutput(fullResponse, userMessage);
    fullResponse = stripFounderTeachingInquiryLeak(fullResponse);
    fullResponse = stripFounderRevisionMetaLoop(fullResponse);
    fullResponse = repairFounderKonvensionalSurface(
      fullResponse,
      userMessage,
      recentUserTurns,
    );
    fullResponse = stripFounderContinuationMetaOpener(fullResponse);
    fullResponse = repairFounderTeachingRecallEssay(
      fullResponse,
      userMessage,
      recentUserTurns,
      recentAssistantTurns,
    );
    fullResponse = repairFounderEmpiricalVoice(
      fullResponse,
      searchResults,
      extractedFacts,
      userMessage,
      recentUserTurns,
      recentAssistantTurns,
    );
    fullResponse = repairFounderInventedEmpiricalClaims(
      fullResponse,
      searchResults,
      extractedFacts,
    );
    if (isArithmeticAlphaCollapsedRepair(rawModelStream, fullResponse, userMessage)) {
      arithmeticAlphaRepairApplied = true;
      sanitizedRepairApplied = true;
      onEvent('adam_stream_done', JSON.stringify({
        sessionId:           resolvedSessionId,
        replace:             true,
        sanitizedRepair:     true,
        arithmeticAlphaRepair: true,
        briefTier1Repair:    true,
        response:            fullResponse,
      }));
    } else if (
      fullResponse.trim()
      && fullResponse !== rawModelStream
      && founderOutputHasAddressDrift(rawModelStream)
    ) {
      sanitizedRepairApplied = true;
      onEvent('adam_stream_done', JSON.stringify({
        sessionId:        resolvedSessionId,
        replace:          true,
        sanitizedRepair:  true,
        founderAddressRepair: true,
        response:         fullResponse,
      }));
    }
  } else if (channelId === 'founder-teaching-learner') {
    if (isFounderReplyRevisionDirective(userMessage)) {
      fullResponse = stripFounderTeachingInquiryLeak(fullResponse);
      fullResponse = stripFounderRevisionMetaLoop(fullResponse);
      fullResponse = restoreFounderPaltAddress(fullResponse);
    } else {
    fullResponse = restoreFounderPaltAddress(fullResponse);
    fullResponse = sanitizeFounderTeachingQuranFormat(fullResponse);
    fullResponse = syncSanitizeFounderTeachingOutput(fullResponse);
    const teachingGuardOptions = {
      allowConventionalSynthesis: founderTeachingSynthesis,
    };
    const teachingLeak = detectFounderTeachingOutputLeak(
      fullResponse,
      normalizedMessage,
      teaching.context,
      teachingGuardOptions,
    );
    if (teachingLeak.hasLeak) {
      fullResponse = await repairFounderTeachingOutputLeak(
        fullResponse,
        normalizedMessage,
        teaching.context,
        false,
        teachingGuardOptions,
      );
    }
    if (founderTeachingAbsorption) {
      const beforeInquiry = fullResponse;
      fullResponse = ensureFounderTeachingInquiryClose(
        fullResponse,
        normalizedMessage,
        teaching.context,
      );
      if (
        fullResponse !== beforeInquiry
        && adamTeachingMessageHasInquirySection(fullResponse)
      ) {
        console.log('[adam:founder-teaching-inquiry] sync inquiry close applied', {
          sessionId: resolvedSessionId,
        });
      }
    }
    if (founderTeachingSynthesis) {
      const beforeSynthesis = fullResponse;
      fullResponse = ensureFounderTeachingSynthesisSections(fullResponse);
      if (
        fullResponse !== beforeSynthesis
        && adamTeachingMessageHasSynthesisSection(fullResponse)
      ) {
        console.log('[adam:founder-teaching-synthesis] sync section labels applied', {
          sessionId: resolvedSessionId,
        });
      }
      fullResponse = repairFounderInventedEmpiricalClaims(
        fullResponse,
        searchResults,
        extractedFacts,
      );
    }
    }
    if (
      fullResponse.trim()
      && fullResponse !== rawModelStream
      && (
        /\\frac_/.test(rawModelStream)
        || /\|:\s*-+\s*\|/.test(rawModelStream)
        || /Cikgu guna bahasa mudah/i.test(rawModelStream)
        || founderOutputHasAddressDrift(rawModelStream)
        || /\bSaya\s+tunggu\s+arahan\s+seterusnya\b/i.test(rawModelStream)
      )
    ) {
      sanitizedRepairApplied = true;
      onEvent('adam_stream_done', JSON.stringify({
        sessionId:            resolvedSessionId,
        replace:              true,
        sanitizedRepair:      true,
        founderTeachingRepair: true,
        structurePreserving:  true,
        response:             fullResponse,
      }));
    }
  } else {
    fullResponse = restoreFounderPaltAddress(fullResponse);
  }

  if (!fullResponse?.trim()) {
    console.warn('[adam:stream] empty founder response after stream/repair', {
      sessionId: resolvedSessionId,
      mode,
      channelId,
      upload: teaching.fileNames,
    });
    fullResponse = [
      'Bismillahirahmanirrahim.',
      'P.alt, maaf — pada giliran ini jawapan saya kosong.',
      'Sila hantar semula bab itu.',
    ].join(' ');
  }

  return {
    fullResponse,
    repairMs: Date.now() - repairStarted,
    syncRepairMs: 0,
    sanitizedRepairApplied,
    arithmeticAlphaRepairApplied,
    visualDrawRepairApplied: false,
    proseCraftRepairApplied: false,
    usersGreetingRepairApplied: false,
    technicalMediaRepairApplied: false,
    adamProductRedirectRepairApplied: false,
  };
}
