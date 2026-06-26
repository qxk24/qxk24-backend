/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach PIN Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum BusinessCoachPinStatus {
  AVAILABLE = 'available',
  LOCKED    = 'locked',
  REDEEMED  = 'redeemed',
  REVOKED   = 'revoked',
}

export interface IBusinessCoachPin extends Document {
  codeId:       string;
  registerCode: string;
  distributorLabel: string | null;
  status:       BusinessCoachPinStatus;
  lockedBy:     string | null;
  lockedAt:     Date | null;
  redeemedBy:   string | null;
  redeemedAt:   Date | null;
  invitedEmail:       string | null;
  invitedAt:          Date | null;
  invitedName:        string | null;
  createdBy:    string;
  notes:        string | null;
  createdAt:    Date;
  updatedAt:    Date;
}

const BusinessCoachPinSchema = new Schema<IBusinessCoachPin>(
  {
    codeId:           { type: String, required: true, unique: true, index: true },
    registerCode:     { type: String, required: true, unique: true, index: true },
    distributorLabel: { type: String, default: null },
    status:           {
      type:    String,
      enum:    Object.values(BusinessCoachPinStatus),
      default: BusinessCoachPinStatus.AVAILABLE,
      index:   true,
    },
    lockedBy:   { type: String, default: null, index: true },
    lockedAt:   { type: Date, default: null },
    redeemedBy: { type: String, default: null, index: true },
    redeemedAt: { type: Date, default: null },
    invitedEmail: { type: String, default: null },
    invitedAt:    { type: Date, default: null },
    invitedName:  { type: String, default: null },
    createdBy:    { type: String, required: true },
    notes:        { type: String, default: null },
  },
  { timestamps: true, collection: 'adam_business_coach_pins' },
);

export const BusinessCoachPinModel = mongoose.model<IBusinessCoachPin>(
  'BusinessCoachPin',
  BusinessCoachPinSchema,
);
