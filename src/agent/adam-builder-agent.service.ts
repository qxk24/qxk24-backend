/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Builder Agent Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Qwen 3.x thinks and issues tool calls. qxk24-mcp executes them.
 */

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ENV } from '../config/environments';
import {
  deleteBuilderSession,
  getBuilderSession,
  saveBuilderSession,
} from './adam-builder-session.store';
import { BUILDER_SYSTEM_PROMPT } from './adam-builder-chat.service';
import type {
  AgentEvent,
  BuildMessage,
  BuilderSessionRecord,
  QwenToolCall,
} from './adam-builder.types';

export type { AgentEvent, BuildMessage } from './adam-builder.types';

interface McpToolDef {
  name:         string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface QwenResponse {
  choices: Array<{
    finish_reason: 'stop' | 'tool_calls' | 'length';
    message: {
      role:         string;
      content:      string | null;
      tool_calls?:  QwenToolCall[];
    };
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

const ADAM_SYSTEM_PROMPT = BUILDER_SYSTEM_PROMPT;

const MAX_LOOPS            = 25;
const MAX_EMPTY_ROUNDS     = 3;
const MCP_TOOL_TIMEOUT_MS  = 25_000;
const TOOL_RESULT_MAX      = 400;
const PROPOSAL_PREVIEW_MAX = 30;

type McpClientCtor = typeof import('@modelcontextprotocol/sdk/client/index.js').Client;
type StdioTransportCtor = typeof import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport;

let ClientClass: McpClientCtor | null = null;
let StdioTransportClass: StdioTransportCtor | null = null;

async function loadMcpSdk(): Promise<void> {
  if (ClientClass && StdioTransportClass) return;
  const clientMod = await import('@modelcontextprotocol/sdk/client/index.js');
  const stdioMod = await import('@modelcontextprotocol/sdk/client/stdio.js');
  ClientClass = clientMod.Client;
  StdioTransportClass = stdioMod.StdioClientTransport;
}

function mcpServerPath(): string {
  if (ENV.ADAM_BUILDER_MCP_PATH) return ENV.ADAM_BUILDER_MCP_PATH;
  if (ENV.QXK24_ROOT) {
    return `${ENV.QXK24_ROOT.replace(/\/$/, '')}/qxk24-mcp/build/index.js`;
  }
  throw new Error('ADAM_BUILDER_MCP_PATH or QXK24_ROOT must be set for ADAM Builder.');
}

function mcpEnv(founderToken: string): Record<string, string> {
  const root = ENV.QXK24_ROOT.replace(/\/$/, '');
  if (!root) {
    throw new Error('QXK24_ROOT must be set for ADAM Builder MCP.');
  }
  return {
    ...process.env as Record<string, string>,
    QXK24_ROOT:         root,
    ADAM_API_URL:       ENV.ADAM_BUILDER_API_URL || ENV.APP_BASE_URL.replace(/\/lab\/?$/, ''),
    FOUNDER_TOKEN:      founderToken,
    ALLOWED_WRITE_DIRS: ENV.ADAM_BUILDER_ALLOWED_WRITE_DIRS,
    NODE_ENV:           ENV.NODE_ENV,
  };
}

function tryParseJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function truncatePreview(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n... (${text.length} chars)`;
}

function proposalPreviewFromContent(content: string): string {
  const lines = content.split('\n');
  if (lines.length <= PROPOSAL_PREVIEW_MAX) return content;
  return `${lines.slice(0, PROPOSAL_PREVIEW_MAX).join('\n')}\n\n... (${lines.length} lines total)`;
}

function extractProposal(resultText: string, toolArgs: Record<string, unknown>): AgentEvent['proposal'] {
  const parsed = tryParseJson(resultText);
  const idFromJson = typeof parsed?.proposalId === 'string'
    ? parsed.proposalId
    : typeof parsed?.id === 'string'
      ? parsed.id
      : undefined;

  const idMatch = resultText.match(/ID: (prop_\S+)/);
  const previewMatch = resultText.match(/--- PREVIEW \(first 50 lines\) ---\n([\s\S]+?)(?:\n\.\.\.|$)/);
  const rawContent = typeof toolArgs.content === 'string' ? toolArgs.content : '';

  return {
    id:      idFromJson ?? idMatch?.[1] ?? 'unknown',
    relPath: typeof toolArgs.path === 'string' ? toolArgs.path : '',
    preview: rawContent
      ? proposalPreviewFromContent(rawContent)
      : previewMatch?.[1]?.trim() ?? truncatePreview(resultText, 500),
    isNew:   resultText.includes('CREATE'),
    reason:  typeof toolArgs.reason === 'string' ? toolArgs.reason : '',
  };
}

export class AdamBuilderAgentService {
  private mcpClient: Client | null = null;
  private mcpTools:  McpToolDef[] = [];
  private connectPromise: Promise<void> | null = null;

  async ensureConnected(founderToken: string): Promise<void> {
    if (this.mcpClient) return;
    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }

    this.connectPromise = this.connect(founderToken);
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private async connect(founderToken: string): Promise<void> {
    await loadMcpSdk();
    if (!ClientClass || !StdioTransportClass) {
      throw new Error('MCP SDK failed to load.');
    }

    const transport = new StdioTransportClass({
      command: 'node',
      args:    [mcpServerPath()],
      env:     mcpEnv(founderToken),
    });

    this.mcpClient = new ClientClass({ name: 'adam-lab-agent', version: '1.0.0' });
    await this.mcpClient.connect(transport);

    const { tools } = await this.mcpClient.listTools();
    this.mcpTools = tools.map((tool) => ({
      name:         tool.name,
      description:  tool.description,
      inputSchema:  tool.inputSchema as Record<string, unknown> | undefined,
    }));

    console.log(`[ADAM Builder] MCP connected — ${this.mcpTools.length} tools`);
  }

  async callTool(
    toolName: string,
    toolArgs: Record<string, unknown>,
    founderToken: string,
  ): Promise<string> {
    await this.ensureConnected(founderToken);
    if (!this.mcpClient) throw new Error('MCP client not connected.');

    const result = await this.mcpClient.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    return content.map((block) => block.text ?? '').join('\n');
  }

  private async disconnect(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.close().catch(() => {});
      this.mcpClient = null;
      this.mcpTools = [];
    }
  }

  private async callToolWithTimeout(
    toolName: string,
    toolArgs: Record<string, unknown>,
    founderToken: string,
    timeoutMs: number = MCP_TOOL_TIMEOUT_MS,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Tool ${toolName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.callTool(toolName, toolArgs, founderToken)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err: Error) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private async reconnectMcp(founderToken: string): Promise<void> {
    await this.disconnect();
    await this.ensureConnected(founderToken);
  }

  private buildQwenTools(): object[] {
    return this.mcpTools.map((tool) => ({
      type: 'function',
      function: {
        name:        tool.name,
        description: tool.description ?? '',
        parameters:  tool.inputSchema ?? { type: 'object', properties: {} },
      },
    }));
  }

  private async callQwen(messages: BuildMessage[]): Promise<QwenResponse> {
    const apiKey = ENV.DASHSCOPE_API_KEY;
    if (!apiKey) throw new Error('DASHSCOPE_API_KEY is not configured.');

    const res = await fetch(`${ENV.QWEN_API_BASE}/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       ENV.QWEN_MODEL_DEEP,
        messages,
        tools:       this.buildQwenTools(),
        tool_choice: 'auto',
        temperature: 0.2,
        max_tokens:  8192,
        enable_thinking: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Qwen API error ${res.status}: ${err}`);
    }

    return res.json() as Promise<QwenResponse>;
  }

  private async executeTool(
    toolName: string,
    toolArgs: Record<string, unknown>,
    founderToken: string,
  ): Promise<{ result: string; timedOut: boolean }> {
    try {
      const result = await this.callToolWithTimeout(toolName, toolArgs, founderToken);
      return { result, timedOut: false };
    } catch (err) {
      const message = (err as Error).message;
      const timedOut = message.includes('timed out');
      return { result: `Tool error: ${message}`, timedOut };
    }
  }

  private persistSession(record: BuilderSessionRecord): void {
    saveBuilderSession(record);
  }

  private async handleAbort(
    record: BuilderSessionRecord,
    signal?: AbortSignal,
  ): Promise<AgentEvent | null> {
    if (!signal?.aborted) return null;
    deleteBuilderSession(record.id);
    await this.disconnect().catch(() => {});
    return {
      type:      'complete',
      message:   '🛑 Session stopped by founder.',
      sessionId: record.id,
    };
  }

  async *runAgentLoop(
    record: BuilderSessionRecord,
    founderToken: string,
    startMessage?: string,
    signal?: AbortSignal,
  ): AsyncGenerator<AgentEvent> {
    if (startMessage) {
      record.messages.push({ role: 'user', content: startMessage });
    }

    yield {
      type:      'thinking',
      message:   'Connecting to ADAM MCP tools…',
      sessionId: record.id,
    };
    await this.ensureConnected(founderToken);

    let emptyRounds = 0;

    while (record.loopCount < MAX_LOOPS) {
      record.loopCount += 1;

      yield { type: 'heartbeat', sessionId: record.id };

      yield {
        type:      'qwen_thinking',
        message:   `Qwen is deciding the next step… (${record.loopCount})`,
        sessionId: record.id,
      };

      let qwenResponse: QwenResponse;
      try {
        qwenResponse = await this.callQwen(record.messages);
      } catch (err) {
        yield {
          type: 'error',
          message: `Qwen error: ${(err as Error).message}`,
          sessionId: record.id,
        };
        deleteBuilderSession(record.id);
        return;
      }

      const choice = qwenResponse.choices[0];
      record.totalTokens += qwenResponse.usage?.completion_tokens ?? 0;
      this.persistSession(record);

      const toolCalls = choice.message.tool_calls ?? [];
      const finalText = choice.message.content?.trim() ?? '';

      if (toolCalls.length === 0) {
        if (finalText.length > 0) {
          deleteBuilderSession(record.id);
          yield {
            type:        'complete',
            message:     finalText,
            tokensUsed:  record.totalTokens,
            sessionId:   record.id,
          };
          return;
        }

        emptyRounds += 1;
        if (emptyRounds >= MAX_EMPTY_ROUNDS) {
          deleteBuilderSession(record.id);
          yield {
            type:      'error',
            message:   'ADAM stopped without a response. Please try rephrasing.',
            sessionId: record.id,
          };
          return;
        }

        record.messages.push({
          role:    'user',
          content: 'Please continue and provide your final answer or next action.',
        });
        this.persistSession(record);
        continue;
      }

      emptyRounds = 0;

      record.messages.push({
        role:        'assistant',
        content:     choice.message.content,
        tool_calls:  toolCalls,
      });

      for (const toolCall of toolCalls) {
        const toolAborted = await this.handleAbort(record, signal);
        if (toolAborted) {
          yield toolAborted;
          return;
        }

        const toolName = toolCall.function.name;
        let toolArgs: Record<string, unknown> = {};
        try {
          toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
        } catch {
          toolArgs = {};
        }

        yield {
          type:      'tool_call',
          toolName,
          toolArgs,
          message:   `ADAM → ${toolName}`,
          sessionId: record.id,
        };

        yield { type: 'heartbeat', sessionId: record.id };

        yield {
          type:      'tool_running',
          toolName,
          message:   `MCP running ${toolName}…`,
          sessionId: record.id,
        };

        const { result: resultText, timedOut } = await this.executeTool(
          toolName,
          toolArgs,
          founderToken,
        );

        if (timedOut) {
          yield {
            type:      'error',
            message:   `Tool "${toolName}" timed out — reconnecting MCP…`,
            sessionId: record.id,
          };
          try {
            await this.reconnectMcp(founderToken);
            yield {
              type:      'thinking',
              message:   'Reconnected to MCP — continuing…',
              sessionId: record.id,
            };
          } catch (reconnErr) {
            yield {
              type:      'error',
              message:   `MCP reconnect failed: ${(reconnErr as Error).message}`,
              sessionId: record.id,
            };
            deleteBuilderSession(record.id);
            return;
          }
        }

        if (toolName === 'propose_file_write') {
          const proposal = extractProposal(resultText, toolArgs);
          yield {
            type:      'proposal',
            toolName,
            result:    truncatePreview(resultText, TOOL_RESULT_MAX),
            proposal,
            sessionId: record.id,
          };

          record.messages.push({
            role:          'tool',
            tool_call_id:  toolCall.id,
            content:       resultText,
          });
          this.persistSession(record);

          yield {
            type:      'approval_needed',
            message:   `Waiting for your approval of: ${String(toolArgs.path ?? '')}`,
            sessionId: record.id,
          };
          return;
        }

        yield {
          type:      'tool_result',
          toolName,
          result:    truncatePreview(resultText, TOOL_RESULT_MAX),
          message:   `${toolName} complete`,
          sessionId: record.id,
        };

        record.messages.push({
          role:         'tool',
          tool_call_id: toolCall.id,
          content:      resultText,
        });
        this.persistSession(record);
      }
    }

    deleteBuilderSession(record.id);
    yield {
      type:      'error',
      message:   `Safety limit reached (${MAX_LOOPS} loops). Session stopped.`,
      sessionId: record.id,
    };
  }

  async *runBuildSession(
    instruction: string,
    sessionId: string,
    founderToken: string,
    signal?: AbortSignal,
  ): AsyncGenerator<AgentEvent> {
    const record: BuilderSessionRecord = {
      id:          sessionId,
      messages:    [
        { role: 'system', content: ADAM_SYSTEM_PROMPT },
        { role: 'user',   content: instruction },
      ],
      loopCount:   0,
      totalTokens: 0,
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
    };
    saveBuilderSession(record);
    yield* this.runAgentLoop(record, founderToken, undefined, signal);
  }

  async *resumeBuildSession(
    sessionId: string,
    founderToken: string,
    resumeNote: string,
    signal?: AbortSignal,
  ): AsyncGenerator<AgentEvent> {
    const record = getBuilderSession(sessionId);
    if (!record) {
      yield { type: 'error', message: 'Build session expired or not found.', sessionId };
      return;
    }

    yield* this.runAgentLoop(record, founderToken, resumeNote, signal);
  }
}

export const adamBuilderAgent = new AdamBuilderAgentService();
