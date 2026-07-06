/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Guard — paragraph filter
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

import { messageAsksRoleAndSkills } from './adam-official-source-enrich';
import {
  paragraphIsCoachingScriptClosing,
  paragraphIsFounderTeachingVoiceLeak,
  paragraphIsCareerTimelineBlock,
  paragraphIsLabeledSkillLine,
  paragraphIsEmojiSkillChecklist,
  paragraphIsExplainBackPhase1ALeak,
  paragraphIsExplainBackSoulStrikeLeak,
  paragraphIsUnsolicitedFaithSermon,
  paragraphIsUnsolicitedTier1FaithWeave,
  paragraphIsMarkdownBulletForest,
  paragraphIsNumberedSyllabusLeak,
  paragraphShouldStripForUniversalVoice,
  paragraphIsCareerSkillsBlockLeak,
  paragraphIsSciencePhilosophyEssayLeak,
  paragraphIsScienceBookPivotLeak,
  paragraphIsTier1EssayLeak,
  paragraphIsMediaRefusalLeak,
  paragraphIsMediaKeywordRedirectLeak,
  paragraphIsBismillahOpenerOnly,
  paragraphIsConstitutionalFrameworkLeak,
  paragraphIsSimpleArithmeticPhilosophyLeak,
} from './adam-users-output-law';
import {
  userAskedForConstitutionalStructure,
  userAskedForAlamtologi,
} from './adam-universal-voice';
import {
  paragraphIsUniversalScholarDoorOffer,
  countRecentUniversalScholarDoors,
  userRequestedPracticalDepth,
  paragraphIsUserUmumCoachingFrameworkLeak,
  paragraphIsUserUmumPoeticPreambleLeak,
  stripMisplacedPracticalCareerDoor,
  paragraphIsAlamtologiPromotionLeak,
} from './adam-universal-scholar';
import {
  isAdamPracticalAdvisoryTurn,
  isAdamLinearAlgebraTurn,
  isAdamSimpleArithmeticTurn,
  isAdamSimpleFactualTurn,
  isAdamVisualDrawTurn,
  isAdamAlgorithmTeachingTurn,
  isAdamCompareTurn,
  isAdamLifeWellbeingTurn,
  salvageLifeWellbeingParagraph,
  threadRootIsPracticalAdvisory,
} from './adam-response-generation';
import { isAdamMediaSearchTurn } from './adam-media-search';
import { paragraphIsGeometryPoeticLeak } from './adam-visual-draw-guard';
import {
  paragraphIsGeographyEssayBodyLeak,
  paragraphIsGeographyEssayCloseLeak,
  paragraphIsGeographyEssayOpenerLeak,
  paragraphIsGeographyPassiveMenuLeak,
  repairGeographyEssayOpenerParagraph,
} from './adam-geography-voice-guard';
import { isAdamGeneralKonvensionalTurn, shouldStripKonvensionalFrameworkLeaks } from './adam-knowledge-mode';
import { GOLD_STANDARD_FOLLOW_UP_RE } from './adam-gold-standard';
import { SCRIPTED_CLOSINGS } from './adam-users-output-guard.framework';
import { paragraphIsSimpleFactualPhilosophyTail } from './adam-simple-factual-voice-guard';

export interface UsersSanitizeParagraphFilterInput {
  userMessage: string;
  recentUserMessages: string[];
  recentAssistantMessages: string[];
  umumVoiceHoldTurn: boolean;
  tier1BriefEssayStrip: boolean;
  /** α science/nature konvensional — strip Explain-Back Phase 1A even on teaching-depth turns. */
  stripScienceAlphaExplainBack: boolean;
  technicalKonvensionalDisplay: boolean;
  usersTechnicalDirect: boolean;
  preserveStructuredAnswer: boolean;
  preservePracticalSkillsStructure: boolean;
  preserveCareerStructure: boolean;
  preserveAccessibleListStructure: boolean;
  runUniversalVoiceStrip: boolean;
  practicalThread: boolean;
  faithOk: boolean;
  cadanganTurn: boolean;
  perlaksanaanTurn: boolean;
}

/** Paragraph-level leak strip — keeps substantive structure when flags demand it. */
export function filterUsersSanitizeParagraphs(
  paragraphs: string[],
  input: UsersSanitizeParagraphFilterInput,
): string[] {
  const {
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
  } = input;

  const kept: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (paragraphIsBismillahOpenerOnly(trimmed)) continue;
    if (paragraphIsFounderTeachingVoiceLeak(trimmed)) continue;
    if (
      umumVoiceHoldTurn
      && (paragraphIsUserUmumPoeticPreambleLeak(trimmed) || paragraphIsUserUmumCoachingFrameworkLeak(trimmed))
    ) {
      if (isAdamLifeWellbeingTurn(userMessage)) {
        const salvaged = salvageLifeWellbeingParagraph(trimmed);
        if (salvaged) {
          kept.push(salvaged);
          continue;
        }
      }
      continue;
    }
    if (tier1BriefEssayStrip && paragraphIsExplainBackPhase1ALeak(trimmed)) {
      continue;
    }
    if (stripScienceAlphaExplainBack && paragraphIsExplainBackPhase1ALeak(trimmed)) {
      continue;
    }
    if (stripScienceAlphaExplainBack && paragraphIsExplainBackSoulStrikeLeak(trimmed)) {
      continue;
    }
    if (stripScienceAlphaExplainBack && paragraphIsScienceBookPivotLeak(trimmed)) {
      continue;
    }
    if (stripScienceAlphaExplainBack && paragraphIsSciencePhilosophyEssayLeak(trimmed)) {
      if (paragraphIsGeographyEssayOpenerLeak(trimmed)) {
        const salvaged = repairGeographyEssayOpenerParagraph(trimmed);
        if (salvaged) {
          kept.push(salvaged);
          continue;
        }
      }
      continue;
    }
    if (paragraphIsGeographyEssayBodyLeak(trimmed)) continue;
    if (paragraphIsGeographyEssayCloseLeak(trimmed)) continue;
    if (paragraphIsGeographyPassiveMenuLeak(trimmed)) continue;
    if (paragraphIsTier1EssayLeak(trimmed) && !userRequestedPracticalDepth(userMessage)) {
      continue;
    }
    if (
      tier1BriefEssayStrip
      && technicalKonvensionalDisplay
      && paragraphIsSciencePhilosophyEssayLeak(trimmed)
    ) {
      continue;
    }
    if (isAdamMediaSearchTurn(userMessage) && paragraphIsMediaRefusalLeak(trimmed)) {
      continue;
    }
    if (isAdamMediaSearchTurn(userMessage) && paragraphIsMediaKeywordRedirectLeak(trimmed)) {
      continue;
    }
    if (
      !preservePracticalSkillsStructure
      && !isAdamPracticalAdvisoryTurn(userMessage)
      && !messageAsksRoleAndSkills(userMessage)
      && paragraphIsCareerSkillsBlockLeak(trimmed)
    ) {
      continue;
    }
    if (!faithOk && paragraphIsUnsolicitedFaithSermon(trimmed)) {
      continue;
    }
    if (tier1BriefEssayStrip && !faithOk && paragraphIsUnsolicitedTier1FaithWeave(trimmed)) {
      continue;
    }
    if (
      tier1BriefEssayStrip
      && !userAskedForAlamtologi(userMessage)
      && !userAskedForConstitutionalStructure(userMessage)
      && /\bAlamtologi\b/i.test(trimmed)
    ) {
      if (isAdamLifeWellbeingTurn(userMessage)) {
        const salvaged = salvageLifeWellbeingParagraph(trimmed);
        if (salvaged) {
          kept.push(salvaged);
          continue;
        }
      }
      continue;
    }
    if (
      (tier1BriefEssayStrip || shouldStripKonvensionalFrameworkLeaks(userMessage, recentUserMessages))
      && paragraphIsConstitutionalFrameworkLeak(trimmed)
    ) {
      if (isAdamLifeWellbeingTurn(userMessage)) {
        const salvaged = salvageLifeWellbeingParagraph(trimmed);
        if (salvaged) {
          kept.push(salvaged);
          continue;
        }
      }
      continue;
    }
    if (
      isAdamGeneralKonvensionalTurn(userMessage)
      && paragraphIsAlamtologiPromotionLeak(trimmed)
    ) {
      continue;
    }
    if (
      isAdamSimpleArithmeticTurn(userMessage)
      && paragraphIsSimpleArithmeticPhilosophyLeak(trimmed)
    ) {
      continue;
    }
    if (
      isAdamSimpleFactualTurn(userMessage)
      && !userAskedForAlamtologi(userMessage)
      && !userAskedForConstitutionalStructure(userMessage)
      && paragraphIsSimpleFactualPhilosophyTail(trimmed)
    ) {
      continue;
    }
    if (
      isAdamLinearAlgebraTurn(userMessage)
      && paragraphIsSimpleArithmeticPhilosophyLeak(trimmed)
    ) {
      continue;
    }
    if (isAdamVisualDrawTurn(userMessage) && paragraphIsGeometryPoeticLeak(trimmed)) {
      continue;
    }
    if (
      (
        preserveCareerStructure
        || preservePracticalSkillsStructure
        || technicalKonvensionalDisplay
        || usersTechnicalDirect
        || preserveStructuredAnswer
      )
      && (
        paragraphIsMarkdownBulletForest(trimmed)
        || paragraphIsNumberedSyllabusLeak(trimmed)
        || /^#{1,6}\s+/m.test(trimmed)
        || paragraphIsCareerTimelineBlock(trimmed)
        || paragraphIsLabeledSkillLine(trimmed)
        || paragraphIsEmojiSkillChecklist(trimmed)
        || (/^The skills you need fall into/i.test(trimmed) && trimmed.length >= 90)
        || /^\s*\d+[.)]\s+/.test(trimmed)
      )
    ) {
      kept.push(trimmed);
      continue;
    }
    if (runUniversalVoiceStrip && paragraphShouldStripForUniversalVoice(trimmed, {
      faithOk,
      alamtologiOk: userAskedForConstitutionalStructure(userMessage)
        || /\b(?:alamtologi|MASA|TENAGA|RUANG|prinsip)\b/i.test(userMessage),
      technicalKonvensionalDisplay,
      accessibleHybridFormat: preserveAccessibleListStructure,
      preserveStructuredAnswer,
    })) continue;
    if (!paragraphIsUniversalScholarDoorOffer(trimmed)
      && !isAdamAlgorithmTeachingTurn(userMessage)
      && SCRIPTED_CLOSINGS.some((re) => re.test(trimmed))) continue;
    if (paragraphIsCoachingScriptClosing(trimmed) && !paragraphIsUniversalScholarDoorOffer(trimmed)) continue;
    if (/^\[Source:/i.test(trimmed)) continue;
    if (/^Maksudnya\s*:/i.test(trimmed)) continue;
    kept.push(trimmed);
  }

  if (
    cadanganTurn
    || perlaksanaanTurn
    || countRecentUniversalScholarDoors(recentAssistantMessages) >= 1
    || (practicalThread && userRequestedPracticalDepth(userMessage))
  ) {
    for (let i = kept.length - 1; i >= 0; i -= 1) {
      const para = kept[i] ?? '';
      if (paragraphIsUniversalScholarDoorOffer(para) && !GOLD_STANDARD_FOLLOW_UP_RE.test(para)) {
        kept.splice(i, 1);
      }
    }
  }

  const usePracticalCareerDoor = threadRootIsPracticalAdvisory(recentUserMessages, userMessage)
    && !isAdamCompareTurn(userMessage);
  if (!usePracticalCareerDoor) {
    const stripped = stripMisplacedPracticalCareerDoor(
      kept.join('\n\n').trim(),
      userMessage,
      recentUserMessages,
    );
    kept.length = 0;
    kept.push(...stripped.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean));
  }

  return kept;
}
