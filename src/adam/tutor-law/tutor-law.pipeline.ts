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
  fixTutorMalayPlaceValueTerms,
} from './tutor-law.guards';
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
  const quantity = tutorThreadIsQuantityWordProblem(
    userMessage ?? '',
    recentUserMessages,
    recentAssistantMessages,
  )
    ? enforceTutorQuantityReplyGuard(pedagogy, userMessage ?? '', recentAssistantMessages)
    : pedagogy;

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
  if (
    closureTurn
    || tutorReplyHasCompleteWorkingSummary(algebra)
    || algebraEscalation
    || tutorReplyHasAlgebraFactoringExample(algebra)
  ) {
    return algebra.replace(/\n{3,}/g, '\n\n').trim();
  }

  const language = enforceTutorSessionLanguage(
    algebra,
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
