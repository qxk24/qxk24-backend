/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Builder Types
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
 */

export interface QwenToolCall {
  id:       string;
  type:     'function';
  function: { name: string; arguments: string };
}

export interface BuildMessage {
  role:          'system' | 'user' | 'assistant' | 'tool';
  content:       string | null;
  tool_calls?:   QwenToolCall[];
  tool_call_id?: string;
}

export interface HawaVerdictPayload {
  judgment:   'LULUS' | 'ISLAH' | 'GAGAL' | 'WAQF';
  findings:   string[];
  stop:       boolean;
  checkpoint: 'propose_write' | 'post_tool';
  toolName?:  string;
  relPath?:   string;
}

export interface AgentEvent {
  type:
    | 'thinking'
    | 'qwen_thinking'
    | 'tool_call'
    | 'tool_running'
    | 'tool_result'
    | 'proposal'
    | 'approval_needed'
    | 'hawa_checkpoint'
    | 'hawa_lulus'
    | 'hawa_hold'
    | 'hawa_veto'
    | 'complete'
    | 'error'
    | 'heartbeat';
  toolName?:   string;
  toolArgs?:   Record<string, unknown>;
  result?:     string;
  proposal?: {
    id:      string;
    relPath: string;
    preview: string;
    isNew:   boolean;
    reason:  string;
  };
  hawa?:       HawaVerdictPayload;
  message?:    string;
  tokensUsed?: number;
  sessionId?:  string;
}

export interface BuilderSessionRecord {
  id:          string;
  messages:    BuildMessage[];
  loopCount:   number;
  totalTokens: number;
  createdAt:   number;
  updatedAt:   number;
}
