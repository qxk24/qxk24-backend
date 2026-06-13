/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Trader Subscription Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum NiagaBillingCycle {
  MONTHLY = 'monthly',
  ANNUAL  = 'annual',
}

export enum NiagaSubscriptionStatus {
  PENDING   = 'pending',
  ACTIVE    = 'active',
  PAST_DUE  = 'past_due',
  CANCELLED = 'cancelled',
}

export interface INiagaSubscription extends Document {
  subscriptionId:       string;
  registrationId:       string;
  userId:               string;
  channelCode:          string;
  sku:                  string;
  amountMyr:            number;
  wholesaleAmountMyr:   number;
  partnerCommissionMyr: number;
  billingCycle:         NiagaBillingCycle;
  status:               NiagaSubscriptionStatus;
  stripeSessionId:      string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId:     string | null;
  currentPeriodEnd:     Date | null;
  messagesUsedMonth:    number;
  snapshotsUsedQuarter: number;
  usageMonthKey:        string | null;
  usageQuarterKey:      string | null;
  createdAt:            Date;
  updatedAt:            Date;
}

const NiagaSubscriptionSchema = new Schema<INiagaSubscription>(
  {
    subscriptionId:       { type: String, required: true, unique: true, index: true },
    registrationId:       { type: String, required: true, unique: true, index: true },
    userId:               { type: String, required: true, index: true },
    channelCode:          { type: String, required: true, index: true },
    sku:                  { type: String, required: true },
    amountMyr:            { type: Number, required: true },
    wholesaleAmountMyr:   { type: Number, required: true },
    partnerCommissionMyr: { type: Number, required: true },
    billingCycle:         { type: String, enum: Object.values(NiagaBillingCycle), required: true },
    status:               {
      type:    String,
      enum:    Object.values(NiagaSubscriptionStatus),
      default: NiagaSubscriptionStatus.PENDING,
      index:   true,
    },
    stripeSessionId:        { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    stripeCustomerId:       { type: String, default: null },
    currentPeriodEnd:       { type: Date, default: null },
    messagesUsedMonth:        { type: Number, default: 0 },
    snapshotsUsedQuarter:   { type: Number, default: 0 },
    usageMonthKey:          { type: String, default: null },
    usageQuarterKey:        { type: String, default: null },
  },
  { timestamps: true, collection: 'niaga_subscriptions' },
);

export const NiagaSubscriptionModel = mongoose.model<INiagaSubscription>(
  'NiagaSubscription',
  NiagaSubscriptionSchema,
);
