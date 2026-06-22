/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Builder — Chat Core
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
  ADAM_CHARACTER_CORE,
  ADAM_CHARACTER_TEACHING_LEARNER,
} from './adam-character';
import { ADAM_CORE_BEHAVIOUR, ADAM_CONVERSATION_GUARDRAILS } from './adam-identity-prompts';
import {
  ADAM_FOUNDER_NARRATIVE,
  ADAM_FOUNDER_BIOGRAPHY_IDENTITY_LAW,
  ADAM_FOUNDER_BIOGRAPHY_OUTPUT_LOCK,
  ADAM_FOUNDER_EPISODE_ATTRIBUTION_OUTPUT_LOCK,
  ADAM_DR_AMINULLAH_OUTPUT_LOCK,
  founderAsksPersonalBiography,
  founderAsksDrAminullahContext,
  founderTurnExcludesPrologEpisodes,
} from './adam-knowledge-prompts';
import {
  ADAM_PERSON_RELATIONAL_IDENTITY_LAW,
  buildPersonIdentityOutputLock,
  listKnownPersonRefs,
  resolvePersonFromMessage,
} from './person-relational-memory.service';
import { ADAM_UNIFIED_SURFACE_HYGIENE } from './adam-users-output-law';
import {
  ADAM_EQ_VIRTUE_FOUNDATION,
  buildAdamEQVirtueTurnOverlay,
} from './adam-eq-virtues';
import {
  ADAM_MEMORY_HONESTY_RULE,
  ADAM_MEMORY_HONESTY_RULE_STUDENT,
  ADAM_MEMORY_HONESTY_WEB_SEARCH_OVERRIDE,
  LAYER1_CHAT_ONLY_PROMPT,
  webSearchPromptNeedsMemoryOverride,
} from './adam-users-prompts';
import { ADAM_USERS_BM_LAW_COMPACT, ADAM_USERS_DELIVERY, ADAM_ALGORITHM_TEACHING_OUTPUT_LOCK } from './adam-users-constitution';
import {
  resolveAdamKnowledgeMode,
  knowledgeModeAllowsConstitutionalLayer5,
  buildAdamKnowledgeModeManifest,
} from './adam-knowledge-mode';
import {
  ADAM_FOUNDER_CONTINUATION_DEPTH_TURN,
  ADAM_FOUNDER_REPLY_REVISION_LAW,
} from './adam-founder-empirical-depth';
import { isAdamPedagogyKonvensionalTurn } from './adam-domain-detectors';
import {
  isAdamContinuationDepthTurn,
  isFounderReplyRevisionDirective,
  isAdamConsumerPlainTurn,
  isAdamSimpleFactualTurn,
  isAdamSimpleArithmeticTurn,
  isAdamLinearAlgebraTurn,
  isAdamHistorySynthesisTurn,
  isAdamVisualDrawTurn,
  isAdamAlgorithmTeachingTurn,
  threadRootIsPracticalAdvisory,
  ADAM_LAYER5_CORE,
  ADAM_LAYER5_FOUNDER,
  ADAM_LAYER5_STUDENT_DELIVERY,
} from './adam-response-generation';
import { ADAM_PROSE_DASH_LAW } from './adam-prose-sanitize';
import {
  ADAM_BAHASA_MELAYU_LAW,
  ADAM_PHILOSOPHER_TEACHER_IDENTITY,
  ADAM_NARRATIVE_DELIVERY,
} from './adam-language-prompts';
import { ALAMTOLOGI_BOOK_CANON } from './adam-book-aware-recall';
import {
  buildAnswerStylePromptBlock,
  ADAM_CONSTITUTIONAL_STRUCTURE_FORMAT,
  ADAM_SIMPLE_FACTUAL_TURN,
  ADAM_SIMPLE_ARITHMETIC_TURN,
  ADAM_LINEAR_ALGEBRA_TURN,
  ADAM_HISTORY_SYNTHESIS_TURN,
  ADAM_PEDAGOGY_CLASSROOM_TURN,
  ADAM_VISUAL_DRAW_TURN,
  ADAM_UNIVERSAL_ALPHA_TURN,
  ADAM_STRUCTURED_SPEC_FORMAT,
  ADAM_PHILOSOPHY_VOICE,
  resolveEffectiveAnswerStyle,
} from './adam-answer-style';
import {
  userAskedForConstitutionalStructure,
  userAskedForStructuredSpecification,
  userAskedForAlamtologi,
} from './adam-universal-voice';
import { ADAM_FOUNDER_ADDRESS_OUTPUT_LAW } from './adam-founder-address-guard';
import { ADAM_WARMTH_VOICE, ADAM_WARMTH_VOICE_TEACHING_LEARNER } from './adam-warmth-voice';
import { ADAM_UNIVERSAL_SCHOLAR_CHARTER } from './adam-universal-scholar';
import { ADAM_CURRENT_AFFAIRS_TURN, isAdamCurrentAffairsTurn } from './adam-current-affairs';
import {
  ADAM_MEMORY_HONESTY_TEACHING_LEARNER_RULE,
  FOUNDER_TEACHING_ABSORPTION_PROMPT,
  FOUNDER_TEACHING_FRAMING_LAW,
  FOUNDER_TEACHING_INQUIRY_PROMPT,
  FOUNDER_TEACHING_INQUIRY_OUTPUT_LOCK,
  FOUNDER_TEACHING_LEARNER_BEHAVIOUR,
  FOUNDER_TEACHING_OUTPUT_LOCK,
  FOUNDER_TEACHING_SYNTHESIS_BEHAVIOUR,
  FOUNDER_TEACHING_SYNTHESIS_OUTPUT_LOCK,
  FOUNDER_TEACHING_SYNTHESIS_PROMPT,
} from './adam-founder-teaching-prompts';
import { resolveAdamAnswerProfile, type AdamAnswerProfile } from './adam-answer-profile';
import { isAdamNiagaMode, buildAdamNiagaSystemPrompt } from './adam-niaga-law';
import {
  isAdamTutorMode,
  shouldApplyAcademicIntentRouting,
  buildAcademicIntentTurnPromptBlock,
} from './adam-tutor-law';
import type { AdamChatSystemPromptParams } from './adam-prompt-builder.types';
import {
  MODE_PROMPTS,
  TEACHING_DIRECTION_LAW,
  FOUNDER_TEACHING_BUILDER_PROMPT,
} from './adam-prompt-builder.constants';
import { appendExplainBackPedagogy } from './adam-prompt-builder.pedagogy';
import { buildAdamTutorSystemPrompt } from './adam-prompt-builder.tutor';
import { appendAdamUsersConsumerTurnParts } from './adam-prompt-builder.chat-users';

export function buildAdamChatSystemPrompt(params: AdamChatSystemPromptParams): string {
  if (isAdamNiagaMode(params.mode) && !params.isFounder) {
    return buildAdamNiagaSystemPrompt({
      participantName: params.participantName,
      niagaProfile:    params.niagaProfile,
      userMessage:     params.userMessage,
    });
  }

  if (isAdamTutorMode(params.mode) && !params.isFounder) {
    return buildAdamTutorSystemPrompt(params);
  }

  const voice = resolveEffectiveAnswerStyle(params.mode, params.answerStyle);
  const teachingAbsorption = params.founderTeachingAbsorption === true;
  const teachingInquiry = params.founderTeachingInquiry === true;
  const teachingSynthesis = params.founderTeachingSynthesis === true;
  const teachingLearnerTurn = teachingAbsorption || teachingInquiry || teachingSynthesis;

  const answerProfile = params.userMessage?.trim()
    ? resolveAdamAnswerProfile({
      message:                  params.userMessage,
      recentUserMessages:       params.recentUserMessages ?? [],
      recentAssistantMessages:  params.recentAssistantMessages ?? [],
      isFounder:                params.isFounder,
    })
    : (params.isFounder
      ? 'light'
      : (params.usersKnowledgeTier != null && params.usersKnowledgeTier >= 2)
        ? 'beta'
        : 'alpha') as AdamAnswerProfile;

  const knowledgeMode = params.knowledgeMode
    ?? params.turnGate?.flags.knowledgeMode
    ?? (params.userMessage?.trim()
      ? resolveAdamKnowledgeMode({
        userMessage:              params.userMessage,
        recentUserMessages:       params.recentUserMessages ?? [],
        recentAssistantMessages:  params.recentAssistantMessages ?? [],
        isFounder:                params.isFounder,
        founderTeachingAbsorption: teachingAbsorption,
        founderTeachingInquiry:   teachingInquiry,
        founderTeachingSynthesis: teachingSynthesis,
        answerProfile,
        usersKnowledgeTier:     params.usersKnowledgeTier,
        turnGate:                 params.turnGate,
      })
      : params.isFounder
        ? 'konstitusi'
        : (params.usersKnowledgeTier != null && params.usersKnowledgeTier >= 2)
          ? 'alamtologi'
          : 'konvensional');

  const characterBlock = params.isFounder && teachingLearnerTurn
    ? ADAM_CHARACTER_TEACHING_LEARNER
    : ADAM_CHARACTER_CORE;

  const behaviourBlock = params.isFounder
    ? (teachingSynthesis
        ? FOUNDER_TEACHING_SYNTHESIS_BEHAVIOUR
        : teachingInquiry
          ? FOUNDER_TEACHING_LEARNER_BEHAVIOUR
          : teachingAbsorption
            ? FOUNDER_TEACHING_LEARNER_BEHAVIOUR
            : ADAM_CORE_BEHAVIOUR)
    : ADAM_CORE_BEHAVIOUR;

  const warmthBlock = params.isFounder && teachingLearnerTurn
    ? ADAM_WARMTH_VOICE_TEACHING_LEARNER
    : ADAM_WARMTH_VOICE;

  const parts: string[] = [characterBlock];

  if (params.isFounder && teachingLearnerTurn) {
    parts.push(
      ADAM_CONVERSATION_GUARDRAILS,
      ADAM_PROSE_DASH_LAW,
      ADAM_FOUNDER_ADDRESS_OUTPUT_LAW,
      behaviourBlock,
      warmthBlock,
      ADAM_BAHASA_MELAYU_LAW,
      TEACHING_DIRECTION_LAW,
    );
  } else if (params.isFounder) {
    parts.push(
      ADAM_CONVERSATION_GUARDRAILS,
      ADAM_PROSE_DASH_LAW,
      ADAM_FOUNDER_ADDRESS_OUTPUT_LAW,
      behaviourBlock,
      warmthBlock,
      ADAM_BAHASA_MELAYU_LAW,
      TEACHING_DIRECTION_LAW,
    );
  } else if (params.mode === 'RESEARCH') {
    parts.push(
      ADAM_CONVERSATION_GUARDRAILS,
      ADAM_PROSE_DASH_LAW,
      behaviourBlock,
      warmthBlock,
      ADAM_BAHASA_MELAYU_LAW,
      ALAMTOLOGI_BOOK_CANON,
      ADAM_FOUNDER_NARRATIVE,
      ADAM_UNIFIED_SURFACE_HYGIENE,
    );
  } else {
    parts.push(
      ADAM_CONVERSATION_GUARDRAILS,
      ADAM_PROSE_DASH_LAW,
      behaviourBlock,
      warmthBlock,
      ADAM_USERS_BM_LAW_COMPACT,
      TEACHING_DIRECTION_LAW,
      ADAM_UNIFIED_SURFACE_HYGIENE,
      ADAM_USERS_DELIVERY,
      LAYER1_CHAT_ONLY_PROMPT,
    );
  }

  parts.push(buildAnswerStylePromptBlock(voice, params.isFounder));
  parts.push(ADAM_EQ_VIRTUE_FOUNDATION);

  const eqVirtueOverlay = params.userMessage?.trim()
    ? buildAdamEQVirtueTurnOverlay({
      factualSurface: params.turnGate
        ? ['factual', 'arithmetic', 'record-superlative', 'definitional'].includes(
          params.turnGate.iq.surfaceKind,
        )
        : undefined,
    })
    : '';
  if (eqVirtueOverlay) parts.push(eqVirtueOverlay);

  if (params.userMessage?.trim() && userAskedForConstitutionalStructure(params.userMessage)) {
    parts.push(ADAM_CONSTITUTIONAL_STRUCTURE_FORMAT);
  }

  if (params.userMessage?.trim() && userAskedForStructuredSpecification(params.userMessage)) {
    parts.push(ADAM_STRUCTURED_SPEC_FORMAT);
  }

  if (params.userMessage?.trim() && isAdamCurrentAffairsTurn(params.userMessage)) {
    parts.push(ADAM_CURRENT_AFFAIRS_TURN);
  }

  if (params.userMessage?.trim() && isAdamPedagogyKonvensionalTurn(params.userMessage)) {
    parts.push(ADAM_PEDAGOGY_CLASSROOM_TURN);
  }

  if (
    params.userMessage?.trim()
    && shouldApplyAcademicIntentRouting(params.mode, { founderTeachingLearnerTurn: teachingLearnerTurn })
    && !isAdamTutorMode(params.mode)
  ) {
    parts.push(buildAcademicIntentTurnPromptBlock({
      userMessage:             params.userMessage,
      recentUserMessages:      params.recentUserMessages,
      recentAssistantMessages: params.recentAssistantMessages,
      profile:                 params.tutorProfile,
    }));
  }

  if (params.userMessage?.trim()) {
    const founderAlphaKonvensional = params.isFounder
      && answerProfile === 'alpha'
      && knowledgeMode === 'konvensional';
    if (
      !params.isFounder
      && isAdamSimpleFactualTurn(params.userMessage)
      && !userAskedForAlamtologi(params.userMessage)
      && !userAskedForConstitutionalStructure(params.userMessage)
    ) {
      parts.push(ADAM_UNIVERSAL_ALPHA_TURN);
      parts.push(ADAM_SIMPLE_FACTUAL_TURN);
      if (isAdamLinearAlgebraTurn(params.userMessage)) {
        parts.push(ADAM_LINEAR_ALGEBRA_TURN);
      } else if (isAdamSimpleArithmeticTurn(params.userMessage)) {
        parts.push(ADAM_SIMPLE_ARITHMETIC_TURN);
      }
      if (isAdamHistorySynthesisTurn(params.userMessage)) {
        parts.push(ADAM_HISTORY_SYNTHESIS_TURN);
      }
      if (isAdamVisualDrawTurn(params.userMessage)) {
        parts.push(ADAM_VISUAL_DRAW_TURN);
      }
    } else if (founderAlphaKonvensional && isAdamSimpleFactualTurn(params.userMessage)) {
      parts.push(ADAM_UNIVERSAL_ALPHA_TURN);
      parts.push(ADAM_SIMPLE_FACTUAL_TURN);
      if (isAdamLinearAlgebraTurn(params.userMessage)) {
        parts.push(ADAM_LINEAR_ALGEBRA_TURN);
      } else if (isAdamSimpleArithmeticTurn(params.userMessage)) {
        parts.push(ADAM_SIMPLE_ARITHMETIC_TURN);
      }
      if (isAdamVisualDrawTurn(params.userMessage)) {
        parts.push(ADAM_VISUAL_DRAW_TURN);
      }
    }
  }


  appendAdamUsersConsumerTurnParts(parts, params, teachingLearnerTurn);

  if (params.isFounder && params.userMessage) {
    if (isFounderReplyRevisionDirective(params.userMessage)) {
      parts.push(ADAM_FOUNDER_REPLY_REVISION_LAW);
      parts.push(ADAM_FOUNDER_CONTINUATION_DEPTH_TURN);
    } else if (isAdamContinuationDepthTurn(params.userMessage)) {
      parts.push(ADAM_FOUNDER_CONTINUATION_DEPTH_TURN);
    }
  }

  const consumerPlain = Boolean(params.userMessage && (
    isAdamConsumerPlainTurn(params.userMessage)
    || isAdamCurrentAffairsTurn(params.userMessage)
    || threadRootIsPracticalAdvisory(params.recentUserMessages ?? [], params.userMessage)
  ));
  if (!params.isFounder && !teachingLearnerTurn && knowledgeMode !== 'alamtologi') {
    parts.push(ADAM_UNIVERSAL_SCHOLAR_CHARTER);
  }

  if (!teachingLearnerTurn && params.userMessage?.trim()) {
    parts.push(buildAdamKnowledgeModeManifest(knowledgeMode));
  }
  if (!params.isFounder && !teachingLearnerTurn && consumerPlain) {
    parts.push(`
CONSUMER PLAIN (direct factual / practical advisory — α):
- L1 facts first from web search when enabled — career/role answers MUST use official sources (NHS, WHO, .gov).
- Practical advisory: full ADAM voice — multi-paragraph prose + penjiwaan OK when facts are search-verified.
- L5 optional: organic close — career fork, Gold Standard follow-up, or depth invitation when it adds value.
- Tier 2 only after user accepts — ONE extra practical section; no values trifold; no faith/Quran on career threads.
- FORBIDDEN: Alamtologi/Quran/Islam labels, Bismillah, stub answers, invented duties/skills without search hits.
`.trim());
  } else if (!params.isFounder && !teachingLearnerTurn && !consumerPlain) {
    parts.push(`
UNIVERSAL SCHOLAR VOICE (User turn — default):
- General + formal. ADAM character — warm, clear — not constitutional performance.
- Follow Answer Profile (α or β) injected below — α: inti first; β: realiti semasa (gambar hidup) first.
- α L5 optional; β L5 mandatory tamparan jiwa — see Explain-Back Law CLOSE.
- Brain C depth only after user accepts the invitation (tier 2+).
`.trim());
  }

  // Philosophy / narrative voice — Founder command only (never student α templates)
  if (
    !teachingLearnerTurn
    && !consumerPlain
    && params.isFounder
  ) {
    parts.push(ADAM_PHILOSOPHER_TEACHER_IDENTITY, ADAM_NARRATIVE_DELIVERY);
    if (voice === 'philosophy') {
      parts.push(ADAM_PHILOSOPHY_VOICE);
    }
  }

  // Mode-specific block
  const modeBlock = MODE_PROMPTS[params.mode];
  if (modeBlock) parts.push(modeBlock);

  // Layer 5 Response Generation — constitutional modes only; not konvensional / teaching learner / journal
  if (
    !teachingLearnerTurn
    && params.mode !== 'JOURNAL_GEN'
    && !consumerPlain
    && knowledgeModeAllowsConstitutionalLayer5(knowledgeMode)
  ) {
    parts.push(ADAM_LAYER5_CORE);
    if (params.isFounder) {
      parts.push(ADAM_LAYER5_FOUNDER);
      if (params.amaTamatBlock?.trim()) {
        parts.push(params.amaTamatBlock.trim());
      }
    } else {
      parts.push(ADAM_LAYER5_STUDENT_DELIVERY);
      if (params.amaTamatBlock?.trim()) {
        parts.push(params.amaTamatBlock.trim());
      }
    }
  }

  // ── 6. Role-specific ─────────────────────────────────────────
  if (params.isFounder) {
    parts.push(ADAM_FOUNDER_BIOGRAPHY_IDENTITY_LAW);
    parts.push(ADAM_PERSON_RELATIONAL_IDENTITY_LAW);
    if (
      params.userMessage?.trim()
      && founderTurnExcludesPrologEpisodes(params.userMessage)
      && !teachingLearnerTurn
    ) {
      parts.push(ADAM_FOUNDER_EPISODE_ATTRIBUTION_OUTPUT_LOCK);
    }
    if (params.userMessage?.trim() && founderAsksPersonalBiography(params.userMessage)) {
      parts.push(ADAM_FOUNDER_BIOGRAPHY_OUTPUT_LOCK);
    }
    if (params.userMessage?.trim() && founderAsksDrAminullahContext(params.userMessage)) {
      parts.push(ADAM_DR_AMINULLAH_OUTPUT_LOCK);
    }
    const personSubject = params.userMessage?.trim()
      ? resolvePersonFromMessage(params.userMessage, listKnownPersonRefs())
      : null;
    if (personSubject) {
      parts.push(buildPersonIdentityOutputLock(personSubject));
    }
    if (teachingSynthesis) {
      parts.push(ALAMTOLOGI_BOOK_CANON);
      parts.push(ADAM_FOUNDER_NARRATIVE);
      parts.push(FOUNDER_TEACHING_SYNTHESIS_PROMPT);
      parts.push(params.founderStudentsBlock);
      if (params.webSearchPrompt) parts.push(params.webSearchPrompt);
      if (ENV.ADAM_BUILDER_ENABLED && params.mode === 'TEACHING') {
        parts.push(FOUNDER_TEACHING_BUILDER_PROMPT);
      }
    } else if (teachingInquiry) {
      parts.push(FOUNDER_TEACHING_FRAMING_LAW);
      parts.push(ADAM_FOUNDER_NARRATIVE);
      parts.push(FOUNDER_TEACHING_INQUIRY_PROMPT);
      parts.push(params.founderStudentsBlock);
      if (ENV.ADAM_BUILDER_ENABLED && params.mode === 'TEACHING') {
        parts.push(FOUNDER_TEACHING_BUILDER_PROMPT);
      }
    } else if (teachingAbsorption) {
      parts.push(FOUNDER_TEACHING_FRAMING_LAW);
      parts.push(ADAM_FOUNDER_NARRATIVE);
      parts.push(FOUNDER_TEACHING_ABSORPTION_PROMPT);
      parts.push(params.founderStudentsBlock);
      if (ENV.ADAM_BUILDER_ENABLED && params.mode === 'TEACHING') {
        parts.push(FOUNDER_TEACHING_BUILDER_PROMPT);
      }
    } else {
      appendExplainBackPedagogy(parts, params, teachingLearnerTurn, knowledgeMode, answerProfile);
    }
  } else {
    appendExplainBackPedagogy(parts, params, teachingLearnerTurn, knowledgeMode, answerProfile);
  }

  // ── 7. Memory honesty — always last (Teaching learner uses session-aware law, not gap templates)
  if (
    !params.isFounder
    && params.userMessage
    && isAdamAlgorithmTeachingTurn(params.userMessage)
  ) {
    parts.push(ADAM_ALGORITHM_TEACHING_OUTPUT_LOCK);
  }
  if (teachingLearnerTurn) {
    parts.push(ADAM_MEMORY_HONESTY_TEACHING_LEARNER_RULE);
  } else {
    parts.push(params.isFounder ? ADAM_MEMORY_HONESTY_RULE : ADAM_MEMORY_HONESTY_RULE_STUDENT);
  }
  if (
    !params.isFounder
    && webSearchPromptNeedsMemoryOverride(params.webSearchPrompt)
  ) {
    parts.push(ADAM_MEMORY_HONESTY_WEB_SEARCH_OVERRIDE);
  }
  if (teachingSynthesis) {
    parts.push(FOUNDER_TEACHING_SYNTHESIS_OUTPUT_LOCK);
  } else if (teachingInquiry) {
    parts.push(FOUNDER_TEACHING_INQUIRY_OUTPUT_LOCK);
  } else if (teachingAbsorption) {
    parts.push(FOUNDER_TEACHING_OUTPUT_LOCK);
  }

  return parts.filter(Boolean).join('\n\n');
}
