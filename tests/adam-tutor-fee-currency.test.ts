/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Fee Currency Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  convertTutorUsdToRegionalFee,
  DEFAULT_TUTOR_FEE_CURRENCY,
  tutorFeeCurrencyForRegion,
} from '../src/adam/tutor/adam-tutor-fee-currency.service';
import { SupportedRegion } from '../src/subscriptions/subscription.schema';
import {
  getTutorPricing,
  listTutorLevelPricing,
  tutorMonthlyUsdByLevel,
  getConsumerProPricing,
  getConsumerPremiumPricing,
} from '../src/subscriptions/tier-access.config';

describe('ADAM Tutor fee currency — regional display', () => {
  it('defaults to USD for unmapped / OTHER regions', () => {
    expect(tutorFeeCurrencyForRegion(SupportedRegion.OTHER)).toBe('USD');
    expect(tutorFeeCurrencyForRegion(SupportedRegion.US)).toBe('USD');
    const out = convertTutorUsdToRegionalFee(33, SupportedRegion.US);
    expect(out.currency).toBe(DEFAULT_TUTOR_FEE_CURRENCY);
    expect(out.monthlyLocal).toBe(33);
  });

  it('uses MYR for Malaysia with live rate', () => {
    const out = convertTutorUsdToRegionalFee(23, SupportedRegion.MY, 4.5);
    expect(out.currency).toBe('MYR');
    expect(out.monthlyLocal).toBe(103.5);
  });

  it('uses Pelajar PPP currency for Singapore', () => {
    expect(tutorFeeCurrencyForRegion(SupportedRegion.SG)).toBe('SGD');
    const out = convertTutorUsdToRegionalFee(33, SupportedRegion.SG);
    expect(out.currency).toBe('SGD');
    expect(out.monthlyLocal).toBeGreaterThan(0);
  });

  it('getTutorPricing returns regional currency while USD stays canonical', () => {
    const my = getTutorPricing('secondary', 'public', SupportedRegion.MY, 4.5);
    expect(my.currency).toBe('MYR');
    expect(my.monthly).toBe(148.5);
    expect(tutorMonthlyUsdByLevel('secondary', 'public')).toBe(33);

    const us = getTutorPricing('secondary', 'public', SupportedRegion.US);
    expect(us.currency).toBe('USD');
    expect(us.monthly).toBe(33);
  });

  it('listTutorLevelPricing exposes monthlyUsd reference and local amount', () => {
    const levels = listTutorLevelPricing('public', SupportedRegion.MY, 4.5);
    expect(levels).toHaveLength(3);
    expect(levels.every((l) => l.currency === 'MYR')).toBe(true);
    expect(levels.map((l) => l.monthlyUsd)).toEqual([25, 33, 45]);
  });
});

describe('Consumer daily plan — regional pricing', () => {
  it('returns MYR for Malaysia Pro and Premium', () => {
    const pro = getConsumerProPricing(SupportedRegion.MY, 4.5);
    const premium = getConsumerPremiumPricing(SupportedRegion.MY, 4.5);

    expect(pro.currency).toBe('MYR');
    expect(pro.monthly).toBe(85.5);
    expect(premium.currency).toBe('MYR');
    expect(premium.monthly).toBe(337.5);
  });

  it('keeps USD for US visitors', () => {
    const pro = getConsumerProPricing(SupportedRegion.US);
    expect(pro.currency).toBe('USD');
    expect(pro.monthly).toBe(19);
  });
});
