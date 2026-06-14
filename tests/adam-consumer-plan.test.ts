/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Consumer Plan Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import {
  getPremiumCreditPacks,
  extraMessageCostCents,
  resolveCreditPack,
} from '../src/freemium/adam-freemium-credit.service';
import {
  consumerFreeDailyLimit,
  consumerProDailyLimit,
  isConsumerDailyPlan,
} from '../src/freemium/adam-freemium-consumer.service';

describe('consumer plan config', () => {
  it('uses daily free/pro limits', () => {
    expect(isConsumerDailyPlan()).toBe(true);
    expect(consumerFreeDailyLimit()).toBe(20);
    expect(consumerProDailyLimit()).toBe(100);
  });

  it('charges $0.12 per extra message', () => {
    expect(extraMessageCostCents()).toBe(12);
  });

  it('exposes Claude-style credit bundles', () => {
    const packs = getPremiumCreditPacks();
    expect(packs).toHaveLength(3);
    expect(packs[0]?.amount).toBe(45);
    expect(packs[0]?.creditValue).toBe(50);
    expect(packs[1]?.amount).toBe(200);
    expect(packs[1]?.creditValue).toBe(250);
    expect(packs[2]?.amount).toBe(700);
    expect(packs[2]?.creditValue).toBe(1000);
  });

  it('maps legacy pack ids', () => {
    expect(resolveCreditPack('premium-50')?.id).toBe('credits-50');
  });
});
