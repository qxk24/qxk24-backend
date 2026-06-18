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
import type { AdamMediaSearchHit } from './adam-media-search';
import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
import { shouldForceWebSearchForGateReason } from './adam-web-search';
import { resolveAdamChannel, isFounderChannel, type AdamResolvedChannel } from './adam-channel-router';
import { repairFounderStreamOutput } from './adam-founder-stream-repair';
import { repairUsersStreamOutput } from './adam-users-stream-repair';
import type { AdamAnswerPlan } from './adam-answer-plan';
import type { AdamTurnGateDecision } from './turn-gate/adam-turn-gate.types';
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
  /** Prose-craft — Hai/asterisk/faith strip replaces streamed essay opener. */
  proseCraftRepairApplied: boolean;
  /** Hai + name prepended — stream UI must replace raw chunks. */
  usersGreetingRepairApplied: boolean;
  /** Image/video/diagram tags injected or repaired after stream. */
  technicalMediaRepairApplied: boolean;
  /** Users channel — Layer 2 product-server redirect stripped from stream. */
  adamProductRedirectRepairApplied: boolean;
}

export async function repairAdamStreamOutput(input: {
  shell: AdamChatTurnShell;
  rawModelStream: string;
  teachingFlags: FounderTeachingFlags;
  recentUserTurns: string[];
  recentAssistantTurns?: string[];
  mode: ADAMChatMode;
  channel?: AdamResolvedChannel;
  answerPlan?: AdamAnswerPlan;
  turnGate?: AdamTurnGateDecision;
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
    channel: inputChannel,
    answerPlan,
    turnGate,
  } = input;

  const channel = inputChannel ?? resolveAdamChannel({
    isFounder: shell.isFounder,
    mode,
    userMessage: shell.userMessage,
    teachingFlags,
  });

  if (isFounderChannel(channel)) {
    return repairFounderStreamOutput({
      shell,
      rawModelStream,
      teachingFlags,
      recentUserTurns,
      recentAssistantTurns,
      channelId: channel.channelId as 'founder-journal' | 'founder-teaching-learner' | 'founder-command',
      mode,
      searchResults: input.searchResults,
      extractedFacts: input.extractedFacts,
    });
  }

  return repairUsersStreamOutput({
    shell,
    rawModelStream,
    channel,
    recentUserTurns,
    recentAssistantTurns,
    mode,
    answerPlan,
    turnGate: input.turnGate,
  });
}
