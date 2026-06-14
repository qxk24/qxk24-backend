/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pricing Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
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
  getTutorPricing,
  listTutorLevelPricing,
  tutorMonthlyUsdByLevel,
} from '../src/subscriptions/tier-access.config';

describe('ADAM Tutor pricing (USD)', () => {
  it('returns USD amounts by school level', () => {
    expect(tutorMonthlyUsdByLevel('primary')).toBe(13);
    expect(tutorMonthlyUsdByLevel('secondary')).toBe(15);
    expect(tutorMonthlyUsdByLevel('university')).toBe(17);
  });

  it('getTutorPricing uses USD and monthly-only annual', () => {
    const p = getTutorPricing('secondary');
    expect(p.currency).toBe('USD');
    expect(p.monthly).toBe(15);
    expect(p.annual).toBe(0);
  });

  it('lists all tutor bands for Stripe checkout', () => {
    const levels = listTutorLevelPricing();
    expect(levels).toHaveLength(3);
    expect(levels.map((l) => l.monthlyAmount)).toEqual([13, 15, 17]);
    expect(levels.every((l) => l.currency === 'USD')).toBe(true);
  });
});
