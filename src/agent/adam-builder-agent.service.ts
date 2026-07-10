/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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
import { planBuilderStep } from '../qxk24brain/deep-ul/builder-agent-ul';
import {
  deleteBuilderSession,
  getBuilderSession,
  saveBuilderSession,
} from './adam-builder-session.store';
import { BUILDER_SYSTEM_PROMPT } from './adam-builder-chat.service';
import {
  buildStickyConstitutionBlock,
  hasStickyConstitution,
  loadAdamRulesFromDisk,
} from './adam-constitution-loader';
import {
  abortBuilderSession,
} from './adam-builder-abort.store';
import {
  auditPostTool,
  auditProposeWrite,
  hawaUserMessage,
  isHawaEnabled,
} from '../hawa/hawa-audit.service';
import { hawaPrepareProposedContent } from '../hawa/hawa-preflight';
import { runHawaTierB } from '../hawa/hawa-tier-b.service';
import { clearHawaHold, markHawaHold } from '../hawa/hawa-hold.store';
import type { HawaVerdict } from '../hawa/hawa.types';
import { isMacBridgeRoutingActive } from '../adam/adam-mac-bridge-settings.service';
import {
  callToolViaMacBridge,
  getMacBridgeTools,
  isMacBridgeConnected,
} from './mac-bridge.store';
import type {
  AgentEvent,
  BuildMessage,
  BuilderSessionRecord,
  HawaVerdictPayload,
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
const MCP_TOOL_TIMEOUT_MS            = 25_000;
const MCP_TOOL_TIMEOUT_MAC_MS        = 120_000;
const MCP_TOOL_TIMEOUT_MAC_LIST_MS   = 120_000;
const TOOL_RESULT_MAX      = 400;
const CONSTITUTION_RESULT_MAX = 16_000;
const PROPOSAL_PREVIEW_MAX = 30;

/** ADAM must not call these — only founder HTTP approve / reject routes. */
const FOUNDER_ONLY_MCP_TOOLS = new Set([
  'approve_write',
  'approve_all_writes',
  'reject_write',
]);

function toolResultForUi(
  toolName: string,
  toolArgs: Record<string, unknown>,
  resultText: string,
): string {
  const relPath = typeof toolArgs.path === 'string' ? toolArgs.path : '';
  if (toolName === 'get_constitution') {
    return truncatePreview(resultText, CONSTITUTION_RESULT_MAX);
  }
  if (toolName === 'read_file' && relPath.includes('.adamrules')) {
    return truncatePreview(resultText, CONSTITUTION_RESULT_MAX);
  }
  return truncatePreview(resultText, TOOL_RESULT_MAX);
}

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
    ADAM_GIT_HOME:      ENV.ADAM_GIT_HOME,
    ADAM_GIT_SSH_KEY:   ENV.ADAM_GIT_SSH_KEY,
    HOME:               ENV.ADAM_GIT_HOME || process.env.HOME || '/root',
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

function isPreflightBlocked(resultText: string): boolean {
  const parsed = tryParseJson(resultText);
  return parsed?.blocked === true;
}

function isSuccessfulWriteProposal(resultText: string): boolean {
  return resultText.includes('📋 WRITE PROPOSAL') && /ID: prop_/.test(resultText);
}

function isMacBridgePathArg(value: unknown): boolean {
  return typeof value === 'string' && (value.startsWith('mac:') || value.startsWith('@mac/'));
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

function toHawaPayload(verdict: HawaVerdict): HawaVerdictPayload {
  return {
    judgment:   verdict.judgment,
    findings:   verdict.findings,
    stop:       verdict.stop,
    checkpoint: verdict.checkpoint,
    toolName:   verdict.toolName,
    relPath:    verdict.relPath,
    tier:       verdict.tier,
  };
}

function mergeTierVerdicts(tierA: HawaVerdict, tierB: HawaVerdict): HawaVerdict {
  if (tierA.judgment === 'GAGAL' || tierB.judgment === 'GAGAL') {
    return {
      ...tierB,
      judgment: 'GAGAL',
      findings: [...tierA.findings, ...tierB.findings],
      stop:     true,
      tier:     'A+B',
    };
  }
  if (tierA.judgment === 'ISLAH' || tierB.judgment === 'ISLAH') {
    return {
      ...tierB,
      judgment: 'ISLAH',
      findings: [...tierA.findings, ...tierB.findings],
      stop:     false,
      tier:     'A+B',
    };
  }
  return {
    ...tierB,
    judgment: 'LULUS',
    findings: [],
    stop:     false,
    tier:     'A+B',
  };
}

async function* yieldHawaFinal(
  record: BuilderSessionRecord,
  verdict: HawaVerdict,
): AsyncGenerator<AgentEvent, HawaVerdict> {
  if (verdict.judgment === 'LULUS') {
    yield {
      type:      'hawa_lulus',
      message:   hawaUserMessage(verdict),
      sessionId: record.id,
      hawa:      toHawaPayload(verdict),
    };
    return verdict;
  }

  if (verdict.judgment === 'ISLAH' && !verdict.stop) {
    yield {
      type:      'hawa_hold',
      message:   hawaUserMessage(verdict),
      sessionId: record.id,
      hawa:      toHawaPayload(verdict),
    };
    return verdict;
  }

  markHawaHold(record.id, verdict);
  abortBuilderSession(record.id);

  yield {
    type:      'hawa_veto',
    message:   hawaUserMessage(verdict),
    sessionId: record.id,
    hawa:      toHawaPayload(verdict),
  };

  record.messages.push({
    role:    'user',
    content: [
      'HAWA (constitutional auditor) halted this build.',
      hawaUserMessage(verdict),
      'Founder may resume after review. Correct violations before continuing.',
    ].join('\n\n'),
  });
  saveBuilderSession(record);

  return verdict;
}

async function* yieldHawaProposeReview(
  record: BuilderSessionRecord,
  toolArgs: Record<string, unknown>,
  resultText: string,
): AsyncGenerator<AgentEvent, HawaVerdict | null> {
  const relPath = typeof toolArgs.path === 'string' ? toolArgs.path : '';
  const rawContent = typeof toolArgs.content === 'string' ? toolArgs.content : '';
  const reason  = typeof toolArgs.reason === 'string' ? toolArgs.reason : '';
  const content = rawContent.trim()
    ? hawaPrepareProposedContent(rawContent, relPath).content
    : rawContent;

  yield {
    type:      'thinking',
    message:   'HAWA Tier A — constitutional pre-flight…',
    sessionId: record.id,
    toolName:  'hawa_audit',
  };

  const tierA = auditProposeWrite(toolArgs, resultText);
  const tierAVerdict: HawaVerdict = { ...tierA, tier: 'A' };

  yield {
    type:      'hawa_checkpoint',
    message:   `HAWA Tier A: ${tierA.judgment}`,
    sessionId: record.id,
    hawa:      toHawaPayload(tierAVerdict),
  };

  if (tierA.judgment === 'GAGAL' && tierA.stop) {
    if (tierA.findings.length) {
      yield {
        type:      'thinking',
        message:   `HAWA GAGAL (Tier A) — ${tierA.findings.join(' | ')}`,
        sessionId: record.id,
        toolName:  'hawa_audit',
      };
    }
    return yield* yieldHawaFinal(record, tierAVerdict);
  }

  if (tierA.judgment === 'ISLAH' && tierA.findings.length) {
    yield {
      type:      'thinking',
      message:   `HAWA ISLAH (Tier A) — ${tierA.findings.join(' | ')}`,
      sessionId: record.id,
      toolName:  'hawa_audit',
    };
  }

  yield {
    type:      'thinking',
    message:   'HAWA Tier B — semantic audit running…',
    sessionId: record.id,
    toolName:  'hawa_audit',
  };

  const tierBResult = await runHawaTierB(content, relPath, reason);
  const tierBVerdict: HawaVerdict = {
    judgment:   tierBResult.judgment,
    findings:   tierBResult.findings,
    stop:       tierBResult.judgment === 'GAGAL',
    checkpoint: 'propose_write',
    toolName:   'propose_file_write',
    relPath,
    tier:       'B',
  };

  yield {
    type:      'hawa_checkpoint',
    message:   `HAWA Tier B: ${tierBResult.judgment}`,
    sessionId: record.id,
    hawa:      toHawaPayload(tierBVerdict),
  };

  if (tierBResult.judgment === 'GAGAL') {
    yield {
      type:      'thinking',
      message:   `HAWA GAGAL (Tier B) — ${tierBResult.findings.join(' | ')}`,
      sessionId: record.id,
      toolName:  'hawa_audit',
    };
    return yield* yieldHawaFinal(record, mergeTierVerdicts(tierAVerdict, tierBVerdict));
  }

  if (tierBResult.judgment === 'ISLAH' && tierBResult.findings.length) {
    yield {
      type:      'thinking',
      message:   `HAWA ISLAH (Tier B) — ${tierBResult.findings.join(' | ')}`,
      sessionId: record.id,
      toolName:  'hawa_audit',
    };
  }

  if (tierBResult.judgment === 'LULUS') {
    yield {
      type:      'thinking',
      message:   'HAWA LULUS (Tier A+B) — proposal may proceed to founder LULUS',
      sessionId: record.id,
      toolName:  'hawa_audit',
    };
  }

  const combined = mergeTierVerdicts(tierAVerdict, tierBVerdict);
  return yield* yieldHawaFinal(record, combined);
}

async function* yieldHawaReview(
  record: BuilderSessionRecord,
  toolName: string,
  toolArgs: Record<string, unknown>,
  resultText: string,
  checkpoint: 'propose_write' | 'post_tool',
): AsyncGenerator<AgentEvent, HawaVerdict | null> {
  if (!isHawaEnabled()) return null;

  if (checkpoint === 'propose_write') {
    return yield* yieldHawaProposeReview(record, toolArgs, resultText);
  }

  const postVerdict = auditPostTool(toolName, toolArgs, resultText);

  yield {
    type:      'hawa_checkpoint',
    message:   `HAWA is auditing ${toolName}…`,
    sessionId: record.id,
    hawa:      toHawaPayload(postVerdict),
  };

  return yield* yieldHawaFinal(record, postVerdict);
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
  private bridgeUserId = 'masa-bayu';
  private bridgeIsFounder = true;

  private async resolveMcpToolTimeoutMs(
    toolName: string,
    toolArgs: Record<string, unknown>,
  ): Promise<number> {
    const routing = await isMacBridgeRoutingActive(this.bridgeUserId, this.bridgeIsFounder);
    if (!routing || !isMacBridgeConnected(this.bridgeUserId)) {
      return MCP_TOOL_TIMEOUT_MS;
    }

    const pathArg = toolArgs.path;
    const onMacPath = isMacBridgePathArg(pathArg);

    if (
      toolName === 'list_directory'
      || toolName === 'get_project_structure'
      || toolName === 'search_codebase'
      || toolName === 'find_file'
    ) {
      return onMacPath ? MCP_TOOL_TIMEOUT_MAC_LIST_MS : MCP_TOOL_TIMEOUT_MAC_MS;
    }

    return MCP_TOOL_TIMEOUT_MAC_MS;
  }

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
    const routing = await isMacBridgeRoutingActive(this.bridgeUserId, this.bridgeIsFounder);
    if (routing && isMacBridgeConnected(this.bridgeUserId)) {
      this.mcpClient = null;
      this.mcpTools = getMacBridgeTools(this.bridgeUserId);
      if (!this.mcpTools.length) {
        throw new Error('Mac bridge connected but no tools registered — restart mac-bridge on Mac.');
      }

      return;
    }

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

  }

  async callTool(
    toolName: string,
    toolArgs: Record<string, unknown>,
    founderToken: string,
  ): Promise<string> {
    const routing = await isMacBridgeRoutingActive(this.bridgeUserId, this.bridgeIsFounder);
    if (routing && isMacBridgeConnected(this.bridgeUserId)) {
      return callToolViaMacBridge(
        this.bridgeUserId,
        toolName,
        toolArgs,
        await this.resolveMcpToolTimeoutMs(toolName, toolArgs),
      );
    }

    await this.ensureConnected(founderToken);
    if (!this.mcpClient) throw new Error('MCP client not connected.');

    const result = await this.mcpClient.callTool({
      name:      toolName,
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

  private async callUlPlanner(messages: BuildMessage[]): Promise<QwenResponse> {
    const toolNames = this.mcpTools.map((t) => t.name);
    const planned = planBuilderStep(messages, toolNames);

    return {
      choices: [{
        finish_reason: planned.finish_reason,
        message: {
          role:        'assistant',
          content:     planned.content,
          tool_calls:  planned.tool_calls,
        },
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0 },
    };
  }

  private async executeTool(
    toolName: string,
    toolArgs: Record<string, unknown>,
    founderToken: string,
  ): Promise<{ result: string; timedOut: boolean }> {
    if (FOUNDER_ONLY_MCP_TOOLS.has(toolName)) {
      return {
        result: [
          '⛔ BLOCKED: approve_write / reject_write are founder-only.',
          'ADAM must use propose_file_write, then wait for founder LULUS in the build drawer.',
          'The kernel writes the file only after the founder taps Approve.',
        ].join(' '),
        timedOut: false,
      };
    }

    try {
      const timeoutMs = await this.resolveMcpToolTimeoutMs(toolName, toolArgs);
      const result = await this.callToolWithTimeout(
        toolName,
        toolArgs,
        founderToken,
        timeoutMs,
      );
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

  private async injectStickyConstitution(
    record: BuilderSessionRecord,
    founderToken: string,
  ): Promise<string> {
    let constitutionText = await loadAdamRulesFromDisk();

    if (!constitutionText) {
      const { result } = await this.executeTool('get_constitution', {}, founderToken);
      constitutionText = result;
    }

    const block = buildStickyConstitutionBlock(constitutionText);
    const systemIdx = record.messages.findIndex((m) => m.role === 'system');
    const insertAt = systemIdx >= 0 ? systemIdx + 1 : 0;

    record.messages.splice(insertAt, 0, { role: 'user', content: block });
    return block;
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

    if (!hasStickyConstitution(record.messages)) {
      yield {
        type:      'thinking',
        message:   'Loading CODE LAWS from .adamrules…',
        sessionId: record.id,
      };

      try {
        const block = await this.injectStickyConstitution(record, founderToken);
        this.persistSession(record);
        yield {
          type:      'tool_result',
          toolName:  'get_constitution',
          result:    truncatePreview(block, CONSTITUTION_RESULT_MAX),
          message:   'Constitution loaded — CODE LAWS 1–10 sticky in context',
          sessionId: record.id,
        };
      } catch (err) {
        yield {
          type:      'error',
          message:   `Failed to load .adamrules: ${(err as Error).message}`,
          sessionId: record.id,
        };
        deleteBuilderSession(record.id);
        return;
      }
    }

    let emptyRounds = 0;

    while (record.loopCount < MAX_LOOPS) {
      record.loopCount += 1;

      yield { type: 'heartbeat', sessionId: record.id };

      yield {
        type:      'qwen_thinking',
        message:   `ADAM is thinking… (step ${record.loopCount})`,
        sessionId: record.id,
      };

      let qwenResponse: QwenResponse;
      try {
        qwenResponse = await this.callUlPlanner(record.messages);
      } catch (err) {
        yield {
          type: 'error',
          message: `ADAM builder error: ${(err as Error).message}`,
          sessionId: record.id,
        };
        deleteBuilderSession(record.id);
        return;
      }

      const choice = qwenResponse.choices[0];
      if (!choice) {
        yield {
          type:      'error',
          message:   'ADAM builder error: empty model response.',
          sessionId: record.id,
        };
        deleteBuilderSession(record.id);
        return;
      }
      record.totalTokens += qwenResponse.usage?.completion_tokens ?? 0;
      this.persistSession(record);

      const toolCalls = choice.message.tool_calls ?? [];
      const finalText = choice.message.content?.trim() ?? '';

      if (toolCalls.length === 0) {
        if (finalText.length > 0) {
          deleteBuilderSession(record.id);
          yield {
            type:        'complete',
            message:     finalText.length > 0
              ? `✅ Task completed.\n\n${finalText}`
              : '✅ Task completed.',
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
          const onMacBridge = await isMacBridgeRoutingActive(this.bridgeUserId, this.bridgeIsFounder)
            && isMacBridgeConnected(this.bridgeUserId);
          if (onMacBridge) {
            yield {
              type:      'error',
              message:   `Tool "${toolName}" timed out on Mac bridge. Use a narrower path (e.g. mac:Desktop/qxk24/qxk24-backend) and list depth 1–2 — not mac:Desktop depth 4.`,
              sessionId: record.id,
            };
          } else {
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
        }

        if (toolName === 'propose_file_write') {
          record.messages.push({
            role:         'tool',
            tool_call_id: toolCall.id,
            content:      resultText,
          });
          this.persistSession(record);

          if (isPreflightBlocked(resultText) || !isSuccessfulWriteProposal(resultText)) {
            yield {
              type:      'tool_result',
              toolName,
              result:    toolResultForUi(toolName, toolArgs, resultText),
              message:   'Pre-flight blocked — ADAM self-correcting…',
              sessionId: record.id,
            };
            continue;
          }

          const hawaPropose = yield* yieldHawaReview(
            record,
            toolName,
            toolArgs,
            resultText,
            'propose_write',
          );
          if (hawaPropose?.stop) {
            yield {
              type:      'tool_result',
              toolName,
              result:    toolResultForUi(toolName, toolArgs, resultText),
              message:   'HAWA veto — task halted',
              sessionId: record.id,
            };
            return;
          }

          const proposal = extractProposal(resultText, toolArgs);
          record.awaitingFounderLulus = true;
          record.pendingProposalId = proposal?.id;
          saveBuilderSession(record);

          yield {
            type:      'proposal',
            toolName,
            result:    toolResultForUi(toolName, toolArgs, resultText),
            proposal,
            sessionId: record.id,
          };

          yield {
            type:      'approval_needed',
            message:   `Waiting for founder LULUS: ${String(toolArgs.path ?? '')}`,
            sessionId: record.id,
          };
          return;
        }

        yield {
          type:      'tool_result',
          toolName,
          result:    toolResultForUi(toolName, toolArgs, resultText),
          message:   `${toolName} complete`,
          sessionId: record.id,
        };

        record.messages.push({
          role:         'tool',
          tool_call_id: toolCall.id,
          content:      resultText,
        });
        this.persistSession(record);

        const hawaPost = yield* yieldHawaReview(
          record,
          toolName,
          toolArgs,
          resultText,
          'post_tool',
        );
        if (hawaPost?.stop) {
          return;
        }
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
    bridgeUserId: string,
    bridgeIsFounder: boolean,
    signal?: AbortSignal,
  ): AsyncGenerator<AgentEvent> {
    this.bridgeUserId = bridgeUserId;
    this.bridgeIsFounder = bridgeIsFounder;
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
    bridgeUserId: string,
    bridgeIsFounder: boolean,
    signal?: AbortSignal,
    clearHawa: boolean = false,
  ): AsyncGenerator<AgentEvent> {
    this.bridgeUserId = bridgeUserId;
    this.bridgeIsFounder = bridgeIsFounder;
    const record = getBuilderSession(sessionId);
    if (!record) {
      yield { type: 'error', message: 'Build session expired or not found.', sessionId };
      return;
    }

    if (clearHawa) {
      clearHawaHold(sessionId);
      yield {
        type:      'hawa_lulus',
        message:   'HAWA: Founder resumed — ADAM may continue.',
        sessionId: record.id,
      };
    }

    record.awaitingFounderLulus = false;
    record.pendingProposalId = undefined;
    saveBuilderSession(record);

    yield* this.runAgentLoop(record, founderToken, resumeNote, signal);
  }
}

export const adamBuilderAgent = new AdamBuilderAgentService();
