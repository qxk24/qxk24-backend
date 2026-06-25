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
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  quoteTutorAgentPackage,
  type TutorAgentPackageTier,
} from '../src/adam/tutor/adam-tutor-agent-package.config';
import { creditTutorAgentPackagePins } from '../src/adam/tutor/adam-tutor-agent-package.service';

const OFFICIAL_PRIMARY: Record<TutorAgentPackageTier, { pinCount: number; totalMyr: number }> = {
  silver:   { pinCount: 100, totalMyr: 200 },
  gold:     { pinCount: 500, totalMyr: 900 },
  diamond:  { pinCount: 1_000, totalMyr: 1_600 },
  platinum: { pinCount: 1_500, totalMyr: 2_100 },
};

describe('quoteTutorAgentPackage — jadual rasmi pakej ejen (primary)', () => {
  for (const tier of ['silver', 'gold', 'diamond', 'platinum'] as const) {
    it(`${tier}`, () => {
      const expected = OFFICIAL_PRIMARY[tier];
      const quote = quoteTutorAgentPackage('primary', tier);
      expect(quote.pinCount).toBe(expected.pinCount);
      expect(quote.totalMyr).toBe(expected.totalMyr);
      expect(quote.band).toBe('primary');
    });
  }
});

describe('creditTutorAgentPackagePins — accumulate repurchases', () => {
  it('adds PIN credits on each same-tier purchase', () => {
    const silver = quoteTutorAgentPackage('primary', 'silver');
    let balance = 0;
    let purchased = 0;

    const first = creditTutorAgentPackagePins(
      { pinBalance: balance, pinPurchasedTotal: purchased },
      silver.pinCount,
    );
    balance = first.pinBalance;
    purchased = first.pinPurchasedTotal;
    expect(balance).toBe(100);
    expect(purchased).toBe(100);

    const second = creditTutorAgentPackagePins(
      { pinBalance: balance, pinPurchasedTotal: purchased },
      silver.pinCount,
    );
    expect(second.pinBalance).toBe(200);
    expect(second.pinPurchasedTotal).toBe(200);
  });
});
