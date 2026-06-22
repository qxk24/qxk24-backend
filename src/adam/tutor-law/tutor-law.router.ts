/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Domain Router
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
 *
 * Intent-first pipeline: detect domain → classify → update session.
 * Topic guards run inside domain handlers, not before routing.
 */

import type { AdamTutorProfile } from './tutor-law.types';
import type { IslamicStudentLevel } from './tutor-law.islamic-intent.types';
import type { WritingType } from './tutor-law.language-writing.types';
import { ConceptReadiness, MathTopic, type ClassifierInput, type ClassifierOutput } from './tutor-law.math-intent.types';
import { ScienceSubject } from './tutor-law.science-intent.types';
import type { ScienceClassifierOutput } from './tutor-law.science-intent.types';
import type { LanguageClassifierOutput } from './tutor-law.language-writing.types';
import type { IslamicClassifierOutput } from './tutor-law.islamic-intent.types';
import {
  ProgrammingLanguage,
  type CodeClassifierOutput,
  buildCodeClassifierInput,
  classifyCodeIntent,
  isTutorCodeDomainMessage,
} from './tutor-law.code-intent-classifier';
import { GenericDomain, type GenericClassifierOutput } from './tutor-law.generic-intent.types';
import {
  buildGenericClassifierInput,
  classifyGenericIntent,
} from './tutor-law.generic-intent-classifier';
import { isTutorGenericHumanitiesDomainMessage } from './tutor-law.generic-intent-signals';
import { classifyMathIntent } from './tutor-law.math-intent-classifier.core';
import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { isTutorMathDomainMessage } from './tutor-law.math-intent-detectors';
import {
  buildScienceClassifierInput,
  classifyScienceIntent,
  isTutorScienceDomainMessage,
} from './tutor-law.science-intent-classifier';
import {
  buildLanguageClassifierInput,
  classifyLanguageIntent,
  isTutorLanguageWritingDomainMessage,
} from './tutor-law.language-writing-classifier';
import {
  buildIslamicClassifierInput,
  classifyIslamicIntent,
  isTutorIslamicDomainMessage,
} from './tutor-law.islamic-intent-classifier';
import {
  createFullSession,
  inferPreferredLang,
  type FullSessionState,
} from './tutor-law.session-state';

export enum SubjectDomain {
  MATH     = 'MATH',
  SCIENCE  = 'SCIENCE',
  LANGUAGE = 'LANGUAGE',
  CODE     = 'CODE',
  ISLAMIC  = 'ISLAMIC',
  GENERIC  = 'GENERIC',
}

/** Cross-domain session snapshot — extended by tutor-law.session-state. */
export interface SessionState {
  studentId: string;
  sessionId: string;
  priorDomain: SubjectDomain | null;
  stuckCount:  number;

  mathConceptReadiness:     ConceptReadiness;
  mathPriorTopic:           MathTopic | null;

  sciencePriorSubject: ScienceSubject | null;

  languagePriorWritingType: WritingType | null;
  languageHasDraft:         boolean;
  languageDraftWordCount:   number;

  codeHasCodeBlock:      boolean;
  codeHasErrorMessage:   boolean;
  codeCodeLineCount:     number;
  codePriorLanguage:     ProgrammingLanguage | null;

  islamicStudentLevel: IslamicStudentLevel;

  genericPriorDomain: GenericDomain | null;
}

export type { ConceptReadiness, MathTopic };

export interface RouterInput {
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  session:                  FullSessionState;
  profile?:                 AdamTutorProfile;
}

export type RoutedClassifierOutput =
  | { domain: SubjectDomain.MATH;     output: ClassifierOutput }
  | { domain: SubjectDomain.SCIENCE;  output: ScienceClassifierOutput }
  | { domain: SubjectDomain.LANGUAGE; output: LanguageClassifierOutput }
  | { domain: SubjectDomain.CODE;     output: CodeClassifierOutput }
  | { domain: SubjectDomain.ISLAMIC;  output: IslamicClassifierOutput }
  | { domain: SubjectDomain.GENERIC;  output: GenericClassifierOutput };

export interface RouterOutput {
  domain:      SubjectDomain;
  normText:    string;
  routed:      RoutedClassifierOutput;
  nextSession: FullSessionState;
  trace:       string[];
}

export function createInitialSession(
  studentId: string,
  sessionId: string,
  studentLevel: FullSessionState['studentLevel'] = 'UNKNOWN',
): FullSessionState {
  return createFullSession(studentId, sessionId, studentLevel);
}

function isShortContinuation(message: string): boolean {
  const t = message.trim();
  return t.length > 0 && t.length <= 24 && !/\?/.test(t);
}

/** SENSE step — pick one academic domain for this turn. */
export function detectDomain(input: RouterInput): SubjectDomain {
  const msg = input.userMessage ?? '';
  const recent = input.recentUserMessages ?? [];
  const blob = [msg, ...recent].join('\n');

  if (isTutorCodeDomainMessage(msg, recent) || isTutorCodeDomainMessage(blob, recent)) {
    return SubjectDomain.CODE;
  }
  if (isTutorIslamicDomainMessage(msg, recent)) {
    return SubjectDomain.ISLAMIC;
  }
  if (isTutorGenericHumanitiesDomainMessage(msg, recent)) {
    return SubjectDomain.GENERIC;
  }
  if (isTutorLanguageWritingDomainMessage(msg, recent)) {
    return SubjectDomain.LANGUAGE;
  }
  if (isTutorScienceDomainMessage(msg, recent) && !isTutorMathDomainMessage(msg)) {
    return SubjectDomain.SCIENCE;
  }
  if (isTutorMathDomainMessage(msg) || isTutorMathDomainMessage(blob)) {
    return SubjectDomain.MATH;
  }
  if (input.session.priorDomain && isShortContinuation(msg)) {
    return input.session.priorDomain;
  }
  return SubjectDomain.GENERIC;
}

function buildMathInput(session: FullSessionState, rawText: string, normText: string): ClassifierInput {
  const mathLayer = session.layerState[SubjectDomain.MATH];
  return {
    rawText,
    normText,
    hasShownWorking:    mathLayer.attemptCount > 0 || session.mathConceptReadiness !== ConceptReadiness.UNVERIFIED,
    stuckCount:         session.stuckCount,
    conceptReadiness:   session.mathConceptReadiness,
    priorTopic:         session.mathPriorTopic,
  };
}

function classifyForDomain(
  domain: SubjectDomain,
  input: RouterInput,
  normText: string,
): RoutedClassifierOutput {
  const { userMessage, recentUserMessages = [], session, profile } = input;
  const rawText = userMessage ?? '';

  switch (domain) {
    case SubjectDomain.MATH:
      return {
        domain,
        output: classifyMathIntent(buildMathInput(session, rawText, normText)),
      };
    case SubjectDomain.SCIENCE:
      return {
        domain,
        output: classifyScienceIntent(buildScienceClassifierInput({
          userMessage:        rawText,
          recentUserMessages,
          profile,
          sessionState:       { lockedSubject: session.sciencePriorSubject },
        })),
      };
    case SubjectDomain.LANGUAGE:
      return {
        domain,
        output: classifyLanguageIntent(buildLanguageClassifierInput({
          userMessage:        rawText,
          recentUserMessages,
          profile,
          sessionState:       { lockedWritingType: session.languagePriorWritingType },
        })),
      };
    case SubjectDomain.CODE:
      return {
        domain,
        output: classifyCodeIntent(buildCodeClassifierInput({
          userMessage:        rawText,
          recentUserMessages,
          profile,
          sessionState: {
            codeHasCodeBlock:    session.codeHasCodeBlock,
            codeHasErrorMessage: session.codeHasErrorMessage,
            codeCodeLineCount:   session.codeCodeLineCount,
            codePriorLanguage:   session.codePriorLanguage,
            stuckCount:          session.stuckCount,
          },
        })),
      };
    case SubjectDomain.ISLAMIC:
      return {
        domain,
        output: classifyIslamicIntent(buildIslamicClassifierInput({
          userMessage: rawText,
          profile,
          stuckCount:  session.stuckCount,
        })),
      };
  }

  return {
    domain: SubjectDomain.GENERIC,
    output: classifyGenericIntent(buildGenericClassifierInput({
      userMessage:  rawText,
      profile,
      sessionState: {
        genericPriorDomain: session.genericPriorDomain,
        stuckCount:         session.stuckCount,
      },
    })),
  };
}

/** ORIENT + persist anchors for the next turn. */
export function updateSessionState(
  session: FullSessionState,
  domain: SubjectDomain,
  turn: { userMessage: string; routed: RoutedClassifierOutput },
): FullSessionState {
  const next: FullSessionState = {
    ...session,
    priorDomain:   domain,
    preferredLang: inferPreferredLang(turn.userMessage),
    turnCount:     session.turnCount + 1,
  };

  switch (turn.routed.domain) {
    case SubjectDomain.MATH: {
      const out = turn.routed.output;
      next.mathPriorTopic = out.topic;
      if (out.escalationActive) {
        next.stuckCount = session.stuckCount;
      }
      break;
    }
    case SubjectDomain.SCIENCE: {
      const out = turn.routed.output;
      next.sciencePriorSubject = out.subject;
      break;
    }
    case SubjectDomain.LANGUAGE: {
      const out = turn.routed.output;
      next.languagePriorWritingType = out.writingType;
      next.languageHasDraft = /\w{20,}/.test(turn.userMessage);
      next.languageDraftWordCount = turn.userMessage.split(/\s+/).filter(Boolean).length;
      break;
    }
    case SubjectDomain.CODE: {
      const out = turn.routed.output;
      next.codePriorLanguage = out.language;
      next.codeHasCodeBlock = /```/.test(turn.userMessage);
      next.codeHasErrorMessage = /SyntaxError|TypeError|ReferenceError|Traceback/i.test(turn.userMessage);
      next.codeCodeLineCount = turn.userMessage.split('\n').length;
      break;
    }
    case SubjectDomain.ISLAMIC:
      break;
    case SubjectDomain.GENERIC: {
      const out = turn.routed.output;
      next.genericPriorDomain = out.domain;
      break;
    }
  }

  return next;
}

/** Primary router entry — normalise, detect domain, classify, update session. */
export function routeStudentTurn(input: RouterInput): RouterOutput {
  const normText = normalizeMathClassifierText(input.userMessage ?? '');
  const domain = detectDomain(input);
  const trace = [`normChars=${normText.length}`, `domain=${domain}`];
  const routed = classifyForDomain(domain, input, normText);
  trace.push(`intent=${describeRoutedIntent(routed)}`);
  const nextSession = updateSessionState(input.session, domain, {
    userMessage: input.userMessage,
    routed,
  });

  return { domain, normText, routed, nextSession, trace };
}

function describeRoutedIntent(routed: RoutedClassifierOutput): string {
  switch (routed.domain) {
    case SubjectDomain.MATH:
      return routed.output.intent;
    case SubjectDomain.SCIENCE:
      return routed.output.intent;
    case SubjectDomain.LANGUAGE:
      return routed.output.intent;
    case SubjectDomain.CODE:
      return routed.output.intent;
    case SubjectDomain.ISLAMIC:
      return routed.output.intent;
    case SubjectDomain.GENERIC:
      return routed.output.intent;
    default:
      return 'UNKNOWN';
  }
}
