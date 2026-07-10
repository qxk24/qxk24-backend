/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Builder — Users Turn Overlays
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

import { isUsersTechnicalPlan } from './adam-answer-plan';
import { isAdamPedagogyKonvensionalTurn } from './adam-domain-detectors';
import {
  resolveAdamUsersDomainFacet,
  usersDomainUsesTeachingPack,
} from './adam-users-domain-router';
import {
  isAdamContinuationDepthTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamScienceNatureSynthesisTurn,
  isAdamCompareTurn,
  isAdamAlgorithmTeachingTurn,
  isAdamLayer1BookWritingTurn,
  isAdamLayer1ManuscriptExportTurn,
  isAdamTeachingDepthTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  userRequestedPhilosophicalBookVoice,
} from './adam-response-generation';
import { isAdamGeneralProseKonvensionalTurn } from './adam-knowledge-mode';
import {
  ADAM_PROSE_CRAFT_ESSAY_LAYOUT,
  ADAM_PROSE_CRAFT_TURN,
  isAdamProseCraftTurn,
} from './adam-prose-craft';
import { detectLanguage } from './adam-language-mirror.service';
import {
  ADAM_PRACTICAL_ADVISORY_TURN,
  ADAM_TECHNICAL_KONVENSIONAL_DISPLAY_TURN,
  ADAM_GENERAL_PROSE_KONVENSIONAL_TURN,
  ADAM_LAYER1_BOOK_WRITING_FORMAL_TURN,
  ADAM_LAYER1_BOOK_WRITING_PHILOSOPHY_TURN,
} from './adam-answer-style';
import {
  ADAM_LAYER1_BOOK_WRITING_DISCUSSION_TURN,
  ADAM_LAYER1_BOOK_WRITING_CADANGAN_TURN,
} from './adam-users-prompts';
import {
  ADAM_UNIVERSAL_SHAPE_DEFINITIONAL,
  ADAM_UNIVERSAL_SHAPE_COMPARATIVE,
  ADAM_UNIVERSAL_SHAPE_COMPARATIVE_FORMAL_DATA,
  ADAM_USERS_CONTINUATION_DEPTH_TURN,
  ADAM_USERS_TEACHING_DEPTH_TURN,
  ADAM_USERS_TEACHING_STRUCTURED_LAYOUT,
  ADAM_USERS_COMPARE_DEPTH_TURN,
  ADAM_USERS_ALGORITHM_TEACHING_TURN,
  ADAM_USERS_DIRECT_TECHNICAL_TURN,
  ADAM_USERS_DIRECT_TECHNICAL_LAYOUT,
} from './adam-users-constitution';
import {
  ADAM_USER_UMUM_PERLAKSANAAN_TURN,
  ADAM_USER_UMUM_CADANGAN_TURN,
  ADAM_USER_UMUM_COMPANION_VOICE_HOLD,
  ADAM_UNIVERSAL_SCHOLAR_MALAY_LAYOUT,
  ADAM_UNIVERSAL_SCHOLAR_MALAY_TECHNICAL_LAYOUT,
  userUmumPerlaksanaanTurnActive,
  resolveUserUmumCadanganTurn,
  isUserUmumCompanionTurnActive,
} from './adam-universal-scholar';
import {
  buildUsersDomainPromptBlock,
  buildUsersDomainFormalLayoutBlock,
  buildUsersDomainUniversalProseBlock,
} from './adam-users-domain-prompts';
import type { AdamChatSystemPromptParams } from './adam-prompt-builder.types';

/** Users consumer turn — domain routing, book-writing, cadangan/perlaksanaan overlays. */
export function appendAdamUsersConsumerTurnParts(
  parts: string[],
  params: AdamChatSystemPromptParams,
  teachingLearnerTurn: boolean,
): void {
  if (!params.isFounder && params.userMessage) {
    const recentAssistant = params.recentAssistantMessages ?? [];
    const recentUser = params.recentUserMessages ?? [];
    const perlaksanaanTurn = userUmumPerlaksanaanTurnActive(
      params.userMessage,
      recentAssistant,
      recentUser,
    );
    const cadanganTurn = resolveUserUmumCadanganTurn(
      params.userMessage,
      recentAssistant,
      recentUser,
    );
    const companionTurn = isUserUmumCompanionTurnActive(
      params.userMessage,
      recentAssistant,
      recentUser,
    );
    const usersDirectRoute = params.turnGate
      ? params.turnGate.flags.usersTechnicalFinalize
      : Boolean(params.answerPlan && isUsersTechnicalPlan(params.answerPlan));
    const domainFacet = params.turnGate
      ? params.turnGate.iq.domainFacet
      : (params.answerPlan?.usersDomain
        ?? resolveAdamUsersDomainFacet(params.userMessage, { recentUserMessages: recentUser }));
    const domainTeachingPack = params.turnGate
      ? params.turnGate.flags.domainTeachingPack
      : usersDomainUsesTeachingPack(domainFacet);
    const bookWritingTurn = isAdamLayer1BookWritingTurn(recentUser, params.userMessage);
    const scienceNatureTurn = !bookWritingTurn
      && isAdamScienceNatureSynthesisTurn(params.userMessage ?? '');
    const bookPhilosophyOptIn = bookWritingTurn
      && !scienceNatureTurn
      && userRequestedPhilosophicalBookVoice(params.userMessage, recentUser);

    const pushUsersShapeBlocks = () => {
      const userMsg = params.userMessage ?? '';
      const shapeIntent = params.answerPlan?.answerShape?.intent;
      const formalLayout = params.turnGate?.flags.formalDisplayLaw === true
        || params.answerPlan?.answerShape?.formalDataLayout === true;
      if (shapeIntent === 'comparative') {
        parts.push(ADAM_UNIVERSAL_SHAPE_COMPARATIVE);
        if (formalLayout) {
          parts.push(ADAM_UNIVERSAL_SHAPE_COMPARATIVE_FORMAL_DATA);
        }
      } else if (
        shapeIntent === 'definitional'
        || shapeIntent === 'compound'
        || shapeIntent === 'general'
        || shapeIntent === 'causal'
      ) {
        parts.push(ADAM_UNIVERSAL_SHAPE_DEFINITIONAL);
      } else if (isAdamCompareTurn(userMsg)) {
        parts.push(ADAM_UNIVERSAL_SHAPE_COMPARATIVE);
        if (formalLayout) {
          parts.push(ADAM_UNIVERSAL_SHAPE_COMPARATIVE_FORMAL_DATA);
        }
      } else if (isAdamAlgorithmTeachingTurn(userMsg)) {
        parts.push(ADAM_USERS_ALGORITHM_TEACHING_TURN);
      }
    };

    if (isAdamProseCraftTurn(params.userMessage)) {
      parts.push(ADAM_PROSE_CRAFT_TURN);
    } else if (
      !scienceNatureTurn
      && (bookWritingTurn || isAdamLayer1ManuscriptExportTurn(params.userMessage))
    ) {
      parts.push(ADAM_LAYER1_BOOK_WRITING_DISCUSSION_TURN);
      if (bookPhilosophyOptIn) {
        parts.push(ADAM_LAYER1_BOOK_WRITING_PHILOSOPHY_TURN);
      } else {
        parts.push(ADAM_LAYER1_BOOK_WRITING_FORMAL_TURN);
      }
      parts.push(ADAM_USER_UMUM_COMPANION_VOICE_HOLD);
    }
    if (perlaksanaanTurn) {
      parts.push(ADAM_USER_UMUM_PERLAKSANAAN_TURN);
    } else if (cadanganTurn) {
      if (bookWritingTurn && !scienceNatureTurn) {
        parts.push(ADAM_LAYER1_BOOK_WRITING_CADANGAN_TURN);
      } else {
        parts.push(ADAM_USER_UMUM_CADANGAN_TURN);
      }
    } else if (domainTeachingPack && !bookWritingTurn) {
      const domainBlock = buildUsersDomainPromptBlock(domainFacet);
      if (domainBlock) parts.push(domainBlock);
      if (params.answerPlan?.answerShape?.formalDataLayout) {
        const formalBlock = buildUsersDomainFormalLayoutBlock(domainFacet);
        if (formalBlock) parts.push(formalBlock);
      }
      parts.push(ADAM_USERS_TEACHING_DEPTH_TURN);
      parts.push(ADAM_USERS_TEACHING_STRUCTURED_LAYOUT);
      if (isAdamCompareTurn(params.userMessage)) {
        parts.push(ADAM_USERS_COMPARE_DEPTH_TURN);
      }
      if (isAdamAlgorithmTeachingTurn(params.userMessage)) {
        parts.push(ADAM_USERS_ALGORITHM_TEACHING_TURN);
      }
      if (usersDirectRoute) {
        parts.push(ADAM_USERS_DIRECT_TECHNICAL_TURN);
        pushUsersShapeBlocks();
      } else {
        pushUsersShapeBlocks();
      }
    } else {
      const universalProse = buildUsersDomainUniversalProseBlock(domainFacet);
      if (universalProse) {
        parts.push(universalProse);
      } else if (usersDirectRoute) {
        parts.push(ADAM_USERS_DIRECT_TECHNICAL_TURN);
        parts.push(ADAM_USERS_DIRECT_TECHNICAL_LAYOUT);
        const shapeIntent = params.answerPlan?.answerShape?.intent;
        if (shapeIntent === 'comparative') {
          parts.push(ADAM_UNIVERSAL_SHAPE_COMPARATIVE);
          if (params.answerPlan?.answerShape?.formalDataLayout) {
            parts.push(ADAM_UNIVERSAL_SHAPE_COMPARATIVE_FORMAL_DATA);
          }
        } else if (shapeIntent === 'definitional' || shapeIntent === 'compound') {
          parts.push(ADAM_UNIVERSAL_SHAPE_DEFINITIONAL);
        } else if (isAdamCompareTurn(params.userMessage)) {
          parts.push(ADAM_UNIVERSAL_SHAPE_COMPARATIVE);
        } else if (isAdamAlgorithmTeachingTurn(params.userMessage)) {
          parts.push(ADAM_USERS_ALGORITHM_TEACHING_TURN);
        }
      } else if (isAdamCompareTurn(params.userMessage)) {
        parts.push(ADAM_USERS_TEACHING_DEPTH_TURN);
        parts.push(ADAM_USERS_COMPARE_DEPTH_TURN);
      } else if (isAdamPracticalAdvisoryTurn(params.userMessage)) {
        parts.push(ADAM_PRACTICAL_ADVISORY_TURN);
      } else if (isAdamContinuationDepthTurn(params.userMessage)) {
        parts.push(ADAM_USERS_CONTINUATION_DEPTH_TURN);
      } else if (
        isAdamScienceNatureSynthesisTurn(params.userMessage)
        || (
          !bookWritingTurn
          && isAdamTeachingDepthTurn(params.userMessage)
        )
      ) {
        parts.push(ADAM_USERS_TEACHING_DEPTH_TURN);
        parts.push(ADAM_USERS_TEACHING_STRUCTURED_LAYOUT);
        if (isAdamAlgorithmTeachingTurn(params.userMessage)) {
          parts.push(ADAM_USERS_ALGORITHM_TEACHING_TURN);
        }
      }
    }
    if (companionTurn && !isAdamLayer1BookWritingTurn(recentUser, params.userMessage)) {
      parts.push(ADAM_USER_UMUM_COMPANION_VOICE_HOLD);
    }
  }

  if (!params.isFounder && !teachingLearnerTurn && params.userMessage?.trim()) {
    const locale = detectLanguage(params.userMessage.trim()).detectedLocale;
    const bookWritingLocale = isAdamLayer1BookWritingTurn(
      params.recentUserMessages ?? [],
      params.userMessage,
    );
    const usersDirectRoute = params.turnGate
      ? params.turnGate.flags.usersTechnicalFinalize
      : Boolean(params.answerPlan && isUsersTechnicalPlan(params.answerPlan));
    const usersTechnicalLegacy = !bookWritingLocale && !params.turnGate && !usersDirectRoute && (
      isAdamTechnicalKonvensionalDisplayTurn(params.userMessage)
      || isAdamTeachingDepthTurn(params.userMessage)
      || isAdamScienceNatureSynthesisTurn(params.userMessage)
      || isAdamCompareTurn(params.userMessage)
    );
    if (locale === 'ms' || locale === 'mixed-ms-en') {
      if (!usersDirectRoute && usersTechnicalLegacy && !bookWritingLocale) {
        parts.push(ADAM_UNIVERSAL_SCHOLAR_MALAY_TECHNICAL_LAYOUT);
      } else if (!usersDirectRoute && isAdamProseCraftTurn(params.userMessage)) {
        parts.push(ADAM_PROSE_CRAFT_ESSAY_LAYOUT);
      } else if (!usersDirectRoute && !bookWritingLocale) {
        parts.push(ADAM_UNIVERSAL_SCHOLAR_MALAY_LAYOUT);
      }
    }
    if (usersDirectRoute) {
      // Users answerPlan route — DIRECT_TECHNICAL blocks only (no Ringkasnya essence law).
    } else if (usersTechnicalLegacy && !bookWritingLocale) {
      parts.push(ADAM_TECHNICAL_KONVENSIONAL_DISPLAY_TURN);
    } else if (isAdamProseCraftTurn(params.userMessage)) {
      // ADAM_PROSE_CRAFT_TURN already injected — no hybrid bullet layout.
    } else if (!bookWritingLocale && isAdamGeneralProseKonvensionalTurn(params.userMessage)) {
      parts.push(ADAM_GENERAL_PROSE_KONVENSIONAL_TURN);
    }
  }
}
