/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Host Subscription Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-06
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { AdamStreamBillingCycle, AdamStreamHostPlanId } from './adam-stream.constants';

export enum AdamStreamSubscriptionStatus {
  PENDING   = 'pending',
  ACTIVE    = 'active',
  PAST_DUE  = 'past_due',
  CANCELLED = 'cancelled',
}

export interface IAdamStreamSubscription extends Document {
  subscriptionId:       string;
  userId:               string;
  planId:               AdamStreamHostPlanId;
  sku:                  string;
  billingCycle:         AdamStreamBillingCycle;
  amountUsd:            number;
  status:               AdamStreamSubscriptionStatus;
  stripeSessionId:      string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId:     string | null;
  currentPeriodStart:   Date | null;
  currentPeriodEnd:     Date | null;
  createdAt:            Date;
  updatedAt:            Date;
}

const AdamStreamSubscriptionSchema = new Schema<IAdamStreamSubscription>(
  {
    subscriptionId:       { type: String, required: true, unique: true, index: true },
    userId:               { type: String, required: true, unique: true, index: true },
    planId:               { type: String, required: true },
    sku:                  { type: String, required: true },
    billingCycle:         { type: String, enum: ['monthly', 'annual'], required: true },
    amountUsd:            { type: Number, required: true },
    status:               {
      type:    String,
      enum:    Object.values(AdamStreamSubscriptionStatus),
      default: AdamStreamSubscriptionStatus.PENDING,
    },
    stripeSessionId:      { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    stripeCustomerId:     { type: String, default: null },
    currentPeriodStart:   { type: Date, default: null },
    currentPeriodEnd:     { type: Date, default: null },
  },
  { timestamps: true },
);

export const AdamStreamSubscriptionModel = mongoose.model<IAdamStreamSubscription>(
  'AdamStreamSubscription',
  AdamStreamSubscriptionSchema,
);
