/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Search Audit
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 *
 * Guards production search pipeline against entity/country hardcoding.
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SEARCH_PIPELINE_FILES = [
  'src/adam/adam-official-source-enrich.ts',
  'src/adam/adam-search-first.ts',
  'src/adam/adam-web-search.ts',
  'src/adam/adam-web-search-prompts.ts',
  'src/adam/adam-alpha-output-guard.ts',
  'src/adam/adam-chat-stream-turn-search.ts',
  'src/qxk24brain/deep-ul/web-search-engine.ts',
];

const BANNED_IN_PRODUCTION = [
  /\.edu\.my/i,
  /\.gov\.my/i,
  /knownAgencyHints/i,
  /kptmOfficial/i,
  /fetchKptm/i,
  /seedHits/i,
  /\bKPTM\b/,
  /18,000/,
  /Poly-Tech Mara/i,
  /mara\.gov/i,
  /MOHE\/KPT/i,
  /\$\{token\}\.edu\./,
  /acronym\.edu/i,
];

describe('ADAM universal search pipeline audit', () => {
  for (const relPath of SEARCH_PIPELINE_FILES) {
    it(`${relPath} has no entity/country hardcoding`, () => {
      const abs = join(__dirname, '..', relPath);
      const source = readFileSync(abs, 'utf8');
      for (const banned of BANNED_IN_PRODUCTION) {
        expect(source).not.toMatch(banned);
      }
    });
  }

  it('domain extraction never invents TLDs from acronyms alone', () => {
    const { extractDomainsFromMessageUrls } = require('../src/adam/adam-official-source-enrich') as {
      extractDomainsFromMessageUrls: (m: string) => string[];
    };
    expect(extractDomainsFromMessageUrls('How many students at MIT?')).toEqual([]);
    expect(extractDomainsFromMessageUrls('Statistik pelajar ABC')).toEqual([]);
  });

  it('page enrich only accepts search hits — no userMessage domain fetch', () => {
    const enrichSrc = readFileSync(
      join(__dirname, '..', 'src/adam/adam-official-source-enrich.ts'),
      'utf8',
    );
    expect(enrichSrc).toMatch(/enrichSearchHitsWithPageSnippets\(\s*hits/);
    expect(enrichSrc).not.toMatch(/for \(const domain of inferredDomains/);
  });
});
