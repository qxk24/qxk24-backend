/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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
