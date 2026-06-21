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

/** Public agen login code — e.g. A000001, A000002 (global sequence). */
export const TUTOR_AGENT_CODE_PATTERN = /^A\d{6}$/;

const MAX_AGENT_CODE_SEQ = 999_999;

export function formatTutorAgentCode(seq: number): string {
  if (!Number.isInteger(seq) || seq < 1 || seq > MAX_AGENT_CODE_SEQ) {
    throw new Error('Invalid agent code sequence.');
  }
  return `A${String(seq).padStart(6, '0')}`;
}

export function parseTutorAgentCodeSequence(agentCode: string): number | null {
  const normalized = agentCode.trim().toUpperCase();
  const match = TUTOR_AGENT_CODE_PATTERN.exec(normalized);
  if (!match) return null;
  const seq = Number(normalized.slice(1));
  return Number.isInteger(seq) && seq >= 1 ? seq : null;
}

async function maxAllocatedAgentCodeSequence(): Promise<number> {
  const rows = await TutorAgentModel.aggregate<{ maxSeq: number }>([
    { $match: { agentCode: { $regex: /^A\d{6}$/i } } },
    {
      $project: {
        seq: {
          $convert: {
            input: { $substrCP: [{ $toUpper: '$agentCode' }, 1, 6] },
            to:    'int',
            onError: 0,
            onNull:  0,
          },
        },
      },
    },
    { $group: { _id: null, maxSeq: { $max: '$seq' } } },
  ]);

  return rows[0]?.maxSeq ?? 0;
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
