/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Revenue Insights
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  BillingCycle,
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
  type ISubscription,
} from './subscription.schema';

export interface RevenueCurrencyTotal {
  currency: string;
  amount:   number;
}

export interface FounderRevenueInsights {
  activePaying:       number;
  pendingCheckout:    number;
  activations24h:     number;
  cancellations30d:   number;
  mrr:                RevenueCurrencyTotal[];
  extensionRevenue30d: RevenueCurrencyTotal[];
  byTier: Array<{
    tier:    string;
    active:  number;
    pending: number;
    mrr:     RevenueCurrencyTotal[];
  }>;
  topProviders: Array<{ provider: string; active: number }>;
}

function monthlyAmount(amountPerCycle: number, billingCycle: BillingCycle): number {
  if (amountPerCycle <= 0) return 0;
  if (billingCycle === BillingCycle.ANNUAL) return amountPerCycle / 12;
  if (billingCycle === BillingCycle.MONTHLY) return amountPerCycle;
  return 0;
}

function addToBucket(
  map: Map<string, number>,
  currency: string,
  amount: number,
): void {
  if (amount <= 0) return;
  const key = currency.toUpperCase();
  map.set(key, (map.get(key) ?? 0) + amount);
}

function mapToSortedTotals(map: Map<string, number>): RevenueCurrencyTotal[] {
  return [...map.entries()]
    .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);
}

function isPayingTier(tier: SubscriptionTier): boolean {
  return tier === SubscriptionTier.PELAJAR
    || tier === SubscriptionTier.PROFESIONAL
    || tier === SubscriptionTier.ENTERPRISE;
}

export async function buildFounderRevenueInsights(): Promise<FounderRevenueInsights> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const subs = await SubscriptionModel.find({
    isFounderFunded: { $ne: true },
    status: { $ne: SubscriptionStatus.WAQF },
  }).lean<ISubscription[]>();

  const mrrMap = new Map<string, number>();
  const extensionMap = new Map<string, number>();
  const tierStats = new Map<string, { active: number; pending: number; mrr: Map<string, number> }>();
  const providerMap = new Map<string, number>();

  let activePaying = 0;
  let pendingCheckout = 0;
  let activations24h = 0;
  let cancellations30d = 0;

  for (const sub of subs) {
    const tierKey = String(sub.tier);
    if (!tierStats.has(tierKey)) {
      tierStats.set(tierKey, { active: 0, pending: 0, mrr: new Map() });
    }
    const tierRow = tierStats.get(tierKey)!;

    if (sub.status === SubscriptionStatus.ACTIVE && isPayingTier(sub.tier)) {
      const mrr = monthlyAmount(sub.amountPerCycle, sub.billingCycle);
      if (mrr > 0) {
        activePaying += 1;
        tierRow.active += 1;
        addToBucket(mrrMap, sub.currency, mrr);
        addToBucket(tierRow.mrr, sub.currency, mrr);
        providerMap.set(
          String(sub.provider),
          (providerMap.get(String(sub.provider)) ?? 0) + 1,
        );
      }
    }

    if (sub.status === SubscriptionStatus.PENDING && isPayingTier(sub.tier)) {
      pendingCheckout += 1;
      tierRow.pending += 1;
    }

    if (
      sub.status === SubscriptionStatus.ACTIVE
      && sub.currentPeriodStart
      && new Date(sub.currentPeriodStart) >= since24h
      && sub.amountPerCycle > 0
    ) {
      activations24h += 1;
    }

    if (
      sub.status === SubscriptionStatus.CANCELLED
      && sub.updatedAt
      && new Date(sub.updatedAt) >= since30d
    ) {
      cancellations30d += 1;
    }

    const history = sub.pencarianUsage?.extensionHistory ?? [];
    for (const ext of history) {
      if (!ext.purchasedAt || new Date(ext.purchasedAt) < since30d) continue;
      addToBucket(extensionMap, ext.currency, ext.amountPaid);
    }
  }

  const byTier = [...tierStats.entries()]
    .map(([tier, row]) => ({
      tier,
      active:  row.active,
      pending: row.pending,
      mrr:     mapToSortedTotals(row.mrr),
    }))
    .filter((row) => row.active > 0 || row.pending > 0)
    .sort((a, b) => b.active - a.active);

  const topProviders = [...providerMap.entries()]
    .map(([provider, active]) => ({ provider, active }))
    .sort((a, b) => b.active - a.active)
    .slice(0, 5);

  return {
    activePaying,
    pendingCheckout,
    activations24h,
    cancellations30d,
    mrr:                 mapToSortedTotals(mrrMap),
    extensionRevenue30d: mapToSortedTotals(extensionMap),
    byTier,
    topProviders,
  };
}
