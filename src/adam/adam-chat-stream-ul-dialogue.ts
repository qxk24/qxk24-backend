/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — UL Dialogue
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { LlmMessage } from '../llm/llm-types';
import type { ADAMChatMode, SSEEventType } from './adam.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { AdamLlmStreamOnceFn } from './adam-chat-stream-llm';
import { isAdamCoachingMode } from './adam-coaching-law';
import { isAdamTutorMode } from './adam-tutor-law';
import { FOUNDER_USER_ID } from './adam-student.types';
import {
  loadDialogueOntologyGraph,
  synthesizeDialogue,
  interceptAndSanitizeStream,
  type DialoguePersona,
} from '../qxk24brain/deep-ul';

export function resolveDialoguePersona(
  shell: AdamChatTurnShell,
  mode: ADAMChatMode,
): DialoguePersona {
  if (shell.isFounder) return 'founder';
  if (isAdamTutorMode(mode)) return 'tutor';
  if (isAdamCoachingMode(mode)) return 'coach';
  return 'student';
}

export function extractContextBlocksFromMessages(messages: LlmMessage[]): string[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .filter((c) => c.trim().length > 0);
}

export async function synthesizeChatReply(input: {
  sessionId:       string;
  userMessage:     string;
  persona:         DialoguePersona;
  contextMessages: LlmMessage[];
  founderId?:      string;
  participantName?: string;
  extractedFacts?: string;
}): Promise<string> {
  const graph = await loadDialogueOntologyGraph(input.founderId ?? FOUNDER_USER_ID);
  const contextBlocks = extractContextBlocksFromMessages(input.contextMessages);

  const response = synthesizeDialogue({
    userMessage:     input.userMessage,
    persona:         input.persona,
    contextBlocks,
    ontologyGraph:   graph,
    extractedFacts:  input.extractedFacts,
    participantName: input.participantName,
  });

  return response.text;
}

export async function streamUlDialogueResponse(input: {
  shell:           AdamChatTurnShell;
  mode:            ADAMChatMode;
  contextMessages: LlmMessage[];
  extractedFacts?: string;
  onEvent:         (event: SSEEventType, data: string) => void;
}): Promise<{ text: string; streamMs: number }> {
  const started = Date.now();
  const persona = resolveDialoguePersona(input.shell, input.mode);
  const rawText = await synthesizeChatReply({
    sessionId:       input.shell.resolvedSessionId,
    userMessage:     input.shell.userMessage,
    persona,
    contextMessages: input.contextMessages,
    founderId:       input.shell.isFounder ? FOUNDER_USER_ID : FOUNDER_USER_ID,
    participantName: input.shell.participant.userName,
    extractedFacts:  input.extractedFacts,
  });
  const text = interceptAndSanitizeStream(rawText);

  const tokens = text.match(/\S+\s*|\s+/g) ?? [text];
  for (const chunk of tokens) {
    if (!chunk) continue;
    const sanitizedChunk = interceptAndSanitizeStream(chunk);
    input.onEvent('adam_chunk', JSON.stringify({ text: sanitizedChunk }));
  }

  input.onEvent(
    'adam_stream_idle',
    JSON.stringify({ sessionId: input.shell.resolvedSessionId }),
  );

  return { text, streamMs: Date.now() - started };
}

export function createAdamUlStreamOnce(input: {
  shell:           AdamChatTurnShell;
  mode:            ADAMChatMode;
  contextMessages: LlmMessage[];
  extractedFacts?: string;
  onEvent:         (event: SSEEventType, data: string) => void;
}): AdamLlmStreamOnceFn {
  return async (messages, _withSearch) => {
    const result = await streamUlDialogueResponse({
      shell:           input.shell,
      mode:            input.mode,
      contextMessages: messages.length > 0 ? messages : input.contextMessages,
      extractedFacts:  input.extractedFacts,
      onEvent:         input.onEvent,
    });

    return {
      text:                  result.text,
      searchUsed:            false,
      searchDroppedByFilter: false,
      searchResults:         [],
    };
  };
}
