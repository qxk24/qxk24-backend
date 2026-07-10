/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate Types
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

import type { ADAMChatMode } from '../adam.types';
import type { FounderTeachingFlags } from '../adam-chat-stream-turn-context';
import type {
  AdamAnswerLane,
  AdamAnswerPlan,
  AdamAnswerPolicy,
  AdamUsersAnswerMode,
  AdamUsersIntent,
} from '../adam-answer-plan';
import type { AdamChannelId } from '../adam-channel-router';
import type { AdamAnswerComposer } from '../adam-answer-composer';
import type { AdamAnswerShape, AdamAnswerShapeIntent } from '../adam-answer-shape';
import type { AdamKnowledgeMode } from '../adam-knowledge-mode';
import type { AdamUsersDomainFacet } from '../adam-users-domain-router';
import type {
  AdamSensingBundle,
  AdamSituationPosture,
  AdamSurfaceKind,
} from './sensing-engine/adam-sensing.types';
import type { AdamEQVirtue } from '../adam-eq-virtues';

export type AdamDisplayChannel =
  | 'none'
  | 'economics-formal'
  | 'science-formal'
  | 'civics-formal'
  | 'technology-formal'
  | 'academic-formal'
  | 'mathematics-formal'
  | 'business-formal'
  | 'accounting-formal'
  | 'health-formal'
  | 'environment-formal'
  | 'compare-formal';

export type AdamAffectiveTone =
  | 'light'
  | 'substantive'
  | 'stressed'
  | 'relational'
  | 'prose-craft'
  | 'practical'
  | 'grateful'
  | 'grief'
  | 'frustrated';

export type AdamThreadPosture =
  | 'new-topic'
  | 'continuation'
  | 'depth-request';

export interface AdamTurnGateInput {
  isFounder: boolean;
  mode: ADAMChatMode;
  userMessage: string;
  teachingFlags: FounderTeachingFlags;
  recentUserMessages?: string[];
  recentAssistantMessages?: string[];
  sessionMeta?: {
    isGuestTrial?: boolean;
    participantName?: string;
  };
}

export interface AdamAddressPolicy {
  allowHaiGreeting: boolean;
  participantFirstName?: string;
}

export interface AdamTurnIQ {
  domainFacet: AdamUsersDomainFacet;
  /** Search/recall grounding — dual facet when faith voice + sirah facts. */
  groundingFacet: AdamUsersDomainFacet;
  /** S1 — question surface kind (Article 8). */
  surfaceKind: AdamSurfaceKind;
  /** Analytic delivery — technical vs general prose. IQ only. */
  usersMode: AdamUsersAnswerMode;
  /** Content intent — substantive/factual/light. IQ only. */
  contentIntent: AdamUsersIntent;
  shapeIntent: AdamAnswerShapeIntent;
  topicTitle: string;
  secondaryTitle?: string | null;
  displayChannel: AdamDisplayChannel;
  searchProfile: string | null;
  composer: AdamAnswerComposer;
  answerShape: AdamAnswerShape;
}

export interface AdamTurnEQ {
  lane: AdamAnswerLane;
  legacyChannelId: AdamChannelId;
  /** EQ foundation — empat sifat asas setiap giliran. */
  virtues: readonly AdamEQVirtue[];
  affectiveTone: AdamAffectiveTone;
  /** S2 — situational posture (Article 8). */
  situationPosture: AdamSituationPosture;
  threadPosture: AdamThreadPosture;
  addressPolicy: AdamAddressPolicy;
  answerPolicy: AdamAnswerPolicy;
}

export interface AdamTurnGateFlags {
  domainTeachingPack: boolean;
  formalDisplayLaw: boolean;
  usersTechnicalFinalize: boolean;
  searchEnabled: boolean;
  displayAlign: boolean;
  integrityGuard: boolean;
  /** User opened faith door this turn — only then Quran/konstitusi surface. */
  faithPermitted: boolean;
  /** IQ konvensional analytic — block Alamtologi/faith prompt injection. */
  konvensionalSurface: boolean;
  /** EQ relational/stressed — allow relational voice overlay when context carries C. */
  relationalVoice: boolean;
  /** Resolved at fuse — prompt/search/repair must not re-derive knowledge mode. */
  knowledgeMode: AdamKnowledgeMode;
}

export interface AdamTurnGateDecision {
  schemaVersion: 2;
  sensing: AdamSensingBundle;
  iq: AdamTurnIQ;
  eq: AdamTurnEQ;
  flags: AdamTurnGateFlags;
  answerPlan: AdamAnswerPlan;
  fuseNotes: string[];
  logLine: string;
}
