/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Package Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import {
  TutorAgentPackageStatus,
  canUpgradeTutorAgentPackage,
  isTutorAgentPackageTier,
  listTutorAgentPackageCatalog,
  listTutorAgentPackagesForBand,
  quoteTutorAgentPackage,
  tutorAgentPackageTierRank,
  type TutorAgentPackageTier,
} from './adam-tutor-agent-package.config';
import { TutorAgentModel, type ITutorAgent } from './adam-tutor-agent.schema';
import { TUTOR_REGISTER_BAND_LABELS_BM } from './adam-tutor-register.constants';
import {
  computeAgentPackageExpiry,
  restoreAgentPricingAfterLicenseRenewal,
  resolveAgentLicenseExpiry,
} from './adam-tutor-pricing-renewal.service';

export function agentPackageEnforced(agent: Pick<ITutorAgent, 'packageStatus'>): boolean {
  return agent.packageStatus === TutorAgentPackageStatus.ACTIVE
    || agent.packageStatus === TutorAgentPackageStatus.PENDING;
}

/** Credit PINs after a paid package purchase (same tier repurchase or upgrade). */
export function creditTutorAgentPackagePins(
  agent: Pick<ITutorAgent, 'pinBalance' | 'pinPurchasedTotal'>,
  pinCount: number,
): { pinBalance: number; pinPurchasedTotal: number } {
  return {
    pinBalance:        (agent.pinBalance ?? 0) + pinCount,
    pinPurchasedTotal: (agent.pinPurchasedTotal ?? 0) + pinCount,
  };
}

function resolvePackageBand(
  agent: Pick<ITutorAgent, 'band'>,
  inputBand?: TutorSubscriptionLevel | null,
): TutorSubscriptionLevel {
  const band = inputBand ?? agent.band;
  if (!band) {
    throw new Error('Pilih band sekolah (rendah / menengah / IPT) sebelum pakej.');
  }
  return band;
}

export async function requestTutorAgentPackage(
  agent: ITutorAgent,
  input: {
    band?:    TutorSubscriptionLevel;
    tier:     TutorAgentPackageTier;
    renewal?: boolean;
  },
): Promise<ITutorAgent> {
  if (input.renewal) {
    if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) {
      throw new Error('Beli lagi pakej hanya untuk akaun ejen aktif.');
    }
    const band = resolvePackageBand(agent, input.band);
    if (agent.band && input.band && agent.band !== input.band) {
      throw new Error('Tidak boleh tukar band — hanya tier dalam band sama.');
    }
    if (!canUpgradeTutorAgentPackage(agent.packageTier, input.tier)) {
      throw new Error('Tidak boleh turun tier — hanya kekal atau naik (upgrade).');
    }
    const quote = quoteTutorAgentPackage(band, input.tier);
    agent.band = quote.band;
    agent.packageTier = quote.tier;
    await agent.save();
    return agent;
  }

  if (agent.packageStatus === TutorAgentPackageStatus.ACTIVE) {
    throw new Error('Pakej sudah aktif — gunakan Beli lagi untuk tambah PIN (bayaran penuh ikut tier).');
  }

  const band = resolvePackageBand(agent, input.band);
  const quote = quoteTutorAgentPackage(band, input.tier);
  agent.band = quote.band;
  agent.packageTier = quote.tier;
  agent.packageStatus = TutorAgentPackageStatus.PENDING;
  await agent.save();
  return agent;
}

export async function activateTutorAgentPackage(
  agentId: string,
  input: {
    band?:            TutorSubscriptionLevel;
    tier:             TutorAgentPackageTier;
    activatedBy:      string;
    stripeSessionId?: string;
    isRenewal?:       boolean;
  },
): Promise<ITutorAgent> {
  if (!isTutorAgentPackageTier(input.tier)) {
    throw new Error('Tier pakej tidak sah.');
  }

  const agent = await TutorAgentModel.findOne({ agentId });
  if (!agent) throw new Error('Agen not found.');

  if (input.isRenewal) {
    return renewTutorAgentPackage(agentId, input);
  }

  if (agent.packageStatus === TutorAgentPackageStatus.ACTIVE) {
    if (
      input.stripeSessionId
      && agent.packageStripeSessionId === input.stripeSessionId
    ) {
      return agent;
    }
    throw new Error('Agen package already active. Renew license or contact administrator.');
  }

  const band = resolvePackageBand(agent, input.band);
  const quote = quoteTutorAgentPackage(band, input.tier);
  const paidAt = new Date();
  agent.band = quote.band;
  agent.packageTier = quote.tier;
  agent.packageStatus = TutorAgentPackageStatus.ACTIVE;
  agent.pinBalance = quote.pinCount;
  agent.pinPurchasedTotal = quote.pinCount;
  agent.packagePaidAt = paidAt;
  agent.packageExpiresAt = computeAgentPackageExpiry(paidAt);
  agent.packageRenewedAt = null;
  agent.packageRenewalCount = 0;
  if (input.stripeSessionId) {
    agent.packageStripeSessionId = input.stripeSessionId;
    agent.packageLastFulfilledSessionId = input.stripeSessionId;
  }
  const bandLabel = TUTOR_REGISTER_BAND_LABELS_BM[quote.band] ?? quote.band;
  const note = `Pakej ${quote.tierLabel} ${bandLabel} — RM${quote.totalMyr.toFixed(2)} (${quote.pinCount} PIN) · ${input.activatedBy}`;
  agent.notes = agent.notes ? `${agent.notes}\n${note}` : note;
  await agent.save();

  const { mintTutorAgentRegisterPinsForPackage } = await import('./adam-tutor-agent-pin-mint.service');
  await mintTutorAgentRegisterPinsForPackage(agent.agentId, input.activatedBy);

  const refreshed = await TutorAgentModel.findOne({ agentId });
  return refreshed ?? agent;
}

/** Repurchase / upgrade — full tier price; PIN credits accumulate (no purchase cap). */
export async function renewTutorAgentPackage(
  agentId: string,
  input: {
    band?:            TutorSubscriptionLevel;
    tier:             TutorAgentPackageTier;
    activatedBy:      string;
    stripeSessionId?: string;
    isRenewal?:       boolean;
  },
): Promise<ITutorAgent> {
  const agent = await TutorAgentModel.findOne({ agentId });
  if (!agent) throw new Error('Agen not found.');

  if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) {
    throw new Error('Aktifkan pakej dahulu sebelum pembaharuan lesen.');
  }

  const tier = input.tier ?? agent.packageTier;
  if (!tier || !isTutorAgentPackageTier(tier)) {
    throw new Error('Tier pakej tidak sah untuk pembaharuan.');
  }

  const band = resolvePackageBand(agent, input.band);
  if (agent.band && agent.band !== band) {
    throw new Error('Tidak boleh tukar band semasa pembaharuan.');
  }

  if (!canUpgradeTutorAgentPackage(agent.packageTier, tier)) {
    throw new Error('Tidak boleh turun tier — hanya kekal atau naik (upgrade).');
  }

  const isUpgrade = Boolean(
    agent.packageTier
    && tutorAgentPackageTierRank(tier) > tutorAgentPackageTierRank(agent.packageTier),
  );
  const isSameTierRepurchase = !isUpgrade && agent.packageTier === tier;

  const quote = quoteTutorAgentPackage(band, tier);
  const now = new Date();
  const base = agent.packageExpiresAt && agent.packageExpiresAt > now
    ? agent.packageExpiresAt
    : now;

  agent.band = quote.band;
  agent.packageTier = tier;
  agent.packageExpiresAt = computeAgentPackageExpiry(base);
  agent.packageRenewedAt = now;
  agent.packageRenewalCount = (agent.packageRenewalCount ?? 0) + 1;
  const credited = creditTutorAgentPackagePins(agent, quote.pinCount);
  agent.pinBalance = credited.pinBalance;
  agent.pinPurchasedTotal = credited.pinPurchasedTotal;
  if (input.stripeSessionId) {
    agent.packageStripeSessionId = input.stripeSessionId;
    agent.packageLastFulfilledSessionId = input.stripeSessionId;
  }

  const bandLabel = TUTOR_REGISTER_BAND_LABELS_BM[quote.band] ?? quote.band;
  const action = isUpgrade
    ? `Upgrade ke ${quote.tierLabel}`
    : isSameTierRepurchase
      ? `Beli lagi ${quote.tierLabel}`
      : `Pembaharuan ${quote.tierLabel}`;
  const note = `${action} ${bandLabel} — RM${quote.totalMyr.toFixed(2)} (+${quote.pinCount} PIN · jumlah terkumpul ${agent.pinPurchasedTotal}) · ${input.activatedBy}`;
  agent.notes = agent.notes ? `${agent.notes}\n${note}` : note;
  await agent.save();

  const { mintTutorAgentRegisterPinsForPackage } = await import('./adam-tutor-agent-pin-mint.service');
  await mintTutorAgentRegisterPinsForPackage(agent.agentId, input.activatedBy);

  await restoreAgentPricingAfterLicenseRenewal(agentId);

  const refreshed = await TutorAgentModel.findOne({ agentId });
  return refreshed ?? agent;
}

export async function consumeTutorAgentPins(
  agentId: string,
  count: number,
): Promise<ITutorAgent> {
  const agent = await TutorAgentModel.findOne({ agentId });
  if (!agent) throw new Error('Agen not found.');

  if (!agentPackageEnforced(agent)) return agent;

  if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) {
    throw new Error('Agen package not activated yet. Pay for Silver/Gold/Diamond/Platinum first.');
  }

  if (agent.pinBalance < count) {
    throw new Error(
      `Baki PIN tidak mencukupi (${agent.pinBalance} tinggal, ${count} diperlukan).`,
    );
  }

  agent.pinBalance -= count;
  await agent.save();
  return agent;
}

export function serializeAgentPackage(agent: Pick<
  ITutorAgent,
  | 'band'
  | 'packageTier'
  | 'packageStatus'
  | 'pinBalance'
  | 'pinPurchasedTotal'
  | 'packagePaidAt'
  | 'packageExpiresAt'
  | 'packageRenewedAt'
  | 'packageRenewalCount'
>) {
  const band = agent.band ?? null;
  const tier = agent.packageTier ?? null;
  const packageStatus = agent.packageStatus ?? TutorAgentPackageStatus.LEGACY;
  const quote = band && tier ? quoteTutorAgentPackage(band, tier) : null;

  return {
    band,
    packageTier:       tier,
    packageTierLabel:  tier ? quote?.tierLabel ?? tier : null,
    packageStatus,
    pinBalance:        agent.pinBalance ?? 0,
    pinPurchasedTotal: agent.pinPurchasedTotal ?? 0,
    packagePaidAt:     agent.packagePaidAt?.toISOString?.() ?? null,
    packageExpiresAt:  agent.packageExpiresAt?.toISOString?.() ?? null,
    packageRenewedAt:  agent.packageRenewedAt?.toISOString?.() ?? null,
    packageRenewalCount: agent.packageRenewalCount ?? 0,
    licenseActive:     Boolean(
      (() => {
        const exp = resolveAgentLicenseExpiry(agent);
        return exp && exp > new Date();
      })(),
    ),
    packageQuote:      quote,
    catalog:           band ? listTutorAgentPackagesForBand(band) : listTutorAgentPackageCatalog(),
  };
}

export {
  listTutorAgentPackageCatalog,
  listTutorAgentPackagesForBand,
  quoteTutorAgentPackage,
};
