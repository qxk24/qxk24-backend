/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law (Founder seal — conventional only)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * ADAM Tutor is a separate product lane: conventional school/university
 * subjects only — zero Alamtologi weave, zero direct final answers.
 * Root cause: pedagogical SEQUENCE at generation — not post-stream guard.
 *
 * Split modules live under ./tutor-law/ — each file stays under 500 lines.
 */

export type {
  AdamTutorCurriculum,
  AdamTutorLanguage,
  AdamTutorLevel,
  AdamTutorProfile,
} from './tutor-law/tutor-law.types';

export {
  inferTutorLanguageFromText,
  normalizeTutorLanguage,
  tutorLanguageInstruction,
  tutorTeacherTitle,
} from './tutor-law/tutor-law.types';

export {
  buildAdamTutorProfileBlock,
  buildAdamTutorTeacherIntroLaw,
  buildTutorGreetingFallback,
  buildTutorStudentAddressLaw,
  formatTutorProfileOneLiner,
  isAdamTutorMode,
  isAdamTutorOffTopicMessage,
} from './tutor-law/tutor-law.profile';

export {
  buildTutorLevelScopeLaw,
  buildTutorLevelScopeRefusalLaw,
  detectQuestionEducationBand,
  isQuestionBeyondStudentLevel,
  isAgentMarketingTutorScope,
  tutorLevelScopeLabel,
  tutorLevelScopeCeiling,
  TUTOR_LEVEL_BAND_ORDER,
} from './tutor-law/tutor-law.level-scope';

export {
  ADAM_TUTOR_CONVENTIONAL_LAYOUT_LAW,
  ADAM_TUTOR_GUARDRAILS,
  ADAM_TUTOR_IDENTITY,
  ADAM_TUTOR_LAW,
  ADAM_TUTOR_MALAY_MATH_TERMS,
  ADAM_TUTOR_PLACE_VALUE_COLUMN_LAW,
  ADAM_TUTOR_CARRY_PLACEMENT_LAW,
  ADAM_TUTOR_ARITHMETIC_MULTI_OP_LAW,
  ADAM_TUTOR_ARITHMETIC_ADAPTIVE_LAW,
  ADAM_TUTOR_ARITHMETIC_COMPACT_LAW,
  ADAM_TUTOR_ARITHMETIC_FLUENT_LAW,
  ADAM_TUTOR_STUDENT_CORRECTION_LAW,
  ADAM_TUTOR_OFF_TOPIC_TURN,
  ADAM_TUTOR_PEDAGOGY_LAW,
  ADAM_TUTOR_PERCENTAGE_WORD_PROBLEM_LAW,
  ADAM_TUTOR_FRACTION_REMAINDER_LAW,
  ADAM_TUTOR_FULL_WORKING_LAW,
  ADAM_TUTOR_SESSION_CLOSURE_LAW,
  ADAM_TUTOR_PLAIN_LANGUAGE_LAW,
  ADAM_TUTOR_SCIENCE_FACTUAL_LAW,
  ADAM_TUTOR_SCOPE_REDIRECT_LAW,
  ADAM_TUTOR_ZERO_ANSWER_LAW,
} from './tutor-law/tutor-law.prompt-laws';

export {
  ADAM_TUTOR_STUCK_ESCALATION_LAW,
  ADAM_TUTOR_QUADRATIC_FACTORING_LAW,
  ADAM_TUTOR_FACTOR_PAIR_MICRO_LAW,
} from './tutor-law/tutor-law.algebra-laws';

export { tutorQuestionIsScienceFactual } from './tutor-law/tutor-law.science-routing';

export {
  ScienceIntent,
  ScienceSubject,
  ExperimentPhase,
} from './tutor-law/tutor-law.science-intent.types';

export type {
  ScienceClassifierInput,
  ScienceClassifierOutput,
  ScienceSessionState,
  ScienceTurnContext,
} from './tutor-law/tutor-law.science-intent.types';

export {
  buildScienceClassifierInput,
  buildTutorScienceTurnContext,
  classifyScienceIntent,
  classifyTutorScienceIntent,
  isTutorScienceDomainMessage,
  mergeScienceSessionState,
  scienceIntentSkipsZeroAnswer,
} from './tutor-law/tutor-law.science-intent-classifier';

export {
  ADAM_TUTOR_SCIENCE_EXPERIMENT_LAW,
  ADAM_TUTOR_SCIENCE_AMBIGUOUS_LAW,
  buildScienceIntentTurnLaw,
} from './tutor-law/tutor-law.science-prompt-laws';

export {
  LanguageIntent,
  WritingType,
  LanguageVariant,
} from './tutor-law/tutor-law.language-writing.types';

export type {
  LanguageClassifierInput,
  LanguageClassifierOutput,
  LanguageSessionState,
  LanguageTurnContext,
} from './tutor-law/tutor-law.language-writing.types';

export {
  buildLanguageClassifierInput,
  buildTutorLanguageTurnContext,
  classifyLanguageIntent,
  classifyTutorLanguageIntent,
  isTutorLanguageWritingDomainMessage,
  mergeLanguageSessionState,
  languageIntentSkipsMathPedagogy,
  languageIntentSkipsZeroAnswer,
} from './tutor-law/tutor-law.language-writing-classifier';

export {
  ADAM_TUTOR_WRITING_TRAP_LAW,
  ADAM_TUTOR_WRITING_REVIEW_LAW,
  ADAM_TUTOR_WRITING_GRAMMAR_LAW,
  ADAM_TUTOR_WRITING_AMBIGUOUS_LAW,
  buildLanguageIntentTurnLaw,
} from './tutor-law/tutor-law.language-prompt-laws';

export {
  classifyAcademicTurnIntents,
  buildAcademicIntentTurnPromptParts,
  buildAcademicIntentTurnPromptBlock,
  shouldApplyAcademicIntentRouting,
} from './tutor-law/tutor-law.academic-intent-prompt';

export {
  IslamicIntent,
  SourceTier,
  FabricationRisk,
} from './tutor-law/tutor-law.islamic-intent.types';

export type {
  IslamicClassifierInput,
  IslamicClassifierOutput,
  IslamicStudentLevel,
  IslamicTurnContext,
  IslamicSessionState,
  IslamicIntentResult,
} from './tutor-law/tutor-law.islamic-intent.types';

export {
  buildIslamicClassifierInput,
  buildTutorIslamicTurnContext,
  classifyIslamicIntent,
  classifyTutorIslamicIntent,
  classifyTutorIslamicIntentOutput,
  isTutorIslamicDomainMessage,
  islamicIntentSkipsZeroAnswer,
} from './tutor-law/tutor-law.islamic-intent-classifier';

export {
  defaultIslamicSessionState,
  deriveIslamicSessionState,
  mergeIslamicSessionState,
  commitIslamicSessionState,
  applyIslamicSessionToOutput,
  applyLockedIntentToOutput,
  buildIslamicIntentResult,
} from './tutor-law/tutor-law.islamic-mode';

export {
  ADAM_QURAN_TRANSLATION_ONLY_LAW,
  stripParentheticalSegments,
  sanitizeIslamicUserMessage,
  enforceQuranTranslationOnlyGuard,
} from './tutor-law/tutor-law.quran-translation';

export {
  ADAM_TUTOR_ISLAMIC_SOURCE_HIERARCHY_LAW,
  ADAM_TUTOR_ISLAMIC_FABRICATION_LAW,
  ADAM_TUTOR_ISLAMIC_FIQH_LAW,
  buildIslamicIntentTurnLaw,
} from './tutor-law/tutor-law.islamic-prompt-laws';

export type {
  AcademicIntentTurnInput,
  AcademicIntentTurnBundle,
} from './tutor-law/tutor-law.academic-intent-prompt';

export { hasNumericalComputation } from './tutor-law/tutor-law.math-intent-detectors';

export {
  ADAM_TUTOR_MAIN_SYSTEM_LAW_V1,
  ADAM_TUTOR_FIVE_RESPONSE_MODES_LAW,
} from './tutor-law/tutor-law.main-prompt-laws';

export {
  ADAM_TUTOR_MATH_MODULE_LAW,
  ADAM_TUTOR_MOD_A_CONCEPT_LAW,
  ADAM_TUTOR_MOD_B_PROCEDURAL_LAW,
  ADAM_TUTOR_MOD_C_VERIFICATION_LAW,
  ADAM_TUTOR_MOD_EXAM_BLOCK_LAW,
  ADAM_TUTOR_MOD_TEACH_ME_LAW,
  ADAM_TUTOR_DIAGNOSIS_SCRIPT_LAW,
  ADAM_TUTOR_SESSION_CLOSURE_WITH_CHECK_LAW,
  buildMathIntentTurnLaw,
  buildTutorMathClosureCheckQuestion,
} from './tutor-law/tutor-law.math-prompt-laws';

export {
  classifyTutorMathIntent,
  buildTutorMathTurnContext,
  tutorQuestionIsScienceFactualIntent,
  tutorTurnAllowsStuckEscalation,
} from './tutor-law/tutor-law.math-intent-classifier';

export { tutorTurnWarrantsAutoClosure } from './tutor-law/tutor-law.math-closure-gate';

export type {
  TutorMathIntentResult,
  TutorMathIntentMode,
  TutorMathSessionState,
  TutorMathTurnContext,
} from './tutor-law/tutor-law.math-intent.types';

export {
  shouldSkipTutorZeroAnswerGuard,
  studentAsksTutorFullWorkingLayout,
  studentMessageLooksLikeFinalAnswer,
  tutorQuestionIsMultiStepFractionWordProblem,
  tutorQuestionIsPercentageWordProblem,
  tutorQuestionIsQuantityWordProblem,
  tutorReplyHasCompleteWorkingSummary,
  tutorReplySummaryLooksIncomplete,
  tutorThreadIsMultiStepFractionWordProblem,
  tutorThreadIsPercentageWordProblem,
  tutorThreadIsQuantityWordProblem,
  tutorTurnNeedsFullWorkingLaw,
  tutorTurnWarrantsAutoClosingSummary,
} from './tutor-law/tutor-law.percentage-routing';

export {
  tutorQuestionIsQuadraticEquation,
  tutorStudentExpressesConfusion,
  tutorStudentNeedsConceptBasics,
  tutorThreadIsQuadraticContext,
  tutorAlgebraFullExampleWarranted,
  tutorReplyHasAlgebraFactoringExample,
  tutorTurnNeedsAlgebraWorkedExampleLaw,
  tutorTurnNeedsFactorPairMicroLaw,
} from './tutor-law/tutor-law.algebra-routing';

export {
  tutorStudentGaveFactorPairAttempt,
  dedupeTutorReplyParagraphs,
} from './tutor-law/tutor-law.algebra-micro';

export {
  extractAdditionOperands,
  tutorThreadIsPlaceValueAddition,
  tutorReplyMisalignsPlaceValueColumn,
  tutorColumnDigit,
  buildTutorPlaceValueColumnRecovery,
} from './tutor-law/tutor-law.place-value-routing';

export {
  tutorReplyMisplacesCarry,
  buildTutorCarryStepRecovery,
  buildTutorCorrectionAckRecovery,
  tutorStudentFlagsTeacherMathError,
  tutorReplyLeakedTotalAfterCorrection,
} from './tutor-law/tutor-law.arithmetic-carry';

export {
  tutorInferArithmeticProficiency,
  tutorThreadWarrantsCompactArithmetic,
  tutorThreadIsMultiStepArithmetic,
} from './tutor-law/tutor-law.arithmetic-proficiency';

export {
  enforceTutorPlaceValuePhaseGuard,
  parseAddThenSubtractProblem,
  resolveActiveAddThenSubtractProblem,
  tutorAdditionPhaseComplete,
  tutorInferFurthestColumnInThread,
  tutorReplyRegressesColumnPhase,
  tutorStudentFlagsTeachingLoopError,
} from './tutor-law/tutor-law.arithmetic-phase';

export {
  enforceTutorMathPedagogyGuard,
  enforceTutorPercentageReplyGuard,
  enforceTutorQuantityReplyGuard,
  enforceTutorPlaceValueColumnGuard,
  enforceTutorCarryPlacementGuard,
  enforceTutorStudentCorrectionGuard,
  enforceTutorAlgebraStuckGuard,
  enforceTutorAlgebraMicroCorrectionGuard,
  enforceTutorPlainLanguageGuard,
  enforceTutorScienceFactualGuard,
  enforceTutorZeroAnswerGuard,
  fixTutorMalayPlaceValueTerms,
  paragraphIsTutorMathReflectionLeak,
  tutorReplyLeakedFinalAnswer,
  enforceTutorVerificationWorkingFirstGuard,
  appendTutorClosureCheckQuestion,
} from './tutor-law/tutor-law.guards';

export {
  fixTutorBrokenMalayIntro,
  shouldIncludeTutorTeacherIntro,
  stripRepeatedTutorTeacherIntro,
  stripTutorUniversalOpeners,
  studentDemandsTutorDirectAnswer,
  tutorParagraphIsPolicyIntroBlock,
  tutorReplyHasTeacherIntro,
  tutorSessionIdentityEstablished,
  tutorSessionTeachingStarted,
} from './tutor-law/tutor-law.intro';

export {
  buildTutorAmbiguousInputReply,
  buildTutorMalayFollowUpRecovery,
  buildTutorSessionLanguageLock,
  buildTutorWebSearchPrompt,
  enforceTutorSessionLanguage,
  repairTutorMalaySessionLanguage,
  tutorReplyIsPredominantlyEnglish,
} from './tutor-law/tutor-law.session-language';

export { enforceTutorReplyGuards } from './tutor-law/tutor-law.pipeline';
