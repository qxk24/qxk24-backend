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
  canUpgradeTutorAgentPackage,
  tutorAgentPackageTierRank,
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

  it('agent vs public monthly USD differ by band (poster schedule)', () => {
    expect(tutorAgentMonthlyUsd('primary')).toBe(19);
    expect(tutorAgentMonthlyUsd('secondary')).toBe(23);
    expect(tutorAgentMonthlyUsd('university')).toBe(29);
    expect(tutorPublicMonthlyUsd('primary')).toBe(25);
    expect(tutorPublicMonthlyUsd('secondary')).toBe(33);
    expect(tutorPublicMonthlyUsd('university')).toBe(45);
    expect(tutorMonthlyUsdByLevel('primary', 'agent')).toBe(19);
    expect(tutorMonthlyUsdByLevel('secondary', 'public')).toBe(33);
  });
});

describe('agent package tier upgrade rules', () => {
  it('ranks silver < gold < diamond < platinum', () => {
    expect(tutorAgentPackageTierRank('silver')).toBe(0);
    expect(tutorAgentPackageTierRank('gold')).toBe(1);
    expect(tutorAgentPackageTierRank('diamond')).toBe(2);
    expect(tutorAgentPackageTierRank('platinum')).toBe(3);
  });

  it('allows same tier or upgrade, blocks downgrade', () => {
    expect(canUpgradeTutorAgentPackage('silver', 'silver')).toBe(true);
    expect(canUpgradeTutorAgentPackage('silver', 'gold')).toBe(true);
    expect(canUpgradeTutorAgentPackage('silver', 'platinum')).toBe(true);
    expect(canUpgradeTutorAgentPackage('gold', 'diamond')).toBe(true);
    expect(canUpgradeTutorAgentPackage('platinum', 'diamond')).toBe(false);
    expect(canUpgradeTutorAgentPackage('gold', 'silver')).toBe(false);
    expect(canUpgradeTutorAgentPackage('diamond', 'gold')).toBe(false);
  });

  it('first purchase has no current tier — any tier allowed', () => {
    expect(canUpgradeTutorAgentPackage(null, 'silver')).toBe(true);
    expect(canUpgradeTutorAgentPackage(null, 'platinum')).toBe(true);
  });
});
