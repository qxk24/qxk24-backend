/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Language & Writing Intent Signals
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import { WritingType } from './tutor-law.language-writing.types';

export const TRAP_EXPLICIT = [
  'tolong tulis', 'tolong buat karangan', 'tolong buatkan',
  'tolong siapkan', 'boleh tuliskan', 'tuliskan untuk saya',
  'tulis esei', 'tulis karangan', 'tulis laporan', 'tulis surat',
  'write for me', 'write this for me', 'write an essay',
  'write a report', 'write a letter', 'do my essay',
  'complete my essay', 'finish my essay', 'siapkan esei',
  'siapkan karangan', 'buat karangan untuk saya',
] as const;

export const TRAP_IMPLICIT = [
  'boleh buat', 'boleh siapkan', 'boleh tuliskan',
  'dapat tak tulis', 'boleh tak tuliskan',
  'just write', 'can you write', 'write me a',
] as const;

export const IDEA_SIGNALS = [
  'tak tahu nak tulis apa', 'tak ada idea', 'tiada idea',
  'macam mana nak mula', 'nak start macam mana',
  'tak tahu nak start', 'bingung', 'nak tulis tentang apa',
  "don't know what to write", 'no idea', 'how to start',
  "don't know how to begin", 'stuck on ideas', 'blank',
  'nak tulis pasal apa', 'idea apa yang boleh',
] as const;

export const STRUCTURE_SIGNALS = [
  'macam mana nak susun', 'struktur', 'susunan',
  'nak arrange', 'nak organise', 'outline', 'rangka',
  'macam mana nak format', 'format esei', 'introduction macam mana',
  'body paragraph', 'perenggan', 'kesimpulan macam mana',
  'how to structure', 'how to organise', 'how to arrange',
  'what should i include', 'apa yang perlu ada',
] as const;

export const REVIEW_SIGNALS = [
  'check esei', 'semak esei', 'check karangan', 'semak karangan',
  'betul tak', 'ok tak', 'ada salah tak', 'baca esei saya',
  'read my essay', 'check my essay', 'review my essay',
  'give feedback', 'beri pendapat', 'pendapat kamu',
  'improve esei', 'improve karangan', 'baiki', 'perbaiki',
  'what do you think', 'apa pendapat', 'kritik', 'critique',
] as const;

export const GRAMMAR_SIGNALS = [
  'tatabahasa', 'grammar', 'ejaan', 'spelling', 'ayat betul ke',
  'imbuhan', 'kata kerja', 'kata nama', 'kata adjektif',
  'tanda baca', 'punctuation', 'tense', 'kata hubung',
  'conjunction', 'frasa', 'phrase', 'ayat tunggal', 'ayat majmuk',
  'betul tak ayat', 'ayat ni ok', 'grammatically correct',
  'is this sentence correct', 'peribahasa betul ke',
] as const;

export const TYPE_SIGNALS: Partial<Record<WritingType, readonly string[]>> = {
  [WritingType.KARANGAN]:   ['karangan', 'karangan bm', 'karangan bahasa'],
  [WritingType.ESEI]:       ['esei', 'essay', 'academic writing'],
  [WritingType.LAPORAN]:    ['laporan', 'report', 'minit mesyuarat'],
  [WritingType.SURAT]:      ['surat', 'letter', 'surat rasmi', 'surat kiriman'],
  [WritingType.PUISI]:      ['sajak', 'puisi', 'poem', 'poetry', 'pantun', 'syair'],
  [WritingType.KOMSAS]:     ['komsas', 'novel', 'cerpen', 'drama', 'analisis sastera', 'literary'],
  [WritingType.SEJARAH]:    ['sejarah', 'history essay', 'analisis sejarah', 'peristiwa'],
  [WritingType.PERIBAHASA]: ['peribahasa', 'proverb', 'simpulan bahasa'],
};

export const LANGUAGE_DOMAIN_MARKERS = [
  ...Object.values(TYPE_SIGNALS).flat(),
  'mengarang', 'penulisan', 'writing', 'composition',
  'bm essay', 'english essay', 'sastera', 'literature',
] as const;

export const DRAFT_STRUCTURE_MARKERS = [
  'pengenalan', 'penutup', 'kesimpulan', 'isi 1', 'isi 2', 'isi 3',
  'introduction', 'conclusion', 'body paragraph', 'paragraph 1',
] as const;

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function signalHit(norm: string, signal: string): boolean {
  if (signal.includes(' ')) return norm.includes(signal);
  const re = new RegExp(`\\b${escapeRegExp(signal)}\\b`, 'i');
  return re.test(norm);
}

export function countSignalHits(norm: string, signals: readonly string[]): number {
  return signals.filter((signal) => signalHit(norm, signal)).length;
}
