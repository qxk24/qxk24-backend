/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Reply Pipeline
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */


import type { AdamTutorProfile } from './tutor-law.types';
import { tutorQuestionIsScienceFactual } from './tutor-law.science-routing';
import {
  enforceTutorMathPedagogyGuard,
  enforceTutorQuantityReplyGuard,
  enforceTutorPlainLanguageGuard,
  enforceTutorScienceFactualGuard,
  enforceTutorZeroAnswerGuard,
  enforceTutorAlgebraStuckGuard,
  enforceTutorAlgebraMicroCorrectionGuard,
  enforceTutorPlaceValueColumnGuard,
  enforceTutorCarryPlacementGuard,
  enforceTutorStudentCorrectionGuard,
  fixTutorMalayPlaceValueTerms,
} from './tutor-law.guards';
import {
  enforceTutorArithmeticClosureGuard,
} from './tutor-law.arithmetic-closure';
import {
  enforceTutorPlaceValuePhaseGuard,
} from './tutor-law.arithmetic-phase';
import {
  fixTutorBrokenMalayIntro,
  shouldIncludeTutorTeacherIntro,
  stripRepeatedTutorTeacherIntro,
  stripTutorUniversalOpeners,
} from './tutor-law.intro';
import {
  tutorThreadIsQuantityWordProblem,
  tutorTurnWarrantsAutoClosingSummary,
  tutorReplyHasCompleteWorkingSummary,
} from './tutor-law.percentage-routing';
import {
  tutorAlgebraFullExampleWarranted,
  tutorReplyHasAlgebraFactoringExample,
  tutorThreadIsQuadraticContext,
} from './tutor-law.algebra-routing';
import { enforceTutorSessionLanguage } from './tutor-law.session-language';

/** Full tutor post-stream pipeline — plain language first, then zero-answer. */
export function enforceTutorReplyGuards(
  text: string,
  profile?: AdamTutorProfile,
  userMessage?: string,
  participantName?: string,
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
): string {
  const openers = stripTutorUniversalOpeners(text);
  const introFixed = fixTutorBrokenMalayIntro(openers);
  const intro = shouldIncludeTutorTeacherIntro(userMessage, recentAssistantMessages, profile)
    ? introFixed
    : stripRepeatedTutorTeacherIntro(introFixed, profile);
  const terms = fixTutorMalayPlaceValueTerms(intro, profile);
  const plain = enforceTutorPlainLanguageGuard(terms, profile);
  const scienceFactual = tutorQuestionIsScienceFactual(userMessage ?? '');
  const pedagogy = scienceFactual
    ? enforceTutorScienceFactualGuard(plain, userMessage ?? '')
    : enforceTutorMathPedagogyGuard(plain, profile, userMessage ?? '');
  const placeValue = enforceTutorPlaceValueColumnGuard(
    pedagogy,
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  );
  const phase = enforceTutorPlaceValuePhaseGuard(
    placeValue,
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  );
  const carry = enforceTutorCarryPlacementGuard(
    phase,
    userMessage ?? '',
    recentUserMessages,
  );
  const correction = enforceTutorStudentCorrectionGuard(
    carry,
    userMessage ?? '',
    recentUserMessages,
  );
  const quantity = tutorThreadIsQuantityWordProblem(
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  )
    ? enforceTutorQuantityReplyGuard(correction, userMessage ?? '', recentAssistantMessages)
    : correction;

  const algebra = tutorThreadIsQuadraticContext(
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  )
    ? enforceTutorAlgebraStuckGuard(
      quantity,
      userMessage ?? '',
      recentAssistantMessages,
      recentUserMessages,
    )
    : quantity;

  const algebraMicro = tutorThreadIsQuadraticContext(
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  )
    ? enforceTutorAlgebraMicroCorrectionGuard(
      algebra,
      userMessage ?? '',
      recentUserMessages,
      recentAssistantMessages,
    )
    : algebra;

  const arithmeticClosure = enforceTutorArithmeticClosureGuard(
    algebraMicro,
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  );

  const closureTurn = tutorTurnWarrantsAutoClosingSummary(
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  );
  const algebraEscalation = tutorAlgebraFullExampleWarranted(
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  );

  let finalized = arithmeticClosure;
  if (
    closureTurn
    && !tutorReplyHasCompleteWorkingSummary(arithmeticClosure)
  ) {
    const forcedClosure = enforceTutorArithmeticClosureGuard(
      '',
      userMessage ?? '',
      recentUserMessages,
      recentAssistantMessages,
    );
    if (forcedClosure.trim()) finalized = forcedClosure;
  }

  if (
    closureTurn
    || tutorReplyHasCompleteWorkingSummary(finalized)
    || algebraEscalation
  ) {
    return finalized.replace(/\n{3,}/g, '\n\n').trim();
  }

  const language = enforceTutorSessionLanguage(
    finalized,
    profile,
    userMessage,
    participantName,
  );
  if (scienceFactual) return language;
  return enforceTutorZeroAnswerGuard(
    language,
    profile,
    text,
    userMessage ?? '',
    recentAssistantMessages,
    recentUserMessages,
  );
}
