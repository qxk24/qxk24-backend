/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D & Applied Science Subscription Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import {
  RdAppliedSku,
  RdCategory,
  RdGraduatePhase,
  RdLegalAck,
  RdSubscriptionStatus,
} from './rd-applied.types';

export interface IRdSubscription extends Document {
  userId:             string;
  sku:                RdAppliedSku;
  status:             RdSubscriptionStatus;
  rdCategory:         RdCategory | null;
  projectFocus:       string | null;
  packId:             string | null;
  labAdminEmail:      string | null;
  eduEmail:           string | null;
  graduatePhase:      RdGraduatePhase | null;
  legalAck:           RdLegalAck;
  amountUsd:          number;
  currency:           string;
  stripeSessionId:    string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId:   string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd:   Date | null;
  cancelledAt:        Date | null;
  createdAt:          Date;
  updatedAt:          Date;
}

const LegalAckSchema = new Schema<RdLegalAck>({
  platformTerms:     { type: Boolean, required: true },
  rdTerms:           { type: Boolean, required: true },
  disclaimer:        { type: Boolean, required: true },
  journalPublish:    { type: Boolean, required: true },
  graduateRules:     { type: Boolean, default: false },
  appliedPack:       { type: Boolean, default: false },
  labSharedProject:  { type: Boolean, default: false },
}, { _id: false });

const RdSubscriptionSchema = new Schema<IRdSubscription>(
  {
    userId:               { type: String, required: true, index: true },
    sku:                  { type: String, enum: Object.values(RdAppliedSku), required: true },
    status:               { type: String, enum: Object.values(RdSubscriptionStatus), default: RdSubscriptionStatus.PENDING },
    rdCategory:           { type: String, enum: ['academic', 'industry'], default: null },
    projectFocus:         { type: String, default: null },
    packId:               { type: String, default: null },
    labAdminEmail:        { type: String, default: null },
    eduEmail:             { type: String, default: null },
    graduatePhase:        { type: String, enum: Object.values(RdGraduatePhase), default: null },
    legalAck:             { type: LegalAckSchema, required: true },
    amountUsd:            { type: Number, required: true },
    currency:             { type: String, default: 'USD' },
    stripeSessionId:      { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    stripeCustomerId:     { type: String, default: null },
    currentPeriodStart:   { type: Date, default: null },
    currentPeriodEnd:     { type: Date, default: null },
    cancelledAt:          { type: Date, default: null },
  },
  { timestamps: true, collection: 'alamtologi_rd_subscriptions' },
);

RdSubscriptionSchema.index({ userId: 1, sku: 1, status: 1 });
RdSubscriptionSchema.index({ stripeSubscriptionId: 1 });

export const RdSubscriptionModel = mongoose.model<IRdSubscription>(
  'RdSubscription',
  RdSubscriptionSchema,
);
