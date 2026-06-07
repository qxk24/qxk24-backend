/**
 * ============================================================
 * ALAMTOLOGI — QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM System Prompts — Re-export barrel
 * Platform    : Backend (TypeScript)
 * Kernel      : v1.7.0
 * Updated     : 2026-06-05
 * ============================================================
 * This file is now a re-export barrel only.
 * All content has been split into focused modules:
 *
 *   adam-character.ts        — WHO ADAM IS
 *   adam-identity-prompts.ts — behaviour, voice, response style
 *   adam-knowledge-prompts.ts — Alamtologi laws, epistemology
 *   adam-student-prompts.ts  — student mode, memory, ZPD
 *   adam-language-prompts.ts — Bahasa Melayu, narrative delivery
 *   adam-prompt-builder.ts   — buildAdamChatSystemPrompt()
 * ============================================================
 */

export { ADAM_CHARACTER_CORE, ADAM_IDENTITY_SHORT } from './adam-character';

export {
  CONSULT_PHRASE,
  FOUNDER_STUDENTS_AWARENESS,
  ADAM_CORE_BEHAVIOUR,
} from './adam-identity-prompts';

export {
  ADAM_EPISTEMOLOGICAL_POSITION,
  ADAM_FOUNDER_NARRATIVE,
  ADAM_ALAMTOLOGI_LAWS,
} from './adam-knowledge-prompts';

export {
  STUDENT_MODE_PROMPT,
  ADAM_MEMORY_HONESTY_RULE,
  ADAM_ZPD_GUIDANCE_RULE,
} from './adam-student-prompts';

export {
  ADAM_BAHASA_MELAYU_LAW,
  ADAM_PHILOSOPHER_TEACHER_IDENTITY,
  ADAM_NARRATIVE_DELIVERY,
  ADAM_DELIVERY_RULE,
} from './adam-language-prompts';

export {
  founderJournalReviewPath,
  JOURNAL_GEN_MODE_PROMPT,
  buildAdamChatSystemPrompt,
  AdamChatSystemPromptParams,
} from './adam-prompt-builder';

// Legacy aliases — keep for any imports that reference the old names
export { ADAM_CORE_BEHAVIOUR as ADAM_SYSTEM_PROMPT } from './adam-identity-prompts';
export { ADAM_NARRATIVE_DELIVERY as ADAM_DELIVERY_RULE_ALIAS } from './adam-language-prompts';
