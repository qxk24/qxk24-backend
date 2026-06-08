/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface AdamDailyQuotaDoc extends Document {
  userId:   string;
  dateKey:  string;
  count:    number;
  updatedAt: Date;
}

const DailyQuotaSchema = new Schema<AdamDailyQuotaDoc>({
  userId:  { type: String, required: true, index: true },
  dateKey: { type: String, required: true, index: true },
  count:   { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true });

DailyQuotaSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export interface AdamGuestFreemiumDoc extends Document {
  guestId:        string;
  questionsUsed:  number;
  lastSessionId?: string;
}

const GuestFreemiumSchema = new Schema<AdamGuestFreemiumDoc>({
  guestId:       { type: String, required: true, unique: true, index: true },
  questionsUsed: { type: Number, required: true, default: 0, min: 0 },
  lastSessionId: { type: String },
}, { timestamps: true });

export const AdamDailyQuotaModel = mongoose.model<AdamDailyQuotaDoc>(
  'AdamDailyQuota',
  DailyQuotaSchema,
);

export const AdamGuestFreemiumModel = mongoose.model<AdamGuestFreemiumDoc>(
  'AdamGuestFreemium',
  GuestFreemiumSchema,
);

export interface CreditPurchaseRecord {
  purchasedAt:   Date;
  creditsAdded:  number;
  amountPaid:    number;
  currency:      string;
  provider:      string;
  transactionId: string;
  packId:        string;
}

export interface AdamCreditWalletDoc extends Document {
  userId:    string;
  balance:   number;
  purchases: CreditPurchaseRecord[];
}

const CreditPurchaseSchema = new Schema({
  purchasedAt:   { type: Date, required: true },
  creditsAdded:  { type: Number, required: true, min: 1 },
  amountPaid:    { type: Number, required: true, min: 0 },
  currency:      { type: String, required: true },
  provider:      { type: String, required: true },
  transactionId: { type: String, required: true },
  packId:        { type: String, required: true },
}, { _id: false });

const CreditWalletSchema = new Schema<AdamCreditWalletDoc>({
  userId:    { type: String, required: true, unique: true, index: true },
  balance:   { type: Number, required: true, default: 0, min: 0 },
  purchases: { type: [CreditPurchaseSchema], default: [] },
}, { timestamps: true });

export const AdamCreditWalletModel = mongoose.model<AdamCreditWalletDoc>(
  'AdamCreditWallet',
  CreditWalletSchema,
);
