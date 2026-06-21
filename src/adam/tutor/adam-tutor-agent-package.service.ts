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
  isTutorAgentPackageTier,
  listTutorAgentPackageCatalog,
  listTutorAgentPackagesForBand,
  quoteTutorAgentPackage,
  type TutorAgentPackageTier,
} from './adam-tutor-agent-package.config';
import { TutorAgentModel, type ITutorAgent } from './adam-tutor-agent.schema';
import { TUTOR_REGISTER_BAND_LABELS_BM } from './adam-tutor-register.constants';

export function agentPackageEnforced(agent: Pick<ITutorAgent, 'packageStatus'>): boolean {
  return agent.packageStatus === TutorAgentPackageStatus.ACTIVE
    || agent.packageStatus === TutorAgentPackageStatus.PENDING;
}

export async function requestTutorAgentPackage(
  agent: ITutorAgent,
  input: { band: TutorSubscriptionLevel; tier: TutorAgentPackageTier },
): Promise<ITutorAgent> {
  if (agent.packageStatus === TutorAgentPackageStatus.ACTIVE) {
    throw new Error('Agen package already active. Contact an administrator to upgrade.');
  }

  const quote = quoteTutorAgentPackage(input.band, input.tier);
  agent.band = quote.band;
  agent.packageTier = quote.tier;
  agent.packageStatus = TutorAgentPackageStatus.PENDING;
  await agent.save();
  return agent;
}

export async function activateTutorAgentPackage(
  agentId: string,
  input: {
    band:            TutorSubscriptionLevel;
    tier:            TutorAgentPackageTier;
    activatedBy:     string;
    stripeSessionId?: string;
  },
): Promise<ITutorAgent> {
  if (!isTutorAgentPackageTier(input.tier)) {
    throw new Error('Tier pakej tidak sah.');
  }

  const agent = await TutorAgentModel.findOne({ agentId });
  if (!agent) throw new Error('Agen not found.');

  if (agent.packageStatus === TutorAgentPackageStatus.ACTIVE) {
    if (
      input.stripeSessionId
      && agent.packageStripeSessionId === input.stripeSessionId
    ) {
      return agent;
    }
    throw new Error('Agen package already active. Contact an administrator to upgrade.');
  }

  const quote = quoteTutorAgentPackage(input.band, input.tier);
  agent.band = quote.band;
  agent.packageTier = quote.tier;
  agent.packageStatus = TutorAgentPackageStatus.ACTIVE;
  agent.pinBalance = quote.pinCount;
  agent.pinPurchasedTotal = quote.pinCount;
  agent.packagePaidAt = new Date();
  if (input.stripeSessionId) {
    agent.packageStripeSessionId = input.stripeSessionId;
  }
  const note = `Pakej ${quote.tierLabel} ${TUTOR_REGISTER_BAND_LABELS_BM[quote.band] ?? quote.band} — RM${quote.totalMyr.toFixed(2)} (${quote.pinCount} PIN) · ${input.activatedBy}`;
  agent.notes = agent.notes ? `${agent.notes}\n${note}` : note;
  await agent.save();

  const { mintTutorAgentRegisterPinsForPackage } = await import('./adam-tutor-agent-pin-mint.service');
  await mintTutorAgentRegisterPinsForPackage(agent.agentId, input.activatedBy);

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
  'band' | 'packageTier' | 'packageStatus' | 'pinBalance' | 'pinPurchasedTotal' | 'packagePaidAt'
>) {
  const band = agent.band ?? null;
  const tier = agent.packageTier ?? null;
  const packageStatus = agent.packageStatus ?? TutorAgentPackageStatus.LEGACY;
  const quote =
    band && tier ? quoteTutorAgentPackage(band, tier) : null;

  return {
    band,
    packageTier:       tier,
    packageTierLabel:  tier ? quote?.tierLabel ?? tier : null,
    packageStatus,
    pinBalance:        agent.pinBalance ?? 0,
    pinPurchasedTotal: agent.pinPurchasedTotal ?? 0,
    packagePaidAt:     agent.packagePaidAt?.toISOString?.() ?? null,
    packageQuote:      quote,
    catalog:           band ? listTutorAgentPackagesForBand(band) : null,
  };
}

export { listTutorAgentPackageCatalog, listTutorAgentPackagesForBand, quoteTutorAgentPackage };
