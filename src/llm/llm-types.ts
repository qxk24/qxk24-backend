/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : LLM Provider Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type Anthropic from '@anthropic-ai/sdk';

export type LlmProvider = 'anthropic' | 'qwen';

export interface LlmMessage {
  role:    'user' | 'assistant';
  content: string;
}

export type LlmStreamEventHandler = (event: string, data: string) => void;

export interface LlmCompleteParams {
  system:    string;
  messages:  LlmMessage[];
  model:     string;
  maxTokens: number;
}

export interface LlmStreamParams extends LlmCompleteParams {
  enableWebSearch?:  boolean;
  enableThinking?:   boolean;
  onEvent?:          LlmStreamEventHandler;
}

/** Normalize Anthropic message params (string content only after coalesce). */
export function toLlmMessages(messages: Anthropic.MessageParam[]): LlmMessage[] {
  return messages.map((msg) => {
    const content =
      typeof msg.content === 'string'
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content
              .map((p) => ('text' in p && typeof p.text === 'string' ? p.text : ''))
              .filter(Boolean)
              .join('\n')
          : String(msg.content ?? '');

    return { role: msg.role as 'user' | 'assistant', content };
  });
}
