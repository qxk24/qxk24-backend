/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Builder — Pedagogy Stack
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

import { ENV } from '../config/environments';
import {
  ADAM_CONSTITUTIONAL_KNOWLEDGE_HOLD,
  ADAM_EXPLAIN_BACK_LAW,
} from './adam-student-explain-back-law';
import {
  buildAdamAlphaGenerationLaw,
  buildAdamAnswerProfileHeader,
  buildAdamAnswerVoiceOverlay,
  type AdamAnswerProfile,
} from './adam-answer-profile';
import {
  buildAdamKnowledgeModeTurnOverlay,
  knowledgeModeAllowsAlamtologiStack,
  ADAM_GENERAL_KONVENSIONAL_ONLY_LAW,
  isAdamGeneralKonvensionalTurn,
  type AdamKnowledgeMode,
} from './adam-knowledge-mode';
import {
  ADAM_FOUNDER_EMPIRICAL_DEPTH_LAW,
  ADAM_FOUNDER_TECHNICAL_STRUCTURE_LAW,
  ADAM_FOUNDER_EMPIRICAL_PEDAGOGY_OVERRIDE,
  isFounderEmpiricalPedagogyTurn,
} from './adam-founder-empirical-depth';
import {
  ADAM_FOUNDER_TEACHING_RECALL_PRIMACY_LAW,
  isFounderTeachingRecallPrimacyTurn,
} from './adam-founder-teaching-recall-law';
import { ADAM_DEFAULT_GOLD_STANDARD_PIPELINE } from './adam-search-first';
import {
  isAdamPracticalAdvisoryTurn,
  isAdamAlgorithmTeachingTurn,
  isAdamLayer1BookWritingTurn,
  isAdamLayer1ManuscriptExportTurn,
  threadRootIsPracticalAdvisory,
  userRequestedPhilosophicalBookVoice,
} from './adam-response-generation';
import {
  ADAM_CONSTITUTIONAL_STRUCTURE_FORMAT,
} from './adam-answer-style';
import { userAskedForConstitutionalStructure } from './adam-universal-voice';
import {
  ADAM_THREE_TIER_KNOWLEDGE_ARCHITECTURE,
  ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD,
  ADAM_USER_UMUM_COMPANION_VOICE_HOLD,
  buildThreeTierTurnOverlay,
  userUmumPerlaksanaanTurnActive,
  resolveUserUmumCadanganTurn,
  isUserUmumCompanionTurnActive,
} from './adam-universal-scholar';
import {
  ADAM_PRACTICAL_ADVISORY_TURN,
  ADAM_LAYER1_BOOK_WRITING_FORMAL_TURN,
  ADAM_LAYER1_BOOK_WRITING_PHILOSOPHY_TURN,
} from './adam-answer-style';
import {
  ADAM_LAYER1_BOOK_WRITING_DISCUSSION_TURN,
  USERS_MODE_PROMPT,
} from './adam-users-prompts';
import { buildStudentAddressLaw } from './adam-users-constitution';
import { ADAM_RELATIONAL_VOICE_OVERLAY } from './adam-relational-voice';
import {
  ADAM_EPISTEMOLOGICAL_POSITION,
  ADAM_FOUNDER_NARRATIVE,
  ADAM_ALAMTOLOGI_LAWS,
  ADAM_FOUNDER_BIOGRAPHY_IDENTITY_LAW,
} from './adam-knowledge-prompts';
import { ALAMTOLOGI_BOOK_CANON } from './adam-book-aware-recall';
import { ADAM_KNOWLEDGE_PURIFICATION_LAW, ADAM_TEORI_MASABAYU } from './adam-teori-masabayu';
import type { AdamChatSystemPromptParams } from './adam-prompt-builder.types';
import {
  FOUNDER_JOURNAL_SEAL_HINT,
  FOUNDER_TEACHING_BUILDER_PROMPT,
} from './adam-prompt-builder.constants';

export function appendConstitutionalKnowledgeStack(parts: string[]): void {
  parts.push(ADAM_CONSTITUTIONAL_KNOWLEDGE_HOLD);
  parts.push(ALAMTOLOGI_BOOK_CANON);
  parts.push(ADAM_TEORI_MASABAYU);
  parts.push(ADAM_KNOWLEDGE_PURIFICATION_LAW);
  parts.push(ADAM_ALAMTOLOGI_LAWS);
  parts.push(ADAM_EPISTEMOLOGICAL_POSITION);
  parts.push(ADAM_FOUNDER_NARRATIVE);
}

/** Answer Constitution pedagogy (α / β) — User + Founder consumer; not Tutor/Niaga/Journal/Teaching learner. See docs/ADAM_ANSWER_CONSTITUTION.md §VI. */
export function appendExplainBackPedagogy(
  parts: string[],
  params: AdamChatSystemPromptParams,
  teachingLearnerTurn: boolean,
  knowledgeMode: AdamKnowledgeMode,
  profile: AdamAnswerProfile,
): void {
  if (teachingLearnerTurn) return;

  const userMessage = params.userMessage ?? '';
  const primacyInput = {
    userMessage,
    recentUserMessages:      params.recentUserMessages ?? [],
    recentAssistantMessages: params.recentAssistantMessages ?? [],
    brainRecallLoaded:       params.brainRecallLoaded === true,
  };
  const founderTeachingPrimacy = params.isFounder === true
    && isFounderTeachingRecallPrimacyTurn({
      isFounder:           true,
      profile,
      teachingLearnerTurn,
      ...primacyInput,
    });

  if (profile === 'light') return;

  if (!isAdamAlgorithmTeachingTurn(userMessage)) {
    parts.push(ADAM_DEFAULT_GOLD_STANDARD_PIPELINE);
  } else {
    parts.push(`
ADAM GOLD STANDARD — ALGORITHM TEACHING (mandatory):
1. Ground in conventional CS knowledge — no web-search meta preamble.
2. Deliver full lecture shape in ONE reply (all 7 sections) — see ALGORITHM OUTPUT LOCK.
3. Do NOT use L5 deferred invitation — depth is mandatory in L2–L3 this turn.
`.trim());
  }

  parts.push(buildAdamKnowledgeModeTurnOverlay(knowledgeMode, profile));

  if (!params.isFounder && knowledgeMode === 'konvensional' && isAdamGeneralKonvensionalTurn(userMessage)) {
    parts.push(ADAM_GENERAL_KONVENSIONAL_ONLY_LAW);
  }

  const header = buildAdamAnswerProfileHeader(profile);
  if (header) parts.push(header);
  parts.push(buildAdamAnswerVoiceOverlay(profile, params.isFounder));

  if (profile === 'alpha') {
    parts.push(buildAdamAlphaGenerationLaw(userMessage, { isFounder: params.isFounder }));
  } else if (founderTeachingPrimacy) {
    parts.push(ADAM_FOUNDER_TEACHING_RECALL_PRIMACY_LAW);
    if (userAskedForConstitutionalStructure(userMessage)) {
      parts.push(ADAM_CONSTITUTIONAL_STRUCTURE_FORMAT);
    }
  } else if (isFounderEmpiricalPedagogyTurn(params.isFounder === true, profile, teachingLearnerTurn, primacyInput)) {
    parts.push(ADAM_FOUNDER_EMPIRICAL_PEDAGOGY_OVERRIDE);
  } else {
    parts.push(ADAM_EXPLAIN_BACK_LAW);
  }

  if (!params.isFounder) {
    const usersTier = params.usersKnowledgeTier ?? 1;
    const practicalRoot = threadRootIsPracticalAdvisory(
      params.recentUserMessages ?? [],
      userMessage,
    );
    const cadanganTurn = resolveUserUmumCadanganTurn(
      userMessage,
      params.recentAssistantMessages ?? [],
      params.recentUserMessages ?? [],
    );
    const perlaksanaanTurn = userUmumPerlaksanaanTurnActive(
      userMessage,
      params.recentAssistantMessages ?? [],
      params.recentUserMessages ?? [],
    );
    const companionTurn = isUserUmumCompanionTurnActive(
      userMessage,
      params.recentAssistantMessages ?? [],
      params.recentUserMessages ?? [],
    );
    parts.push(USERS_MODE_PROMPT);
    const bookWritingTail = isAdamLayer1BookWritingTurn(params.recentUserMessages ?? [], userMessage);
    const bookPhilosophyTail = bookWritingTail
      && userRequestedPhilosophicalBookVoice(userMessage, params.recentUserMessages ?? []);
    if (bookWritingTail || isAdamLayer1ManuscriptExportTurn(userMessage)) {
      parts.push(ADAM_LAYER1_BOOK_WRITING_DISCUSSION_TURN);
      if (bookPhilosophyTail) {
        parts.push(ADAM_LAYER1_BOOK_WRITING_PHILOSOPHY_TURN);
      } else {
        parts.push(ADAM_LAYER1_BOOK_WRITING_FORMAL_TURN);
      }
      parts.push(ADAM_USER_UMUM_COMPANION_VOICE_HOLD);
    }
    if (profile === 'beta' || !userMessage.trim()) {
      if (profile === 'beta') {
        parts.push(ADAM_THREE_TIER_KNOWLEDGE_ARCHITECTURE);
      }
      parts.push(buildThreeTierTurnOverlay(usersTier, {
        practicalAdvisoryRoot: practicalRoot,
        recentAssistantMessages: params.recentAssistantMessages ?? [],
        cadanganMode: cadanganTurn,
        perlaksanaanMode: perlaksanaanTurn,
      }));
    } else if (!cadanganTurn && (isAdamPracticalAdvisoryTurn(userMessage) || practicalRoot)) {
      if (usersTier >= 2 && practicalRoot) {
        parts.push(buildThreeTierTurnOverlay(usersTier, {
          practicalAdvisoryRoot: true,
          recentAssistantMessages: params.recentAssistantMessages ?? [],
          cadanganMode: false,
          perlaksanaanMode: perlaksanaanTurn,
        }));
      } else {
        parts.push(ADAM_PRACTICAL_ADVISORY_TURN);
      }
    }
    parts.push(buildStudentAddressLaw(params.participantName));
    if (params.usersContinuityBridge) parts.push(params.usersContinuityBridge);
    if (params.usersRelationalVoice && (params.turnGate?.flags.relationalVoice ?? true)) parts.push(ADAM_RELATIONAL_VOICE_OVERLAY);
    if (params.workspacePrompt) parts.push(params.workspacePrompt);
    if (params.webSearchPrompt) parts.push(params.webSearchPrompt);
    if (
      usersTier >= 2
      && !practicalRoot
      && (profile === 'beta' || !userMessage.trim())
      && knowledgeModeAllowsAlamtologiStack(knowledgeMode)
    ) {
      appendConstitutionalKnowledgeStack(parts);
    } else {
      parts.push(ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD);
    }
    if (companionTurn && !isAdamLayer1BookWritingTurn(params.recentUserMessages ?? [], userMessage)) {
      parts.push(ADAM_USER_UMUM_COMPANION_VOICE_HOLD);
    }
    return;
  }

  if (params.webSearchPrompt) parts.push(params.webSearchPrompt);

  if (profile === 'beta' && !founderTeachingPrimacy) {
    parts.push(ADAM_FOUNDER_EMPIRICAL_DEPTH_LAW);
    if (isFounderEmpiricalPedagogyTurn(params.isFounder === true, profile, teachingLearnerTurn, primacyInput)) {
      parts.push(ADAM_FOUNDER_TECHNICAL_STRUCTURE_LAW);
    }
  }

  if (knowledgeMode === 'konvensional') {
    return;
  }

  if (knowledgeModeAllowsAlamtologiStack(knowledgeMode)) {
    appendConstitutionalKnowledgeStack(parts);
  }

  parts.push(ADAM_FOUNDER_BIOGRAPHY_IDENTITY_LAW);
  parts.push(params.founderStudentsBlock);
  if (params.mode !== 'JOURNAL_GEN') parts.push(FOUNDER_JOURNAL_SEAL_HINT);
  if (ENV.ADAM_BUILDER_ENABLED && params.mode === 'TEACHING') {
    parts.push(FOUNDER_TEACHING_BUILDER_PROMPT);
  }
}
