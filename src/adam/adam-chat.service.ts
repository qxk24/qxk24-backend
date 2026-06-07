/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Public barrel — routes import from here. Implementation lives in:
 * - adam-system-prompts.ts
 * - adam-chat-session.service.ts
 * - adam-chat-response-parser.ts
 * - adam-chat-relay.service.ts
 * - adam-chat-stream.service.ts
 */

export type { ChatParticipant } from './adam-student.types';

export {
  ADAM_SYSTEM_PROMPT,
  CONSULT_PHRASE,
  FOUNDER_STUDENTS_AWARENESS,
  STUDENT_MODE_PROMPT,
} from './adam-system-prompts';

export {
  getOrCreateSession,
  resolveFounderTeachingSession,
  founderSessionIdWithMostMessages,
  getOrCreateGroupSession,
  ensureSession,
  loadMessageHistory,
  saveMessage,
  generateK24Address,
  getChatSession,
  listChatSessions,
  deleteFounderMessage,
  assertCanClearSessionChat,
  clearSessionChatHistory,
  verifyADAMMessage,
  createChatSession,
} from './adam-chat-session.service';

export type { StoredADAMMessage } from './adam-chat-session.service';

export {
  parseConsultBlock,
  parseBroadcastBlocks,
  parseToFounderBlocks,
  parseJudgmentBlock,
  parseJournalSealBlocks,
  founderWantsStudentRelay,
  studentWantsFounderRelay,
} from './adam-chat-response-parser';

export type { FounderBroadcast } from './adam-chat-response-parser';

export {
  relayFounderMessageToStudents,
  relayStudentMessageToFounder,
  syncUndeliveredConsultsToFounder,
} from './adam-chat-relay.service';

export { streamADAMChat } from './adam-chat-stream.service';
