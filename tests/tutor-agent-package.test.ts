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

const BAND_TOTALS = {
  primary:    { silver: 200, gold: 900, diamond: 1600, platinum: 2100 },
  secondary:  { silver: 300, gold: 1400, diamond: 2600, platinum: 3600 },
  university: { silver: 400, gold: 1900, diamond: 3600, platinum: 5100 },
} as const;

describe('tutor agent package pricing (band-based)', () => {
  for (const band of ['primary', 'secondary', 'university'] as const) {
    describe(band, () => {
      for (const [tier, totalMyr] of Object.entries(BAND_TOTALS[band])) {
        it(`${tier} = RM${totalMyr}`, () => {
          expect(quoteTutorAgentPackage(band, tier as keyof typeof BAND_TOTALS.primary)).toMatchObject({
            band,
            totalMyr,
          });
        });
      }

      it('returns four tiers per band', () => {
        expect(listTutorAgentPackagesForBand(band)).toHaveLength(4);
      });
    });
  }

  it('catalog has 3 bands', () => {
    const catalog = listTutorAgentPackageCatalog();
    expect(Object.keys(catalog)).toEqual(['primary', 'secondary', 'university']);
  });
});
