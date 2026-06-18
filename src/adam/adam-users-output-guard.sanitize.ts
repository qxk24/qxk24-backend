/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Guard — sync sanitize
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * Updated     : 2026-06-09 — constitutional/faith/performance leak strip
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Light post-stream sync — format hygiene only. No LLM rewrite.
 * Voice and form come from Layer 5 prompts at generation time.
 */
import { repairFounderKonvensionalSurface } from './adam-founder-konvensional-surface';
import { resolveTechnicalPrecisionTurn, sanitizeTechnicalPrecisionOutput } from './adam-factual-grounding';
import {
  repairStaleOfficeHolderOutput,
  stripCurrentAffairsCoachingTail,
} from './adam-current-affairs';
import {
  normalizeConsumerParagraphBreaks,
  polishStudentOutputSurface,
  rewriteDualLaneEssayLabels,
  rewriteEmojiPerformanceOpeners,
  sanitizeUsersForbiddenPronouns,
  stripPlanTesterAddress,
  stripSciencePoeticInline,
  stripSciencePhilosophyEssayInline,
  stripMediaRefusalInline,
  stripScienceFaithInline,
  stripKonvensionalAlamtologiTailInline,
  stripLifeStressFaithInline,
  stripSunomNotation,
  repairTeachingStructuredOutput,
  stripConsumerMarkdownEmphasis,
  stripUsersBismillahOpener,
  stripWebSearchAttributionInline,
  clampTechnicalMarkdownBold,
} from './adam-users-output-law';
import {
  userOpenedFaithDoor,
  isTechnicalPrecisionQuestion,
  outputLooksLikeStructuredSpec,
  userAskedForConstitutionalStructure,
  userAskedForStructuredSpecification,
  userAskedForAlamtologi,
} from './adam-universal-voice';
import {
  countRecentUniversalScholarDoors,
  userRequestedPracticalDepth,
  appendUniversalScholarTier1DoorIfMissing,
  userUmumPerlaksanaanTurnActive,
  resolveUserUmumCadanganTurn,
  repairUserUmumCompanionOutput,
  isUserUmumCompanionTurnActive,
  stripUserUmumCadanganInterrogativeCloses,
  stripMisplacedPracticalCareerDoor,
  stripAlamtologiPromotionInline,
  UNIVERSAL_SCHOLAR_DOOR_EN,
} from './adam-universal-scholar';
import { repairPracticalAdvisoryGoldShape } from './adam-practical-advisory-gold';
import { normalizeGoldStandardFollowUpClosing, stripRedundantAlphaGoldStandardClose } from './adam-gold-standard';
import {
  isAdamConsumerPlainTurn,
  isAdamContinuationDepthTurn,
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamSimpleFactualTurn,
  isAdamSimpleArithmeticTurn,
  isAdamScienceNatureSynthesisTurn,
  isAdamHistorySynthesisTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  isAdamSubstantiveTurn,
  isAdamVisualDrawTurn,
  isAdamCompareTurn,
  isAdamLifeWellbeingTurn,
  isAdamTeachingDepthTurn,
  isAdamAlgorithmTeachingTurn,
  isAdamAccessibleHybridFormatTurn,
  isAdamLayer1BookWritingTurn,
  isAdamUserGuidanceCoachingTurn,
  repairAdamProductRedirectLeak,
  threadRootIsPracticalAdvisory,
} from './adam-response-generation';
import { isAdamProseCraftTurn, polishProseCraftOutput } from './adam-prose-craft';
import { isAdamCurrentAffairsTurn, isVerifiedDataStatAsk } from './adam-web-search';
import { resolveAdamAnswerProfile, userOptedIntoStudentExplainBackBeta } from './adam-answer-profile';
import { repairAlphaStatSurface } from './adam-alpha-output-guard';
import { collapseSimpleArithmeticAlphaOutput } from './adam-arithmetic-alpha-guard';
import { repairVisualDrawOutput } from './adam-visual-draw-guard';
import { repairTechnicalDiagramOutput, stripGenericTechnicalDiagrams } from './adam-technical-diagram-guard';
import {
  repairTechnicalKonvensionalDisplayStructure,
  stripHomeworkCadanganBlock,
} from './adam-technical-display-structure';
import { isAdamMediaSearchTurn } from './adam-media-search';
import { stripUnsolicitedAdamChatMedia } from './adam-media-guard';
import { repairAlgorithmTeachingOutput } from './adam-algorithm-teaching-repair';
import { applyUsersHaiGreetingPolicy } from './adam-users-constitution';
import { detectLanguage } from './adam-language-mirror.service';
import { sanitizeMalaysiaBmDrift } from './adam-malaysia-bm-guard';
import { isAdamGeneralKonvensionalTurn, shouldStripKonvensionalFrameworkLeaks } from './adam-knowledge-mode';
import {
  inlineQuranAyat,
  stashStudentMathBlocks,
  restoreStudentMathBlocks,
  stripFrameworkBillboards,
} from './adam-users-output-guard.framework';
import { filterUsersSanitizeParagraphs } from './adam-users-output-guard.sanitize-paragraphs';

/** Sync hygiene only — ADAM voice must not be gutted post-stream. */
export function sanitizeUsersOutputSync(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  participantName?: string,
  options?: {
    enforceUsersGreeting?: boolean;
    isFounder?: boolean;
    usersTechnicalDirect?: boolean;
    /** Turn Gate fuse — authoritative faith permission. */
    gateFaithPermitted?: boolean;
    /** Turn Gate fuse — IQ konvensional analytic surface. */
    gateKonvensionalSurface?: boolean;
  },
): string {
  if (options?.isFounder) {
    return repairFounderKonvensionalSurface(text, userMessage, recentUserMessages);
  }

  // ADAM-α stat turns — meta/orphan strip only; never run tier-1 paragraph gutting.
  if (isVerifiedDataStatAsk(userMessage) && !isAdamSimpleArithmeticTurn(userMessage)) {
    return repairAlphaStatSurface(text, userMessage);
  }

  if (
    isAdamVisualDrawTurn(userMessage)
    && !userAskedForAlamtologi(userMessage)
    && !userAskedForConstitutionalStructure(userMessage)
  ) {
    return repairVisualDrawOutput(text, userMessage, participantName);
  }

  const { text: stashed, slots } = stashStudentMathBlocks(text);
  const lightChat = isAdamLightChatTurn(userMessage);
  const proseCraftTurn = isAdamProseCraftTurn(userMessage);
  const practicalThread = threadRootIsPracticalAdvisory(recentUserMessages, userMessage);
  const preserveCareerStructure = practicalThread && (
    isAdamContinuationDepthTurn(userMessage)
    || /\b(?:career path|real-world example|skills and tools|laluan kerjaya|contoh sebenar|kemahiran dan alat|90-day|transitioning into)\b/i.test(userMessage)
  );
  const strictPlainConsumer = isAdamConsumerPlainTurn(userMessage)
    || isAdamCurrentAffairsTurn(userMessage)
    || isAdamPracticalAdvisoryTurn(userMessage)
    || practicalThread;
  const constitutionalStructureOk = userAskedForConstitutionalStructure(userMessage);
  const structuredSpecOk =
    userAskedForStructuredSpecification(userMessage)
    || outputLooksLikeStructuredSpec(stashed);
  const profile = resolveAdamAnswerProfile({
    message:                  userMessage,
    recentUserMessages,
    recentAssistantMessages,
    isFounder:                false,
  });
  const betaOptedIn = userOptedIntoStudentExplainBackBeta({
    message:                  userMessage,
    recentUserMessages,
    recentAssistantMessages,
    isFounder:                false,
  });
  const technicalKonvensionalDisplay = isAdamTechnicalKonvensionalDisplayTurn(userMessage);
  const usersTechnicalDirect = options?.usersTechnicalDirect === true;
  const preserveStructuredAnswer = usersTechnicalDirect
    || technicalKonvensionalDisplay
    || isAdamCompareTurn(userMessage);
  const bookWritingTurn = isAdamLayer1BookWritingTurn(recentUserMessages, userMessage);
  const tier1BriefEssayStrip = profile === 'alpha'
    && !betaOptedIn
    && !proseCraftTurn
    && !preserveCareerStructure
    && !technicalKonvensionalDisplay
    && !isAdamTeachingDepthTurn(userMessage)
    && !isAdamAlgorithmTeachingTurn(userMessage)
    && !isAdamCompareTurn(userMessage)
    && !isAdamLightChatTurn(userMessage)
    && !isAdamPracticalAdvisoryTurn(userMessage)
    && !practicalThread
    && (
      strictPlainConsumer
      || isAdamSimpleFactualTurn(userMessage)
      || isAdamCurrentAffairsTurn(userMessage)
      || isAdamScienceNatureSynthesisTurn(userMessage)
      || isAdamHistorySynthesisTurn(userMessage)
      || isAdamVisualDrawTurn(userMessage)
      || (
        isAdamSubstantiveTurn(userMessage)
        && !userRequestedPracticalDepth(userMessage)
      )
      || bookWritingTurn
      || isAdamUserGuidanceCoachingTurn(userMessage)
    );
  const preservePracticalSkillsStructure = isAdamPracticalAdvisoryTurn(userMessage)
    && !isAdamContinuationDepthTurn(userMessage)
    && !userRequestedPracticalDepth(userMessage);

  const cadanganTurn = resolveUserUmumCadanganTurn(
    userMessage,
    recentAssistantMessages,
    recentUserMessages,
  );
  const perlaksanaanTurn = userUmumPerlaksanaanTurnActive(
    userMessage,
    recentAssistantMessages,
    recentUserMessages,
  );
  const companionTurn = isUserUmumCompanionTurnActive(
    userMessage,
    recentAssistantMessages,
    recentUserMessages,
  );
  const umumVoiceHoldTurn = companionTurn || bookWritingTurn;

  const preserveAccessibleListStructure = isAdamAccessibleHybridFormatTurn(userMessage)
    || cadanganTurn
    || perlaksanaanTurn
    || companionTurn
    || bookWritingTurn
    || isAdamUserGuidanceCoachingTurn(userMessage)
    || isAdamLayer1BookWritingTurn(recentUserMessages, userMessage);

  const runUniversalVoiceStrip = !lightChat && !proseCraftTurn && (
    strictPlainConsumer
    || isAdamCurrentAffairsTurn(userMessage)
    || practicalThread
    || isAdamLifeWellbeingTurn(userMessage)
    || isAdamCompareTurn(userMessage)
    || isAdamScienceNatureSynthesisTurn(userMessage)
    || isAdamHistorySynthesisTurn(userMessage)
  );

  const preserveStructuredMarkdown = constitutionalStructureOk || structuredSpecOk || technicalKonvensionalDisplay
    || options?.usersTechnicalDirect === true
    || isAdamAccessibleHybridFormatTurn(userMessage)
    || isAdamTeachingDepthTurn(userMessage)
    || isAdamAlgorithmTeachingTurn(userMessage)
    || isAdamCompareTurn(userMessage);

  let out = stripUsersBismillahOpener(stashed)
    .replace(/\bmemperkuat\b/gi, 'menguatkan')
    .replace(/\bistirehat\b/gi, 'rehat');

  out = preservePracticalSkillsStructure
    ? out
    : stripWebSearchAttributionInline(out);

  if (!preserveStructuredMarkdown) {
    out = out
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      .replace(/^---+$/gm, '');
  }

  out = out
    .replace(/^\[Source:[^\]]*\]\s*$/gim, '');

  out = restoreStudentMathBlocks(out, slots);
  out = inlineQuranAyat(out);
  out = rewriteDualLaneEssayLabels(out);
  out = rewriteEmojiPerformanceOpeners(out);
  out = stripSunomNotation(out);
  out = stripPlanTesterAddress(out);
  if (!practicalThread) {
    const konvensionalIqSurface = options?.gateKonvensionalSurface === true
      || technicalKonvensionalDisplay
      || isAdamScienceNatureSynthesisTurn(userMessage);
    if (konvensionalIqSurface) {
      out = stripSciencePhilosophyEssayInline(out);
      out = stripScienceFaithInline(out);
    }
  }
  if (tier1BriefEssayStrip && !practicalThread) {
    out = stripSciencePoeticInline(out);
  }
  if (tier1BriefEssayStrip && isAdamLifeWellbeingTurn(userMessage)) {
    out = stripLifeStressFaithInline(out);
  }
  out = sanitizeTechnicalPrecisionOutput(out, userMessage, recentUserMessages);
  out = repairStaleOfficeHolderOutput(out, userMessage);
  out = stripCurrentAffairsCoachingTail(out, userMessage);
  out = sanitizeUsersForbiddenPronouns(out);
  if (!lightChat) {
    if (isAdamGeneralKonvensionalTurn(userMessage)) {
      out = stripAlamtologiPromotionInline(out);
    }
    out = stripFrameworkBillboards(out, userMessage, recentUserMessages);
    if (shouldStripKonvensionalFrameworkLeaks(userMessage, recentUserMessages)) {
      out = stripKonvensionalAlamtologiTailInline(out);
    }
    if (isAdamGeneralKonvensionalTurn(userMessage)) {
      out = stripAlamtologiPromotionInline(out);
    }
  }

  if (
    !usersTechnicalDirect
    && (
      isAdamTeachingDepthTurn(userMessage)
      || isAdamScienceNatureSynthesisTurn(userMessage)
      || isAdamCompareTurn(userMessage)
    )
  ) {
    out = repairTeachingStructuredOutput(out);
  }

  const paragraphs = out.split(/\n{2,}/);

  const faithOk = options?.gateFaithPermitted !== undefined
    ? options.gateFaithPermitted
    : practicalThread
      ? userOpenedFaithDoor(userMessage)
      : userOpenedFaithDoor(userMessage)
        || recentUserMessages.some((m) => userOpenedFaithDoor(m));

  const technicalOk = resolveTechnicalPrecisionTurn(userMessage, recentUserMessages).isActive
    || isTechnicalPrecisionQuestion(userMessage.trim());
  const usePracticalCareerDoor = threadRootIsPracticalAdvisory(recentUserMessages, userMessage)
    && !isAdamCompareTurn(userMessage);
  const stripScienceAlphaExplainBack = profile === 'alpha'
    && !betaOptedIn
    && isAdamScienceNatureSynthesisTurn(userMessage);

  const kept = proseCraftTurn
    ? paragraphs.map((p) => p.trim()).filter(Boolean)
    : filterUsersSanitizeParagraphs(paragraphs, {
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
    umumVoiceHoldTurn,
    tier1BriefEssayStrip,
    stripScienceAlphaExplainBack,
    technicalKonvensionalDisplay,
    usersTechnicalDirect,
    preserveStructuredAnswer,
    preservePracticalSkillsStructure,
    preserveCareerStructure,
    preserveAccessibleListStructure,
    runUniversalVoiceStrip,
    practicalThread,
    faithOk,
    cadanganTurn,
    perlaksanaanTurn,
  });

  let joined = (Array.isArray(kept) ? kept : []).join('\n\n').trim();
  if (
    !usersTechnicalDirect
    && (
      isAdamTeachingDepthTurn(userMessage)
      || isAdamScienceNatureSynthesisTurn(userMessage)
      || isAdamCompareTurn(userMessage)
    )
  ) {
    joined = repairTeachingStructuredOutput(joined);
  }

  let polished = polishStudentOutputSurface(
    joined,
    technicalOk,
    preserveStructuredMarkdown || preservePracticalSkillsStructure || preserveAccessibleListStructure || technicalKonvensionalDisplay,
  );
  if (
    !preserveStructuredMarkdown
    && !preservePracticalSkillsStructure
    && !technicalKonvensionalDisplay
    && !isAdamVisualDrawTurn(userMessage)
    && !proseCraftTurn
  ) {
    polished = stripConsumerMarkdownEmphasis(polished);
  }
  if (tier1BriefEssayStrip && polished.includes('Would you like more on skills and tools')) {
    polished = polished.replace(
      /Would you like more on skills and tools, a career path[\s\S]*?\?/i,
      UNIVERSAL_SCHOLAR_DOOR_EN,
    );
  }
  if (
    tier1BriefEssayStrip
    && !cadanganTurn
    && !perlaksanaanTurn
    && !userRequestedPracticalDepth(userMessage)
    && countRecentUniversalScholarDoors(recentAssistantMessages) === 0
    && (
      usePracticalCareerDoor
      || isAdamCompareTurn(userMessage)
      || isAdamLifeWellbeingTurn(userMessage)
    )
  ) {
    polished = appendUniversalScholarTier1DoorIfMissing(
      polished,
      userMessage,
      recentAssistantMessages,
      recentUserMessages,
    );
  }
  if (!usePracticalCareerDoor) {
    polished = stripMisplacedPracticalCareerDoor(polished, userMessage, recentUserMessages);
  }
  if (!lightChat && !isAdamVisualDrawTurn(userMessage)) {
    polished = normalizeConsumerParagraphBreaks(polished);
  }
  if (isAdamPracticalAdvisoryTurn(userMessage) || practicalThread) {
    polished = repairPracticalAdvisoryGoldShape(polished, userMessage);
  }
  polished = normalizeGoldStandardFollowUpClosing(polished, userMessage);
  if (
    profile === 'alpha'
    && !betaOptedIn
    && !lightChat
    && !isAdamCompareTurn(userMessage)
    && !isAdamLifeWellbeingTurn(userMessage)
    && !isAdamPracticalAdvisoryTurn(userMessage)
    && !preservePracticalSkillsStructure
  ) {
    polished = stripRedundantAlphaGoldStandardClose(polished, userMessage);
  }
  if (
    (cadanganTurn || perlaksanaanTurn)
    && !isAdamSimpleFactualTurn(userMessage)
  ) {
    polished = stripUserUmumCadanganInterrogativeCloses(polished);
  }
  if (umumVoiceHoldTurn) {
    const repairSource = polished.trim() || stashed.trim();
    polished = repairUserUmumCompanionOutput(repairSource, userMessage, recentUserMessages);
  }
  polished = repairAdamProductRedirectLeak(polished, userMessage, recentUserMessages);
  if (
    isAdamSimpleArithmeticTurn(userMessage)
    && !userAskedForAlamtologi(userMessage)
    && !userAskedForConstitutionalStructure(userMessage)
  ) {
    polished = collapseSimpleArithmeticAlphaOutput(polished, userMessage, participantName);
  }
  if (
    isAdamVisualDrawTurn(userMessage)
    && !userAskedForAlamtologi(userMessage)
    && !userAskedForConstitutionalStructure(userMessage)
  ) {
    polished = repairVisualDrawOutput(polished, userMessage, participantName);
  }
  if (technicalKonvensionalDisplay) {
    polished = repairTechnicalDiagramOutput(polished, userMessage);
    polished = repairTechnicalKonvensionalDisplayStructure(polished, userMessage, {
      usersTechnicalDirect: false,
    });
    polished = stripHomeworkCadanganBlock(polished);
    polished = clampTechnicalMarkdownBold(polished);
  } else if (!usersTechnicalDirect) {
    polished = stripGenericTechnicalDiagrams(polished);
    polished = stripUnsolicitedAdamChatMedia(polished, userMessage);
    polished = repairAlgorithmTeachingOutput(polished, userMessage);
  }
  if (isAdamMediaSearchTurn(userMessage)) {
    polished = stripMediaRefusalInline(polished);
  }
  if (isAdamProseCraftTurn(userMessage)) {
    polished = polishProseCraftOutput(polished, userMessage);
  }
  if (
    options?.enforceUsersGreeting
    && !lightChat
    && polished.trim()
    && !isAdamVisualDrawTurn(userMessage)
    && !isAdamProseCraftTurn(userMessage)
  ) {
    polished = applyUsersHaiGreetingPolicy(polished, participantName, userMessage);
  }
  polished = stripUsersBismillahOpener(polished);
  if (options?.usersTechnicalDirect) {
    polished = stripHomeworkCadanganBlock(polished);
    polished = polished
      .replace(/\n*\s*Mahu saya jelaskan lebih lanjut\?\s*/gi, '\n\n')
      .replace(/\n*\s*Mahukah saya jelaskan lebih lanjut\?\s*/gi, '\n\n')
      .trim();
  }
  const speakerLocale = detectLanguage(userMessage).detectedLocale;
  polished = sanitizeMalaysiaBmDrift(polished, speakerLocale);
  return polished;
}