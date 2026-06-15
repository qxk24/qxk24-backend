/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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

/** DashScope web-search hit surfaced during streaming (SuNom picu lerai). */
export interface LlmSearchResult {
  title?:   string;
  url?:     string;
  /** DashScope may surface page summary/snippet when available. */
  snippet?: string;
  /** True when snippet was built from a full HTML page fetch — never from search API alone. */
  pageFetched?: boolean;
}

export interface LlmStreamResult {
  text:          string;
  searchResults: LlmSearchResult[];
}

export interface LlmCompleteParams {
  system:    string;
  messages:  LlmMessage[];
  model:     string;
  maxTokens: number;
}

export interface LlmStreamParams extends LlmCompleteParams {
  enableWebSearch?:      boolean;
  forceWebSearch?:       boolean;
  enableThinking?:       boolean;
  /** Shown in adam_searching SSE — usually the student's question. */
  searchDisplayQuery?:   string;
  /** DashScope assigned_site_list — up to 25 domains for focused retrieval. */
  searchAssignedSites?:  string[];
  /** Override ENV.QWEN_SEARCH_STRATEGY for this call (e.g. max for stat prefetch). */
  searchStrategy?:       string;
  onEvent?:              LlmStreamEventHandler;
}

/** Pass-through after coalesce — kept for call-site stability. */
export function toLlmMessages(messages: LlmMessage[]): LlmMessage[] {
  return messages;
}
