/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Chat Stream Types
 * Platform : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { ADAMAnswerStyle, ADAMChatMode, SSEEventType } from './adam.types';
import type { ChatParticipant } from './adam-student.types';
import type { AdamTutorProfile } from './adam-tutor-law';
import type { RdIndustryDeliverableType } from '../rd-industry/rd-industry.types';
import type { LlmMessage } from '../llm/llm-types';
import type { UniversityKnowledgeTopic } from './adam-university-knowledge';
import type { JournalSectionId } from './adam-journal-section.types';

export interface StreamADAMChatOptions {
  founderToken?:      string;
  answerStyle?:       ADAMAnswerStyle;
  /** @deprecated Natural flow: ADAM selects topic. Autonomous batch may pass focus id. */
  journalTopicId?:    string;
  journalAutonomous?: boolean;
  forceBuilder?:      boolean;
  clientBuilderMode?: boolean;
  builderEvaluate?:   boolean;
  /** ADAM Tutor lane — level, curriculum, year */
  tutorProfile?:      AdamTutorProfile;
  /** ADAM Tools › Docs — task contract for TOOLS mode */
  docsTaskId?:        import('./adam-tools-docs-law').AdamDocsTaskId;
  /** ERA_2c — student sent message via browser STT microphone */
  viaVoice?:          boolean;
  /** ERA_2h — client-measured response time since last ADAM prompt (ms) */
  responseMs?:        number;
  /** ADAM Niaga lane — trader business profile */
  niagaProfile?:      import('./adam-niaga-law').AdamNiagaBusinessProfile;
  /** ADAM Business Coach — professional domain lock */
  businessCoachDomain?: {
    professionalDomain: import('../business-coach/business-coach-domains').BusinessCoachProfessionalDomain;
    domainProfile?:     Record<string, unknown> | null;
  };
  /** R&D Industry — project context for RESEARCH mode */
  rdIndustryContext?: {
    projectId:      string;
    projectFocus:   string;
    deliverable:    RdIndustryDeliverableType;
    packId:         string | null;
    technicalDocId: string | null;
  };
}

export type AdamStreamOnceFn = (
  messages: LlmMessage[],
  withSearch: boolean,
) => Promise<string>;

export type AdamOnEventFn = (event: SSEEventType, data: string) => void;

export interface JournalGenContext {
  journalTopic:           UniversityKnowledgeTopic | null;
  journalTopicId:         string | undefined;
  wantsJournalWrite:      boolean;
  journalWriteBySections: boolean;
  systemPrompt:           string;
}

export interface JournalStreamResult {
  fullResponse:           string;
  sectionJournalComplete: boolean;
  sectionDraftMap?:       Partial<Record<JournalSectionId, string>>;
  streamMs:               number;
  repairMs:               number;
}

export interface AdamChatTurnShell {
  resolvedSessionId: string;
  userMessage:       string;
  normalizedMessage: string;
  messageForAdam:    string;
  mode:              ADAMChatMode;
  isFounder:         boolean;
  isGroup:           boolean;
  participant:       ChatParticipant;
  options:           StreamADAMChatOptions;
  onEvent:           AdamOnEventFn;
  uploadIds:         string[];
  teaching: {
    context:   string;
    fileNames: string[];
    uploadIds: string[];
  };
  userMessageId:     string;
}
