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
import { SupportedRegion } from '../src/subscriptions/subscription.schema';

describe('ADAM Tutor pricing (USD)', () => {
  it('returns public USD amounts by school level', () => {
    expect(tutorMonthlyUsdByLevel('primary', 'public')).toBe(19);
    expect(tutorMonthlyUsdByLevel('secondary', 'public')).toBe(19);
    expect(tutorMonthlyUsdByLevel('university', 'public')).toBe(25);
  });

  it('returns agent USD amounts by school level', () => {
    expect(tutorMonthlyUsdByLevel('primary', 'agent')).toBe(17);
    expect(tutorMonthlyUsdByLevel('secondary', 'agent')).toBe(17);
    expect(tutorMonthlyUsdByLevel('university', 'agent')).toBe(19);
  });

  it('defaults getTutorPricing to public channel USD for OTHER', () => {
    const p = getTutorPricing('secondary', 'public', SupportedRegion.OTHER);
    expect(p.currency).toBe('USD');
    expect(p.monthly).toBe(19);
    expect(p.annual).toBe(0);
  });

  it('returns MYR for Malaysia region', () => {
    const p = getTutorPricing('secondary', 'public', SupportedRegion.MY, 4.5);
    expect(p.currency).toBe('MYR');
    expect(p.monthly).toBe(85.5);
  });

  it('lists public tutor bands for Stripe checkout (USD default region)', () => {
    const levels = listTutorLevelPricing('public', SupportedRegion.OTHER);
    expect(levels).toHaveLength(3);
    expect(levels.map((l) => l.monthlyAmount)).toEqual([19, 19, 25]);
    expect(levels.every((l) => l.currency === 'USD')).toBe(true);
  });

  it('lists agent tutor bands for kod-daftar quotes', () => {
    const levels = listTutorLevelPricing('agent');
    expect(levels.map((l) => l.monthlyAmount)).toEqual([17, 17, 19]);
    expect(levels.every((l) => l.currency === 'USD')).toBe(true);
  });

  it('agent channel stays USD in Malaysia (student pay USD; komisen wallet MYR)', () => {
    const p = getTutorPricing('secondary', 'agent', SupportedRegion.MY, 4.5);
    expect(p.currency).toBe('USD');
    expect(p.monthly).toBe(17);
  });
});
