/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Payment Ledger Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum NiagaLedgerType {
  LICENSE_SETUP    = 'license_setup',
  LICENSE_RENEWAL  = 'license_renewal',
  TRADER_RETAIL    = 'trader_retail',
  WHOLESALE        = 'wholesale',
  PARTNER_COMMISSION = 'partner_commission',
}

export interface INiagaPaymentLedger extends Document {
  ledgerId:         string;
  type:             NiagaLedgerType;
  channelCode:      string | null;
  userId:           string | null;
  subscriptionId:   string | null;
  amountMyr:        number;
  stripePaymentId:  string | null;
  stripeSessionId:  string | null;
  note:             string | null;
  recordedAt:       Date;
  createdAt:        Date;
}

const NiagaPaymentLedgerSchema = new Schema<INiagaPaymentLedger>(
  {
    ledgerId:        { type: String, required: true, unique: true, index: true },
    type:            { type: String, enum: Object.values(NiagaLedgerType), required: true, index: true },
    channelCode:     { type: String, default: null, index: true },
    userId:          { type: String, default: null, index: true },
    subscriptionId:  { type: String, default: null },
    amountMyr:       { type: Number, required: true },
    stripePaymentId: { type: String, default: null },
    stripeSessionId: { type: String, default: null },
    note:            { type: String, default: null },
    recordedAt:      { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true, collection: 'niaga_payment_ledger' },
);

export const NiagaPaymentLedgerModel = mongoose.model<INiagaPaymentLedger>(
  'NiagaPaymentLedger',
  NiagaPaymentLedgerSchema,
);
