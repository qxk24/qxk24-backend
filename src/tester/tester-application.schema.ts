/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Tester Application Schema
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum TesterApplicationStatus {
  PENDING  = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ITesterApplication extends Document {
  applicationId:     string;
  name:              string;
  email:             string;
  roleTitle:         string | null;
  motivation:        string;
  preferredLanguage: string | null;
  status:            TesterApplicationStatus;
  rejectReason:      string | null;
  approvedUserId:    string | null;
  reviewedAt:        Date | null;
  createdAt:         Date;
  updatedAt:         Date;
}

const TesterApplicationSchema = new Schema<ITesterApplication>(
  {
    applicationId:     { type: String, required: true, unique: true, index: true },
    name:              { type: String, required: true },
    email:             { type: String, required: true, lowercase: true, trim: true, index: true },
    roleTitle:         { type: String, default: null },
    motivation:        { type: String, required: true },
    preferredLanguage: { type: String, default: null },
    status:            {
      type:    String,
      enum:    Object.values(TesterApplicationStatus),
      default: TesterApplicationStatus.PENDING,
      index:   true,
    },
    rejectReason:   { type: String, default: null },
    approvedUserId: { type: String, default: null },
    reviewedAt:     { type: Date, default: null },
  },
  { timestamps: true, collection: 'adam_tester_applications' },
);

TesterApplicationSchema.index({ email: 1, status: 1 });

export const TesterApplicationModel = mongoose.model<ITesterApplication>(
  'TesterApplication',
  TesterApplicationSchema,
);
