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
  listTutorAgentPackages,
  quoteTutorAgentPackage,
} from '../src/adam/tutor/adam-tutor-agent-package.config';

describe('tutor agent package pricing (band-independent)', () => {
  it('quotes one flat schedule across 4 tiers', () => {
    expect(quoteTutorAgentPackage('silver')).toMatchObject({
      pinCount: 100, pricePerPinMyr: 2.0, totalMyr: 200,
    });
    expect(quoteTutorAgentPackage('gold')).toMatchObject({
      pinCount: 500, pricePerPinMyr: 1.8, totalMyr: 900,
    });
    expect(quoteTutorAgentPackage('diamond')).toMatchObject({
      pinCount: 1000, pricePerPinMyr: 1.6, totalMyr: 1600,
    });
    expect(quoteTutorAgentPackage('platinum')).toMatchObject({
      pinCount: 1500, pricePerPinMyr: 1.4, totalMyr: 2100,
    });
  });

  it('quotes carry no band dimension', () => {
    expect(quoteTutorAgentPackage('silver')).not.toHaveProperty('band');
  });

  it('returns exactly four tiers', () => {
    expect(listTutorAgentPackages()).toHaveLength(4);
  });
});
