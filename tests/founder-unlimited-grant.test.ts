/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Founder Unlimited Grant Test
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
import { SubscriptionTier } from '../src/subscriptions/subscription.schema';
import {
  ADAM_FREEMIUM_QUOTA_CATEGORIES,
  ADAM_SUBSCRIPTION_TIER_CATEGORIES,
  listAdamAccountCategories,
} from '../src/subscriptions/founder-unlimited-grant.service';

describe('ADAM account categories', () => {
  it('lists six subscription tiers', () => {
    expect(ADAM_SUBSCRIPTION_TIER_CATEGORIES).toHaveLength(6);
    const tiers = ADAM_SUBSCRIPTION_TIER_CATEGORIES.map((c) => c.tier);
    expect(tiers).toEqual([
      SubscriptionTier.BASIC,
      SubscriptionTier.PRO,
      SubscriptionTier.PROFESIONAL,
      SubscriptionTier.TUTOR,
      SubscriptionTier.TESTER,
      SubscriptionTier.ENTERPRISE,
    ]);
  });

  it('lists five freemium quota modes including unlimited', () => {
    expect(ADAM_FREEMIUM_QUOTA_CATEGORIES).toHaveLength(5);
    const modes = ADAM_FREEMIUM_QUOTA_CATEGORIES.map((c) => c.mode);
    expect(modes).toContain('GUEST');
    expect(modes).toContain('FREE');
    expect(modes).toContain('PRO');
    expect(modes).toContain('PROFESIONAL');
    expect(modes).toContain('UNLIMITED');
  });

  it('returns category snapshot with counts', () => {
    const snap = listAdamAccountCategories();
    expect(snap.totalSubscriptionTiers).toBe(6);
    expect(snap.totalFreemiumQuotas).toBe(5);
    expect(snap.freemiumQuotas.find((q) => q.mode === 'UNLIMITED')?.limit).toBe(-1);
  });
});
