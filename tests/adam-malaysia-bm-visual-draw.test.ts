/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Malaysia BM Visual Draw Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeMalaysiaBmDrift } from '../src/adam/adam-malaysia-bm-guard';
import { buildVisualDrawCanonicalAnswer } from '../src/adam/adam-visual-draw-guard';

const DRAW_ASK =
  'Lukiskan bulatan dan segiempat. Apakah perbezaan antara keduanya?';

describe('sanitizeMalaysiaBmDrift — visual draw', () => {
  it('preserves tagged ASCII art newlines and spacing', () => {
    const canonical = buildVisualDrawCanonicalAnswer(DRAW_ASK, 'QA');
    const out = sanitizeMalaysiaBmDrift(canonical, 'ms');
    expect(out).toMatch(/^Hai QA,\n\n<adam-visual-draw>/);
    expect(out).toContain('  ..    ..');
    expect(out).toContain(' .        .');
    expect(out).not.toMatch(/Bulatan:\.{6,}/);
  });
});
