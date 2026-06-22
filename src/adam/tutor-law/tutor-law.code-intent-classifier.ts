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
import {
  buildCEClassifierInput,
  classifyCEIntent,
  isTutorCEDomainMessage,
} from './tutor-law.ce-intent-classifier';
import { CESecurityFlag } from './tutor-law.ce-intent.types';
import type { CEClassifierOutput } from './tutor-law.ce-intent.types';
import {
  buildHardwareClassifierInput,
  classifyHardwareIntent,
  shouldRouteToCEHardware,
} from './tutor-law.ce-hardware-classifier';
import {
  HardwareIntent,
  type HardwareClassifierOutput,
} from './tutor-law.ce-hardware.types';
import {
  buildTheoryClassifierInput,
  classifyTheoryIntent,
  shouldRouteToCETheory,
} from './tutor-law.ce-theory-classifier';
import {
  TheoryIntent,
  type TheoryClassifierOutput,
} from './tutor-law.ce-theory.types';
import {
  buildSystemClassifierInput,
  classifySystemIntent,
  shouldRouteToCESystem,
} from './tutor-law.ce-system-classifier';
import {
  SystemIntent,
  type SystemClassifierOutput,
} from './tutor-law.ce-system.types';
import {
  buildNetworkClassifierInput,
  classifyNetworkIntent,
  shouldRouteToCENetwork,
} from './tutor-law.ce-network-classifier';
import {
  NetworkIntent,
  type NetworkClassifierOutput,
} from './tutor-law.ce-network.types';
import type {
  CESessionState,
  CETurnContext,
  CodeIntentResult,
} from './tutor-law.ce-mode.types';
import {
  applyCESessionToOutput,
  buildCodeIntentResult,
  ceIntentSkipsMathPedagogy,
  ceIntentSkipsZeroAnswer,
  deriveCESessionState,
  mergeCESessionState,
  resolveCETurnHandler,
} from './tutor-law.ce-mode';

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
  /** CE master routing when isTutorCEDomainMessage — subdomain + layer + routeTo. */
  ceRouting?:          CEClassifierOutput | null;
  /** CE hardware subdomain when routeTo is ce-hardware-classifier. */
  ceHardware?:         HardwareClassifierOutput | null;
  /** CE theory subdomain when routeTo is ce-theory-classifier. */
  ceTheory?:           TheoryClassifierOutput | null;
  /** CE systems subdomain when routeTo is ce-system-classifier. */
  ceSystem?:           SystemClassifierOutput | null;
  /** CE network subdomain when routeTo is ce-network-classifier. */
  ceNetwork?:          NetworkClassifierOutput | null;
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

export function isTutorCodeDomainMessage(
  message: string,
  recentUserMessages: string[] = [],
): boolean {
  if (isTutorCEDomainMessage(message, recentUserMessages)) return true;
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

function codeOutputFromHardware(
  hw: HardwareClassifierOutput,
  language: ProgrammingLanguage,
  trace: string[],
  ceRouting: CEClassifierOutput,
): CodeClassifierOutput {
  const base: CodeClassifierOutput = {
    language,
    ceRouting,
    ceHardware:        hw,
    decisionTrace:     [...trace, ...hw._trace],
    confidence:        hw.confidence,
    examplePermission: CodeExamplePermission.SNIPPET,
    probeQuestion:     null,
    redirectScript:    null,
    intent:            CodeIntent.C_CONCEPT,
  };

  switch (hw.intent) {
    case HardwareIntent.EXAM_DIRECT:
      return {
        ...base,
        intent:            CodeIntent.TRAP,
        confidence:        'HIGH',
        examplePermission: CodeExamplePermission.NONE,
        redirectScript:    hw.redirectScript,
      };
    case HardwareIntent.H_VERIFY:
      return {
        ...base,
        intent:         CodeIntent.R_REVIEW,
        probeQuestion:  hw.verifyAnchor,
      };
    case HardwareIntent.H_TRACE:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: hw.traceProbe,
      };
    case HardwareIntent.H_DESIGN:
      return {
        ...base,
        intent:            CodeIntent.B_BUILD,
        probeQuestion:     hw.designScaffold,
        examplePermission: CodeExamplePermission.SNIPPET,
      };
    case HardwareIntent.H_CONCEPT:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: hw.conceptProbe,
      };
    default:
      return {
        ...base,
        intent:            CodeIntent.AMBIGUOUS,
        confidence:        'LOW',
        examplePermission: CodeExamplePermission.NONE,
        probeQuestion:     hw.probeQuestion,
      };
  }
}

function codeOutputFromTheory(
  theory: TheoryClassifierOutput,
  language: ProgrammingLanguage,
  trace: string[],
  ceRouting: CEClassifierOutput,
): CodeClassifierOutput {
  const base: CodeClassifierOutput = {
    language,
    ceRouting,
    ceTheory:          theory,
    decisionTrace:     [...trace, ...theory._trace],
    confidence:        theory.confidence,
    examplePermission: CodeExamplePermission.SNIPPET,
    probeQuestion:     null,
    redirectScript:    null,
    intent:            CodeIntent.C_CONCEPT,
  };

  switch (theory.intent) {
    case TheoryIntent.EXAM_DIRECT:
      return {
        ...base,
        intent:            CodeIntent.TRAP,
        confidence:        'HIGH',
        examplePermission: CodeExamplePermission.NONE,
        redirectScript:    theory.redirectScript,
      };
    case TheoryIntent.T_PROOF:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: theory.proofProbe,
      };
    case TheoryIntent.T_COMPLEXITY:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: theory.complexityProbe,
      };
    case TheoryIntent.T_TRACE:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: theory.traceAnchor,
      };
    case TheoryIntent.T_DESIGN:
      return {
        ...base,
        intent:            CodeIntent.B_BUILD,
        probeQuestion:     theory.designScaffold,
        examplePermission: CodeExamplePermission.SNIPPET,
      };
    case TheoryIntent.T_CONCEPT:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: theory.conceptProbe,
      };
    default:
      return {
        ...base,
        intent:            CodeIntent.AMBIGUOUS,
        confidence:        'LOW',
        examplePermission: CodeExamplePermission.NONE,
        probeQuestion:     theory.probeQuestion,
      };
  }
}

function codeOutputFromSystem(
  system: SystemClassifierOutput,
  language: ProgrammingLanguage,
  trace: string[],
  ceRouting: CEClassifierOutput,
): CodeClassifierOutput {
  const base: CodeClassifierOutput = {
    language,
    ceRouting,
    ceSystem:          system,
    decisionTrace:     [...trace, ...system._trace],
    confidence:        system.confidence,
    examplePermission: CodeExamplePermission.SNIPPET,
    probeQuestion:     null,
    redirectScript:    null,
    intent:            CodeIntent.C_CONCEPT,
  };

  switch (system.intent) {
    case SystemIntent.EXAM_DIRECT:
      return {
        ...base,
        intent:            CodeIntent.TRAP,
        confidence:        'HIGH',
        examplePermission: CodeExamplePermission.NONE,
        redirectScript:    system.redirectScript,
      };
    case SystemIntent.S_VERIFY:
      return {
        ...base,
        intent:         CodeIntent.R_REVIEW,
        probeQuestion:  system.verifyAnchor,
      };
    case SystemIntent.S_ANALYZE:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: system.analyzeProbe,
      };
    case SystemIntent.S_DESIGN:
      return {
        ...base,
        intent:            CodeIntent.B_BUILD,
        probeQuestion:     system.designScaffold,
        examplePermission: CodeExamplePermission.SNIPPET,
      };
    case SystemIntent.S_TRACE:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: system.traceProbe,
      };
    case SystemIntent.S_CONCEPT:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: system.conceptProbe,
      };
    default:
      return {
        ...base,
        intent:            CodeIntent.AMBIGUOUS,
        confidence:        'LOW',
        examplePermission: CodeExamplePermission.NONE,
        probeQuestion:     system.probeQuestion,
      };
  }
}

function codeOutputFromNetwork(
  network: NetworkClassifierOutput,
  language: ProgrammingLanguage,
  trace: string[],
  ceRouting: CEClassifierOutput,
): CodeClassifierOutput {
  const base: CodeClassifierOutput = {
    language,
    ceRouting,
    ceNetwork:         network,
    decisionTrace:     [...trace, ...network._trace],
    confidence:        network.confidence,
    examplePermission: CodeExamplePermission.SNIPPET,
    probeQuestion:     null,
    redirectScript:    null,
    intent:            CodeIntent.C_CONCEPT,
  };

  switch (network.intent) {
    case NetworkIntent.EXAM_DIRECT:
      return {
        ...base,
        intent:            CodeIntent.TRAP,
        confidence:        'HIGH',
        examplePermission: CodeExamplePermission.NONE,
        redirectScript:    network.redirectScript,
      };
    case NetworkIntent.N_VERIFY:
      return {
        ...base,
        intent:         CodeIntent.R_REVIEW,
        probeQuestion:  network.verifyAnchor,
      };
    case NetworkIntent.N_ANALYZE:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: network.analyzeProbe,
      };
    case NetworkIntent.N_DESIGN:
      return {
        ...base,
        intent:            CodeIntent.B_BUILD,
        probeQuestion:     network.designScaffold,
        examplePermission: CodeExamplePermission.SNIPPET,
      };
    case NetworkIntent.N_TRACE:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: network.traceProbe,
      };
    case NetworkIntent.N_CONCEPT:
      return {
        ...base,
        intent:        CodeIntent.C_CONCEPT,
        probeQuestion: network.conceptProbe,
      };
    default:
      return {
        ...base,
        intent:            CodeIntent.AMBIGUOUS,
        confidence:        'LOW',
        examplePermission: CodeExamplePermission.NONE,
        probeQuestion:     network.probeQuestion,
      };
  }
}

function tryCERoutedSubdomainOutput(
  ceRouting: CEClassifierOutput,
  rawText: string,
  language: ProgrammingLanguage,
  trace: string[],
): CodeClassifierOutput | null {
  if (shouldRouteToCEHardware(ceRouting)) {
    const hw = classifyHardwareIntent(buildHardwareClassifierInput({
      userMessage: rawText,
      ceRouting,
    }));
    if (hw.intent !== HardwareIntent.AMBIGUOUS) {
      return codeOutputFromHardware(hw, language, trace, ceRouting);
    }
  }

  if (shouldRouteToCETheory(ceRouting)) {
    const theory = classifyTheoryIntent(buildTheoryClassifierInput({
      userMessage: rawText,
      ceRouting,
    }));
    if (theory.intent !== TheoryIntent.AMBIGUOUS) {
      return codeOutputFromTheory(theory, language, trace, ceRouting);
    }
  }

  if (shouldRouteToCESystem(ceRouting)) {
    const system = classifySystemIntent(buildSystemClassifierInput({
      userMessage: rawText,
      ceRouting,
    }));
    if (system.intent !== SystemIntent.AMBIGUOUS) {
      return codeOutputFromSystem(system, language, trace, ceRouting);
    }
  }

  if (shouldRouteToCENetwork(ceRouting)) {
    const network = classifyNetworkIntent(buildNetworkClassifierInput({
      userMessage: rawText,
      ceRouting,
    }));
    if (network.intent !== NetworkIntent.AMBIGUOUS) {
      return codeOutputFromNetwork(network, language, trace, ceRouting);
    }
  }

  return null;
}

export function classifyCodeIntent(input: CodeClassifierInput): CodeClassifierOutput {
  const { normText, rawText, hasCodeBlock, hasErrorMessage, priorLanguage, stuckCount } = input;
  const trace: string[] = [];
  const language = detectProgrammingLanguage(rawText, priorLanguage);
  trace.push(`language=${language}`);

  let ceRouting: CEClassifierOutput | null = null;
  if (isTutorCEDomainMessage(rawText)) {
    ceRouting = classifyCEIntent(buildCEClassifierInput({
      userMessage: rawText,
      sessionState: {
        codeHasCodeBlock: hasCodeBlock,
        stuckCount,
      },
    }));
    trace.push(...ceRouting._trace);

    if (ceRouting.securityFlag === CESecurityFlag.EXPLOIT) {
      return {
        intent:            CodeIntent.TRAP,
        language,
        confidence:        'HIGH',
        examplePermission: CodeExamplePermission.NONE,
        probeQuestion:     null,
        redirectScript:    ceRouting.securityGuard,
        decisionTrace:     [...trace, 'CE_EXPLOIT_BLOCK'],
        ceRouting,
      };
    }
  }

  const attachCE = (out: CodeClassifierOutput): CodeClassifierOutput => {
    let merged = out;
    if (ceRouting) {
      merged = { ...merged, ceRouting };
      if (ceRouting.layerProbe) {
        merged.probeQuestion = ceRouting.layerProbe;
        if (merged.intent === CodeIntent.AMBIGUOUS) {
          merged.intent = CodeIntent.C_CONCEPT;
        }
      }
    }
    if (ceRouting && shouldRouteToCEHardware(ceRouting)) {
      const hw = classifyHardwareIntent(buildHardwareClassifierInput({
        userMessage: rawText,
        ceRouting,
      }));
      merged = {
        ...merged,
        ceHardware:    hw,
        decisionTrace: [...merged.decisionTrace, ...hw._trace],
      };
      if (merged.intent === CodeIntent.AMBIGUOUS && hw.probeQuestion) {
        merged.probeQuestion = hw.probeQuestion;
      }
    }
    if (ceRouting && shouldRouteToCETheory(ceRouting)) {
      const theory = classifyTheoryIntent(buildTheoryClassifierInput({
        userMessage: rawText,
        ceRouting,
      }));
      merged = {
        ...merged,
        ceTheory:      theory,
        decisionTrace: [...merged.decisionTrace, ...theory._trace],
      };
      if (merged.intent === CodeIntent.AMBIGUOUS && theory.probeQuestion) {
        merged.probeQuestion = theory.probeQuestion;
      }
    }
    if (ceRouting && shouldRouteToCESystem(ceRouting)) {
      const system = classifySystemIntent(buildSystemClassifierInput({
        userMessage: rawText,
        ceRouting,
      }));
      merged = {
        ...merged,
        ceSystem:      system,
        decisionTrace: [...merged.decisionTrace, ...system._trace],
      };
      if (merged.intent === CodeIntent.AMBIGUOUS && system.probeQuestion) {
        merged.probeQuestion = system.probeQuestion;
      }
    }
    if (ceRouting && shouldRouteToCENetwork(ceRouting)) {
      const network = classifyNetworkIntent(buildNetworkClassifierInput({
        userMessage: rawText,
        ceRouting,
      }));
      merged = {
        ...merged,
        ceNetwork:     network,
        decisionTrace: [...merged.decisionTrace, ...network._trace],
      };
      if (merged.intent === CodeIntent.AMBIGUOUS && network.probeQuestion) {
        merged.probeQuestion = network.probeQuestion;
      }
    }
    return merged;
  };

  if (ceRouting) {
    const routed = tryCERoutedSubdomainOutput(ceRouting, rawText, language, trace);
    if (routed) return routed;
  }

  if (countSignalHits(normText, TRAP_SIGNALS) >= 1) {
    return attachCE({
      intent:            CodeIntent.TRAP,
      language,
      confidence:        'HIGH',
      examplePermission: CodeExamplePermission.NONE,
      probeQuestion:     null,
      redirectScript:
        'ADAM tak akan tulis projek penuh untuk kamu — tapi boleh bantu pecahkan masalah langkah demi langkah. Apa bahagian yang kamu dah cuba?',
      decisionTrace:     [...trace, 'TRAP'],
    });
  }

  if (hasErrorMessage || countSignalHits(normText, DEBUG_SIGNALS) >= 1) {
    return attachCE({
      intent:            CodeIntent.D_DEBUG,
      language,
      confidence:        hasErrorMessage ? 'HIGH' : 'MEDIUM',
      examplePermission: CodeExamplePermission.SNIPPET,
      probeQuestion:     hasCodeBlock ? null : 'Boleh paste mesej error atau kod yang bermasalah?',
      redirectScript:    null,
      decisionTrace:     [...trace, 'D_DEBUG'],
    });
  }

  if (countSignalHits(normText, BUILD_SIGNALS) >= 1) {
    return attachCE({
      intent:            CodeIntent.B_BUILD,
      language,
      confidence:        'MEDIUM',
      examplePermission: CodeExamplePermission.SNIPPET,
      probeQuestion:     'Apa input dan output yang program kamu perlu hasilkan?',
      redirectScript:    null,
      decisionTrace:     [...trace, 'B_BUILD'],
    });
  }

  if (countSignalHits(normText, REVIEW_SIGNALS) >= 1 || hasCodeBlock) {
    return attachCE({
      intent:            CodeIntent.R_REVIEW,
      language,
      confidence:        hasCodeBlock ? 'HIGH' : 'MEDIUM',
      examplePermission: CodeExamplePermission.SNIPPET,
      probeQuestion:     null,
      redirectScript:    null,
      decisionTrace:     [...trace, 'R_REVIEW'],
    });
  }

  if (countSignalHits(normText, CONCEPT_SIGNALS) >= 1) {
    return attachCE({
      intent:            CodeIntent.C_CONCEPT,
      language,
      confidence:        'MEDIUM',
      examplePermission: CodeExamplePermission.SNIPPET,
      probeQuestion:     null,
      redirectScript:    null,
      decisionTrace:     [...trace, 'C_CONCEPT'],
    });
  }

  return attachCE({
    intent:            CodeIntent.AMBIGUOUS,
    language,
    confidence:        'LOW',
    examplePermission: CodeExamplePermission.NONE,
    probeQuestion:     ceRouting?.layerProbe
      ?? 'Kamu nak belajar konsep, debug error, atau bina sesuatu? Cerita sikit.',
    redirectScript:    null,
    decisionTrace:     [...trace, 'AMBIGUOUS'],
  });
}

export type {
  CESessionState,
  CETurnContext,
  CETurnHandler,
  CodeIntentResult,
} from './tutor-law.ce-mode.types';

export {
  ceIntentSkipsZeroAnswer,
  ceIntentSkipsMathPedagogy,
};

export function buildTutorCodeTurnContext(input: {
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  profile?:                 AdamTutorProfile;
  sessionState?:            Partial<CESessionState>;
  stuckCount?:              number;
}): CETurnContext {
  return {
    userMessage:             input.userMessage ?? '',
    recentUserMessages:      input.recentUserMessages ?? [],
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
    sessionState:            input.sessionState,
    stuckCount:              input.stuckCount,
  };
}

/** Full code/CE result — handler + session state for prompt laws. */
export function classifyTutorCodeIntentFull(
  ctx: CETurnContext,
): CodeIntentResult | null {
  if (!isTutorCodeDomainMessage(ctx.userMessage, ctx.recentUserMessages)) {
    return null;
  }

  const derived = deriveCESessionState(ctx);
  const merged = mergeCESessionState(ctx.sessionState, derived);
  const sessionState: CESessionState = {
    ...merged,
    stuckCount: Math.max(merged.stuckCount, ctx.stuckCount ?? 0),
  };

  const classified = classifyCodeIntent(buildCodeClassifierInput({
    userMessage: ctx.userMessage,
    recentUserMessages: ctx.recentUserMessages,
    profile: ctx.profile,
    sessionState: {
      stuckCount: sessionState.stuckCount,
      codePriorLanguage: null,
    },
  }));

  const handler = resolveCETurnHandler(classified, sessionState);
  const { output, verifyAnchorSkipped } = applyCESessionToOutput(
    classified,
    sessionState,
    handler,
  );

  return buildCodeIntentResult(output, sessionState, handler, verifyAnchorSkipped);
}

/** Classifier output only — for guards when full result not needed. */
export function classifyTutorCodeIntentOutput(
  ctx: CETurnContext,
): CodeClassifierOutput | null {
  return classifyTutorCodeIntentFull(ctx)?.output ?? null;
}
