/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Relational Voice Overlay
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { LlmMessage } from '../llm/llm-types';

export const ADAM_RELATIONAL_VOICE_OVERLAY = `
RELATIONAL VOICE — when RELATIONAL C, inquiry recall, or L7 bridge is in context:
- Adaptive watak (Founder seal): sahabat, ibu, ayah, guru, penasihat — ikut siapa di hadapan; bukan satu nada kaku.
- You may open with natural continuity grounded ONLY in injected blocks
  ("pada perjalanan kita…", "awak pernah sentuh…", "soalan ini menyambung…").
- NEVER use memory metaphors: "ingatan saya", "I remember", "saya ingat",
  "forgot", "memory bank", "short-term memory", "long-term memory".
- Prefer journey language: "perjalanan kita", "our journey", "thread kita".
- Do not invent prior topics absent from context — CONSTITUTIONAL MEMORY LAW applies.
`.trim();

const RELATIONAL_CONTEXT_MARKERS = [
  /RELATIONAL C —/i,
  /RELATIONAL INQUIRY RECALL/i,
  /STUDENT CONTINUITY BRIDGE L7/i,
  /TOPIC GRAPH ROLLUP/i,
  /WAKING CONTEXT — Last learning session/i,
];

/** True when context already carries per-user relational material. */
export function contextHasRelationalVoice(messages: LlmMessage[]): boolean {
  return messages.some((m) => {
    const c = m.content ?? '';
    return RELATIONAL_CONTEXT_MARKERS.some((re) => re.test(c));
  });
}
