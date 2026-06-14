/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Bm Lexicon Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeMalaysiaBmDrift } from '../src/adam/adam-malaysia-bm-guard';
import { buildBmLexiconPromptBlock } from '../src/malay-malaysia/bm-lexicon-context';
import {
  applyBmLexiconReplacements,
  isBmLexiconLoaded,
  matchBmLexiconEntries,
} from '../src/malay-malaysia/bm-lexicon.service';

describe('bm-lexicon service', () => {
  it('loads curated lexicon from data/malay-malaysia/lexicon.json', () => {
    expect(isBmLexiconLoaded()).toBe(true);
  });

  it('matches Indonesian drift tokens in user text', () => {
    const matches = matchBmLexiconEntries('Saya faham karena sistem teknis tidak efisien.');
    const ids = matches.map((m) => m.id);
    expect(ids).toContain('karena-kerana');
    expect(ids).toContain('teknis-teknikal');
    expect(ids).toContain('efisien-cekap');
  });

  it('applies wrong→correct replacements post-stream', () => {
    const raw = 'Ini berlaku karena sistem teknis tidak efisien, tapi bisa diperbaiki.';
    const out = applyBmLexiconReplacements(raw);
    expect(out).toContain('kerana');
    expect(out).toContain('teknikal');
    expect(out).toContain('cekap');
    expect(out).toContain('boleh');
    expect(out).not.toMatch(/\bkarena\b/i);
    expect(out).not.toMatch(/\bbisa\b/i);
  });

  it('fixes berramai-ramai spelling via lexicon', () => {
    const out = applyBmLexiconReplacements('Hidupan liar hidup berramai-ramai di hutan.');
    expect(out).toContain('beramai-ramai');
    expect(out).not.toMatch(/berramai/i);
  });
});

describe('buildBmLexiconPromptBlock', () => {
  it('injects on-demand block when Malay turn matches lexicon tokens', () => {
    const block = buildBmLexiconPromptBlock('Kenapa sistem teknis ini efisien?');
    expect(block).not.toBeNull();
    expect(block).toContain('[BM MALAYSIA LEXICON');
    expect(block).toContain('teknis → teknikal');
    expect(block).toContain('efisien → cekap');
  });

  it('returns null when no lexicon tokens match', () => {
    expect(buildBmLexiconPromptBlock('Hello, what is photosynthesis?')).toBeNull();
  });
});

describe('sanitizeMalaysiaBmDrift with lexicon', () => {
  it('uses lexicon as single source for drift + spelling', () => {
    const raw = 'Hidupan berramai-ramai karena teknis.';
    const out = sanitizeMalaysiaBmDrift(raw, 'ms');
    expect(out).toContain('beramai-ramai');
    expect(out).toContain('kerana');
    expect(out).toContain('teknikal');
  });
});
