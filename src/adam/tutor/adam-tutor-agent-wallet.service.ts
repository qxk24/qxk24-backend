/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Wallet Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

import crypto from 'crypto';
import { TutorAgentModel } from './adam-tutor-agent.schema';
import {
  TutorAgentLedgerType,
  TutorAgentWalletLedgerModel,
} from './adam-tutor-agent-wallet.schema';
import { getTutorBandPricing } from './adam-tutor-pricing.service';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

function newLedgerId(): string {
  return `TUTOR-WAL-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export async function creditTutorAgentCommission(input: {
  agentId:      string;
  enrollmentId: string;
  userId:       string;
  registerCode: string;
  band:         TutorSubscriptionLevel;
}): Promise<number | null> {
  if (!input.agentId) return null;

  const existing = await TutorAgentWalletLedgerModel.exists({
    agentId:      input.agentId,
    enrollmentId: input.enrollmentId,
    type:         TutorAgentLedgerType.COMMISSION,
  });
  if (existing) return null;

  const agent = await TutorAgentModel.findOne({ agentId: input.agentId });
  if (!agent || agent.status !== 'active') return null;

  const pricing = await getTutorBandPricing(input.band, 'agent');
  const pct = Math.min(Math.max(agent.commissionPercent, 0), 50);
  const commissionMyr = Math.round(pricing.monthlyMyr * (pct / 100) * 100) / 100;
  if (commissionMyr <= 0) return null;

  const balanceAfter = Math.round((agent.walletBalanceMyr + commissionMyr) * 100) / 100;

  await TutorAgentWalletLedgerModel.create({
    ledgerId:     newLedgerId(),
    agentId:      agent.agentId,
    type:         TutorAgentLedgerType.COMMISSION,
    amountMyr:    commissionMyr,
    balanceAfter,
    enrollmentId: input.enrollmentId,
    userId:       input.userId,
    registerCode: input.registerCode,
    note:         `Komisen ${pct}% · ${pricing.bandLabel}`,
  });

  agent.walletBalanceMyr = balanceAfter;
  await agent.save();

  return commissionMyr;
}

export async function listAgentWalletLedger(
  agentId: string,
  limit = 50,
) {
  return TutorAgentWalletLedgerModel.find({ agentId })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .lean();
}

export async function sumAgentCommission(agentId: string): Promise<number> {
  const rows = await TutorAgentWalletLedgerModel.find({
    agentId,
    type: TutorAgentLedgerType.COMMISSION,
  }).lean();
  const total = rows.reduce((s, r) => s + r.amountMyr, 0);
  return Math.round(total * 100) / 100;
}
