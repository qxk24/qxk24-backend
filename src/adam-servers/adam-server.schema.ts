/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Server Subscription Schema (Layer 2)
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

import mongoose, { Document, Schema } from 'mongoose';
import { AdamServerId, AdamServerTier } from './adam-server.types';

export enum AdamServerSubscriptionStatus {
  ACTIVE    = 'ACTIVE',
  PENDING   = 'PENDING',
  CANCELLED = 'CANCELLED',
  EXPIRED   = 'EXPIRED',
}

export interface IAdamServerSubscription extends Document {
  userId:       string;
  serverId:     AdamServerId;
  tier:         AdamServerTier;
  status:       AdamServerSubscriptionStatus;
  monthlyLimit: number;
  usedThisMonth: number;
  periodKey:    string;
  createdAt:    Date;
  updatedAt:    Date;
}

const AdamServerSubscriptionSchema = new Schema<IAdamServerSubscription>(
  {
    userId:        { type: String, required: true, index: true },
    serverId:      { type: String, enum: Object.values(AdamServerId), required: true },
    tier:          { type: String, enum: Object.values(AdamServerTier), required: true },
    status:        { type: String, enum: Object.values(AdamServerSubscriptionStatus), default: AdamServerSubscriptionStatus.PENDING },
    monthlyLimit:  { type: Number, required: true },
    usedThisMonth: { type: Number, default: 0 },
    periodKey:     { type: String, default: '' },
  },
  { timestamps: true },
);

AdamServerSubscriptionSchema.index({ userId: 1, serverId: 1 }, { unique: true });

export const AdamServerSubscriptionModel = mongoose.model<IAdamServerSubscription>(
  'AdamServerSubscription',
  AdamServerSubscriptionSchema,
);
