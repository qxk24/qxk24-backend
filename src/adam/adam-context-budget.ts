/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Context Budget
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import type { LlmMessage } from '../llm/llm-types';

/** Strict user/assistant alternation (after system). */
export function coalesceLlmMessages(messages: LlmMessage[]): LlmMessage[] {
  const out: LlmMessage[] = [];

  for (const msg of messages) {
    const content = msg.content.trim();
    const last = out[out.length - 1];
    if (last && last.role === msg.role) {
      last.content = `${last.content}\n\n${content}`.trim();
    } else {
      out.push({ role: msg.role, content });
    }
  }

  if (out.length > 0 && out[0].role === 'assistant') {
    out.unshift({ role: 'user', content: '(Continuing this session.)' });
  }

  return out;
}

/** @deprecated Use coalesceLlmMessages */
export const coalesceAnthropicMessages = coalesceLlmMessages;

export function extractLlmErrorText(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as {
      message?: string;
      error?: { message?: string; type?: string };
    };
    if (typeof e.error?.message === 'string') return e.error.message;
    if (typeof e.message === 'string') return e.message;
  }
  return err instanceof Error ? err.message : String(err);
}

/** @deprecated Use extractLlmErrorText */
export const extractAnthropicErrorText = extractLlmErrorText;

export function truncateForAdam(
  text: string,
  maxChars: number,
  label = 'content',
): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const note =
    `\n\n[… ${label} shortened so ADAM can respond this turn ` +
    `(${trimmed.length.toLocaleString()} → ~${maxChars.toLocaleString()} characters) …]`;
  const keep = Math.max(500, maxChars - note.length);
  return trimmed.slice(0, keep) + note;
}

export function normalizeUserMessage(message: string): string {
  return truncateForAdam(message, ENV.ADAM_MAX_MESSAGE_CHARS, 'your message');
}

export function friendlyAnthropicError(err: unknown): string {
  const msg = extractLlmErrorText(err);

  if (/context|token|too long|request size|maximum|alternat/i.test(msg)) {
    return (
      'This turn is too large for ADAM to process at once. ' +
      'Send a shorter message, attach fewer or smaller files, or split the teaching across multiple messages.'
    );
  }
  if (/timeout|timed out|ETIMEDOUT|aborted/i.test(msg)) {
    return 'ADAM timed out — often caused by very long text or large images. Try again with less content.';
  }
  if (/overloaded|529|rate/i.test(msg)) {
    return 'ADAM is temporarily overloaded. Please wait a moment and try again.';
  }
  if (/credit balance|purchase credits|billing|insufficient.*credit|quota|balance/i.test(msg)) {
    return (
      'ADAM is paused — teaching credits on the server need to be renewed. ' +
      'Please ask the Founder to top up the DashScope API account, then try again.'
    );
  }
  if (/internal server error|api_error|502|503/i.test(msg)) {
    return (
      'ADAM hit a temporary server error. Wait a few seconds and send again — ' +
      'your message is already saved.'
    );
  }
  return msg.length > 280 ? `${msg.slice(0, 280)}…` : msg;
}
