/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM System Prompts
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
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
  USERS_MODE_PROMPT,
  ADAM_MEMORY_HONESTY_RULE,
  ADAM_ZPD_GUIDANCE_RULE,
} from './adam-users-prompts';

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
