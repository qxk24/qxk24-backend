/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Builder
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

import { ENV } from '../config/environments';
import {
  ADAM_CHARACTER_CORE,
  ADAM_CHARACTER_TEACHING_LEARNER,
} from './adam-character';
import { ADAM_CORE_BEHAVIOUR, CONSULT_PHRASE, FOUNDER_STUDENTS_AWARENESS } from './adam-identity-prompts';
import { ADAM_EPISTEMOLOGICAL_POSITION, ADAM_FOUNDER_NARRATIVE, ADAM_ALAMTOLOGI_LAWS, ADAM_FOUNDER_BIOGRAPHY_IDENTITY_LAW, ADAM_FOUNDER_BIOGRAPHY_OUTPUT_LOCK, ADAM_FOUNDER_EPISODE_ATTRIBUTION_OUTPUT_LOCK, ADAM_DR_AMINULLAH_OUTPUT_LOCK, founderAsksPersonalBiography, founderAsksDrAminullahContext, founderTurnExcludesPrologEpisodes } from './adam-knowledge-prompts';
import {
  ADAM_PERSON_RELATIONAL_IDENTITY_LAW,
  buildPersonIdentityOutputLock,
  listKnownPersonRefs,
  resolvePersonFromMessage,
} from './person-relational-memory.service';
import { ADAM_UNIFIED_SURFACE_HYGIENE } from './adam-student-output-law';
import {
  ADAM_MEMORY_HONESTY_RULE,
  ADAM_MEMORY_HONESTY_RULE_STUDENT,
  ADAM_MEMORY_HONESTY_WEB_SEARCH_OVERRIDE,
  LAYER1_CHAT_ONLY_PROMPT,
  STUDENT_MODE_PROMPT,
  webSearchPromptNeedsMemoryOverride,
} from './adam-student-prompts';
import {
  buildStudentAddressLaw,
  ADAM_STUDENT_BM_LAW_COMPACT,
  ADAM_STUDENT_CONTINUATION_DEPTH_TURN,
  ADAM_STUDENT_DELIVERY,
  ADAM_STUDENT_TEACHING_DEPTH_TURN,
} from './adam-student-constitution';
import {
  ADAM_CONSTITUTIONAL_KNOWLEDGE_HOLD,
  ADAM_EXPLAIN_BACK_LAW,
} from './adam-student-explain-back-law';
import {
  buildAdamAlphaGenerationLaw,
  buildAdamAnswerProfileHeader,
  buildAdamAnswerVoiceOverlay,
  resolveAdamAnswerProfile,
  type AdamAnswerProfile,
} from './adam-answer-profile';
import {
  buildAdamKnowledgeModeManifest,
  buildAdamKnowledgeModeTurnOverlay,
  knowledgeModeAllowsAlamtologiStack,
  knowledgeModeAllowsConstitutionalLayer5,
  resolveAdamKnowledgeMode,
  ADAM_GENERAL_KONVENSIONAL_ONLY_LAW,
  isAdamGeneralKonvensionalTurn,
  isAdamGeneralProseKonvensionalTurn,
  type AdamKnowledgeMode,
} from './adam-knowledge-mode';
import { ADAM_DEFAULT_GOLD_STANDARD_PIPELINE } from './adam-search-first';
import {
  isAdamContinuationDepthTurn,
  isAdamConsumerPlainTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamSimpleFactualTurn,
  isAdamSimpleArithmeticTurn,
  isAdamLinearAlgebraTurn,
  isAdamHistorySynthesisTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  isAdamVisualDrawTurn,
  isAdamTeachingDepthTurn,
  threadRootIsPracticalAdvisory,
} from './adam-response-generation';
import { ADAM_CURRENT_AFFAIRS_TURN, isAdamCurrentAffairsTurn } from './adam-current-affairs';
import { ADAM_CONVERSATION_GUARDRAILS } from './adam-identity-prompts';
import { ADAM_PROSE_DASH_LAW } from './adam-prose-sanitize';
import { ADAM_BAHASA_MELAYU_LAW, ADAM_PHILOSOPHER_TEACHER_IDENTITY, ADAM_NARRATIVE_DELIVERY } from './adam-language-prompts';
import { ALAMTOLOGI_BOOK_CANON } from './adam-book-aware-recall';
import { ADAM_KNOWLEDGE_PURIFICATION_LAW, ADAM_TEORI_MASABAYU } from './adam-teori-masabayu';
import {
  buildAnswerStylePromptBlock,
  ADAM_CONSTITUTIONAL_STRUCTURE_FORMAT,
  ADAM_PRACTICAL_ADVISORY_TURN,
  ADAM_SIMPLE_FACTUAL_TURN,
  ADAM_SIMPLE_ARITHMETIC_TURN,
  ADAM_LINEAR_ALGEBRA_TURN,
  ADAM_HISTORY_SYNTHESIS_TURN,
  ADAM_TECHNICAL_KONVENSIONAL_DISPLAY_TURN,
  ADAM_GENERAL_PROSE_KONVENSIONAL_TURN,
  ADAM_VISUAL_DRAW_TURN,
  ADAM_UNIVERSAL_ALPHA_TURN,
  ADAM_STRUCTURED_SPEC_FORMAT,
  resolveEffectiveAnswerStyle,
} from './adam-answer-style';
import { userAskedForConstitutionalStructure, userAskedForStructuredSpecification, userAskedForAlamtologi } from './adam-universal-voice';
import {
  ADAM_WARMTH_VOICE,
  ADAM_WARMTH_VOICE_TEACHING_LEARNER,
} from './adam-warmth-voice';
import {
  ADAM_LAYER5_CORE,
  ADAM_LAYER5_FOUNDER,
  ADAM_LAYER5_STUDENT_DELIVERY,
} from './adam-response-generation';
import {
  ADAM_THREE_TIER_KNOWLEDGE_ARCHITECTURE,
  ADAM_UNIVERSAL_SCHOLAR_CHARTER,
  ADAM_UNIVERSAL_SCHOLAR_MALAY_LAYOUT,
  ADAM_UNIVERSAL_SCHOLAR_MALAY_TECHNICAL_LAYOUT,
  ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD,
  buildThreeTierTurnOverlay,
  type StudentKnowledgeTier,
} from './adam-universal-scholar';
import { JOURNAL_GEN_MANUAL_MODE_PROMPT } from './adam-journal-manual-prompt';
import { RD_INDUSTRY_RESEARCH_MODE_PROMPT } from '../rd-industry/rd-industry-research-prompt';
import {
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
import {
  ADAM_TUTOR_GUARDRAILS,
  ADAM_TUTOR_IDENTITY,
  ADAM_TUTOR_LAW,
  ADAM_TUTOR_OFF_TOPIC_TURN,
  buildAdamTutorTeacherIntroLaw,
  buildAdamTutorProfileBlock,
  buildTutorStudentAddressLaw,
  isAdamTutorMode,
  isAdamTutorOffTopicMessage,
  type AdamTutorProfile,
} from './adam-tutor-law';
import {
  isAdamNiagaMode,
  buildAdamNiagaSystemPrompt,
} from './adam-niaga-law';
import { detectLanguage } from './adam-language-mirror.service';
import type { ADAMAnswerStyle, ADAMChatMode } from './adam.types';

export { CONSULT_PHRASE, FOUNDER_STUDENTS_AWARENESS };

export function founderJournalReviewPath(): string {
  return '/adam/journals/review';
}

export const JOURNAL_GEN_MODE_PROMPT = JOURNAL_GEN_MANUAL_MODE_PROMPT;

const TEACHING_DIRECTION_LAW = `
LAW OF TEACHING DIRECTION:
Allah → Al-Quran → Alamtologi → P.alt Masa Bayu → ADAM → students and the world.

In the Teaching room P.alt is the teacher; ADAM is the learner.
ADAM learns naturally and explains back in detail what P.alt gave — section by section, so P.alt can verify before the next bab.
ADAM does NOT lecture P.alt, add new book structures, or remap his teaching to the framework
unless P.alt explicitly asks ADAM to reflect back or mirror constitutionally.
ADAM asks short clarifying questions as a learner — never as a lecturer offering menus.

With students: ADAM carries what he has learned and understood of Alamtologi — his own mature synthesis for each question, not a copy of P.alt's words.
`.trim();

const FOUNDER_JOURNAL_SEAL_HINT = `
FOUNDER JOURNAL SEAL (P.alt only):
When P.alt asks to seal, save, or submit a journal, include the full analysed manuscript in:
<adam_journal_seal>{JSON}</adam_journal_seal>
with title, abstract, content (IMRaD + seven-principle alamtologiAnalysis),
hukumZAnalysis, judgment, tahapAkalAchieved, cVLevel, reviewNotes.
In alamtologiAnalysis use ONLY: MASA, TENAGA, AIR, API, BUMI, CAHAYA, RUANG.
The tag is stripped from chat; the system saves to ${founderJournalReviewPath()}.
NEVER claim a journal is saved unless you emitted <adam_journal_seal> JSON in that reply.
Real journal numbers are ALM-J{year}-{seq} assigned only on publish.

TEACHING RECORDS:
When [ADAM TEACHING RECORDS] is injected, you may say "I remember" only for
episodes listed there. Do not invent autobiography beyond those records.

BIOGRAPHY IDENTITY:
When P.alt asks about his life story, use ONLY ADAM_FOUNDER_NARRATIVE facts for P.alt.
Dr Aminullah and other figures are separate people — never merge their episodes into P.alt's life.
See ADAM_FOUNDER_BIOGRAPHY_IDENTITY_LAW.

RELATIONAL MEMORY:
When [ADAM RELATIONAL MEMORY] is injected, speak from the family arc summaries —
who ADAM has become across sessions. This is broad continuity, not a dated episode.
`.trim();

const FOUNDER_TEACHING_BUILDER_PROMPT = `
BUILDER DURING TEACHING (P.alt — same chat thread):
Builder runs only when P.alt explicitly activates it:
message starts with "Build:" or "/build", or the BUILDER mode chip is selected.
Natural teaching stays in Teaching voice — do not expect the build drawer unless activated.
When Builder is active, do NOT invent file edits in markdown — the drawer shows real MCP steps.
When [MAC BRIDGE] is ONLINE, use list_directory / read_file (mac:Desktop/qxk24/…);
if OFFLINE, ask P.alt to run mac-bridge once.
`.trim();

const MODE_PROMPTS: Partial<Record<ADAMChatMode, string>> = {
  JOURNAL_GEN: JOURNAL_GEN_MANUAL_MODE_PROMPT,
  RESEARCH:    RD_INDUSTRY_RESEARCH_MODE_PROMPT,
};

export interface AdamChatSystemPromptParams {
  mode:                     ADAMChatMode;
  answerStyle?:             ADAMAnswerStyle;
  isFounder:                boolean;
  participantName:          string;
  workspacePrompt?:         string;
  founderStudentsBlock:     string;
  webSearchPrompt?:         string;
  studentContinuityBridge?: string;
  /** Founder TEACHING — learner absorption (not constitutional mirror) */
  founderTeachingAbsorption?: boolean;
  /** Founder TEACHING — ilmu konvensional + isu dunia + web search */
  founderTeachingSynthesis?: boolean;
  /** Founder TEACHING — Phase B real situation inquiry */
  founderTeachingInquiry?: boolean;
  /** AMA Tamat Kotak 20–22 anchor (Tahap 2 Layer 5) */
  amaTamatBlock?:          string;
  /** 1 = konvensional, 2 = Alamtologi opt-in, 3 = Quran opt-in */
  studentKnowledgeTier?:  StudentKnowledgeTier;
  /** Recent user turns — practical thread detection for tier overlay and guards. */
  recentUserMessages?:    string[];
  /** Recent assistant turns — essay-loop detection for tier overlay. */
  recentAssistantMessages?: string[];
  /** Current user message — enables per-turn depth overlay (any subject). */
  userMessage?:            string;
  /** ADAM Tutor lane — conventional academics only (no Alamtologi stack). */
  tutorProfile?:           AdamTutorProfile;
  /** ADAM Niaga lane — Malaysia SME business profile */
  niagaProfile?:           import('./adam-niaga-law').AdamNiagaBusinessProfile;
  /** Dedicated knowledge surface — resolved per turn when omitted */
  knowledgeMode?:          AdamKnowledgeMode;
}

/**
 * Assembles the system prompt for each conversation turn.
 *
 * Unified ADAM (Founder decree): Users receive the same character, warmth,
 * Layer 5, and knowledge stack as Founder chat — hygiene-only surface rules differ.
 */
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
    : 'light' as AdamAnswerProfile;

  const knowledgeMode = params.knowledgeMode ?? (params.userMessage?.trim()
    ? resolveAdamKnowledgeMode({
      userMessage:              params.userMessage,
      recentUserMessages:       params.recentUserMessages ?? [],
      recentAssistantMessages:  params.recentAssistantMessages ?? [],
      isFounder:                params.isFounder,
      founderTeachingAbsorption: teachingAbsorption,
      founderTeachingInquiry:   teachingInquiry,
      founderTeachingSynthesis: teachingSynthesis,
      answerProfile,
      studentKnowledgeTier:     params.studentKnowledgeTier,
    })
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
      behaviourBlock,
      warmthBlock,
      ADAM_BAHASA_MELAYU_LAW,
      TEACHING_DIRECTION_LAW,
    );
  } else if (params.isFounder) {
    parts.push(
      ADAM_CONVERSATION_GUARDRAILS,
      ADAM_PROSE_DASH_LAW,
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
      ADAM_STUDENT_BM_LAW_COMPACT,
      TEACHING_DIRECTION_LAW,
      ADAM_UNIFIED_SURFACE_HYGIENE,
      ADAM_STUDENT_DELIVERY,
      LAYER1_CHAT_ONLY_PROMPT,
    );
  }

  parts.push(buildAnswerStylePromptBlock(voice, params.isFounder));

  if (params.userMessage?.trim() && userAskedForConstitutionalStructure(params.userMessage)) {
    parts.push(ADAM_CONSTITUTIONAL_STRUCTURE_FORMAT);
  }

  if (params.userMessage?.trim() && userAskedForStructuredSpecification(params.userMessage)) {
    parts.push(ADAM_STRUCTURED_SPEC_FORMAT);
  }

  if (params.userMessage?.trim() && isAdamCurrentAffairsTurn(params.userMessage)) {
    parts.push(ADAM_CURRENT_AFFAIRS_TURN);
  }

  if (params.userMessage?.trim()) {
    if (
      isAdamSimpleFactualTurn(params.userMessage)
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
    }
  }

  if (!params.isFounder && params.userMessage) {
    if (isAdamPracticalAdvisoryTurn(params.userMessage)) {
      parts.push(ADAM_PRACTICAL_ADVISORY_TURN);
    } else if (isAdamContinuationDepthTurn(params.userMessage)) {
      parts.push(ADAM_STUDENT_CONTINUATION_DEPTH_TURN);
    } else if (isAdamTeachingDepthTurn(params.userMessage)) {
      parts.push(ADAM_STUDENT_TEACHING_DEPTH_TURN);
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

  if (!params.isFounder && !teachingLearnerTurn && params.userMessage?.trim()) {
    const locale = detectLanguage(params.userMessage.trim()).detectedLocale;
    if (locale === 'ms' || locale === 'mixed-ms-en') {
      if (isAdamTechnicalKonvensionalDisplayTurn(params.userMessage)) {
        parts.push(ADAM_UNIVERSAL_SCHOLAR_MALAY_TECHNICAL_LAYOUT);
      } else {
        parts.push(ADAM_UNIVERSAL_SCHOLAR_MALAY_LAYOUT);
      }
    }
    if (isAdamTechnicalKonvensionalDisplayTurn(params.userMessage)) {
      parts.push(ADAM_TECHNICAL_KONVENSIONAL_DISPLAY_TURN);
    } else if (isAdamGeneralProseKonvensionalTurn(params.userMessage)) {
      parts.push(ADAM_GENERAL_PROSE_KONVENSIONAL_TURN);
    }
  }

  // Philosophy / narrative voice — founder only; not on konvensional or consumer plain turns
  if (
    !teachingLearnerTurn
    && !consumerPlain
    && params.isFounder
    && knowledgeMode !== 'konvensional'
  ) {
    if (voice === 'philosophy') {
      parts.push(ADAM_PHILOSOPHER_TEACHER_IDENTITY, ADAM_NARRATIVE_DELIVERY);
    } else if (voice === 'natural') {
      parts.push(ADAM_NARRATIVE_DELIVERY);
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

  // ── 7. Memory honesty — always last (web-search override wins on student search turns)
  parts.push(params.isFounder ? ADAM_MEMORY_HONESTY_RULE : ADAM_MEMORY_HONESTY_RULE_STUDENT);
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

function appendConstitutionalKnowledgeStack(parts: string[]): void {
  parts.push(ADAM_CONSTITUTIONAL_KNOWLEDGE_HOLD);
  parts.push(ALAMTOLOGI_BOOK_CANON);
  parts.push(ADAM_TEORI_MASABAYU);
  parts.push(ADAM_KNOWLEDGE_PURIFICATION_LAW);
  parts.push(ADAM_ALAMTOLOGI_LAWS);
  parts.push(ADAM_EPISTEMOLOGICAL_POSITION);
  parts.push(ADAM_FOUNDER_NARRATIVE);
}

/** Answer Constitution pedagogy (α / β) — User + Founder consumer; not Tutor/Niaga/Journal/Teaching learner. See docs/ADAM_ANSWER_CONSTITUTION.md §VI. */
function appendExplainBackPedagogy(
  parts: string[],
  params: AdamChatSystemPromptParams,
  teachingLearnerTurn: boolean,
  knowledgeMode: AdamKnowledgeMode,
  profile: AdamAnswerProfile,
): void {
  if (teachingLearnerTurn) return;

  const userMessage = params.userMessage ?? '';

  if (profile === 'light') return;

  parts.push(ADAM_DEFAULT_GOLD_STANDARD_PIPELINE);
  parts.push(buildAdamKnowledgeModeTurnOverlay(knowledgeMode, profile));

  if (!params.isFounder && knowledgeMode === 'konvensional' && isAdamGeneralKonvensionalTurn(userMessage)) {
    parts.push(ADAM_GENERAL_KONVENSIONAL_ONLY_LAW);
  }

  const header = buildAdamAnswerProfileHeader(profile);
  if (header) parts.push(header);
  parts.push(buildAdamAnswerVoiceOverlay(profile, params.isFounder));

  if (profile === 'alpha') {
    parts.push(buildAdamAlphaGenerationLaw(userMessage));
  } else {
    parts.push(ADAM_EXPLAIN_BACK_LAW);
  }

  if (!params.isFounder) {
    const studentTier = params.studentKnowledgeTier ?? 1;
    const practicalRoot = threadRootIsPracticalAdvisory(
      params.recentUserMessages ?? [],
      userMessage,
    );
    parts.push(STUDENT_MODE_PROMPT);
    if (profile === 'beta') {
      parts.push(ADAM_THREE_TIER_KNOWLEDGE_ARCHITECTURE);
      parts.push(buildThreeTierTurnOverlay(studentTier, {
        practicalAdvisoryRoot: practicalRoot,
        recentAssistantMessages: params.recentAssistantMessages ?? [],
      }));
    } else if (isAdamPracticalAdvisoryTurn(userMessage) || practicalRoot) {
      parts.push(ADAM_PRACTICAL_ADVISORY_TURN);
    }
    parts.push(buildStudentAddressLaw(params.participantName));
    if (params.studentContinuityBridge) parts.push(params.studentContinuityBridge);
    if (params.workspacePrompt) parts.push(params.workspacePrompt);
    if (params.webSearchPrompt) parts.push(params.webSearchPrompt);
    if (knowledgeModeAllowsAlamtologiStack(knowledgeMode) && studentTier >= 2 && !practicalRoot && profile === 'beta') {
      appendConstitutionalKnowledgeStack(parts);
    } else {
      parts.push(ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD);
    }
    return;
  }

  if (params.webSearchPrompt) parts.push(params.webSearchPrompt);

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

/** ADAM Tutor — separate product lane; no Alamtologi / Explain-Back constitutional stack. */
function buildAdamTutorSystemPrompt(params: AdamChatSystemPromptParams): string {
  const parts: string[] = [
    ADAM_TUTOR_IDENTITY,
    buildAdamTutorTeacherIntroLaw(params.tutorProfile),
    ADAM_TUTOR_GUARDRAILS,
    ADAM_PROSE_DASH_LAW,
    ADAM_BAHASA_MELAYU_LAW,
    buildAdamTutorProfileBlock(params.tutorProfile),
    ADAM_TUTOR_LAW,
  ];

  if (params.userMessage?.trim() && isAdamTutorOffTopicMessage(params.userMessage)) {
    parts.push(ADAM_TUTOR_OFF_TOPIC_TURN);
  }

  if (params.webSearchPrompt) parts.push(params.webSearchPrompt);
  parts.push(buildTutorStudentAddressLaw(params.participantName));
  parts.push(ADAM_MEMORY_HONESTY_RULE_STUDENT);
  if (webSearchPromptNeedsMemoryOverride(params.webSearchPrompt)) {
    parts.push(ADAM_MEMORY_HONESTY_WEB_SEARCH_OVERRIDE);
  }

  return parts.filter(Boolean).join('\n\n');
}
