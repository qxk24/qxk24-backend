/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Package Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  listTutorAgentPackageCatalog,
  listTutorAgentPackagesForBand,
  quoteTutorAgentPackage,
} from '../src/adam/tutor/adam-tutor-agent-package.config';

describe('tutor agent wholesale pricing (school / university)', () => {
  it('school bands quote RM 200 · 100 PIN', () => {
    for (const band of ['primary', 'secondary'] as const) {
      const quote = quoteTutorAgentPackage(band);
      expect(quote).toMatchObject({
        band:     'secondary',
        totalMyr: 200,
        pinCount: 100,
      });
      expect(listTutorAgentPackagesForBand(band)).toHaveLength(1);
    }
  });

  it('university quotes RM 200 · 100 PIN', () => {
    const quote = quoteTutorAgentPackage('university');
    expect(quote).toMatchObject({
      band:     'university',
      totalMyr: 200,
      pinCount: 100,
    });
    expect(listTutorAgentPackagesForBand('university')).toHaveLength(1);
  });

  it('catalog has 3 bands', () => {
    const catalog = listTutorAgentPackageCatalog();
    expect(Object.keys(catalog)).toEqual(['primary', 'secondary', 'university']);
  });
});
