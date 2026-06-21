/**
 * ADAM Tutor — official agent package PIN counts and MYR totals.
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  quoteTutorAgentPackage,
  type TutorAgentPackageTier,
} from '../src/adam/tutor/adam-tutor-agent-package.config';
import type { TutorSubscriptionLevel } from '../src/subscriptions/subscription.schema';

const OFFICIAL_TOTALS: Record<
  TutorSubscriptionLevel,
  Record<TutorAgentPackageTier, { pinCount: number; totalMyr: number }>
> = {
  primary: {
    silver:   { pinCount: 100, totalMyr: 200 },
    gold:     { pinCount: 500, totalMyr: 900 },
    diamond:  { pinCount: 1_000, totalMyr: 1_600 },
    platinum: { pinCount: 1_500, totalMyr: 2_100 },
  },
  secondary: {
    silver:   { pinCount: 100, totalMyr: 300 },
    gold:     { pinCount: 500, totalMyr: 1_400 },
    diamond:  { pinCount: 1_000, totalMyr: 2_600 },
    platinum: { pinCount: 1_500, totalMyr: 3_600 },
  },
  university: {
    silver:   { pinCount: 100, totalMyr: 400 },
    gold:     { pinCount: 500, totalMyr: 1_900 },
    diamond:  { pinCount: 1_000, totalMyr: 3_600 },
    platinum: { pinCount: 1_500, totalMyr: 5_100 },
  },
};

describe('quoteTutorAgentPackage — jadual rasmi pakej ejen', () => {
  for (const band of ['primary', 'secondary', 'university'] as const) {
    for (const tier of ['silver', 'gold', 'diamond', 'platinum'] as const) {
      it(`${band} · ${tier}`, () => {
        const expected = OFFICIAL_TOTALS[band][tier];
        const quote = quoteTutorAgentPackage(band, tier);
        expect(quote.pinCount).toBe(expected.pinCount);
        expect(quote.totalMyr).toBe(expected.totalMyr);
        expect(quote.pricePerPinMyr).toBe(
          Math.round((expected.totalMyr / expected.pinCount) * 100) / 100,
        );
      });
    }
  }
});
