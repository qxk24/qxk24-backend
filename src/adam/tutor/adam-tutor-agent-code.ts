/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Code Allocator
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { TutorAgentModel } from './adam-tutor-agent.schema';

/** Public agen login code — 1 letter + 8 digits, e.g. A00000001, A00000002. */
export const TUTOR_AGENT_CODE_PATTERN = /^A\d{8}$/;

/** Transitional 6-digit codes issued before the 8-digit format. */
export const LEGACY_TUTOR_AGENT_CODE_PATTERN = /^A\d{6}$/;

const AGENT_CODE_DIGITS = 8;
const MAX_AGENT_CODE_SEQ = 99_999_999;

export function formatTutorAgentCode(seq: number): string {
  if (!Number.isInteger(seq) || seq < 1 || seq > MAX_AGENT_CODE_SEQ) {
    throw new Error('Invalid agent code sequence.');
  }
  return `A${String(seq).padStart(AGENT_CODE_DIGITS, '0')}`;
}

export function parseTutorAgentCodeSequence(agentCode: string): number | null {
  const normalized = agentCode.trim().toUpperCase();
  if (
    !TUTOR_AGENT_CODE_PATTERN.test(normalized)
    && !LEGACY_TUTOR_AGENT_CODE_PATTERN.test(normalized)
  ) {
    return null;
  }
  const seq = Number(normalized.slice(1));
  return Number.isInteger(seq) && seq >= 1 ? seq : null;
}

/** Accept canonical A00000001, transitional A000001, and legacy TUTOR-AGEN-* slugs. */
export function isValidTutorAgentLoginCode(agentCode: string): boolean {
  const code = agentCode.trim().toUpperCase();
  if (TUTOR_AGENT_CODE_PATTERN.test(code)) return true;
  if (LEGACY_TUTOR_AGENT_CODE_PATTERN.test(code)) return true;
  return /^TUTOR-AGEN-[A-Z0-9-]{3,32}$/.test(code);
}

async function maxAllocatedAgentCodeSequence(): Promise<number> {
  const rows = await TutorAgentModel.find(
    { agentCode: { $regex: /^A\d{6,8}$/i } },
    { agentCode: 1 },
  ).lean();

  let maxSeq = 0;
  for (const row of rows) {
    const seq = parseTutorAgentCodeSequence(row.agentCode ?? '');
    if (seq !== null && seq > maxSeq) maxSeq = seq;
  }
  return maxSeq;
}

export async function allocateTutorAgentCode(): Promise<string> {
  let seq = (await maxAllocatedAgentCodeSequence()) + 1;

  for (; seq <= MAX_AGENT_CODE_SEQ; seq += 1) {
    const code = formatTutorAgentCode(seq);
    const taken = await TutorAgentModel.exists({ agentCode: code });
    if (!taken) return code;
  }

  throw new Error('Unable to generate a unique agen code.');
}
