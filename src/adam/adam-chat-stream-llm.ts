/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — LLM Runner
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

import { isQwenDataInspectionError, llmStream } from '../llm/llm-client';
import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
import { repairEastAsianScriptLeak } from './adam-language-guard';
import {
  buildStudentGreetingFallback,
  isAdamLightChatTurn,
} from './adam-response-generation';
import {
  buildTutorGreetingFallback,
  isAdamTutorMode,
} from './adam-tutor-law';
import {
  applyStudentSurfaceOutputRepair,
  resolveStudentStreamSurface,
} from './adam-student-output-guard';
import {
  sanitizeFounderTeachingQuranFormat,
} from './adam-founder-teaching-prompts';
import { restoreFounderPaltAddress } from './adam-founder-address-guard';
import {
  detectFounderTeachingOutputLeak,
  repairFounderTeachingOutputLeak,
  syncSanitizeFounderTeachingOutput,
} from './adam-founder-teaching-output-guard';
import { repairFormulaXyzStreamOutput } from './adam-book-aware-recall';
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
    onEvent,
  } = input;

  const bufferStreamForPostRepair = false;
  const forceWebSearch = false;

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
}

export async function repairAdamStreamOutput(input: {
  shell: AdamChatTurnShell;
  rawModelStream: string;
  teachingFlags: FounderTeachingFlags;
  recentUserTurns: string[];
  mode: ADAMChatMode;
}): Promise<StreamRepairResult> {
  const {
    shell,
    rawModelStream,
    teachingFlags,
    recentUserTurns,
    mode,
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
  const { founderTeachingSynthesis, founderTeachingLearnerTurn } = teachingFlags;

  const repairStarted = Date.now();
  let syncRepairMs = 0;
  let fullResponse = await repairEastAsianScriptLeak(rawModelStream, userMessage);

  if (isFounder) {
    fullResponse = repairFormulaXyzStreamOutput(fullResponse, userMessage);
    fullResponse = restoreFounderPaltAddress(fullResponse);
  }

  if (!isFounder && isAdamTutorMode(mode)) {
    if (!fullResponse?.trim() && isAdamLightChatTurn(userMessage)) {
      fullResponse = buildTutorGreetingFallback(
        userMessage,
        participant.userName,
        shell.options.tutorProfile,
      );
    }
  } else if (!isFounder) {
    const syncStarted = Date.now();
    let surface = applyStudentSurfaceOutputRepair(
      fullResponse,
      userMessage,
      recentUserTurns,
    );
    syncRepairMs = Date.now() - syncStarted;
    if (!surface.trim() && isAdamLightChatTurn(userMessage)) {
      surface = buildStudentGreetingFallback(userMessage, participant.userName);
    }
    const resolved = resolveStudentStreamSurface(rawModelStream, surface);
    if (resolved.streamReplace) {
      onEvent('adam_stream_done', JSON.stringify({
        sessionId: resolvedSessionId,
        replace:   true,
        response:  resolved.streamReplace,
      }));
    }
    fullResponse = resolved.fullResponse;
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
  };
}
