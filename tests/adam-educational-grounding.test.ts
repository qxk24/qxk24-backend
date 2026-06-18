/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Educational Grounding Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildEducationalSearchDisplayQuery,
  buildEducationalZeroHitSearchContextBlock,
} from '../src/adam/adam-educational-grounding';
import { buildAdamSearchDisplayQuery, buildPrefetchedSearchContextBlock } from '../src/adam/adam-search-first';
import { repairAdamMediaOutput } from '../src/adam/adam-media-guard';

const NEWTON_ASK =
  'Terangkan hukum Newton yang pertama dengan contoh kehidupan seharian.';

const CONSTITUTION_ASK =
  'Apakah peranan Perlembagaan Malaysia dalam sistem kerajaan negara kita?';

describe('educational search display query', () => {
  it('derives display query from student text — no topic catalog', () => {
    const q = buildEducationalSearchDisplayQuery(NEWTON_ASK);
    expect(q).toMatch(/newton|hukum/i);
    expect(q).not.toMatch(/khan academy|MgBjm6Pu/i);
    expect(buildAdamSearchDisplayQuery(NEWTON_ASK, 'substantive_conventional')).toBe(q);
  });

  it('derives constitution query from student wording', () => {
    const q = buildEducationalSearchDisplayQuery(CONSTITUTION_ASK);
    expect(q).toMatch(/perlembagaan|malaysia|kerajaan/i);
    expect(q).not.toMatch(/youtube\.com|8ijrYBV/i);
  });
});

describe('educational zero-hit synthesis context', () => {
  it('allows full teaching answer when search has no hits', () => {
    const block = buildPrefetchedSearchContextBlock([], { userMessage: NEWTON_ASK });
    expect(block).toMatch(/CONVENTIONAL TEACHING OK/i);
    expect(block).not.toMatch(/TWO short sentences/i);
    expect(buildEducationalZeroHitSearchContextBlock()).toMatch(/structured lecture shape/i);
  });
});

describe('media repair — no hardcoded fallback', () => {
  it('does not invent image/video tags when discovery returned no hits', () => {
    const body = [
      'Hai QA, Hukum Newton pertama ialah hukum inersia.',
      '<adam-technical-diagram>\nflowchart LR\n  A --> B\n</adam-technical-diagram>',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = repairAdamMediaOutput(body, NEWTON_ASK, []);
    expect(out).not.toMatch(/<adam-chat-image\b/i);
    expect(out).not.toMatch(/<adam-chat-video\b/i);
  });
});
