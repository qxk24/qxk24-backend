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
  enforceTutorVerificationWorkingFirstGuard,
  appendTutorClosureCheckQuestion,
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
  tutorReplyHasCompleteWorkingSummary,
  shouldSkipTutorZeroAnswerGuard,
} from './tutor-law.percentage-routing';
import {
  tutorReplyHasAlgebraFactoringExample,
  tutorThreadIsQuadraticContext,
} from './tutor-law.algebra-routing';
import { enforceTutorSessionLanguage } from './tutor-law.session-language';
import {
  buildTutorMathTurnContext,
  classifyTutorMathIntent,
} from './tutor-law.math-intent-classifier';
import { buildTutorMathClosureCheckQuestion } from './tutor-law.math-prompt-laws';

/** Full tutor post-stream pipeline — intent-first, then topic guards. */
export function enforceTutorReplyGuards(
  text: string,
  profile?: AdamTutorProfile,
  userMessage?: string,
  participantName?: string,
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
): string {
  const msg = userMessage ?? '';
  const ctx = buildTutorMathTurnContext({
    userMessage:             msg,
    recentUserMessages,
    recentAssistantMessages,
    profile,
  });
  const intent = classifyTutorMathIntent(ctx);

  const openers = stripTutorUniversalOpeners(text);
  const introFixed = fixTutorBrokenMalayIntro(openers);
  const intro = shouldIncludeTutorTeacherIntro(msg, recentAssistantMessages, profile)
    ? introFixed
    : stripRepeatedTutorTeacherIntro(introFixed, profile);
  const terms = fixTutorMalayPlaceValueTerms(intro, profile);
  const plain = enforceTutorPlainLanguageGuard(terms, profile);

  const scienceFactual = intent.allowsScienceFactual;

  let body = scienceFactual
    ? enforceTutorScienceFactualGuard(plain, msg)
    : enforceTutorMathPedagogyGuard(plain, profile, msg);

  if (intent.requiresWorkingFirst) {
    body = enforceTutorVerificationWorkingFirstGuard(body, msg);
  }

  const tags = new Set(intent.topicGuardTags);

  if (tags.has('place_value')) {
    body = enforceTutorPlaceValueColumnGuard(
      body,
      msg,
      recentUserMessages,
      recentAssistantMessages,
    );
    body = enforceTutorPlaceValuePhaseGuard(
      body,
      msg,
      recentUserMessages,
      recentAssistantMessages,
    );
  }

  if (tags.has('carry')) {
    body = enforceTutorCarryPlacementGuard(body, msg, recentUserMessages);
  }

  body = enforceTutorStudentCorrectionGuard(body, msg, recentUserMessages);

  if (tags.has('percentage') || tutorThreadIsQuantityWordProblem(msg, recentUserMessages, recentAssistantMessages)) {
    body = enforceTutorQuantityReplyGuard(body, msg, recentAssistantMessages);
  }

  if (tags.has('algebra_stuck') || tags.has('algebra_micro')) {
    if (tutorThreadIsQuadraticContext(msg, recentUserMessages, recentAssistantMessages)) {
      body = enforceTutorAlgebraStuckGuard(
        body,
        msg,
        recentAssistantMessages,
        recentUserMessages,
      );
      body = enforceTutorAlgebraMicroCorrectionGuard(
        body,
        msg,
        recentUserMessages,
        recentAssistantMessages,
      );
    }
  }

  let finalized = body;

  finalized = enforceTutorArithmeticClosureGuard(
    finalized,
    msg,
    recentUserMessages,
    recentAssistantMessages,
  );

  if (intent.warrantsAutoClosure) {
    if (
      !tutorReplyHasCompleteWorkingSummary(finalized)
      && !/\bKaedah\s+penyelesaian\b/i.test(finalized)
    ) {
      const forced = enforceTutorArithmeticClosureGuard(
        '',
        msg,
        recentUserMessages,
        recentAssistantMessages,
      );
      if (forced.trim()) finalized = forced;
    }
  }

  if (intent.warrantsAutoClosure && intent.closureIncludesCheckQ) {
    finalized = appendTutorClosureCheckQuestion(
      finalized,
      buildTutorMathClosureCheckQuestion(intent.topic),
    );
  }

  const skipZeroAnswer = shouldSkipTutorZeroAnswerGuard(
    finalized,
    msg,
    recentAssistantMessages,
    recentUserMessages,
    intent,
  );

  if (
    skipZeroAnswer
    || tutorReplyHasCompleteWorkingSummary(finalized)
    || tutorReplyHasAlgebraFactoringExample(finalized)
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
    msg,
    recentAssistantMessages,
    recentUserMessages,
  );
}
