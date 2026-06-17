/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Search-First Career Pipeline Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildFactualCareerPrefetchPrompt,
  buildPrefetchedSearchContextBlock,
  buildSearchPrefetchUserPrompt,
  extractRoleSkillFactsFromSearchHits,
} from '../src/adam/adam-search-first';
import { messageAsksRoleAndSkills } from '../src/adam/adam-official-source-enrich';
import { findRichestSynthesisEvidenceHit } from '../src/adam/adam-alpha-stat-evidence';
import { snippetHasSynthesisGroundingBody } from '../src/adam/adam-official-source-enrich';
import { buildFactualCareerSearchSites } from '../src/adam/adam-web-search';

const GURU_ASK = 'Apakah peranan guru di sekolah menengah, dan kemahiran apa yang diperlukan?';

describe('messageAsksRoleAndSkills — BM career', () => {
  it('detects BM guru role + skills question', () => {
    expect(messageAsksRoleAndSkills(GURU_ASK)).toBe(true);
  });
});

describe('buildSearchPrefetchUserPrompt — BM career', () => {
  it('uses expanded career prefetch (not raw question only)', () => {
    const prompt = buildSearchPrefetchUserPrompt(GURU_ASK);
    expect(prompt).toMatch(/official career reference/i);
    expect(prompt).not.toMatch(/^Apakah peranan guru/);
  });
});

describe('buildFactualCareerPrefetchPrompt — locale', () => {
  it('prefers KPM/MOE for BM education career', () => {
    const prompt = buildFactualCareerPrefetchPrompt(GURU_ASK);
    expect(prompt).toMatch(/moe\.gov\.my/i);
    expect(prompt).not.toMatch(/NHS healthcare careers skills qualifications/);
  });
});

describe('buildFactualCareerSearchSites', () => {
  it('assigns gov.my for BM guru ask', () => {
    expect(buildFactualCareerSearchSites(GURU_ASK)).toEqual(['moe.gov.my', 'gov.my']);
  });
});

describe('extractRoleSkillFactsFromSearchHits', () => {
  it('pulls role/skill sentences from snippets', () => {
    const facts = extractRoleSkillFactsFromSearchHits([
      {
        title: 'PdPc Guru',
        url:   'https://www.moe.gov.my/pdpc',
        snippet: 'Guru bertindak sebagai perancang untuk melaksanakan Pembelajaran dan Pemudahcaraan (PdPc). Guru juga bertindak sebagai penilai melalui pentaksiran formatif.',
      },
    ], GURU_ASK);
    expect(facts).toMatch(/perancang/i);
    expect(facts).toMatch(/pentaksiran/i);
    expect(facts).toMatch(/moe\.gov\.my/);
  });
});

describe('buildPrefetchedSearchContextBlock — practical advisory weave', () => {
  it('injects mandatory search weave rules for guru ask', () => {
    const block = buildPrefetchedSearchContextBlock(
      [{ title: 'MOE', url: 'https://www.moe.gov.my/', snippet: 'Guru sebagai perancang PdPc.' }],
      { userMessage: GURU_ASK },
    );
    expect(block).toMatch(/PRACTICAL ADVISORY SEARCH SYNTHESIS/i);
    expect(block).toMatch(/Ground EVERY paragraph/i);
    expect(block).toMatch(/FORBIDDEN: answering from model memory alone/i);
  });
});

describe('findRichestSynthesisEvidenceHit — career grounding', () => {
  it('accepts role/skill snippet without enrollment stat', () => {
    const snippet = [
      'Guru sekolah menengah merancang PdPc melalui RPH, menentukan kaedah pentaksiran, dan membimbing murid menguasai kemahiran.',
      'Komunikasi dengan ibu bapa dan kerja berpasukan dengan kaunselor adalah sebahagian tanggungjawab harian.',
    ].join('\n\n');
    expect(snippetHasSynthesisGroundingBody(snippet)).toBe(true);
    const hit = findRichestSynthesisEvidenceHit([
      {
        title:       'Pengurusan PdPc',
        url:         'https://www.moe.gov.my/pdpc',
        snippet,
        pageFetched: true,
      },
    ], GURU_ASK);
    expect(hit?.url).toMatch(/moe\.gov\.my/);
  });
});
