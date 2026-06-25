/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Code Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

export enum TutorRegisterCodeStatus {
  AVAILABLE = 'available',
  LOCKED    = 'locked',
  REDEEMED  = 'redeemed',
  REVOKED   = 'revoked',
}

export interface ITutorRegisterCode extends Document {
  codeId:       string;
  registerCode: string;
  band:         TutorSubscriptionLevel | null;
  agentLabel:   string | null;
  agentId:      string | null;
  status:       TutorRegisterCodeStatus;
  lockedBy:     string | null;
  lockedAt:     Date | null;
  redeemedBy:   string | null;
  redeemedAt:   Date | null;
  invitedEmail:       string | null;
  invitedAt:          Date | null;
  invitedStudentName: string | null;
  createdBy:    string;
  notes:        string | null;
  createdAt:    Date;
  updatedAt:    Date;
}

const TutorRegisterCodeSchema = new Schema<ITutorRegisterCode>(
  {
    codeId:       { type: String, required: true, unique: true, index: true },
    registerCode: { type: String, required: true, unique: true, index: true },
    band:         { type: String, enum: ['primary', 'secondary', 'university', null], default: null, index: true },
    agentLabel:   { type: String, default: null },
    agentId:      { type: String, default: null, index: true },
    status:       {
      type:    String,
      enum:    Object.values(TutorRegisterCodeStatus),
      default: TutorRegisterCodeStatus.AVAILABLE,
      index:   true,
    },
    lockedBy:   { type: String, default: null, index: true },
    lockedAt:   { type: Date, default: null },
    redeemedBy: { type: String, default: null, index: true },
    redeemedAt: { type: Date, default: null },
    invitedEmail:       { type: String, default: null },
    invitedAt:          { type: Date, default: null },
    invitedStudentName: { type: String, default: null },
    createdBy:  { type: String, required: true },
    notes:      { type: String, default: null },
  },
  { timestamps: true, collection: 'adam_tutor_register_codes' },
);

export const TutorRegisterCodeModel = mongoose.model<ITutorRegisterCode>(
  'TutorRegisterCode',
  TutorRegisterCodeSchema,
);
