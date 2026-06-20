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
  it('returns public USD amounts by school level', () => {
    expect(tutorMonthlyUsdByLevel('primary', 'public')).toBe(25);
    expect(tutorMonthlyUsdByLevel('secondary', 'public')).toBe(33);
    expect(tutorMonthlyUsdByLevel('university', 'public')).toBe(45);
  });

  it('returns agent USD amounts by school level', () => {
    expect(tutorMonthlyUsdByLevel('primary', 'agent')).toBe(19);
    expect(tutorMonthlyUsdByLevel('secondary', 'agent')).toBe(23);
    expect(tutorMonthlyUsdByLevel('university', 'agent')).toBe(29);
  });

  it('defaults getTutorPricing to public channel', () => {
    const p = getTutorPricing('secondary');
    expect(p.currency).toBe('USD');
    expect(p.monthly).toBe(33);
    expect(p.annual).toBe(0);
  });

  it('lists public tutor bands for Stripe checkout', () => {
    const levels = listTutorLevelPricing('public');
    expect(levels).toHaveLength(3);
    expect(levels.map((l) => l.monthlyAmount)).toEqual([25, 33, 45]);
    expect(levels.every((l) => l.currency === 'USD')).toBe(true);
  });

  it('lists agent tutor bands for kod-daftar quotes', () => {
    const levels = listTutorLevelPricing('agent');
    expect(levels.map((l) => l.monthlyAmount)).toEqual([19, 23, 29]);
  });
});
