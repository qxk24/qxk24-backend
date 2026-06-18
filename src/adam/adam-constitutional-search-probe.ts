/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Constitutional Search Probe
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Authoritative page probes + search seeds when Faktor Masa / constitutional
 * threads need real HRV, quantum eraser, or epigenetics evidence.
 */

import type { LlmSearchResult } from '../llm/llm-types';
import {
  enrichSearchHitsUntilStatFigure,
  type PageSnippetEnrichOptions,
} from './adam-official-source-enrich';
import type { AdamThreadSearchContext } from './adam-search-continuation';

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/** Empirical search seeds keyed by constitutional / thread concepts. */
export const CONSTITUTIONAL_EMPIRICAL_SEEDS: Readonly<Record<string, string>> = {
  napadu:            'heart rate variability HRV coherence stress childhood attention neuroscience peer reviewed',
  'ruang masa':      'delayed choice quantum eraser Kim interference experiment observer measurement',
  'bekas pada masa': 'DNA methylation transgenerational epigenetics FKBP5 NR3C1 stress offspring study',
  hisal:             'historical trace epigenetic inheritance trauma study',
  masa:              'psychological time perception stress cortisol HRV study',
  tenaga:            'EEG alpha theta coherence prefrontal parietal attention study',
  quantum:           'delayed choice quantum eraser experiment photon path interference',
  epigenetik:        'bisulfite sequencing methylation Dutch famine PNAS epigenetics',
  hrv:               'heart rate variability HF LF spectral power coherence study',
  eeg:               'EEG alpha theta coherence prefrontal parietal correlation study',
};

const CONSTITUTIONAL_PROBE_RULES: ReadonlyArray<{ pattern: RegExp; urls: string[] }> = [
  {
    pattern: /napadu|hrv|heart\s*rate\s*variability|heartmath|koheren/i,
    urls: [
      'https://www.heartmath.com/science/',
      'https://pubmed.ncbi.nlm.nih.gov/15798239/',
    ],
  },
  {
    pattern: /quantum\s*eraser|ruang\s*masa|delayed[- ]choice|foton|interferomet/i,
    urls: [
      'https://www.science.org/doi/10.1126/science.282710',
      'https://journals.aps.org/pra/abstract/10.1103/PhysRevA.65.033818',
    ],
  },
  {
    pattern: /epigenet|methylation|metilasi|bekas\s*pada\s*masa|fkbp5|nr3c1|tmi|dutch\s*famine|kelaparan/i,
    urls: [
      'https://www.pnas.org/doi/10.1073/pnas.1418380111',
      'https://pubmed.ncbi.nlm.nih.gov/15870235/',
    ],
  },
  {
    pattern: /eeg|alpha[- ]theta|prefrontal.*parietal|koheren.*otak/i,
    urls: [
      'https://pubmed.ncbi.nlm.nih.gov/18655758/',
    ],
  },
];

function threadCorpusFromContext(
  userMessage: string,
  context: AdamThreadSearchContext = {},
): string {
  const users = (context.recentUserMessages ?? []).join('\n');
  const assistants = (context.recentAssistantMessages ?? []).join('\n');
  return [userMessage, users, assistants].filter(Boolean).join('\n');
}

/** True when the thread discusses Faktor Masa / constitutional empirical depth. */
export function isConstitutionalEmpiricalThread(
  userMessage: string,
  context: AdamThreadSearchContext = {},
): boolean {
  const corpus = threadCorpusFromContext(userMessage, context).toLowerCase();
  return /faktor\s*masa|formula\s*xyz|bab\s*5|napadu|ruang\s*masa|bekas\s*pada\s*masa|hisal|tenaga.*masa/i.test(corpus);
}

/** Direct-fetch URLs when DashScope returns 0 hits on constitutional science threads. */
export function buildConstitutionalEmpiricalProbeUrls(
  userMessage: string,
  context: AdamThreadSearchContext = {},
): string[] {
  const corpus = threadCorpusFromContext(userMessage, context);
  const urls: string[] = [];
  for (const rule of CONSTITUTIONAL_PROBE_RULES) {
    if (rule.pattern.test(corpus)) urls.push(...rule.urls);
  }
  return uniqueStrings(urls);
}

/** Extra search seeds from named concepts in the thread. */
export function buildConstitutionalEmpiricalSearchSeeds(
  userMessage: string,
  context: AdamThreadSearchContext = {},
): string[] {
  const corpus = threadCorpusFromContext(userMessage, context).toLowerCase();
  const seeds: string[] = [];
  for (const [key, seed] of Object.entries(CONSTITUTIONAL_EMPIRICAL_SEEDS)) {
    const re = new RegExp(key.replace(/\s+/g, '\\s+'), 'i');
    if (re.test(corpus)) seeds.push(seed);
  }
  return [...new Set(seeds)];
}

/** Direct HTML fetch for constitutional empirical threads when DashScope returns 0 hits. */
export async function probeConstitutionalEmpiricalEvidence(
  userMessage: string,
  context: AdamThreadSearchContext = {},
  options?: PageSnippetEnrichOptions,
): Promise<{ hits: LlmSearchResult[]; articleFound: boolean }> {
  const candidates = buildConstitutionalEmpiricalProbeUrls(userMessage, context);
  if (candidates.length === 0) {
    return { hits: [], articleFound: false };
  }

  console.log('[adam:search-first] constitutional empirical probe', JSON.stringify({
    candidates: candidates.slice(0, 4),
    question:   userMessage.slice(0, 80),
  }));

  const seedHits: LlmSearchResult[] = candidates.map((url) => ({
    url,
    title: 'Constitutional empirical probe',
  }));

  const result = await enrichSearchHitsUntilStatFigure(seedHits, userMessage, {
    maxUrls:   options?.maxUrls ?? 4,
    timeoutMs: options?.timeoutMs ?? 10_000,
  });

  return { hits: result.hits, articleFound: result.articleFound };
}
