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
import { quoteTutorAgentPackage } from '../src/adam/tutor/adam-tutor-agent-package.config';
import { creditTutorAgentPackagePins } from '../src/adam/tutor/adam-tutor-agent-package.service';

describe('quoteTutorAgentPackage — flat 100 PIN wholesale', () => {
  it('school bands (primary / secondary) → RM 200', () => {
    for (const band of ['primary', 'secondary'] as const) {
      const quote = quoteTutorAgentPackage(band);
      expect(quote.pinCount).toBe(100);
      expect(quote.totalMyr).toBe(200);
      expect(quote.packLabel).toBe('100 PIN pack');
      expect(quote.band).toBe('secondary');
    }
  });

  it('university band → RM 200', () => {
    const quote = quoteTutorAgentPackage('university');
    expect(quote.pinCount).toBe(100);
    expect(quote.totalMyr).toBe(200);
    expect(quote.band).toBe('university');
  });
});

describe('creditTutorAgentPackagePins — accumulate repurchases', () => {
  it('adds PIN credits on each wholesale repurchase', () => {
    const pack = quoteTutorAgentPackage('secondary');
    let balance = 0;
    let purchased = 0;

    const first = creditTutorAgentPackagePins(
      { pinBalance: balance, pinPurchasedTotal: purchased },
      pack.pinCount,
    );
    balance = first.pinBalance;
    purchased = first.pinPurchasedTotal;
    expect(balance).toBe(100);
    expect(purchased).toBe(100);

    const second = creditTutorAgentPackagePins(
      { pinBalance: balance, pinPurchasedTotal: purchased },
      pack.pinCount,
    );
    expect(second.pinBalance).toBe(200);
    expect(second.pinPurchasedTotal).toBe(200);
  });
});
