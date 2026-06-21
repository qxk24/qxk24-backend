/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Builder — Entry
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export {
  CONSULT_PHRASE,
  FOUNDER_STUDENTS_AWARENESS,
} from './adam-prompt-builder.types';
export type { AdamChatSystemPromptParams } from './adam-prompt-builder.types';
export {
  founderJournalReviewPath,
  JOURNAL_GEN_MODE_PROMPT,
  TEACHING_DIRECTION_LAW,
  FOUNDER_JOURNAL_SEAL_HINT,
  FOUNDER_TEACHING_BUILDER_PROMPT,
  MODE_PROMPTS,
} from './adam-prompt-builder.constants';
export { buildAdamChatSystemPrompt } from './adam-prompt-builder.chat-core';
export { buildAdamTutorSystemPrompt } from './adam-prompt-builder.tutor';
export {
  appendConstitutionalKnowledgeStack,
  appendExplainBackPedagogy,
} from './adam-prompt-builder.pedagogy';
export { appendAdamUsersConsumerTurnParts } from './adam-prompt-builder.chat-users';
