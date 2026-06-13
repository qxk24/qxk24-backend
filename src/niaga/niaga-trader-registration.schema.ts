/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Trader Registration Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum NiagaTraderStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE   = 'active',
  SUSPENDED = 'suspended',
}

export interface INiagaTraderRegistration extends Document {
  registrationId: string;
  userId:           string;
  channelCode:      string;
  businessName:     string;
  businessType:     string;
  state:            string;
  businessBrief:    string | null;
  status:           NiagaTraderStatus;
  rejectReason:     string | null;
  approvedBy:       string | null;
  reviewedAt:       Date | null;
  createdAt:        Date;
  updatedAt:        Date;
}

const NiagaTraderRegistrationSchema = new Schema<INiagaTraderRegistration>(
  {
    registrationId: { type: String, required: true, unique: true, index: true },
    userId:         { type: String, required: true, index: true },
    channelCode:    { type: String, required: true, index: true },
    businessName:   { type: String, required: true },
    businessType:   { type: String, required: true },
    state:          { type: String, required: true },
    businessBrief:  { type: String, default: null },
    status:         {
      type:    String,
      enum:    Object.values(NiagaTraderStatus),
      default: NiagaTraderStatus.PENDING,
      index:   true,
    },
    rejectReason: { type: String, default: null },
    approvedBy:   { type: String, default: null },
    reviewedAt:   { type: Date, default: null },
  },
  { timestamps: true, collection: 'niaga_trader_registrations' },
);

NiagaTraderRegistrationSchema.index({ userId: 1, channelCode: 1 }, { unique: true });

export const NiagaTraderRegistrationModel = mongoose.model<INiagaTraderRegistration>(
  'NiagaTraderRegistration',
  NiagaTraderRegistrationSchema,
);
