/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Intent Signals
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

import { GenericDomain } from './tutor-law.generic-intent.types';

export const FACT_SIGNALS = [
  'siapa', 'bila', 'di mana', 'tahun berapa', 'apa nama',
  'who', 'when', 'where', 'what year', 'what is the name',
  'apakah', 'nyatakan', 'senaraikan', 'list',
  'state the', 'name the', 'identify',
] as const;

export const ANALYSIS_SIGNALS = [
  'kenapa', 'mengapa', 'bagaimana', 'huraikan', 'bincangkan',
  'why', 'how did', 'explain how', 'discuss', 'analyse', 'analyze',
  'faktor', 'factor', 'kesan', 'effect', 'impact', 'sebab', 'cause',
  'bandingkan', 'compare', 'nilaikan', 'evaluate', 'assess',
  'hujah', 'argument', 'justifikasi', 'justify',
  'pendapat kamu', 'your opinion', 'adakah', 'is it true that',
] as const;

export const REVIEW_SIGNALS = [
  'check', 'semak', 'betul tak', 'ok tak', 'review',
  'baca ni', 'tengok ni', 'pendapat', 'ada salah',
  'is this correct', 'is this right', 'look at this',
  'give feedback', 'maklum balas',
] as const;

export const CONCEPT_SIGNALS = [
  'apa itu', 'apa maksud', 'define', 'definisi', 'explain',
  'terangkan', 'jelaskan', 'what is', 'what does mean',
  'tak faham', 'don\'t understand', 'confused about',
] as const;

export const EXAM_DIRECT_SIGNALS = [
  'tolong jawab', 'tolong selesaikan', 'jawabkan soalan',
  'soalan peperiksaan', 'soalan ujian', 'kerja sekolah',
  'tugasan', 'assignment', 'answer this', 'solve this for me',
] as const;

export const DOMAIN_SIGNALS: Record<GenericDomain, readonly string[]> = {
  [GenericDomain.SEJARAH]:  ['sejarah', 'history', 'tamadun', 'peristiwa', 'tokoh', 'kemerdekaan', 'penjajah'],
  [GenericDomain.GEOGRAFI]: ['geografi', 'geography', 'iklim', 'sungai', 'gunung', 'peta', 'kawasan'],
  [GenericDomain.EKONOMI]:  ['ekonomi', 'economics', 'gdp', 'inflasi', 'pasaran', 'penawaran', 'permintaan', 'wang'],
  [GenericDomain.SASTERA]:  ['sastera', 'literature', 'puisi', 'novel', 'cerpen', 'drama', 'pantun', 'poem'],
  [GenericDomain.KOMSAS]:   ['komsas', 'antologi', 'prosa tradisional', 'syair', 'tema novel', 'watak', 'plot'],
  [GenericDomain.SIVIK]:    ['sivik', 'civic', 'kewarganegaraan', 'hak', 'tanggungjawab', 'masyarakat', 'perlembagaan'],
  [GenericDomain.SENI]:     ['seni', 'art', 'lukisan', 'kraftangan', 'reka bentuk', 'muzik'],
  [GenericDomain.UMUM]:     [],
};

export function countGenericHits(norm: string, signals: readonly string[]): number {
  return signals.filter((s) => norm.includes(s)).length;
}

export function detectGenericDomain(norm: string, prior: GenericDomain | null): GenericDomain {
  let best: GenericDomain = GenericDomain.UMUM;
  let bestScore = 0;
  for (const [domain, signals] of Object.entries(DOMAIN_SIGNALS)) {
    if (domain === GenericDomain.UMUM) continue;
    const score = countGenericHits(norm, signals);
    if (score > bestScore) {
      bestScore = score;
      best = domain as GenericDomain;
    }
  }
  return bestScore > 0 ? best : (prior ?? GenericDomain.UMUM);
}

/** Sejarah, Sivik, Komsas, etc. — route before science/language false positives. */
export function detectGenericHumanitiesDomain(
  message: string,
  recentUserMessages: string[] = [],
): GenericDomain | null {
  const norm = [message, ...recentUserMessages].join('\n').trim().toLowerCase();
  const domain = detectGenericDomain(norm, null);
  return domain === GenericDomain.UMUM ? null : domain;
}

export function isTutorGenericHumanitiesDomainMessage(
  message: string,
  recentUserMessages: string[] = [],
): boolean {
  return detectGenericHumanitiesDomain(message, recentUserMessages) !== null;
}
