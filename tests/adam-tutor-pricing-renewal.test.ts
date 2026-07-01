/**
 * ADAM Tutor — 12-month agent price window + public fallback logic.
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  addCalendarMonths,
  computeAgentPackageExpiry,
  computeAgentPriceWindowEnd,
  isAgentLicenseActive,
  tutorAgentMonthlyUsd,
  tutorPublicMonthlyUsd,
} from '../src/adam/tutor/adam-tutor-pricing-renewal.service';
import { TUTOR_AGENT_LICENSE_MONTHS } from '../src/adam/tutor/adam-tutor-register.constants';
import { tutorMonthlyUsdByLevel } from '../src/subscriptions/tier-access.config';
import {
  canPurchaseWholesalePack,
  isActiveWholesalePack,
} from '../src/adam/tutor/adam-tutor-agent-package.config';

describe('adam-tutor-pricing-renewal helpers', () => {
  it('addCalendarMonths advances 12 months', () => {
    const start = new Date('2026-01-15T00:00:00Z');
    const end = addCalendarMonths(start, TUTOR_AGENT_LICENSE_MONTHS);
    expect(end.getUTCFullYear()).toBe(2027);
    expect(end.getUTCMonth()).toBe(0);
  });

  it('computeAgentPriceWindowEnd matches license months', () => {
    const start = new Date('2026-06-01T00:00:00Z');
    const end = computeAgentPriceWindowEnd(start);
    expect(end.getTime()).toBe(computeAgentPackageExpiry(start).getTime());
  });

  it('isAgentLicenseActive respects expiry', () => {
    const future = new Date(Date.now() + 86_400_000);
    const past = new Date(Date.now() - 86_400_000);
    expect(isAgentLicenseActive(future)).toBe(true);
    expect(isAgentLicenseActive(past)).toBe(false);
    expect(isAgentLicenseActive(null)).toBe(false);
  });

  it('agent vs public monthly USD by school / university band', () => {
    expect(tutorAgentMonthlyUsd('primary')).toBe(17);
    expect(tutorAgentMonthlyUsd('secondary')).toBe(17);
    expect(tutorAgentMonthlyUsd('university')).toBe(19);
    expect(tutorPublicMonthlyUsd('primary')).toBe(19);
    expect(tutorPublicMonthlyUsd('secondary')).toBe(19);
    expect(tutorPublicMonthlyUsd('university')).toBe(25);
    expect(tutorMonthlyUsdByLevel('secondary', 'agent')).toBe(17);
    expect(tutorMonthlyUsdByLevel('university', 'public')).toBe(25);
  });
});

describe('agent wholesale pack rules', () => {
  it('only flat 100 PIN wholesale is active', () => {
    expect(isActiveWholesalePack('wholesale')).toBe(true);
    expect(isActiveWholesalePack('silver')).toBe(true);
    expect(isActiveWholesalePack('gold')).toBe(false);
  });

  it('legacy gold agents cannot buy new wholesale until migrated', () => {
    expect(canPurchaseWholesalePack(null)).toBe(true);
    expect(canPurchaseWholesalePack('wholesale')).toBe(true);
    expect(canPurchaseWholesalePack('silver')).toBe(true);
    expect(canPurchaseWholesalePack('gold')).toBe(false);
  });
});
