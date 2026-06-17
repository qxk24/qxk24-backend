/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Wallet Ledger Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum TutorAgentLedgerType {
  COMMISSION = 'commission',
  PAYOUT     = 'payout',
  ADJUSTMENT = 'adjustment',
}

export interface ITutorAgentWalletLedger extends Document {
  ledgerId:      string;
  agentId:       string;
  type:          TutorAgentLedgerType;
  amountMyr:     number;
  balanceAfter:  number;
  enrollmentId:  string | null;
  userId:        string | null;
  registerCode:  string | null;
  note:          string | null;
  recordedAt:    Date;
  createdAt:     Date;
}

const TutorAgentWalletLedgerSchema = new Schema<ITutorAgentWalletLedger>(
  {
    ledgerId:     { type: String, required: true, unique: true, index: true },
    agentId:      { type: String, required: true, index: true },
    type:         { type: String, enum: Object.values(TutorAgentLedgerType), required: true },
    amountMyr:    { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    enrollmentId: { type: String, default: null, index: true },
    userId:       { type: String, default: null },
    registerCode: { type: String, default: null },
    note:         { type: String, default: null },
    recordedAt:   { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true, collection: 'adam_tutor_agent_wallet_ledger' },
);

export const TutorAgentWalletLedgerModel = mongoose.model<ITutorAgentWalletLedger>(
  'TutorAgentWalletLedger',
  TutorAgentWalletLedgerSchema,
);
