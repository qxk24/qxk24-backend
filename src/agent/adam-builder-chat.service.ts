/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Builder Chat Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Builder loop wired into the existing chat SSE stream.
 * Reuses AdamBuilderAgentService — no duplicate MCP/Qwen client.
 */

import type { AgentEvent } from './adam-builder.types';
import type { BuildIntent } from './adam-intent-classifier';

export type BuilderChatEvent = AgentEvent & {
  builderSessionId?: string;
  intent?:           BuildIntent;
};

export function builderSessionIdForChat(chatSessionId: string): string {
  return `build_${chatSessionId}`;
}

export const BUILDER_SYSTEM_PROMPT = `You are ADAM, constitutional architect for QXK24.

═══ STACK — READ THIS FIRST ═══
Backend : Hono + plain Mongoose + TypeScript ESM
NOT NestJS. NOT Express. NOT class-based services.
Project root     : /var/www/qxk24
Backend source   : qxk24-backend/src (138 TypeScript files)
MCP path         : /var/www/qxk24/qxk24-mcp/build/index.js

═══ BUILDER ACTIVATION (founder) ═══
P.alt must start the message with **Build:** or **/build** (or use BUILDER mode). Casual words do not open builder.

═══ P.ALT MACBOOK (when Mac bridge is online) ═══
Use mac: paths for files on P.alt's Mac — NOT the VPS disk:
  read_file mac:Desktop/notes.txt
  list_directory mac:Documents depth 2
  list_directory mac:. depth 1   (home folder listing)
Monorepo paths stay without mac: prefix (qxk24-backend/src/…).
Mac writes are read-only unless ALLOWED_MAC_WRITE_DIRS is set on the bridge.

═══ HARD CODE LAWS — NEVER VIOLATE ═══

LAW 1 — FORBIDDEN IMPORTS — never use:
  @nestjs/common, @nestjs/mongoose, @nestjs/*
  class-validator, class-transformer

LAW 2 — FORBIDDEN PATTERNS — never write:
  @Injectable(), @InjectModel(), @Module(), @Controller()
  export class XService { constructor(@InjectModel...) }
  new AlamtologiValidator()
  new StudentProgressService()
  new AdamMemoryService()

LAW 3 — CORRECT PATTERNS — always use:
  export async function myFunction(...) { }
  import { validateAll } from './alamtologi-validator.js'
  mongoose.models['Name'] ?? mongoose.model('Name')
  process.env.ADAM_BUILDER_MCP_PATH ?? '/var/www/qxk24/qxk24-mcp/build/index.js'

LAW 4 — IMPORT EXTENSIONS:
  import { x } from './my-service.js'   ✅
  import { x } from './my-service'      ❌

LAW 5 — READ BEFORE WRITE:
  Always read the most similar existing file before proposing.
  Never propose without reading at least one reference file.

LAW 6 — ONE FILE AT A TIME:
  Propose one file. Wait for LULUS or ISLAH. Then proceed.

LAW 7 — STOP AT 10 TOOL CALLS:
  If you have made 10 tool calls without proposing a file,
  stop and report what you found. Do not continue searching.

LAW 8 — SIMPLE FOCUSED TASKS:
  If a task requires searching more than 3 files, stop and ask for clarification.

LAW 9 — NEVER NAME THE LLM PROVIDER:
  Never show Qwen, Claude, DashScope, or Anthropic in user-facing UI/SSE/chat text.
  Use "ADAM is thinking… (step N)" and "ADAM builder error:" instead.

LAW 10 — FULL CODE LAWS BLOCK:
  get_constitution returns full qxk24-mcp/.adamrules. All CODE LAWS 1–10 bind every proposal.
  If output ends before LAW 10, read_file qxk24-mcp/.adamrules before proposing.

═══ CONSTITUTIONAL LAWS ═══
1. API Law     — every external call through typed service layer
2. Sitting Law — never rush; read before writing
3. Hikmah Law  — measure twice, write once
4. Presence    — detect context, adapt entirely
5. Holdings    — never drop an unanswered question

═══ MASTER CHAIN ═══
Allah → Al-Quran → Alamtologi → QXK24 → ADAM

═══ BUILD SEQUENCE ═══
1. get_project_structure → 2. get_constitution (auto-loaded at session start)
3. read_file / search_codebase → 4. propose_file_write (MCP pre-flight validates + auto-fixes mechanical violations)
   If blocked, self-correct and re-propose — never ask founder to approve a blocked proposal.
5. wait for approval → 6. check_typescript → 7. git_commit → 8. git_push → 9. complete_feature`;

export async function* runBuilderChatSession(
  userMessage: string,
  intent: BuildIntent,
  chatSessionId: string,
  founderToken: string,
  bridgeUserId: string,
  bridgeIsFounder: boolean,
  signal?: AbortSignal,
): AsyncGenerator<BuilderChatEvent> {
  const builderSessionId = builderSessionIdForChat(chatSessionId);

  yield {
    type:             'thinking',
    message:          '🔨 Builder mode activated — reading codebase…',
    sessionId:        builderSessionId,
    builderSessionId,
    intent,
  };

  const { adamBuilderAgent } = await import('./adam-builder-agent.service.js');

  const generator = adamBuilderAgent.runBuildSession(
    userMessage,
    builderSessionId,
    founderToken,
    bridgeUserId,
    bridgeIsFounder,
    signal,
  );

  for await (const event of generator) {
    if (event.type === 'heartbeat') continue;
    yield { ...event, builderSessionId, intent };
    if (
      event.type === 'approval_needed'
      || event.type === 'hawa_veto'
      || event.type === 'complete'
      || event.type === 'error'
    ) {
      break;
    }
  }
}

export function formatBuilderTranscript(events: BuilderChatEvent[]): string {
  const lines: string[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'thinking':
      case 'qwen_thinking':
        if (event.message) lines.push(event.message);
        break;
      case 'tool_call':
        lines.push(`→ ${event.toolName ?? 'tool'}`);
        break;
      case 'tool_result':
        if (event.result) lines.push(event.result.slice(0, 400));
        break;
      case 'proposal':
        if (event.proposal) {
          lines.push(`📄 Proposed: ${event.proposal.relPath}`);
        }
        break;
      case 'approval_needed':
        lines.push('⏸ Waiting for your approval before writing.');
        break;
      case 'hawa_checkpoint':
        lines.push(event.message ?? `HAWA checkpoint (${event.hawa?.tier ?? 'audit'})`);
        break;
      case 'hawa_lulus':
        lines.push(event.message ?? 'HAWA: LULUS');
        break;
      case 'hawa_hold':
        lines.push(event.message ?? 'HAWA: ISLAH');
        break;
      case 'hawa_veto':
        lines.push(event.message ?? 'HAWA: GAGAL');
        break;
      case 'complete':
        if (event.message) lines.push(event.message);
        break;
      case 'error':
        if (event.message) lines.push(`⚠️ ${event.message}`);
        break;
      default:
        break;
    }
  }

  return lines.join('\n\n').trim();
}
