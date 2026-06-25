/**
 * ADAM Tutor — official agent package PIN counts and MYR totals (band-independent).
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  quoteTutorAgentPackage,
  type TutorAgentPackageTier,
} from '../src/adam/tutor/adam-tutor-agent-package.config';
import { creditTutorAgentPackagePins } from '../src/adam/tutor/adam-tutor-agent-package.service';

const OFFICIAL_TOTALS: Record<
  TutorAgentPackageTier,
  { pinCount: number; totalMyr: number }
> = {
  silver:   { pinCount: 100, totalMyr: 200 },
  gold:     { pinCount: 500, totalMyr: 900 },
  diamond:  { pinCount: 1_000, totalMyr: 1_600 },
  platinum: { pinCount: 1_500, totalMyr: 2_100 },
};

describe('quoteTutorAgentPackage — jadual rasmi pakej ejen (satu kadar)', () => {
  for (const tier of ['silver', 'gold', 'diamond', 'platinum'] as const) {
    it(`${tier}`, () => {
      const expected = OFFICIAL_TOTALS[tier];
      const quote = quoteTutorAgentPackage(tier);
      expect(quote.pinCount).toBe(expected.pinCount);
      expect(quote.totalMyr).toBe(expected.totalMyr);
      expect(quote.pricePerPinMyr).toBe(
        Math.round((expected.totalMyr / expected.pinCount) * 100) / 100,
      );
    });
  }
});

describe('creditTutorAgentPackagePins — accumulate repurchases', () => {
  it('adds PIN credits on each same-tier purchase', () => {
    const silver = quoteTutorAgentPackage('silver');
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
