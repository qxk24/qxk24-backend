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
import {
  buildTutorScienceTurnContext,
  classifyTutorScienceIntent,
  scienceIntentSkipsZeroAnswer,
} from './tutor-law.science-intent-classifier';
import { ScienceIntent } from './tutor-law.science-intent.types';
import {
  buildTutorLanguageTurnContext,
  classifyTutorLanguageIntent,
  languageIntentSkipsZeroAnswer,
} from './tutor-law.language-writing-classifier';
import {
  buildTutorIslamicTurnContext,
  classifyTutorIslamicIntentOutput,
  islamicIntentSkipsZeroAnswer,
} from './tutor-law.islamic-intent-classifier';
import { IslamicIntent } from './tutor-law.islamic-intent.types';
import {
  buildTutorGenericTurnContext,
  classifyTutorGenericIntentFull,
  genericIntentSkipsZeroAnswer,
} from './tutor-law.generic-intent-classifier';
import {
  buildTutorCodeTurnContext,
  classifyTutorCodeIntentFull,
  ceIntentSkipsZeroAnswer,
  ceIntentSkipsMathPedagogy,
} from './tutor-law.code-intent-classifier';
import { enforceQuranTranslationOnlyGuard } from './tutor-law.quran-translation';

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
  const scienceCtx = buildTutorScienceTurnContext({
    userMessage:             msg,
    recentUserMessages,
    recentAssistantMessages,
    profile,
  });
  const scienceIntent = classifyTutorScienceIntent(scienceCtx);
  const languageCtx = buildTutorLanguageTurnContext({
    userMessage:             msg,
    recentUserMessages,
    recentAssistantMessages,
    profile,
  });
  const languageIntent = classifyTutorLanguageIntent(languageCtx);
  const islamicCtx = buildTutorIslamicTurnContext({
    userMessage:             msg,
    recentUserMessages,
    recentAssistantMessages,
    profile,
  });
  const islamicIntent = classifyTutorIslamicIntentOutput(islamicCtx);
  const genericCtx = buildTutorGenericTurnContext({
    userMessage:             msg,
    recentUserMessages,
    recentAssistantMessages,
    profile,
  });
  const genericIntent = classifyTutorGenericIntentFull(genericCtx);
  const codeCtx = buildTutorCodeTurnContext({
    userMessage:             msg,
    recentUserMessages,
    recentAssistantMessages,
    profile,
  });
  const codeIntent = classifyTutorCodeIntentFull(codeCtx);

  const openers = stripTutorUniversalOpeners(text);
  const introFixed = fixTutorBrokenMalayIntro(openers);
  const intro = shouldIncludeTutorTeacherIntro(msg, recentAssistantMessages, profile)
    ? introFixed
    : stripRepeatedTutorTeacherIntro(introFixed, profile);
  const terms = fixTutorMalayPlaceValueTerms(intro, profile);
  const plain = enforceTutorPlainLanguageGuard(terms, profile);

  const scienceFactual = intent.allowsScienceFactual
    || scienceIntent?.intent === ScienceIntent.F_FACTUAL;

  let body: string;
  if (scienceFactual) {
    body = enforceTutorScienceFactualGuard(plain, msg);
  } else if (
    scienceIntent?.intent === ScienceIntent.E_EXPERIMENT
    || scienceIntent?.intent === ScienceIntent.AMBIGUOUS
    || scienceIntent?.intent === ScienceIntent.EXAM_DIRECT
    || languageIntent
    || islamicIntent
    || genericIntent
    || (codeIntent && ceIntentSkipsMathPedagogy(codeIntent.output))
  ) {
    body = plain;
  } else {
    body = enforceTutorMathPedagogyGuard(plain, profile, msg);
  }

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

  let out = finalized.replace(/\n{3,}/g, '\n\n').trim();
  out = enforceTutorSessionLanguage(
    out,
    profile,
    userMessage,
    participantName,
    recentAssistantMessages,
  );

  const skipZeroAnswer = shouldSkipTutorZeroAnswerGuard(
    out,
    msg,
    recentAssistantMessages,
    recentUserMessages,
    intent,
  );

  if (
    skipZeroAnswer
    || tutorReplyHasCompleteWorkingSummary(out)
    || tutorReplyHasAlgebraFactoringExample(out)
  ) {
    return out;
  }

  if (scienceFactual) return out;

  if (scienceIntent && scienceIntentSkipsZeroAnswer(scienceIntent)) {
    return out;
  }

  if (languageIntent && languageIntentSkipsZeroAnswer(languageIntent)) {
    return out;
  }

  if (islamicIntent && islamicIntentSkipsZeroAnswer(islamicIntent)) {
    const quranTurn = islamicIntent.intent === IslamicIntent.Q_QURAN
      || islamicIntent.intent === IslamicIntent.Q_IMAN;
    return quranTurn
      ? enforceQuranTranslationOnlyGuard(out)
      : out;
  }

  if (genericIntent && genericIntentSkipsZeroAnswer(genericIntent.output)) {
    return out;
  }

  if (codeIntent && ceIntentSkipsZeroAnswer(codeIntent.output)) {
    return out;
  }

  return enforceTutorZeroAnswerGuard(
    out,
    profile,
    userMessage ?? msg,
    msg,
    recentAssistantMessages,
    recentUserMessages,
  );
}
