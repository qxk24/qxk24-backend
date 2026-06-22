/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Language & Writing Intent Classifier
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
  countSignalHits,
  GRAMMAR_SIGNALS,
  IDEA_SIGNALS,
  LANGUAGE_DOMAIN_MARKERS,
  DRAFT_STRUCTURE_MARKERS,
  REVIEW_SIGNALS,
  STRUCTURE_SIGNALS,
  TRAP_EXPLICIT,
  TRAP_IMPLICIT,
  TYPE_SIGNALS,
} from './tutor-law.language-writing-signals';
import {
  LanguageClassifierInput,
  LanguageClassifierOutput,
  LanguageIntent,
  LanguageSessionState,
  LanguageTurnContext,
  LanguageVariant,
  WritingType,
} from './tutor-law.language-writing.types';

const FEEDBACK_ANCHOR_BM =
  'ADAM dah baca draf kamu. Sebelum ADAM beri maklum balas — bahagian mana yang kamu sendiri rasa paling lemah atau paling tidak puas hati?';

const FEEDBACK_ANCHOR_EN =
  'ADAM has read your draft. Before giving feedback — which part do you feel is the weakest or you\'re least happy with?';

const DRAFT_MIN_WORDS = 30;

function isMalayLanguageTurn(
  rawText: string,
  profile?: LanguageClassifierInput['profile'],
): boolean {
  return inferTutorLanguageFromText(rawText, profile) === 'malay';
}

function detectLanguageVariant(
  rawText: string,
  profile?: LanguageClassifierInput['profile'],
): LanguageVariant {
  const hasMalay = /\b(saya|kamu|nak|tak|boleh|macam|dengan|yang|ini|itu|karangan)\b/i.test(rawText);
  const hasEnglish = /\b(i|you|the|is|are|was|were|have|has|this|that|essay|write)\b/i.test(rawText);
  if (hasMalay && hasEnglish) return LanguageVariant.MIXED;
  if (isMalayLanguageTurn(rawText, profile)) return LanguageVariant.BAHASA_MELAYU;
  return LanguageVariant.ENGLISH;
}

function detectWritingType(norm: string, prior: WritingType | null): WritingType {
  for (const [type, signals] of Object.entries(TYPE_SIGNALS)) {
    if (signals && countSignalHits(norm, signals) >= 1) {
      return type as WritingType;
    }
  }
  return prior ?? WritingType.UNKNOWN;
}

function estimateDraftWordCount(raw: string): number {
  return raw.trim().split(/\s+/).filter(Boolean).length;
}

function detectHasDraftContent(raw: string, normText: string): boolean {
  const wordCount = estimateDraftWordCount(raw);
  const structureHits = countSignalHits(normText, DRAFT_STRUCTURE_MARKERS);
  if (wordCount >= 25 && structureHits >= 2) return true;
  if (wordCount < DRAFT_MIN_WORDS) return false;
  if (countSignalHits(normText, TRAP_EXPLICIT) >= 1 && wordCount < 80) return false;
  const sentenceEnds = (raw.match(/[.!?]/g) ?? []).length;
  return sentenceEnds >= 2 || wordCount >= 80 || structureHits >= 1;
}

function buildTrapRedirect(writingType: WritingType, lang: LanguageVariant): string {
  const isBm = lang !== LanguageVariant.ENGLISH;

  const scripts: Partial<Record<WritingType, string>> = {
    [WritingType.KARANGAN]: isBm
      ? 'ADAM tidak akan menulis karangan untuk kamu — kemahiran mengarang perlu dibina sendiri. Tapi ADAM boleh bantu kamu hasilkan karangan yang lebih baik dari yang kamu jangkakan. Mulakan dengan ini: apa tiga perkara utama yang kamu rasa penting tentang tajuk ni?'
      : 'ADAM won\'t write the essay for you — that\'s the skill you\'re building. But ADAM can help you write something better than you think you can. Start with this: what are three things you feel strongly about on this topic?',
    [WritingType.LAPORAN]: isBm
      ? 'ADAM tidak menyiapkan laporan — tapi ADAM boleh bimbing kamu bina laporan yang lengkap. Soalan pertama: apa tujuan utama laporan ni? Untuk siapa ia ditulis?'
      : 'ADAM won\'t write the report — but can guide you to build a complete one. First question: what is the main purpose of this report, and who is the audience?',
    [WritingType.SURAT]: isBm
      ? 'ADAM tidak menulis surat untuk kamu. Tapi boleh bimbing kamu tulis surat yang tepat. Mula dengan ni: apakah tujuan surat ini, dan kepada siapa ia ditujukan?'
      : 'ADAM won\'t write the letter for you. But can guide you to write one properly. Start here: what is the purpose of this letter and who is it addressed to?',
    [WritingType.ESEI]: isBm
      ? 'ADAM tidak boleh tulis esei untuk kamu — tapi boleh bimbing kamu bina argumen yang kukuh. Cuba tulis thesis statement kamu dalam satu ayat dahulu.'
      : 'ADAM won\'t write the essay — but can help you build a strong argument. Try writing your thesis statement in one sentence first.',
  };

  return scripts[writingType] ?? (isBm
    ? 'ADAM tidak akan menyiapkan penulisan untuk kamu — tapi boleh bimbing proses itu. Mula dengan ini: apa idea pertama yang datang dalam kepala kamu tentang tugasan ni?'
    : 'ADAM won\'t complete the writing for you — but can guide the process. Start here: what is the first idea that comes to mind about this task?');
}

function buildIdeationProbe(writingType: WritingType, lang: LanguageVariant): string {
  const isBm = lang !== LanguageVariant.ENGLISH;

  const probes: Partial<Record<WritingType, string>> = {
    [WritingType.KARANGAN]: isBm
      ? 'Ok, belum ada idea lagi — itu normal. Cuba baca tajuk tu sekali lagi dengan perlahan. Apa satu perkataan pertama yang datang dalam kepala kamu?'
      : 'No ideas yet — that\'s normal. Read the title slowly one more time. What is the very first word that comes to mind?',
    [WritingType.KOMSAS]: isBm
      ? 'Untuk analisis sastera, mula dengan perasaan: selepas baca teks tu, apa yang kamu rasa? Suka? Marah? Sedih? Kenapa?'
      : 'For literary analysis, start with feeling: after reading the text, what did you feel? Why?',
    [WritingType.SEJARAH]: isBm
      ? 'Untuk esei sejarah, mula dengan bertanya: siapa yang terlibat, apa yang berlaku, dan yang paling penting — kenapa ia berlaku? Cuba jawab tiga soalan tu dulu.'
      : 'For a history essay, start by asking: who was involved, what happened, and most importantly — why did it happen? Try answering those three questions first.',
  };

  return probes[writingType] ?? (isBm
    ? 'Ok, belum ada idea — itu biasa. Cuba beritahu ADAM: tajuk atau arahan tugasan kamu tu apa? Kita mula dari situ.'
    : 'No ideas yet — that\'s fine. Tell ADAM: what is the title or task instruction? We\'ll start from there.');
}

function buildScaffoldPrompt(writingType: WritingType, lang: LanguageVariant): string {
  const isBm = lang !== LanguageVariant.ENGLISH;

  const scaffolds: Partial<Record<WritingType, string>> = {
    [WritingType.KARANGAN]: isBm
      ? 'Bagus, ada idea. Sekarang cuba senaraikan tiga isi utama kamu — dalam bentuk point ringkas, bukan ayat penuh lagi. Apa tiga perkara yang kamu nak sampaikan?'
      : 'Good, you have ideas. Now list your three main points — just short bullet points, not full sentences yet. What three things do you want to say?',
    [WritingType.LAPORAN]: isBm
      ? 'Untuk laporan, struktur asasnya: (1) latar belakang, (2) dapatan/penemuan, (3) cadangan. Kamu ada maklumat untuk bahagian mana sekali?'
      : 'For a report, the basic structure is: (1) background, (2) findings, (3) recommendations. Which section do you already have information for?',
    [WritingType.ESEI]: isBm
      ? 'Untuk esei yang kukuh, kamu perlukan: (1) thesis yang jelas, (2) tiga hujah dengan bukti, (3) counter-argument, (4) kesimpulan. Mula dengan thesis — dalam satu ayat, apa pendirian kamu?'
      : 'For a strong essay, you need: (1) a clear thesis, (2) three arguments with evidence, (3) a counter-argument, (4) conclusion. Start with the thesis — in one sentence, what is your position?',
  };

  return scaffolds[writingType] ?? (isBm
    ? 'Ok kamu ada idea. Sekarang cuba susun: apa yang kamu nak letak di bahagian pertama, tengah, dan akhir? Tulis dalam satu baris je untuk setiap bahagian.'
    : 'You have ideas. Now arrange them: what goes at the beginning, middle, and end? Write just one line for each section.');
}

export function isTutorLanguageWritingDomainMessage(
  message: string,
  recentUserMessages: string[] = [],
): boolean {
  const blob = [message, ...recentUserMessages].join('\n').toLowerCase().trim();
  if (!blob || blob.length < 6) return false;

  if (detectWritingType(blob, null) !== WritingType.UNKNOWN) return true;

  const intentSignals = [
    ...TRAP_EXPLICIT,
    ...TRAP_IMPLICIT,
    ...IDEA_SIGNALS,
    ...STRUCTURE_SIGNALS,
    ...REVIEW_SIGNALS,
    ...GRAMMAR_SIGNALS,
  ];
  if (countSignalHits(blob, intentSignals) >= 1) return true;

  return countSignalHits(blob, LANGUAGE_DOMAIN_MARKERS) >= 1;
}

export function buildLanguageClassifierInput(input: {
  userMessage:             string;
  recentUserMessages?:     string[];
  profile?:                LanguageClassifierInput['profile'];
  sessionState?:           Partial<LanguageSessionState>;
  stuckCount?:             number;
}): LanguageClassifierInput {
  const rawText = input.userMessage ?? '';
  const normText = rawText.trim().toLowerCase();
  const draftWordCount = estimateDraftWordCount(rawText);

  return {
    rawText,
    normText,
    hasDraftContent:  detectHasDraftContent(rawText, normText),
    draftWordCount,
    stuckCount:       input.stuckCount ?? 0,
    priorWritingType: input.sessionState?.lockedWritingType ?? null,
    profile:          input.profile,
  };
}

export function buildTutorLanguageTurnContext(input: {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile?:                LanguageTurnContext['profile'];
  sessionState?:           Partial<LanguageSessionState>;
  stuckCount?:             number;
}): LanguageTurnContext {
  return {
    userMessage:             input.userMessage ?? '',
    recentUserMessages:      input.recentUserMessages ?? [],
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
    sessionState:            input.sessionState,
    stuckCount:              input.stuckCount,
  };
}

export function classifyLanguageIntent(
  input: LanguageClassifierInput,
): LanguageClassifierOutput {
  const {
    rawText,
    normText,
    hasDraftContent,
    priorWritingType,
    profile,
  } = input;
  const trace: string[] = [];
  const writingType = detectWritingType(normText, priorWritingType);
  const languageVariant = detectLanguageVariant(rawText, profile);
  trace.push(`writingType=${writingType}, lang=${languageVariant}`);

  const trapExplicitHits = countSignalHits(normText, TRAP_EXPLICIT);
  const trapImplicitHits = countSignalHits(normText, TRAP_IMPLICIT);
  const isTrap =
    trapExplicitHits >= 1
    || trapImplicitHits >= 2
    || (trapImplicitHits >= 1 && !hasDraftContent);

  if (isTrap) {
    trace.push(`intent=TRAP explicit=${trapExplicitHits} implicit=${trapImplicitHits}`);
    return {
      intent:          LanguageIntent.TRAP,
      writingType,
      languageVariant,
      confidence:      trapExplicitHits >= 1 ? 'HIGH' : 'MEDIUM',
      redirectScript:  buildTrapRedirect(writingType, languageVariant),
      ideationProbe:   null,
      scaffoldPrompt:  null,
      feedbackAnchor:  null,
      probeQuestion:   null,
      decisionTrace:   trace,
    };
  }

  const grammarHits = countSignalHits(normText, GRAMMAR_SIGNALS);
  if (grammarHits >= 1) {
    trace.push(`intent=G_GRAMMAR hits=${grammarHits}`);
    return {
      intent:          LanguageIntent.G_GRAMMAR,
      writingType,
      languageVariant,
      confidence:      grammarHits >= 2 ? 'HIGH' : 'MEDIUM',
      redirectScript:  null,
      ideationProbe:   null,
      scaffoldPrompt:  null,
      feedbackAnchor:  null,
      probeQuestion:   null,
      decisionTrace:   trace,
    };
  }

  const reviewHits = countSignalHits(normText, REVIEW_SIGNALS);
  if (reviewHits >= 1 || hasDraftContent) {
    trace.push(`intent=W_REVIEW reviewHits=${reviewHits} hasDraft=${hasDraftContent}`);
    const anchor = languageVariant === LanguageVariant.ENGLISH
      ? FEEDBACK_ANCHOR_EN
      : FEEDBACK_ANCHOR_BM;
    return {
      intent:          LanguageIntent.W_REVIEW,
      writingType,
      languageVariant,
      confidence:      hasDraftContent ? 'HIGH' : 'MEDIUM',
      redirectScript:  null,
      ideationProbe:   null,
      scaffoldPrompt:  null,
      feedbackAnchor:  anchor,
      probeQuestion:   null,
      decisionTrace:   trace,
    };
  }

  const structureHits = countSignalHits(normText, STRUCTURE_SIGNALS);
  if (structureHits >= 1) {
    trace.push(`intent=W_STRUCTURE hits=${structureHits}`);
    return {
      intent:          LanguageIntent.W_STRUCTURE,
      writingType,
      languageVariant,
      confidence:      structureHits >= 2 ? 'HIGH' : 'MEDIUM',
      redirectScript:  null,
      ideationProbe:   null,
      scaffoldPrompt:  buildScaffoldPrompt(writingType, languageVariant),
      feedbackAnchor:  null,
      probeQuestion:   null,
      decisionTrace:   trace,
    };
  }

  const ideaHits = countSignalHits(normText, IDEA_SIGNALS);
  if (ideaHits >= 1) {
    trace.push(`intent=W_IDEA hits=${ideaHits}`);
    return {
      intent:          LanguageIntent.W_IDEA,
      writingType,
      languageVariant,
      confidence:      ideaHits >= 2 ? 'HIGH' : 'MEDIUM',
      redirectScript:  null,
      ideationProbe:   buildIdeationProbe(writingType, languageVariant),
      scaffoldPrompt:  null,
      feedbackAnchor:  null,
      probeQuestion:   null,
      decisionTrace:   trace,
    };
  }

  trace.push('intent=AMBIGUOUS');
  const isBm = languageVariant !== LanguageVariant.ENGLISH;
  return {
    intent:          LanguageIntent.AMBIGUOUS,
    writingType,
    languageVariant,
    confidence:      'LOW',
    redirectScript:  null,
    ideationProbe:   null,
    scaffoldPrompt:  null,
    feedbackAnchor:  null,
    probeQuestion:   isBm
      ? 'Boleh cerita sikit — kamu tengah buat apa sekarang? Ada tugasan penulisan, nak check tatabahasa, atau ada benda lain?'
      : 'Can you tell me more — what are you working on right now? Is it a writing task, grammar check, or something else?',
    decisionTrace: trace,
  };
}

export function classifyTutorLanguageIntent(
  ctx: LanguageTurnContext,
): LanguageClassifierOutput | null {
  if (!isTutorLanguageWritingDomainMessage(ctx.userMessage, ctx.recentUserMessages)) {
    return null;
  }
  return classifyLanguageIntent(buildLanguageClassifierInput(ctx));
}

export function mergeLanguageSessionState(
  prior: Partial<LanguageSessionState> | undefined,
  output: LanguageClassifierOutput,
): LanguageSessionState {
  const locked = output.writingType !== WritingType.UNKNOWN
    ? output.writingType
    : (prior?.lockedWritingType ?? null);
  return { lockedWritingType: locked };
}

export function languageIntentSkipsMathPedagogy(_intent: LanguageClassifierOutput): boolean {
  return true;
}

export function languageIntentSkipsZeroAnswer(intent: LanguageClassifierOutput): boolean {
  return (
    intent.intent === LanguageIntent.TRAP
    || intent.intent === LanguageIntent.W_REVIEW
    || intent.intent === LanguageIntent.W_STRUCTURE
    || intent.intent === LanguageIntent.W_IDEA
    || intent.intent === LanguageIntent.G_GRAMMAR
    || intent.intent === LanguageIntent.AMBIGUOUS
  );
}
