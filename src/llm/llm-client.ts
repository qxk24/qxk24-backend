/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : LLM Provider Client (Anthropic + Qwen)
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
 *
 * Same A (constitutional prompts + context) — swappable B (engine).
 * Production stack: anthropic. Lab stack: qwen (DashScope compatible-mode).
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages/messages';
import { ENV } from '../config/environments';
import { buildQwenSearchOptions } from '../adam/adam-web-search';
import { extractAnthropicErrorText } from '../adam/adam-context-budget';
import type {
  LlmCompleteParams,
  LlmMessage,
  LlmProvider,
  LlmStreamEventHandler,
  LlmStreamParams,
} from './llm-types';

export { toLlmMessages } from './llm-types';
export type { LlmMessage, LlmProvider };

export function getLlmProvider(): LlmProvider {
  return ENV.QXK24_STACK === 'lab' ? 'qwen' : ENV.LLM_PROVIDER;
}

export function isQwenProvider(): boolean {
  return getLlmProvider() === 'qwen';
}

export function friendlyLlmError(err: unknown): string {
  const msg = extractAnthropicErrorText(err);
  const provider = ENV.LLM_PROVIDER === 'qwen' ? 'DashScope' : 'Anthropic';

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
      `ADAM is paused — teaching credits on the server need to be renewed. ` +
      `Please ask the Founder to top up the ${provider} API account, then try again.`
    );
  }
  if (/internal server error|api_error|502|503/i.test(msg)) {
    return (
      'ADAM hit a temporary server error. Wait a few seconds and send again — ' +
      'your message is already saved.'
    );
  }
  if (/invalid api key|authentication|unauthorized|401/i.test(msg)) {
    return `ADAM engine authentication failed — check ${provider} API key on the server.`;
  }
  if (/DataInspectionFailed|data_inspection_failed|inappropriate content/i.test(msg)) {
    return (
      'QXK24 Lab (Qwen) blocked this turn — Alibaba\'s content safety filter flagged the input. ' +
      'This often happens on turns with web search plus constitutional or metaphorical language (e.g. raja/KING). ' +
      'Try again without asking ADAM to search the web, or rephrase slightly. ' +
      'If this keeps happening, the Founder can request a DashScope content-filter whitelist for the lab API key.'
    );
  }
  return msg.length > 280 ? `${msg.slice(0, 280)}…` : msg;
}

export function isQwenDataInspectionError(err: unknown): boolean {
  const msg = extractAnthropicErrorText(err);
  return /DataInspectionFailed|data_inspection_failed|inappropriate content/i.test(msg);
}

/** @deprecated Use friendlyLlmError — kept for existing imports */
export const friendlyAnthropicError = friendlyLlmError;

// ─── Anthropic ───────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!ENV.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured.');
    }
    anthropicClient = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

async function processAnthropicStream(
  stream: ReturnType<Anthropic['messages']['stream']>,
  onEvent?: LlmStreamEventHandler,
): Promise<string> {
  let searchPartialJson = '';
  let lastSearchQuery = '';

  for await (const event of stream as AsyncIterable<MessageStreamEvent>) {
    if (event.type === 'content_block_start') {
      const block = event.content_block;
      if (block.type === 'server_tool_use' && block.name === 'web_search') {
        searchPartialJson = '';
        const q = extractSearchQueryFromInput(block.input) ?? 'Searching the web…';
        lastSearchQuery = q;
        onEvent?.('adam_searching', JSON.stringify({ query: q }));
      }
      if (block.type === 'web_search_tool_result') {
        onEvent?.('adam_search_done', JSON.stringify({ query: lastSearchQuery }));
        searchPartialJson = '';
      }
    }

    if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
      searchPartialJson += event.delta.partial_json;
      const q = tryParseSearchQueryFromPartialJson(searchPartialJson);
      if (q && q !== lastSearchQuery) {
        lastSearchQuery = q;
        onEvent?.('adam_searching', JSON.stringify({ query: q }));
      }
    }

    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onEvent?.('adam_chunk', JSON.stringify({ text: event.delta.text }));
    }
  }

  return stream.finalText();
}

function extractSearchQueryFromInput(input: unknown): string | null {
  if (!input || typeof input !== 'object') return null;
  const q = (input as { query?: string }).query;
  return typeof q === 'string' && q.trim() ? q.trim() : null;
}

function tryParseSearchQueryFromPartialJson(partial: string): string | null {
  const match = partial.match(/"query"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!match) return null;
  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1].replace(/\\"/g, '"');
  }
}

async function anthropicComplete(params: LlmCompleteParams): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model:      params.model,
    max_tokens: params.maxTokens,
    system:     params.system,
    messages:   params.messages,
  });
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

async function anthropicStream(params: LlmStreamParams): Promise<string> {
  const client = getAnthropicClient();
  const tools = params.enableWebSearch
    ? [{
        type:            'web_search_20250305' as const,
        name:            'web_search' as const,
        max_uses:        5,
        blocked_domains: [] as string[],
      }]
    : [];

  const stream = client.messages.stream({
    model:      params.model,
    max_tokens: params.maxTokens,
    system:     params.system,
    messages:   params.messages,
    tools,
  });

  return processAnthropicStream(stream, params.onEvent);
}

// ─── Qwen (DashScope OpenAI-compatible) ──────────────────────

async function qwenComplete(params: LlmCompleteParams & { enableThinking?: boolean }): Promise<string> {
  const body: Record<string, unknown> = {
    model:            params.model,
    max_tokens:       params.maxTokens,
    enable_thinking:  params.enableThinking ?? false,
    messages:         [
      { role: 'system', content: params.system },
      ...params.messages,
    ],
    stream: false,
  };

  const response = await dashScopeFetch(body);
  const json = await response.json() as {
    choices?: { message?: { content?: string } }[];
    error?:    { message?: string };
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? `DashScope error ${response.status}`);
  }

  return json.choices?.[0]?.message?.content ?? '';
}

async function qwenStream(params: LlmStreamParams): Promise<string> {
  const body: Record<string, unknown> = {
    model:            params.model,
    max_tokens:       params.maxTokens,
    enable_thinking:  params.enableThinking ?? false,
    messages:         [
      { role: 'system', content: params.system },
      ...params.messages,
    ],
    stream: true,
  };

  if (params.enableWebSearch) {
    body.enable_search = true;
    body.search_options = buildQwenSearchOptions();
  }

  const response = await dashScopeFetch(body);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(errJson.error?.message ?? `DashScope stream error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('DashScope returned an empty stream body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let searchAnnounced = false;
  let searchDone = false;

  const finishSearchPhase = () => {
    if (searchAnnounced && !searchDone) {
      params.onEvent?.('adam_search_done', JSON.stringify({ query: '' }));
      searchDone = true;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload) as {
            choices?: { delta?: { content?: string; reasoning_content?: string } }[];
            search_info?: {
              search_results?: { title?: string; url?: string }[];
            };
          };

          const results = parsed.search_info?.search_results;
          if (params.enableWebSearch && results?.length && !searchAnnounced) {
            searchAnnounced = true;
            const title = results[0]?.title?.trim();
            params.onEvent?.(
              'adam_searching',
              JSON.stringify({ query: title || 'Mencari data sebenar…' }),
            );
          }

          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            finishSearchPhase();
            fullText += chunk;
            params.onEvent?.('adam_chunk', JSON.stringify({ text: chunk }));
          }
        } catch {
          // skip malformed SSE line
        }
      }
    }
  } finally {
    finishSearchPhase();
  }

  return fullText;
}

async function dashScopeFetch(body: Record<string, unknown>): Promise<Response> {
  if (!ENV.DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY is not configured.');
  }

  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    Authorization:   `Bearer ${ENV.DASHSCOPE_API_KEY}`,
  };

  const inspection = ENV.QWEN_DATA_INSPECTION.trim();
  if (inspection) {
    headers['X-DashScope-DataInspection'] = inspection;
  }

  const base = ENV.QWEN_API_BASE.replace(/\/$/, '');
  return fetch(`${base}/chat/completions`, {
    method:  'POST',
    headers,
    body: JSON.stringify(body),
  });
}

// ─── Public API ──────────────────────────────────────────────

export async function llmComplete(params: LlmCompleteParams): Promise<string> {
  if (isQwenProvider()) {
    return qwenComplete(params);
  }
  return anthropicComplete(params);
}

export async function llmStream(params: LlmStreamParams): Promise<string> {
  if (isQwenProvider()) {
    return qwenStream(params);
  }
  return anthropicStream(params);
}

export async function llmCompleteUserPrompt(
  system: string,
  userPrompt: string,
  model: string,
  maxTokens = 1500,
): Promise<string> {
  const messages: LlmMessage[] = [{ role: 'user', content: userPrompt }];
  return llmComplete({ system, messages, model, maxTokens });
}

/** Vision — image buffer to teaching text (Anthropic or Qwen-VL). */
export async function llmDescribeImage(params: {
  buffer:       Buffer;
  mediaType:    string;
  fileName:     string;
  prompt:       string;
  model:        string;
  maxTokens?:   number;
}): Promise<string> {
  const { buffer, mediaType, fileName, prompt, model, maxTokens = 4096 } = params;
  const dataUrl = `data:${mediaType};base64,${buffer.toString('base64')}`;

  if (isQwenProvider()) {
    if (!ENV.DASHSCOPE_API_KEY) {
      throw new Error('Image reading requires DASHSCOPE_API_KEY on the server.');
    }
    const base = ENV.QWEN_API_BASE.replace(/\/$/, '');
    const response = await fetch(`${base}/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${ENV.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{
          role:    'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });
    const json = await response.json() as {
      choices?: { message?: { content?: string } }[];
      error?:   { message?: string };
    };
    if (!response.ok) {
      throw new Error(json.error?.message ?? `DashScope vision error ${response.status}`);
    }
    const text = json.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) {
      throw new Error(`Could not read image "${fileName}". Try a clearer JPG or PNG.`);
    }
    return text;
  }

  if (!ENV.ANTHROPIC_API_KEY) {
    throw new Error('Image reading requires ANTHROPIC_API_KEY on the server.');
  }
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{
      role:    'user',
      content: [
        {
          type:   'image',
          source: {
            type:       'base64',
            media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data:       buffer.toString('base64'),
          },
        },
        { type: 'text', text: prompt },
      ],
    }],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!text) {
    throw new Error(`Could not read image "${fileName}". Try a clearer JPG or PNG.`);
  }
  return text;
}

export function assertLlmConfigured(): void {
  if (isQwenProvider()) {
    if (!ENV.DASHSCOPE_API_KEY) {
      console.warn('[QXK24] Lab/Qwen stack but DASHSCOPE_API_KEY is missing.');
    }
    return;
  }
  if (!ENV.ANTHROPIC_API_KEY) {
    console.warn('[QXK24] Production Claude stack but ANTHROPIC_API_KEY is missing.');
  }
}

export function isLlmConfigured(): boolean {
  return isQwenProvider()
    ? Boolean(ENV.DASHSCOPE_API_KEY)
    : Boolean(ENV.ANTHROPIC_API_KEY);
}
