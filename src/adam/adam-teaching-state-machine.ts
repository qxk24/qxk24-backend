/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching State Machine
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Teaching cycle (no per-topic hardcode):
 *   A absorption → explain-back verify
 *   B inquiry    → real situation + conventional gap questions
 *   C synthesis  → web search + kod sains + teori belum selesai + isu dunia
 */

import type { ADAMChatMode } from './adam.types';
import { ADAMMessageModel } from './adam.schema';
import {
  founderRequestsConstitutionalMirror,
  founderRequestsTeachingSynthesis,
} from './adam-founder-teaching-prompts';

export type TeachingPhase = 'absorption' | 'inquiry' | 'synthesis';

export interface FounderTeachingFlags {
  phase:                      TeachingPhase | null;
  founderTeachingAbsorption:  boolean;
  founderTeachingInquiry:     boolean;
  founderTeachingSynthesis:   boolean;
  founderTeachingLearnerTurn: boolean;
}

export interface ResolveTeachingStateInput {
  isFounder:                 boolean;
  mode:                      ADAMChatMode;
  normalizedMessage:         string;
  hasTeachingUpload:         boolean;
  recentAssistantMessages?:  string[];
  recentUserMessages?:       string[];
}

/** Non-Teaching lanes — stable empty flags for LLM repair / stream helpers. */
export const NO_FOUNDER_TEACHING_FLAGS: FounderTeachingFlags = {
  phase:                      null,
  founderTeachingAbsorption:  false,
  founderTeachingInquiry:     false,
  founderTeachingSynthesis:   false,
  founderTeachingLearnerTurn: false,
};

const INQUIRY_SECTION_MARKER =
  /(?:\[TEACHING\s+INQUIRY|INQUIRI\s+SITUASI\s+NYATA|situasi nyata yang P\.alt|contoh di lapangan|data semasa.*P\.alt)/i;

const SYNTHESIS_SECTION_MARKER =
  /\b(?:Kod sains konvensional|Had kaedah|Teori belum selesai|Implikasi isu dunia)\b/i;

const NEW_BAB_SIGNAL =
  /\b(?:bab\s+\d|prakata|isi\s+kandungan|muat\s+naik|upload|shared teaching|fail\s+bab|bab seterusnya)\b/i;

const SHORT_ACK =
  /^(?:ok(?:ay)?|betul|ya|yes|faham|teruskan|seterusnya|next|baik|noted)[\s.!]*$/i;

/** Last ADAM reply in Teaching room carried real-situation inquiry. */
export function adamTeachingMessageHasInquirySection(text: string): boolean {
  return INQUIRY_SECTION_MARKER.test(text.trim());
}

/** Last ADAM reply completed synthesis (phase C). */
export function adamTeachingMessageHasSynthesisSection(text: string): boolean {
  return SYNTHESIS_SECTION_MARKER.test(text.trim());
}

function adamTeachingMessageIsExplainBack(text: string): boolean {
  const t = text.trim();
  if (!t || adamTeachingMessageHasSynthesisSection(t)) return false;
  return t.length >= 160;
}

function founderMessageIsSubstantiveReply(message: string): boolean {
  const t = message.trim();
  if (t.length < 16) return false;
  if (SHORT_ACK.test(t) && t.length < 48) return false;
  return true;
}

function isNewTeachingMaterialTurn(message: string, hasTeachingUpload: boolean): boolean {
  if (hasTeachingUpload) return true;
  const t = message.trim();
  if (NEW_BAB_SIGNAL.test(t)) return true;
  return t.length >= 120 && !founderMessageIsSubstantiveReply(t);
}

export function resolveTeachingPhase(input: ResolveTeachingStateInput): TeachingPhase | null {
  const {
    isFounder,
    mode,
    normalizedMessage,
    hasTeachingUpload,
    recentAssistantMessages = [],
    recentUserMessages: _recentUser = [],
  } = input;

  if (!isFounder || mode !== 'TEACHING') return null;
  if (founderRequestsConstitutionalMirror(normalizedMessage)) return null;

  if (founderRequestsTeachingSynthesis(normalizedMessage)) {
    return 'synthesis';
  }

  const lastAdam = recentAssistantMessages[recentAssistantMessages.length - 1]?.trim() ?? '';

  if (isNewTeachingMaterialTurn(normalizedMessage, hasTeachingUpload)) {
    return 'absorption';
  }

  if (
    lastAdam
    && adamTeachingMessageHasInquirySection(lastAdam)
    && founderMessageIsSubstantiveReply(normalizedMessage)
  ) {
    return 'synthesis';
  }

  if (
    lastAdam
    && adamTeachingMessageIsExplainBack(lastAdam)
    && !adamTeachingMessageHasInquirySection(lastAdam)
  ) {
    return 'inquiry';
  }

  if (
    lastAdam
    && adamTeachingMessageHasInquirySection(lastAdam)
    && !founderMessageIsSubstantiveReply(normalizedMessage)
  ) {
    return 'inquiry';
  }

  if (
    lastAdam
    && adamTeachingMessageHasSynthesisSection(lastAdam)
    && founderMessageIsSubstantiveReply(normalizedMessage)
  ) {
    return 'absorption';
  }

  if (founderMessageIsSubstantiveReply(normalizedMessage) && lastAdam) {
    return 'synthesis';
  }

  return 'absorption';
}

export function resolveFounderTeachingFlags(input: ResolveTeachingStateInput): FounderTeachingFlags {
  const phase = resolveTeachingPhase(input);

  if (!phase) {
    return {
      phase:                      null,
      founderTeachingAbsorption:  false,
      founderTeachingInquiry:     false,
      founderTeachingSynthesis:   false,
      founderTeachingLearnerTurn: false,
    };
  }

  return {
    phase,
    founderTeachingAbsorption:  phase === 'absorption',
    founderTeachingInquiry:     phase === 'inquiry',
    founderTeachingSynthesis:   phase === 'synthesis',
    founderTeachingLearnerTurn: true,
  };
}

/** Recent session turns for phase detection — lightweight, Teaching only. */
export async function loadRecentTeachingTurnTexts(
  sessionId: string,
  limit = 8,
): Promise<{ recentAssistantMessages: string[]; recentUserMessages: string[] }> {
  const rows = await ADAMMessageModel.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select({ role: 1, content: 1 })
    .lean();

  const recentAssistantMessages: string[] = [];
  const recentUserMessages: string[] = [];

  for (const row of rows.reverse()) {
    const content = typeof row.content === 'string' ? row.content.trim() : '';
    if (!content) continue;
    if (row.role === 'adam') recentAssistantMessages.push(content);
    if (row.role === 'founder') recentUserMessages.push(content);
  }

  return { recentAssistantMessages, recentUserMessages };
}
