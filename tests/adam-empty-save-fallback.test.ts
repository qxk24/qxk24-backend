/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Empty Save Fallback Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

import { describe, expect, it } from '@jest/globals';
import {
  buildAdamEmptySaveFallback,
  buildFounderEmptySaveFallback,
  buildStudentGuidedPerspectiveFallback,
} from '../src/adam/adam-response-generation';

describe('buildAdamEmptySaveFallback', () => {
  it('uses P.alt only on founder sessions', () => {
    const founder = buildFounderEmptySaveFallback();
    expect(founder).toMatch(/P\.alt, maaf/);
    expect(founder).toMatch(/tidak tersimpan/);
    expect(buildAdamEmptySaveFallback('founder')).toBe(founder);
  });

  it('never addresses P.alt on student or tester lanes', () => {
    for (const lane of ['student', 'tutor', 'niaga', 'group'] as const) {
      const out = buildAdamEmptySaveFallback(lane);
      expect(out).not.toMatch(/P\.alt/);
      expect(out).toBe(buildStudentGuidedPerspectiveFallback(''));
    }
  });
});
