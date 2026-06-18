/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Voice Registry
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
 *
 * Canonical map of Founder voice sources — generation-time only.
 * Post-stream: hygiene only (web attribution, stale office-holder); never gut prose.
 */

/** Identity + conscience — always on Founder command turns. */
export {
  ADAM_CHARACTER_CORE,
  ADAM_CHARACTER_TEACHING_LEARNER,
} from './adam-character';

/** Adab, Bismillah, paragraph law, master chain. */
export {
  ADAM_CORE_BEHAVIOUR,
  ADAM_CONVERSATION_GUARDRAILS,
} from './adam-identity-prompts';

/** Warmth, philosopher-teacher, narrative story register. */
export {
  ADAM_WARMTH_VOICE,
  ADAM_WARMTH_VOICE_TEACHING_LEARNER,
} from './adam-warmth-voice';

export {
  ADAM_BAHASA_MELAYU_LAW,
  ADAM_PHILOSOPHER_TEACHER_IDENTITY,
  ADAM_NARRATIVE_DELIVERY,
} from './adam-language-prompts';

/** Answer style chip — Natural / Philosophy / Formal / Technical. */
export {
  ADAM_NATURAL_WISDOM_VOICE,
  ADAM_PHILOSOPHY_VOICE,
  ADAM_FORMAL_VOICE,
  ADAM_TECHNICAL_VOICE,
  buildAnswerStylePromptBlock,
} from './adam-answer-style';

/** β Explain-Back — three gambar hidup → konvensional → sintesis (Founder seal). */
export { ADAM_EXPLAIN_BACK_LAW, ADAM_CONSTITUTIONAL_KNOWLEDGE_HOLD } from './adam-student-explain-back-law';
export { ADAM_FOUNDER_EMPIRICAL_DEPTH_LAW } from './adam-founder-empirical-depth';

/** Layer 5 — Qawlan Sadida, five response forms. */
export {
  ADAM_LAYER5_CORE,
  ADAM_LAYER5_FOUNDER,
  ADAM_QAWLAN_SADIDA,
  ADAM_FIVE_RESPONSE_FORMS,
} from './adam-response-generation';

/** Constitutional knowledge stack — HISAL, laws, narrative, epistemology. */
export {
  ADAM_FOUNDER_NARRATIVE,
  ADAM_ALAMTOLOGI_LAWS,
  ADAM_EPISTEMOLOGICAL_POSITION,
  ADAM_FOUNDER_BIOGRAPHY_IDENTITY_LAW,
} from './adam-knowledge-prompts';

/** Journal writing voice (JOURNAL_GEN only). */
export { ADAM_JOURNAL_WRITING_VOICE_PROMPT } from './adam-journal-writing-voice';

/** Prose em-dash law + relational arc. */
export { ADAM_PROSE_DASH_LAW } from './adam-prose-sanitize';
export { ADAM_RELATIONAL_VOICE_OVERLAY } from './adam-relational-voice';

/**
 * Founder command stack order (see adam-prompt-builder.ts):
 * Character → Guardrails → Core behaviour → Warmth → BM law → Answer style
 * → Knowledge mode manifest → Explain-Back (β) or α law (α only)
 * → Philosopher + Narrative → Layer 5 Founder → Constitutional stack
 */
export const ADAM_FOUNDER_VOICE_STACK_IDS = [
  'adam-character',
  'adam-identity-prompts',
  'adam-warmth-voice',
  'adam-language-prompts',
  'adam-answer-style',
  'adam-student-explain-back-law',
  'adam-response-generation',
  'adam-knowledge-prompts',
  'adam-answer-profile',
  'adam-knowledge-mode',
] as const;
