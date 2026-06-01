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

export type LlmProvider = 'qwen';

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

/** Pass-through after coalesce — kept for call-site stability. */
export function toLlmMessages(messages: LlmMessage[]): LlmMessage[] {
  return messages;
}
