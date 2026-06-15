/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Output Guard (verified statistics)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Barrel re-exports — implementation split across adam-alpha-stat-* and adam-gold-standard.
 */

export { alphaStatOutputHasForbiddenPhrases } from './adam-alpha-stat-patterns';

export {
  alphaStatOutputContradictsEvidence,
  buildSearchEvidenceBlob,
  extractEnrollmentFigureFromEvidence,
  extractVerifiedStatFigureFromEvidence,
  findEvidenceHitForFigure,
  findRichestStatEvidenceHit,
  openingHasVerifiedEnrollmentFigure,
} from './adam-alpha-stat-evidence';

export {
  buildAlphaStatFigureLedOpener,
  buildAlphaStatFigureLedReply,
  buildVerifiedSourceOpener,
  extractGoldStandardSubjectLine,
  formatVerifiedWebSearchAttribution,
  prependFigureLedOpenerIfMissing,
  repairOpenerDomainTailOrphan,
  stripLeadingDomainTailOrphan,
} from './adam-alpha-stat-opener';

export {
  appendGoldStandardFollowUp,
  applyDefaultGoldStandardReplySurface,
  applyGoldStandardSurfaceReply,
  assembleVerifiedStatFullBody,
  buildFullVerifiedStatReply,
  buildGoldStandardFollowUpQuestion,
  buildGoldStandardSearchReply,
  buildGoldStandardSynthesisInstruction,
  evidenceHasGoldStandardArticle,
  extractGoldStandardOfficialPageBody,
  GOLD_STANDARD_FOLLOW_UP_BM,
  GOLD_STANDARD_FOLLOW_UP_EN,
  preserveAlphaStatStreamBody,
} from './adam-gold-standard';

export {
  filterPhilosophySentencesFromParagraph,
  paragraphIsAlphaDeferredSearchOffer,
  paragraphIsAlphaStatContextRefusal,
  paragraphIsAlphaStatMetaPreamble,
  paragraphIsAlphaStatPhilosophyPadding,
  paragraphIsOrphanStatFragment,
  sentenceIsAlphaStatPhilosophyPadding,
} from './adam-alpha-stat-paragraph-guard';

export {
  repairOrphanStatParagraphs,
  stripAlphaStatFalseNoFigureClaims,
  stripAlphaStatMechanicalSourceLabels,
  stripAlphaStatMetaParagraphs,
  stripAlphaStatUnverifiedInstitutionClaims,
} from './adam-alpha-stat-compact';

export {
  buildAlphaStatHitsNoFigureResponse,
  buildAlphaStatHonestSearchGapOpener,
  buildAlphaStatVerificationFallback,
  buildAlphaStatZeroHitResponse,
  resolveAlphaStatSearchFirstDisplay,
} from './adam-alpha-stat-terminal';

export {
  type AlphaStatSanitizeOptions,
  repairAlphaStatSurface,
  sanitizeAlphaVerifiedStatOutput,
  stripAlphaStatContextRefusal,
} from './adam-alpha-stat-sanitize';
