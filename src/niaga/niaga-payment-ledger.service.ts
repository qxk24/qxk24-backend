/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Payment Ledger Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import crypto from 'crypto';
import {
  NiagaPaymentLedgerModel,
  NiagaLedgerType,
  type INiagaPaymentLedger,
} from './niaga-payment-ledger.schema';

export function newNiagaLedgerId(): string {
  return `NIAGA-LED-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export interface RecordNiagaLedgerInput {
  type:            NiagaLedgerType;
  amountMyr:       number;
  channelCode?:    string | null;
  userId?:         string | null;
  subscriptionId?: string | null;
  stripePaymentId?: string | null;
  stripeSessionId?: string | null;
  note?:           string | null;
}

export async function recordNiagaLedgerEntry(
  input: RecordNiagaLedgerInput,
): Promise<INiagaPaymentLedger> {
  return NiagaPaymentLedgerModel.create({
    ledgerId:        newNiagaLedgerId(),
    type:            input.type,
    channelCode:     input.channelCode?.trim().toUpperCase() ?? null,
    userId:          input.userId?.trim() ?? null,
    subscriptionId:  input.subscriptionId?.trim() ?? null,
    amountMyr:       input.amountMyr,
    stripePaymentId: input.stripePaymentId?.trim() ?? null,
    stripeSessionId: input.stripeSessionId?.trim() ?? null,
    note:            input.note?.trim() ?? null,
    recordedAt:      new Date(),
  });
}

export async function listNiagaPaymentLedger(limit = 200): Promise<INiagaPaymentLedger[]> {
  return NiagaPaymentLedgerModel.find()
    .sort({ recordedAt: -1 })
    .limit(limit)
    .lean() as unknown as INiagaPaymentLedger[];
}

export async function computeNiagaMrr(): Promise<{ retail: number; wholesale: number }> {
  const { NiagaSubscriptionModel } = await import('./niaga-subscription.schema');
  const { NiagaSubscriptionStatus, NiagaBillingCycle } = await import('./niaga-subscription.schema');

  const active = await NiagaSubscriptionModel.find({
    status: NiagaSubscriptionStatus.ACTIVE,
  }).lean();

  let retail = 0;
  let wholesale = 0;

  for (const sub of active) {
    const monthlyFactor = sub.billingCycle === NiagaBillingCycle.ANNUAL ? 1 / 12 : 1;
    retail += sub.amountMyr * monthlyFactor;
    wholesale += sub.wholesaleAmountMyr * monthlyFactor;
  }

  return {
    retail: Math.round(retail * 100) / 100,
    wholesale: Math.round(wholesale * 100) / 100,
  };
}
