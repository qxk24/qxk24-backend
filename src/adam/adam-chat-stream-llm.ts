/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — LLM Runner
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

import { isQwenDataInspectionError, llmStream } from '../llm/llm-client';
import { repairTechnicalDiagramOutput } from './adam-technical-diagram-guard';
import { repairAdamMediaOutput, outputHasAdamChatMedia } from './adam-media-guard';
import {
  isAdamMediaSearchTurn,
  type AdamMediaSearchHit,
} from './adam-media-search';
import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
import {
  isAdamCurrentAffairsTurn,
  isVerifiedDataStatAsk,
  shouldForceWebSearchForGateReason,
} from './adam-web-search';
import { repairEastAsianScriptLeak } from './adam-language-guard';
import {
  buildStudentGreetingFallback,
  isAdamLightChatTurn,
  isAdamSimpleFactualTurn,
  isAdamSimpleArithmeticTurn,
  isAdamHistoricalBiographyTurn,
  isAdamScienceNatureSynthesisTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  isAdamVisualDrawTurn,
} from './adam-response-generation';
import { isArithmeticAlphaCollapsedRepair } from './adam-arithmetic-alpha-guard';
import { isVisualDrawCollapsedRepair } from './adam-visual-draw-guard';
import { ensureStudentHaiGreeting, isStudentGreetingOnlyRepair } from './adam-student-constitution';
import {
  buildTutorGreetingFallback,
  isAdamTutorMode,
  repairTutorMalaySessionLanguage,
} from './adam-tutor-law';
import {
  applyStudentSurfaceOutputRepair,
  resolveStudentStreamSurface,
  studentStreamBodyWasGutted,
} from './adam-student-output-guard';
import {
  outputHasKonvensionalFrameworkLeak,
  outputHasMediaRefusal,
} from './adam-student-output-law';
import { alphaStatPersistedStreamBody } from './adam-stat-stream-preserve';
import { outputHasScannableListStructure } from './adam-student-output-law';
import {
  sanitizeFounderTeachingQuranFormat,
} from './adam-founder-teaching-prompts';
import { restoreFounderPaltAddress } from './adam-founder-address-guard';
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
import { repairStaleOfficeHolderOutput } from './adam-current-affairs';
import { repairFormulaXyzStreamOutput } from './adam-book-aware-recall';
import { stripMisplacedPracticalCareerDoor } from './adam-universal-scholar';
import type { ResolvedAdamModel } from '../config/llm-models';
import type { ADAMChatMode, SSEEventType } from './adam.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { FounderTeachingFlags } from './adam-chat-stream-turn-context';

export interface LlmStreamOnceResult {
  text: string;
  searchUsed: boolean;
  searchDroppedByFilter: boolean;
  searchResults: LlmSearchResult[];
}

export type AdamLlmStreamOnceFn = (
  messages: LlmMessage[],
  withSearch: boolean,
) => Promise<LlmStreamOnceResult>;

export function createAdamLlmStreamOnce(input: {
  modelChoice: ResolvedAdamModel;
  maxTokens: number;
  systemPrompt: string;
  enableThinking: boolean;
  resolvedSessionId: string;
  userMessage: string;
  precisionActive: boolean;
  webSearchGateReason?: string | null;
  bufferChunksUntilRepair?: boolean;
  onEvent: (event: SSEEventType, data: string) => void;
}): AdamLlmStreamOnceFn {
  const {
    modelChoice,
    maxTokens,
    systemPrompt,
    enableThinking,
    resolvedSessionId,
    userMessage,
    precisionActive,
    webSearchGateReason,
    bufferChunksUntilRepair,
    onEvent,
  } = input;

  const bufferStreamForPostRepair = bufferChunksUntilRepair === true;
  const forceWebSearch = shouldForceWebSearchForGateReason(webSearchGateReason ?? null);

  return async (messages, withSearch) => {
    const callStream = (search: boolean) =>
      llmStream({
        model:           modelChoice.model,
        maxTokens,
        system:          systemPrompt,
        messages,
        enableWebSearch: search,
        forceWebSearch:  search && forceWebSearch,
        enableThinking,
        searchDisplayQuery: userMessage.trim().slice(0, 120) || 'Mencari data sebenar…',
        onEvent:         (event, data) => {
          if (bufferStreamForPostRepair && event === 'adam_chunk') return;
          onEvent(event as SSEEventType, data);
        },
      });

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await callStream(withSearch);
        return {
          text:                  result.text,
          searchUsed:            withSearch,
          searchDroppedByFilter: false,
          searchResults:         result.searchResults,
        };
      } catch (streamErr: unknown) {
        if (withSearch && isQwenDataInspectionError(streamErr)) {
          console.warn('[adam:qwen-filter] content filter with web search — retrying without search', {
            sessionId:     resolvedSessionId,
            preview:         userMessage.slice(0, 80),
            technicalTurn: precisionActive,
          });
          onEvent(
            'adam_search_unavailable',
            JSON.stringify({
              sessionId: resolvedSessionId,
              reason:    'content_filter',
              message:   'Carian web tidak tersedia pada giliran ini. ADAM akan menjawab tanpa data carian.',
            }),
          );
          const result = await callStream(false);
          return {
            text:                  result.text,
            searchUsed:            false,
            searchDroppedByFilter: true,
            searchResults:         [],
          };
        }

        const errText = streamErr instanceof Error ? streamErr.message : String(streamErr);
        const retryable = /internal server error|overloaded|529|503|api_error/i.test(errText);
        if (!retryable || attempt === maxAttempts) throw streamErr;
        await new Promise((r) => setTimeout(r, 700 * attempt));
      }
    }
    throw new Error('ADAM stream failed after retries.');
  };
}

export interface StreamRepairResult {
  fullResponse: string;
  repairMs: number;
  syncRepairMs: number;
  /** Post-stream guard replaced stale model output (current affairs / practical advisory). */
  sanitizedRepairApplied: boolean;
  /** α arithmetic allowlist collapse — short L1 answer + close replaces long stream. */
  arithmeticAlphaRepairApplied: boolean;
  /** Visual draw canonical ASCII shapes replace long geometry essay stream. */
  visualDrawRepairApplied: boolean;
  /** Hai + name prepended — stream UI must replace raw chunks. */
  studentGreetingRepairApplied: boolean;
}

export async function repairAdamStreamOutput(input: {
  shell: AdamChatTurnShell;
  rawModelStream: string;
  teachingFlags: FounderTeachingFlags;
  recentUserTurns: string[];
  recentAssistantTurns?: string[];
  mode: ADAMChatMode;
  searchResults?: LlmSearchResult[];
  searchUsed?: boolean;
  searchDroppedByFilter?: boolean;
  extractedFacts?: string;
  mediaHits?: AdamMediaSearchHit[];
}): Promise<StreamRepairResult> {
  const {
    shell,
    rawModelStream,
    teachingFlags,
    recentUserTurns,
    recentAssistantTurns = [],
    mode,
    searchResults = [],
    searchUsed = false,
    searchDroppedByFilter = false,
    extractedFacts = '',
    mediaHits = [],
  } = input;
  const {
    isFounder,
    userMessage,
    normalizedMessage,
    teaching,
    participant,
    resolvedSessionId,
    onEvent,
  } = shell;
  const { founderTeachingSynthesis, founderTeachingAbsorption, founderTeachingLearnerTurn } = teachingFlags;

  const repairStarted = Date.now();
  let syncRepairMs = 0;
  let sanitizedRepairApplied = false;
  let arithmeticAlphaRepairApplied = false;
  let visualDrawRepairApplied = false;
  let studentGreetingRepairApplied = false;
  let fullResponse = await repairEastAsianScriptLeak(rawModelStream, userMessage);

  if (isFounder) {
    if (!founderTeachingLearnerTurn) {
      fullResponse = repairFormulaXyzStreamOutput(fullResponse, userMessage);
      fullResponse = stripMisplacedPracticalCareerDoor(
        fullResponse,
        userMessage,
        recentUserTurns,
      );
    }
    fullResponse = restoreFounderPaltAddress(fullResponse);
    if (!founderTeachingLearnerTurn) {
      fullResponse = repairStaleOfficeHolderOutput(fullResponse, userMessage);
      if (
        isAdamSimpleFactualTurn(userMessage)
        || isAdamSimpleArithmeticTurn(userMessage)
        || isAdamHistoricalBiographyTurn(userMessage)
        || isAdamScienceNatureSynthesisTurn(userMessage)
        || isAdamVisualDrawTurn(userMessage)
      ) {
        fullResponse = applyStudentSurfaceOutputRepair(
          fullResponse,
          userMessage,
          recentUserTurns,
          recentAssistantTurns,
          participant.userName,
        );
      }
    }
    if (
      !founderTeachingLearnerTurn
      && !isAdamLightChatTurn(userMessage)
      && !isAdamVisualDrawTurn(userMessage)
      && fullResponse?.trim()
    ) {
      const greeted = ensureStudentHaiGreeting(fullResponse, participant.userName);
      if (greeted !== fullResponse.trim()) {
        fullResponse = greeted;
      }
    }
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
    }
  }

  if (!isFounder && isAdamTutorMode(mode)) {
    if (!fullResponse?.trim() && isAdamLightChatTurn(userMessage)) {
      fullResponse = buildTutorGreetingFallback(
        userMessage,
        participant.userName,
        shell.options.tutorProfile,
      );
    } else if (fullResponse?.trim()) {
      const tutorLangStarted = Date.now();
      fullResponse = await repairTutorMalaySessionLanguage(
        fullResponse,
        shell.options.tutorProfile,
      );
      syncRepairMs = Date.now() - tutorLangStarted;
    }
  } else if (!isFounder) {
    const syncStarted = Date.now();
    const alphaStatTurn = isVerifiedDataStatAsk(userMessage);

    if (alphaStatTurn) {
      fullResponse = alphaStatPersistedStreamBody(rawModelStream);
      syncRepairMs = Date.now() - syncStarted;
    } else {
      let surface = applyStudentSurfaceOutputRepair(
        fullResponse,
        userMessage,
        recentUserTurns,
        recentAssistantTurns,
        participant.userName,
        true,
      );
      syncRepairMs = Date.now() - syncStarted;
      if (!surface.trim() && isAdamLightChatTurn(userMessage)) {
        surface = buildStudentGreetingFallback(userMessage, participant.userName);
      }
      const preferSanitized = isAdamCurrentAffairsTurn(userMessage);
      const forceSanitized = isAdamTechnicalKonvensionalDisplayTurn(userMessage)
        && (
          outputHasKonvensionalFrameworkLeak(rawModelStream)
          || outputHasMediaRefusal(rawModelStream)
        );
      const streamGutted = studentStreamBodyWasGutted(rawModelStream, surface, userMessage);
      if (streamGutted) {
        fullResponse = alphaStatPersistedStreamBody(rawModelStream);
      } else {
        const resolved = resolveStudentStreamSurface(rawModelStream, surface, {
          preferSanitized,
          forceSanitized,
          preserveStreamBody: false,
          userMessage,
        });
        if (isArithmeticAlphaCollapsedRepair(rawModelStream, resolved.fullResponse, userMessage)) {
          arithmeticAlphaRepairApplied = true;
          sanitizedRepairApplied = true;
        }
        if (isVisualDrawCollapsedRepair(rawModelStream, resolved.fullResponse, userMessage)) {
          visualDrawRepairApplied = true;
          sanitizedRepairApplied = true;
        }
        if (forceSanitized && resolved.streamReplace) {
          sanitizedRepairApplied = true;
        }
        const structurePreservingReplace = Boolean(
          resolved.streamReplace
          && preferSanitized
          && (
            !outputHasScannableListStructure(rawModelStream)
            || outputHasScannableListStructure(resolved.fullResponse)
          ),
        );
        const arithmeticReplace = Boolean(resolved.streamReplace && arithmeticAlphaRepairApplied);
        const visualDrawReplace = Boolean(resolved.streamReplace && visualDrawRepairApplied);
        const technicalRepairReplace = Boolean(resolved.streamReplace && forceSanitized);
        if (structurePreservingReplace || arithmeticReplace || visualDrawReplace || technicalRepairReplace) {
          sanitizedRepairApplied = true;
          onEvent('adam_stream_done', JSON.stringify({
            sessionId:           resolvedSessionId,
            replace:               true,
            sanitizedRepair:       true,
            arithmeticAlphaRepair: arithmeticReplace,
            visualDrawRepair:      visualDrawReplace,
            technicalMediaRepair: technicalRepairReplace,
            briefTier1Repair:      arithmeticReplace || visualDrawReplace || technicalRepairReplace,
            structurePreserving:   structurePreservingReplace,
            response:              resolved.streamReplace,
          }));
        }
        fullResponse = resolved.fullResponse;
      }
    }
  } else if (founderTeachingLearnerTurn) {
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
    }
  }

  if (
    !founderTeachingLearnerTurn
    && !isAdamTutorMode(mode)
    && !isAdamLightChatTurn(userMessage)
    && fullResponse?.trim()
    && isStudentGreetingOnlyRepair(rawModelStream, fullResponse)
    && !arithmeticAlphaRepairApplied
    && !visualDrawRepairApplied
  ) {
    studentGreetingRepairApplied = true;
    sanitizedRepairApplied = true;
    onEvent('adam_stream_done', JSON.stringify({
      sessionId:             resolvedSessionId,
      replace:               true,
      sanitizedRepair:       true,
      studentGreetingRepair: true,
      response:              fullResponse,
    }));
  }

  if (!isFounder && isAdamMediaSearchTurn(userMessage) && fullResponse?.trim()) {
    const hits = mediaHits;
    if (hits.length > 0) {
      const bodyBeforeMedia = fullResponse;
      fullResponse = repairAdamMediaOutput(fullResponse, userMessage, hits);
      if (isAdamTechnicalKonvensionalDisplayTurn(userMessage)) {
        fullResponse = repairTechnicalDiagramOutput(fullResponse, userMessage);
      }
      if (
        fullResponse !== bodyBeforeMedia
        && (outputHasAdamChatMedia(fullResponse) || sanitizedRepairApplied)
      ) {
        onEvent('adam_stream_done', JSON.stringify({
          sessionId:           resolvedSessionId,
          replace:             true,
          sanitizedRepair:     true,
          technicalMediaRepair: true,
          briefTier1Repair:    true,
          response:            fullResponse,
        }));
        sanitizedRepairApplied = true;
      }
    }
  }

  if (!fullResponse?.trim()) {
    if (isFounder) {
      console.warn('[adam:stream] empty founder response after stream/repair', {
        sessionId: resolvedSessionId,
        mode,
        upload: teaching.fileNames,
      });
      fullResponse = [
        'Bismillahirahmanirrahim.',
        'P.alt, maaf — pada giliran ini jawapan saya kosong.',
        'Sila hantar semula bab itu.',
      ].join(' ');
    } else if (isAdamLightChatTurn(userMessage)) {
      fullResponse = buildStudentGreetingFallback(userMessage, participant.userName);
    } else {
      console.warn('[adam:stream] empty student response after stream/repair', {
        sessionId: resolvedSessionId,
        mode,
      });
    }
  }

  return {
    fullResponse,
    repairMs: Date.now() - repairStarted,
    syncRepairMs,
    sanitizedRepairApplied,
    arithmeticAlphaRepairApplied,
    visualDrawRepairApplied,
    studentGreetingRepairApplied,
  };
}
