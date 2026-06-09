/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  toStripeUnitAmount,
  stripeSecondsToDate,
  validDateOrNull,
  computeBillingPeriodEnd,
  stripeResourceId,
} from '../src/subscriptions/stripe-currency';

describe('Stripe regional unit amounts', () => {
  it('converts MYR and USD to smallest currency unit', () => {
    expect(toStripeUnitAmount(69.9, 'MYR')).toBe(6990);
    expect(toStripeUnitAmount(22, 'USD')).toBe(2200);
  });

  it('keeps zero-decimal currencies whole', () => {
    expect(toStripeUnitAmount(320000, 'IDR')).toBe(320000);
    expect(toStripeUnitAmount(299000, 'VND')).toBe(299000);
  });
});

describe('Stripe period helpers', () => {
  it('parses unix seconds safely', () => {
    const date = stripeSecondsToDate(1_700_000_000);
    expect(date?.toISOString()).toBe('2023-11-14T22:13:20.000Z');
    expect(stripeSecondsToDate(undefined)).toBeNull();
    expect(stripeSecondsToDate('not-a-number')).toBeNull();
  });

  it('computes monthly and annual period ends', () => {
    const start = new Date('2026-06-08T12:00:00.000Z');
    const monthly = computeBillingPeriodEnd(start, 'MONTHLY');
    expect(monthly.getUTCMonth()).toBe(6);
    const annual = computeBillingPeriodEnd(start, 'ANNUAL');
    expect(annual.getUTCFullYear()).toBe(2027);
  });

  it('rejects invalid Date objects', () => {
    expect(validDateOrNull(new Date('Invalid Date'))).toBeNull();
    expect(validDateOrNull(new Date('2026-06-08'))).not.toBeNull();
  });

  it('extracts Stripe resource ids', () => {
    expect(stripeResourceId('sub_123')).toBe('sub_123');
    expect(stripeResourceId({ id: 'sub_456' })).toBe('sub_456');
    expect(stripeResourceId(null)).toBeNull();
  });
});
