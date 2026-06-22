/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Code Intent Classifier
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
 */

import type { AdamTutorProfile } from './tutor-law.types';
import { countSignalHits, normalizeMathClassifierText } from './tutor-law.math-intent.signals';

export enum ProgrammingLanguage {
  PYTHON     = 'PYTHON',
  JAVASCRIPT = 'JAVASCRIPT',
  JAVA       = 'JAVA',
  C          = 'C',
  CPP        = 'CPP',
  GENERAL    = 'GENERAL',
  UNKNOWN    = 'UNKNOWN',
}

export enum CodeIntent {
  D_DEBUG    = 'D_DEBUG',
  B_BUILD    = 'B_BUILD',
  R_REVIEW   = 'R_REVIEW',
  C_CONCEPT  = 'C_CONCEPT',
  TRAP       = 'TRAP',
  AMBIGUOUS  = 'AMBIGUOUS',
}

export enum CodeExamplePermission {
  NONE    = 'NONE',
  SNIPPET = 'SNIPPET',
  FULL    = 'FULL',
}

export interface CodeClassifierInput {
  rawText:           string;
  normText:          string;
  hasCodeBlock:      boolean;
  hasErrorMessage:   boolean;
  codeLineCount:     number;
  priorLanguage:     ProgrammingLanguage | null;
  stuckCount:        number;
  profile?:          AdamTutorProfile;
}

export interface CodeClassifierOutput {
  intent:              CodeIntent;
  language:            ProgrammingLanguage;
  confidence:          'HIGH' | 'MEDIUM' | 'LOW';
  examplePermission:   CodeExamplePermission;
  probeQuestion:       string | null;
  redirectScript:      string | null;
  decisionTrace:       string[];
}

const DEBUG_SIGNALS = [
  'error', 'syntaxerror', 'typeerror', 'referenceerror', 'traceback',
  'bug', 'crash', 'tak jalan', 'not working', 'kenapa error', 'debug',
];

const BUILD_SIGNALS = [
  'bina', 'build', 'buat program', 'write a program', 'create app',
  'implement', 'laksanakan', 'coding project', 'tugasan programming',
];

const REVIEW_SIGNALS = [
  'review code', 'semak kod', 'check my code', 'optimize', 'refactor',
  'improve this', 'baiki kod',
];

const CONCEPT_SIGNALS = [
  'apa itu', 'what is', 'explain', 'terangkan', 'maksud', 'how does',
  'macam mana', 'loop', 'function', 'variable', 'array', 'class',
];

const TRAP_SIGNALS = [
  'complete code for me', 'tulis semua kod', 'full solution',
  'do my assignment', 'buatkan tugasan', 'copy paste',
];

const LANG_PATTERNS: [RegExp, ProgrammingLanguage][] = [
  [/\bpython\b|\.py\b|def\s+\w+\(/i, ProgrammingLanguage.PYTHON],
  [/\bjavascript\b|\bjs\b|console\.log|const\s+\w+\s*=/i, ProgrammingLanguage.JAVASCRIPT],
  [/\bjava\b|public\s+static\s+void\s+main/i, ProgrammingLanguage.JAVA],
  [/\bc\+\+\b|#include\s*</i, ProgrammingLanguage.CPP],
  [/\bc language\b|#include\s+stdio/i, ProgrammingLanguage.C],
];

export function isTutorCodeDomainMessage(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return (
    /```/.test(t)
    || /SyntaxError|TypeError|ReferenceError|Traceback/i.test(t)
    || /\b(?:def |function |const |let |import |class |print\(|console\.log)/.test(t)
    || /\b(?:python|javascript|java|c\+\+|programming|kod|code)\b/i.test(t)
  );
}

export function detectProgrammingLanguage(raw: string, prior: ProgrammingLanguage | null): ProgrammingLanguage {
  for (const [re, lang] of LANG_PATTERNS) {
    if (re.test(raw)) return lang;
  }
  return prior ?? ProgrammingLanguage.UNKNOWN;
}

export function buildCodeClassifierInput(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  sessionState?: {
    codeHasCodeBlock?:     boolean;
    codeHasErrorMessage?:  boolean;
    codeCodeLineCount?:    number;
    codePriorLanguage?:    ProgrammingLanguage | null;
    stuckCount?:           number;
  };
  profile?: AdamTutorProfile;
}): CodeClassifierInput {
  const rawText = input.userMessage ?? '';
  const blob = [rawText, ...(input.recentUserMessages ?? [])].join('\n');
  const hasCodeBlock = input.sessionState?.codeHasCodeBlock ?? /```/.test(blob);
  const hasErrorMessage = input.sessionState?.codeHasErrorMessage
    ?? /SyntaxError|TypeError|ReferenceError|Traceback/i.test(blob);
  const codeLineCount = input.sessionState?.codeCodeLineCount
    ?? (blob.match(/\n/g)?.length ?? 0);
  const priorLanguage = input.sessionState?.codePriorLanguage ?? null;

  return {
    rawText,
    normText:          normalizeMathClassifierText(rawText),
    hasCodeBlock,
    hasErrorMessage,
    codeLineCount,
    priorLanguage,
    stuckCount:        input.sessionState?.stuckCount ?? 0,
    profile:           input.profile,
  };
}

export function classifyCodeIntent(input: CodeClassifierInput): CodeClassifierOutput {
  const { normText, rawText, hasCodeBlock, hasErrorMessage, priorLanguage } = input;
  const trace: string[] = [];
  const language = detectProgrammingLanguage(rawText, priorLanguage);
  trace.push(`language=${language}`);

  if (countSignalHits(normText, TRAP_SIGNALS) >= 1) {
    return {
      intent:            CodeIntent.TRAP,
      language,
      confidence:        'HIGH',
      examplePermission:   CodeExamplePermission.NONE,
      probeQuestion:     null,
      redirectScript:
        'ADAM tak akan tulis projek penuh untuk kamu — tapi boleh bantu pecahkan masalah langkah demi langkah. Apa bahagian yang kamu dah cuba?',
      decisionTrace:     [...trace, 'TRAP'],
    };
  }

  if (hasErrorMessage || countSignalHits(normText, DEBUG_SIGNALS) >= 1) {
    return {
      intent:            CodeIntent.D_DEBUG,
      language,
      confidence:        hasErrorMessage ? 'HIGH' : 'MEDIUM',
      examplePermission: CodeExamplePermission.SNIPPET,
      probeQuestion:     hasCodeBlock ? null : 'Boleh paste mesej error atau kod yang bermasalah?',
      redirectScript:    null,
      decisionTrace:     [...trace, 'D_DEBUG'],
    };
  }

  if (countSignalHits(normText, BUILD_SIGNALS) >= 1) {
    return {
      intent:            CodeIntent.B_BUILD,
      language,
      confidence:        'MEDIUM',
      examplePermission:   CodeExamplePermission.SNIPPET,
      probeQuestion:     'Apa input dan output yang program kamu perlu hasilkan?',
      redirectScript:    null,
      decisionTrace:     [...trace, 'B_BUILD'],
    };
  }

  if (countSignalHits(normText, REVIEW_SIGNALS) >= 1 || hasCodeBlock) {
    return {
      intent:            CodeIntent.R_REVIEW,
      language,
      confidence:        hasCodeBlock ? 'HIGH' : 'MEDIUM',
      examplePermission: CodeExamplePermission.SNIPPET,
      probeQuestion:     null,
      redirectScript:    null,
      decisionTrace:     [...trace, 'R_REVIEW'],
    };
  }

  if (countSignalHits(normText, CONCEPT_SIGNALS) >= 1) {
    return {
      intent:            CodeIntent.C_CONCEPT,
      language,
      confidence:        'MEDIUM',
      examplePermission: CodeExamplePermission.SNIPPET,
      probeQuestion:     null,
      redirectScript:    null,
      decisionTrace:     [...trace, 'C_CONCEPT'],
    };
  }

  return {
    intent:            CodeIntent.AMBIGUOUS,
    language,
    confidence:        'LOW',
    examplePermission: CodeExamplePermission.NONE,
    probeQuestion:     'Kamu nak belajar konsep, debug error, atau bina sesuatu? Cerita sikit.',
    redirectScript:    null,
    decisionTrace:     [...trace, 'AMBIGUOUS'],
  };
}
