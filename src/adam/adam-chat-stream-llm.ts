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

import { synthesizeChatReply } from './adam-chat-stream-ul-dialogue';
import type { AdamMediaSearchHit } from './adam-media-search';
import type { LlmMessage, LlmSearchResult } from '../llm/llm-types';
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
    resolvedSessionId,
    userMessage,
    bufferChunksUntilRepair,
    onEvent,
  } = input;

  const bufferStreamForPostRepair = bufferChunksUntilRepair === true;

  return async (messages, withSearch) => {
    const text = await synthesizeChatReply({
      sessionId:       resolvedSessionId,
      userMessage,
      persona:         'tutor',
      contextMessages: messages,
    });

    if (!bufferStreamForPostRepair) {
      const tokens = text.match(/\S+\s*|\s+/g) ?? [text];
      for (const chunk of tokens) {
        if (chunk) onEvent('adam_chunk', JSON.stringify({ text: chunk }));
      }
    }

    return {
      text,
      searchUsed:            withSearch,
      searchDroppedByFilter: false,
      searchResults:         [],
    };
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
