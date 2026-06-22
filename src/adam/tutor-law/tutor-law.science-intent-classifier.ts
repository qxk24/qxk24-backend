/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Science Intent Classifier
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

import { inferTutorLanguageFromText } from './tutor-law.types';
import {
  studentPresentsExamOrHomeworkDump,
} from './tutor-law.math-intent-detectors';
import { hasNumericalComputation } from './tutor-law.math-intent-detectors';
import {
  BIOLOGY_SIGNALS,
  CALCULATION_EN,
  CALCULATION_MS,
  CHEMISTRY_SIGNALS,
  countSignalHits,
  EXPERIMENT_EN,
  EXPERIMENT_MS,
  EXAM_DIRECT_SIGNALS,
  FACTUAL_EN,
  FACTUAL_MS,
  GEOGRAPHY_SIGNALS,
  PHASE_SIGNALS,
  PHYSICS_SIGNALS,
  SCIENCE_DOMAIN_MARKERS,
} from './tutor-law.science-intent-signals';
import {
  ExperimentPhase,
  ScienceClassifierInput,
  ScienceClassifierOutput,
  ScienceIntent,
  ScienceSessionState,
  ScienceSubject,
  ScienceTurnContext,
} from './tutor-law.science-intent.types';

const DEPTH_BY_SUBJECT_MS: Record<ScienceSubject, string> = {
  [ScienceSubject.BIOLOGY]:
    'Ok sekarang kamu dah tahu apa ia, boleh kamu terangkan apa yang akan berlaku jika proses ini terganggu?',
  [ScienceSubject.CHEMISTRY]:
    'Bagus. Sekarang boleh kamu fikirkan: dalam kehidupan harian, di mana kita boleh jumpa konsep ini?',
  [ScienceSubject.PHYSICS]:
    'Baik. Cuba bayangkan satu situasi kehidupan nyata di mana prinsip ini berlaku. Apa yang kamu nampak?',
  [ScienceSubject.GEOGRAPHY]:
    'Ok. Boleh kamu fikirkan: bagaimana proses ini mempengaruhi kehidupan manusia di kawasan tersebut?',
  [ScienceSubject.GENERAL]:
    'Faham. Sekarang, boleh kamu jelaskan mengapa ini penting dalam konteks saintifik yang lebih luas?',
  [ScienceSubject.UNKNOWN]:
    'Baik. Boleh kamu beri satu contoh di mana konsep ini boleh diperhatikan dalam kehidupan seharian?',
};

const DEPTH_BY_SUBJECT_EN: Record<ScienceSubject, string> = {
  [ScienceSubject.BIOLOGY]:
    'Now that you know what it is, what do you think would happen if this process were disrupted?',
  [ScienceSubject.CHEMISTRY]:
    'Good. Where in everyday life might we encounter this concept?',
  [ScienceSubject.PHYSICS]:
    'Imagine a real-life situation where this principle applies. What do you notice?',
  [ScienceSubject.GEOGRAPHY]:
    'How might this process affect people living in that area?',
  [ScienceSubject.GENERAL]:
    'Why does this matter in a broader scientific context?',
  [ScienceSubject.UNKNOWN]:
    'Can you give one example where we can observe this concept in daily life?',
};

const VARIABLE_PROBE_MS =
  'Sebelum kita teruskan — boleh kamu kenal pasti tiga pemboleh ubah: ' +
  '(1) apa yang kamu ubah, (2) apa yang kamu ukur, dan (3) apa yang kamu pastikan kekal sama?';

const VARIABLE_PROBE_EN =
  'Before we continue — can you identify the three variables: ' +
  '(1) what you changed, (2) what you measured, and (3) what you kept the same?';

const EXAM_REDIRECT_MS =
  'Soalan ni nampak dari peperiksaan atau tugasan. ' +
  'ADAM tidak akan jawab terus — tapi boleh bantu kamu faham cara menjawabnya. ' +
  'Mula dengan ini: apa konsep sains yang kamu rasa soalan ni uji?';

const EXAM_REDIRECT_EN =
  'This looks like an exam or assignment question. ' +
  'ADAM won\'t answer it directly — but can help you understand how to approach it. ' +
  'Start here: what science concept do you think this question is testing?';

const PROBE_BY_SUBJECT_MS: Record<ScienceSubject, string> = {
  [ScienceSubject.BIOLOGY]:
    'Tentang topik biologi ni — kamu nak faham konsepnya, nak buat kiraan, atau ada eksperimen yang kamu tengah buat?',
  [ScienceSubject.CHEMISTRY]:
    'Untuk kimia ni — adakah ini soalan tentang konsep, tentang pengiraan, atau tentang eksperimen amali?',
  [ScienceSubject.PHYSICS]:
    'Untuk fizik ni — adakah kamu nak faham prinsipnya, nak kira sesuatu nilai, atau ada eksperimen yang kamu analisis?',
  [ScienceSubject.GEOGRAPHY]:
    'Untuk geografi ni — adakah ini soalan tentang fakta / konsep, atau ada data / peta yang kamu cuba analisis?',
  [ScienceSubject.GENERAL]:
    'Boleh cerita lebih sikit — adakah kamu nak faham konsep, nak buat kiraan, atau ada eksperimen yang perlu dianalisis?',
  [ScienceSubject.UNKNOWN]:
    'Boleh cerita lebih sikit tentang apa yang kamu tengah buat — adakah ini soalan fakta, pengiraan, atau eksperimen?',
};

const PROBE_BY_SUBJECT_EN: Record<ScienceSubject, string> = {
  [ScienceSubject.BIOLOGY]:
    'For this biology topic — do you want to understand the concept, do a calculation, or work through an experiment?',
  [ScienceSubject.CHEMISTRY]:
    'For chemistry — is this about a concept, a calculation, or a practical experiment?',
  [ScienceSubject.PHYSICS]:
    'For physics — do you want the principle explained, a value calculated, or help analysing an experiment?',
  [ScienceSubject.GEOGRAPHY]:
    'For geography — is this a fact/concept question, or are you analysing data or a map?',
  [ScienceSubject.GENERAL]:
    'Tell me a bit more — concept, calculation, or experiment analysis?',
  [ScienceSubject.UNKNOWN]:
    'What are you working on — factual question, calculation, or experiment?',
};

function isMalayScienceTurn(
  normText: string,
  profile?: ScienceClassifierInput['profile'],
): boolean {
  return inferTutorLanguageFromText(normText, profile) === 'malay';
}

function detectSubject(norm: string, prior: ScienceSubject | null): ScienceSubject {
  if (countSignalHits(norm, BIOLOGY_SIGNALS) >= 1) return ScienceSubject.BIOLOGY;
  if (countSignalHits(norm, CHEMISTRY_SIGNALS) >= 1) return ScienceSubject.CHEMISTRY;
  if (countSignalHits(norm, PHYSICS_SIGNALS) >= 1) return ScienceSubject.PHYSICS;
  if (countSignalHits(norm, GEOGRAPHY_SIGNALS) >= 1) return ScienceSubject.GEOGRAPHY;
  return prior ?? ScienceSubject.UNKNOWN;
}

function detectExperimentPhase(norm: string): ExperimentPhase {
  for (const [phase, signals] of Object.entries(PHASE_SIGNALS)) {
    if (phase === ExperimentPhase.UNKNOWN) continue;
    if (countSignalHits(norm, signals) >= 1) return phase as ExperimentPhase;
  }
  return ExperimentPhase.UNKNOWN;
}

function threadHasExperimentData(blob: string): boolean {
  return countSignalHits(blob, [
    ...EXPERIMENT_MS.filter((s) => ['keputusan', 'data', 'bacaan', 'jadual', 'graf'].includes(s)),
    ...EXPERIMENT_EN.filter((s) => ['results', 'data', 'reading', 'table', 'graph'].includes(s)),
  ]) >= 1;
}

function threadHasExperimentProcedure(blob: string): boolean {
  return countSignalHits(blob, [
    'prosedur', 'procedure', 'kaedah', 'method', 'radas', 'apparatus',
  ]) >= 1;
}

function isScienceCalculation(rawText: string, normText: string): boolean {
  const calcHits = countSignalHits(normText, [...CALCULATION_MS, ...CALCULATION_EN]);
  const hasComputation = hasNumericalComputation(rawText);
  return hasComputation || (calcHits >= 1 && /\d/.test(rawText));
}

export function isTutorScienceDomainMessage(
  message: string,
  recentUserMessages: string[] = [],
): boolean {
  const blob = [message, ...recentUserMessages].join('\n').toLowerCase().trim();
  if (!blob || blob.length < 8) return false;
  if (studentPresentsExamOrHomeworkDump(message)) return true;
  if (detectSubject(blob, null) !== ScienceSubject.UNKNOWN) return true;
  return countSignalHits(blob, SCIENCE_DOMAIN_MARKERS) >= 1;
}

export function buildScienceClassifierInput(input: {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile?:                ScienceClassifierInput['profile'];
  sessionState?:           Partial<ScienceSessionState>;
  stuckCount?:             number;
}): ScienceClassifierInput {
  const rawText = input.userMessage ?? '';
  const normText = rawText.trim().toLowerCase();
  const blob = [rawText, ...(input.recentUserMessages ?? [])].join('\n');
  return {
    rawText,
    normText,
    hasShownData:      threadHasExperimentData(blob),
    hasShownProcedure: threadHasExperimentProcedure(blob),
    stuckCount:        input.stuckCount ?? 0,
    priorSubject:      input.sessionState?.lockedSubject ?? null,
    profile:           input.profile,
  };
}

export function buildTutorScienceTurnContext(input: {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile?:                ScienceTurnContext['profile'];
  sessionState?:           Partial<ScienceSessionState>;
}): ScienceTurnContext {
  return {
    userMessage:             input.userMessage ?? '',
    recentUserMessages:      input.recentUserMessages ?? [],
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
    sessionState:            input.sessionState,
  };
}

export function classifyScienceIntent(
  input: ScienceClassifierInput,
): ScienceClassifierOutput {
  const {
    rawText,
    normText,
    hasShownData,
    hasShownProcedure,
    priorSubject,
    profile,
  } = input;
  const trace: string[] = [];
  const subject = detectSubject(normText, priorSubject);
  trace.push(`subject=${subject}`);
  const isMs = isMalayScienceTurn(normText, profile);

  if (
    studentPresentsExamOrHomeworkDump(rawText)
    || countSignalHits(normText, EXAM_DIRECT_SIGNALS) >= 1
  ) {
    trace.push('intent=EXAM_DIRECT');
    return {
      intent:          ScienceIntent.EXAM_DIRECT,
      subject,
      experimentPhase: null,
      confidence:      'HIGH',
      depthQuestion:   null,
      variableProbe:   null,
      probeQuestion:   null,
      redirectScript:  isMs ? EXAM_REDIRECT_MS : EXAM_REDIRECT_EN,
      decisionTrace:   trace,
    };
  }

  if (isScienceCalculation(rawText, normText)) {
    trace.push('intent=C_CALCULATION');
    return {
      intent:          ScienceIntent.C_CALCULATION,
      subject,
      experimentPhase: null,
      confidence:      hasNumericalComputation(rawText) ? 'HIGH' : 'MEDIUM',
      depthQuestion:   null,
      variableProbe:   null,
      probeQuestion:   null,
      redirectScript:  null,
      decisionTrace:   trace,
    };
  }

  const expHits = countSignalHits(normText, [...EXPERIMENT_MS, ...EXPERIMENT_EN]);
  if (expHits >= 1 || hasShownData || hasShownProcedure) {
    const phase = detectExperimentPhase(normText);
    const needsVariableCheck =
      phase !== ExperimentPhase.VARIABLES
      && phase !== ExperimentPhase.UNKNOWN
      && !hasShownData;
    trace.push(`intent=E_EXPERIMENT phase=${phase}`);
    return {
      intent:          ScienceIntent.E_EXPERIMENT,
      subject,
      experimentPhase: phase,
      confidence:      expHits >= 2 ? 'HIGH' : 'MEDIUM',
      depthQuestion:   null,
      variableProbe:   needsVariableCheck
        ? (isMs ? VARIABLE_PROBE_MS : VARIABLE_PROBE_EN)
        : null,
      probeQuestion: null,
      redirectScript:  null,
      decisionTrace: trace,
    };
  }

  const factHits = countSignalHits(normText, [...FACTUAL_MS, ...FACTUAL_EN]);
  if (factHits >= 1) {
    trace.push(`intent=F_FACTUAL factHits=${factHits}`);
    const depthMap = isMs ? DEPTH_BY_SUBJECT_MS : DEPTH_BY_SUBJECT_EN;
    return {
      intent:          ScienceIntent.F_FACTUAL,
      subject,
      experimentPhase: null,
      confidence:      factHits >= 2 ? 'HIGH' : 'MEDIUM',
      depthQuestion:   depthMap[subject],
      variableProbe:   null,
      probeQuestion:   null,
      redirectScript:  null,
      decisionTrace:   trace,
    };
  }

  trace.push('intent=AMBIGUOUS');
  const probeMap = isMs ? PROBE_BY_SUBJECT_MS : PROBE_BY_SUBJECT_EN;
  return {
    intent:          ScienceIntent.AMBIGUOUS,
    subject,
    experimentPhase: null,
    confidence:      'LOW',
    depthQuestion:   null,
    variableProbe:   null,
    probeQuestion:   probeMap[subject],
    redirectScript:  null,
    decisionTrace:   trace,
  };
}

export function classifyTutorScienceIntent(
  ctx: ScienceTurnContext,
): ScienceClassifierOutput | null {
  if (!isTutorScienceDomainMessage(ctx.userMessage, ctx.recentUserMessages)) {
    return null;
  }
  return classifyScienceIntent(buildScienceClassifierInput(ctx));
}

export function mergeScienceSessionState(
  prior: Partial<ScienceSessionState> | undefined,
  output: ScienceClassifierOutput,
): ScienceSessionState {
  const locked = output.subject !== ScienceSubject.UNKNOWN
    ? output.subject
    : (prior?.lockedSubject ?? null);
  return { lockedSubject: locked };
}

export function scienceIntentSkipsZeroAnswer(intent: ScienceClassifierOutput): boolean {
  return (
    intent.intent === ScienceIntent.F_FACTUAL
    || intent.intent === ScienceIntent.E_EXPERIMENT
    || intent.intent === ScienceIntent.EXAM_DIRECT
    || intent.intent === ScienceIntent.AMBIGUOUS
  );
}
