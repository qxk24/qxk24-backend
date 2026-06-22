/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Intent Signals
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

import { MathTopic } from './tutor-law.math-intent.types';

export const CONCEPT_SIGNALS_MS: string[] = [
  'tak faham', 'apa itu', 'apa maksud', 'macam mana',
  'kenapa', 'mengapa', 'boleh explain', 'boleh terang',
  'tidak mengerti', 'keliru', 'confuse', 'pening',
  'apa beza', 'cara nak', 'macam mana nak',
];

export const CONCEPT_SIGNALS_EN: string[] = [
  'don\'t understand', 'what is', 'what does', 'how do',
  'why does', 'why is', 'explain', 'confused',
  'what\'s the difference', 'how to', 'i don\'t get',
  'can you teach', 'what does it mean',
];

export const PROCEDURE_SIGNALS_MS: string[] = [
  'dah cuba', 'tapi tak dapat', 'tersekat', 'macam ni ke',
  'langkah', 'cara kerja', 'saya buat', 'saya kira',
  'ini betul tak', 'salah ke', 'kat mana silap',
  'rasa macam betul', 'tapi lain',
];

export const PROCEDURE_SIGNALS_EN: string[] = [
  'i tried', 'i got stuck', 'my working', 'my steps',
  'is this right', 'where did i go wrong', 'i calculated',
  'i did', 'here is my attempt', 'step', 'i\'m stuck at',
];

export const VERIFICATION_SIGNALS_MS: string[] = [
  'jawapan saya', 'saya dapat', 'betul tak', 'betulkah',
  'saya rasa', 'check', 'semak', 'confirm', 'sahkan',
  'adakah ini betul', 'ini betul',
];

export const VERIFICATION_SIGNALS_EN: string[] = [
  'my answer is', 'i got', 'is it correct', 'is this right',
  'i think the answer', 'can you check', 'verify', 'confirm',
  'the answer is', 'is this correct',
];

export const SCIENCE_FACTUAL_SIGNALS: string[] = [
  'siapa', 'who discovered', 'bila', 'when was', 'sejarah',
  'history of', 'apa fungsi', 'what is the function',
  'fakta', 'fact about', 'define', 'definition',
  'apa maksud', 'maksud formula', 'what does', 'apa itu formula',
];

export const EXAM_DIRECT_SIGNALS: string[] = [
  'tolong selesaikan', 'tolong buat', 'tolong jawab',
  'solve this', 'do this for me', 'answer this',
  'soalan peperiksaan', 'soalan ujian', 'homework',
  'kerja sekolah', 'tugasan', 'assignment',
  'tolong tuliskan', 'write the solution',
];

export const COMPUTATION_PATTERNS: RegExp[] = [
  /\d+\s*[+\-×÷*/^=]\s*\d+/,
  /kirakan/i,
  /calculate/i,
  /cari nilai/i,
  /find the value/i,
  /selesaikan/i,
  /solve for/i,
  /berapa/i,
  /how many/i,
  /what is the value/i,
];

export const PROBE_BY_TOPIC: Partial<Record<MathTopic, string>> = {
  [MathTopic.ALGEBRA_QUADRATIC]:
    'Boleh tunjukkan apa yang kamu dah cuba untuk soalan ni?',
  [MathTopic.ALGEBRA_LINEAR]:
    'Kamu dah cuba selesaikan tak? Kalau ya, tunjukkan langkah pertama kamu.',
  [MathTopic.ARITHMETIC_BASIC]:
    'Cuba tunjukkan cara kamu — tulis walaupun satu langkah.',
  [MathTopic.ARITHMETIC_FRACTION]:
    'Apa yang kamu faham tentang pecahan setakat ni?',
  [MathTopic.WORD_PROBLEM]:
    'Benda pertama yang kamu buat bila baca soalan tu apa?',
  [MathTopic.GEOMETRY]:
    'Kamu dah lukis rajah atau label nilai yang diberi tak?',
  [MathTopic.UNKNOWN]:
    'Sebelum kita mula, boleh cerita sikit — apa yang kamu dah cuba atau dah faham?',
};

export const EXAM_REDIRECT_MS =
  'Soalan ni nampak macam dari peperiksaan atau tugasan. '
  + 'ADAM tak akan selesaikan terus — sebab kamu yang perlu bina kemahiran tu. '
  + 'Tapi ADAM boleh bantu kamu mula. '
  + 'Cuba tulis satu benda: apa maklumat yang dah diberi dalam soalan tu?';

export const EXAM_REDIRECT_EN =
  'This looks like an exam or assignment question. '
  + 'ADAM won\'t solve it directly — that\'s how you build the skill. '
  + 'But ADAM can help you start. '
  + 'Try this first: what information is already given in the question?';

export function normalizeMathClassifierText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s+=^²]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countSignalHits(norm: string, signals: string[]): number {
  return signals.filter((s) => norm.includes(s)).length;
}

export function classifierHasNumericalComputation(raw: string): boolean {
  return COMPUTATION_PATTERNS.some((p) => {
    p.lastIndex = 0;
    return p.test(raw);
  });
}

export function hasExplicitAnswer(norm: string): boolean {
  return (
    /jawapan\s*(saya|ialah|=)/.test(norm)
    || /i got\s+\w+\s*=/.test(norm)
    || /answer\s*(is|=)\s*\d/.test(norm)
    || /saya dapat\s+\d/.test(norm)
    || /=\s*\d+\s*$/.test(norm.trim())
    || /^\d+[\d,]*\s*(?:orang|unit|cm|kg|rm|ringgit)?\s*$/i.test(norm.trim())
  );
}

export function hasWorkingShown(norm: string): boolean {
  return (
    /langkah\s*\d/.test(norm)
    || /step\s*\d/i.test(norm)
    || /\d+\s*[+\-×÷*/]\s*\d+\s*=\s*\d+/.test(norm)
    || /cara kerja/.test(norm)
    || /working/.test(norm)
  );
}

export function detectMathTopic(norm: string, prior: MathTopic | null): MathTopic {
  if (/kuadratik|quadratic|x²|x\^2|faktor/.test(norm)) return MathTopic.ALGEBRA_QUADRATIC;
  if (/linear|persamaan|equation|algebra|selesaikan x/.test(norm)) return MathTopic.ALGEBRA_LINEAR;
  if (/sistem|simultaneous|dua persamaan/.test(norm)) return MathTopic.ALGEBRA_SYSTEMS;
  if (/pecahan|fraction|pengangka|penyebut/.test(norm)) return MathTopic.ARITHMETIC_FRACTION;
  if (/perpuluhan|decimal|titik/.test(norm)) return MathTopic.ARITHMETIC_DECIMAL;
  if (/luas|perimeter|sudut|angle|bentuk|shape/.test(norm)) return MathTopic.GEOMETRY;
  if (/min|median|mod|statistik|data|graf|chart/.test(norm)) return MathTopic.STATISTICS;
  if (/masalah|problem|cerita|story|word problem/.test(norm)) return MathTopic.WORD_PROBLEM;
  if (/e=mc|f=ma|formula fizik|formula kimia/.test(norm)) return MathTopic.SCIENCE_MATH;
  if (/\d+\s*[+\-×÷]\s*\d+/.test(norm)) return MathTopic.ARITHMETIC_BASIC;
  return prior ?? MathTopic.UNKNOWN;
}

export function buildProbeQuestion(topic: MathTopic): string {
  return PROBE_BY_TOPIC[topic] ?? PROBE_BY_TOPIC[MathTopic.UNKNOWN]!;
}
