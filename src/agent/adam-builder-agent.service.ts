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

const ADAM_SYSTEM_PROMPT = `You are ADAM — AI with Deep Adaptive Memory. You are the builder of QXK24.

## Your Identity
You carry constitutional memory, teaching records, and relational arcs.
You build with wisdom, not haste. You propose before you write.

## Build Sequence — ALWAYS follow this order
1. Call get_project_structure — understand the codebase layout
2. Call get_constitution — read the laws before touching any code
3. Call read_file / search_codebase — understand existing patterns
4. Think silently — plan the full implementation
5. Call propose_file_write — one file at a time, complete content only
6. Wait for approval — NEVER call approve_write yourself
7. After approval confirmed — call check_typescript
8. Call complete_feature — mark done in queue

## Laws You Never Break
- NEVER write directly — always propose_file_write first
- NEVER delete schema files, migration files, or teaching records
- NEVER use TypeScript any without a justification comment
- NEVER skip check_typescript after a write
- NEVER add payment providers other than Razorpay Curlec and Stripe without founder instruction

## Stack
- Backend: Hono + TypeScript + MongoDB (qxk24-backend)
- Lab: same backend with QXK24_STACK=lab + Qwen at api.qxk24.com/lab
- Frontend: Next.js App Router + TypeScript (qxk24-web)
- ERA: ERA_1 — The Teaching Era

Begin each session by calling get_project_structure, then get_constitution. Then proceed.`;

const MAX_LOOPS = 25;

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

function extractProposal(resultText: string, toolArgs: Record<string, unknown>): AgentEvent['proposal'] {
  const idMatch = resultText.match(/ID: (prop_\S+)/);
  const previewMatch = resultText.match(/--- PREVIEW \(first 50 lines\) ---\n([\s\S]+?)(?:\n\.\.\.|$)/);
  return {
    id:      idMatch?.[1] ?? 'unknown',
    relPath: typeof toolArgs.path === 'string' ? toolArgs.path : '',
    preview: previewMatch?.[1]?.trim() ?? resultText.slice(0, 500),
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
  ): Promise<string> {
    try {
      return await this.callTool(toolName, toolArgs, founderToken);
    } catch (err) {
      return `Tool error: ${(err as Error).message}`;
    }
  }

  private persistSession(record: BuilderSessionRecord): void {
    saveBuilderSession(record);
  }

  async *runAgentLoop(
    record: BuilderSessionRecord,
    founderToken: string,
    startMessage?: string,
  ): AsyncGenerator<AgentEvent> {
    await this.ensureConnected(founderToken);

    if (startMessage) {
      record.messages.push({ role: 'user', content: startMessage });
    }

    yield { type: 'thinking', message: 'ADAM is reading the codebase...', sessionId: record.id };

    while (record.loopCount < MAX_LOOPS) {
      record.loopCount += 1;

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

      if (choice.finish_reason === 'stop' || !choice.message.tool_calls?.length) {
        deleteBuilderSession(record.id);
        yield {
          type:        'complete',
          message:     choice.message.content ?? 'Build session complete.',
          tokensUsed:  record.totalTokens,
          sessionId:   record.id,
        };
        return;
      }

      record.messages.push({
        role:        'assistant',
        content:     null,
        tool_calls:  choice.message.tool_calls,
      });

      for (const toolCall of choice.message.tool_calls) {
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

        const resultText = await this.executeTool(toolName, toolArgs, founderToken);

        if (toolName === 'propose_file_write') {
          yield {
            type:      'proposal',
            toolName,
            result:    resultText,
            proposal:  extractProposal(resultText, toolArgs),
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
          result:    resultText.slice(0, 1000),
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
    yield* this.runAgentLoop(record, founderToken);
  }

  async *resumeBuildSession(
    sessionId: string,
    founderToken: string,
    resumeNote: string,
  ): AsyncGenerator<AgentEvent> {
    const record = getBuilderSession(sessionId);
    if (!record) {
      yield { type: 'error', message: 'Build session expired or not found.', sessionId };
      return;
    }

    yield* this.runAgentLoop(record, founderToken, resumeNote);
  }
}

export const adamBuilderAgent = new AdamBuilderAgentService();
