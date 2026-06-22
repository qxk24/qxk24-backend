/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pedagogy v2 Signals
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

import { IThinkMapType } from './tutor-law.pedagogy-v2.types';

export const FEYNMAN_SIGNALS = [
  'feynman', 'terangkan balik', 'explain back', 'explain like',
  'macam ajar kawan', 'macam ajar orang', 'cuba ajar', 'dalam ayat mudah',
  'explain to a friend', 'simple words', 'ringkaskan penjelasan',
] as const;

export const ITHINK_SIGNALS = [
  'peta minda', 'i-think', 'ithink', 'i think map', 'thinking map',
  'peta buih', 'bubble map', 'peta alir', 'flow map', 'peta pokok',
  'tree map', 'peta jejari', 'circle map', 'peta jambatan', 'bridge map',
  'peta berbilang alir', 'multi flow', 'peta kurungan', 'brace map',
  'peta double bubble', 'double bubble',
] as const;

export const CROSS_CURRICULAR_SIGNALS = [
  'kaitkan', 'hubungkan', 'merentas subjek', 'cross subject',
  'cross-curricular', 'cross disciplinary', 'hubungan antara',
  'kaitan antara', 'sejarah dan geografi', 'sains dan matematik',
] as const;

export const FORMATIVE_SIGNALS = [
  'kuiz', 'quiz', 'uji pemahaman', 'soalan latih tubi', 'latih tubi',
  'test pemahaman', 'check understanding', 'soalan formatif',
] as const;

export const METACOGNITION_SIGNALS = [
  'refleksi', 'jurnal', 'metakognisi', 'metacognition',
  'apa yang saya belajar', 'what did i learn', 'rumusan hari ini',
  'journal', 'refleksi harian',
] as const;

export const PRACTICE_ACCEPT_SIGNALS = [
  /^ya\b/i, /^yes\b/i, /^nak\b/i, /^boleh\b/i, /^ok\b/i,
  /teruskan\s+latihan/i, /nak\s+latihan/i, /mahu\s+latihan/i,
  /soalan\s+seterusnya/i, /latihan\s+mengukuhan/i,
] as const;

const MAP_TYPE_PATTERNS: [RegExp, IThinkMapType][] = [
  [/double\s*bubble|peta\s*double/i, IThinkMapType.DOUBLE_BUBBLE],
  [/multi\s*flow|berbilang\s*alir/i, IThinkMapType.MULTI_FLOW],
  [/bubble|peta\s*buih/i, IThinkMapType.BUBBLE],
  [/flow|peta\s*alir/i, IThinkMapType.FLOW],
  [/bridge|peta\s*jambatan/i, IThinkMapType.BRIDGE],
  [/tree|peta\s*pokok/i, IThinkMapType.TREE],
  [/circle|peta\s*jejari/i, IThinkMapType.CIRCLE],
  [/brace|peta\s*kurungan/i, IThinkMapType.BRACE],
];

export function detectIThinkMapType(norm: string): IThinkMapType {
  for (const [re, type] of MAP_TYPE_PATTERNS) {
    if (re.test(norm)) return type;
  }
  if (/peta\s*minda|ithink|thinking\s*map/i.test(norm)) {
    return IThinkMapType.BUBBLE;
  }
  return IThinkMapType.UNKNOWN;
}

export function countSignalHits(norm: string, signals: readonly string[]): number {
  return signals.filter((s) => norm.includes(s)).length;
}

export function studentAcceptedPracticeOffer(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return PRACTICE_ACCEPT_SIGNALS.some((re) => {
    re.lastIndex = 0;
    return re.test(t);
  });
}

export function threadOfferedPractice(recentAssistantMessages: string[]): boolean {
  return recentAssistantMessages.some((msg) =>
    /latihan\s+mengukuhan|soalan\s+matematik\s+seterusnya|teruskan\s+latihan/i.test(msg));
}
