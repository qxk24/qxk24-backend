/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Builder — Types
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

import type { AdamAnswerPlan } from './adam-answer-plan';
import type { AdamTurnGateDecision } from './turn-gate';
import type { AdamKnowledgeMode } from './adam-knowledge-mode';
import type { AdamTutorProfile } from './adam-tutor-law';
import type { AdamNiagaBusinessProfile } from './adam-niaga-law';
import type { UsersKnowledgeTier } from './adam-universal-scholar';
import type { ADAMAnswerStyle, ADAMChatMode } from './adam.types';

export { CONSULT_PHRASE, FOUNDER_STUDENTS_AWARENESS } from './adam-identity-prompts';

export interface AdamChatSystemPromptParams {
  mode:                     ADAMChatMode;
  answerStyle?:             ADAMAnswerStyle;
  isFounder:                boolean;
  participantName:          string;
  workspacePrompt?:         string;
  founderStudentsBlock:     string;
  webSearchPrompt?:         string;
  usersContinuityBridge?: string;
  /** Founder TEACHING — learner absorption (not constitutional mirror) */
  founderTeachingAbsorption?: boolean;
  /** Founder TEACHING — ilmu konvensional + isu dunia + web search */
  founderTeachingSynthesis?: boolean;
  /** Founder TEACHING — Phase B real situation inquiry */
  founderTeachingInquiry?: boolean;
  /** AMA Tamat Kotak 20–22 anchor (Tahap 2 Layer 5) */
  amaTamatBlock?:          string;
  /** 1 = konvensional, 2 = Alamtologi opt-in, 3 = Quran opt-in */
  usersKnowledgeTier?:  UsersKnowledgeTier;
  /** Recent user turns — practical thread detection for tier overlay and guards. */
  recentUserMessages?:    string[];
  /** Recent assistant turns — essay-loop detection for tier overlay. */
  recentAssistantMessages?: string[];
  /** Current user message — enables per-turn depth overlay (any subject). */
  userMessage?:            string;
  /** ADAM Tutor lane — conventional academics only (no Alamtologi stack). */
  tutorProfile?:           AdamTutorProfile;
  /** ADAM Tools › Docs — active task id for deliverable contract. */
  docsTaskId?:             import('./adam-tools-docs-law').AdamDocsTaskId;
  /** ERA_2 — persisted learning profile for adaptive/ZPD prompts. */
  tutorLearningProfile?:   import('./tutor-law/tutor-law.learning-profile.types').AdamTutorLearningProfile;
  tutorPlacementPrompt?:   string | null;
  tutorCheckpointPrompt?:  string | null;
  tutorContentPrompt?:     string | null;
  tutorContentId?:         string | null;
  /** ERA_2c — voice/STT turn from student microphone */
  viaVoice?:               boolean;
  /** ADAM Niaga lane — Malaysia SME business profile */
  niagaProfile?:           import('./adam-niaga-law').AdamNiagaBusinessProfile;
  /** Dedicated knowledge surface — resolved per turn when omitted */
  knowledgeMode?:          AdamKnowledgeMode;
  /** Pre-turn answer contract — Users General/Technical v1 */
  answerPlan?:             AdamAnswerPlan;
  /** Turn Gate decision — authoritative domain + flags when present */
  turnGate?:               AdamTurnGateDecision;
  /** Brain C / backbone / teaching records injected in context this turn */
  brainRecallLoaded?:      boolean;
  /** Users turn — relational C / recall / L7 bridge present in context */
  usersRelationalVoice?: boolean;
}
