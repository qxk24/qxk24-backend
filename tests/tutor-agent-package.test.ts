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
  listTutorAgentPackagesForBand,
  quoteTutorAgentPackage,
} from '../src/adam/tutor/adam-tutor-agent-package.config';

describe('tutor agent package pricing', () => {
  it('matches PDF — Sekolah Rendah', () => {
    expect(quoteTutorAgentPackage('primary', 'silver')).toMatchObject({
      pinCount: 150, pricePerPinMyr: 2.0, totalMyr: 300,
    });
    expect(quoteTutorAgentPackage('primary', 'gold')).toMatchObject({
      pinCount: 1500, pricePerPinMyr: 1.8, totalMyr: 2700,
    });
    expect(quoteTutorAgentPackage('primary', 'diamond')).toMatchObject({
      pinCount: 3750, pricePerPinMyr: 1.6, totalMyr: 6000,
    });
    expect(quoteTutorAgentPackage('primary', 'platinum')).toMatchObject({
      pinCount: 7500, pricePerPinMyr: 1.4, totalMyr: 10500,
    });
  });

  it('matches PDF — Sekolah Menengah', () => {
    expect(quoteTutorAgentPackage('secondary', 'silver')).toMatchObject({
      pinCount: 150, pricePerPinMyr: 3.0, totalMyr: 450,
    });
    expect(quoteTutorAgentPackage('secondary', 'platinum')).toMatchObject({
      pinCount: 7500, pricePerPinMyr: 2.4, totalMyr: 18000,
    });
  });

  it('matches PDF — IPT', () => {
    expect(quoteTutorAgentPackage('university', 'silver')).toMatchObject({
      pinCount: 150, pricePerPinMyr: 4.0, totalMyr: 600,
    });
    expect(quoteTutorAgentPackage('university', 'platinum')).toMatchObject({
      pinCount: 7500, pricePerPinMyr: 3.4, totalMyr: 25500,
    });
  });

  it('returns four tiers per band', () => {
    expect(listTutorAgentPackagesForBand('secondary')).toHaveLength(4);
  });
});
