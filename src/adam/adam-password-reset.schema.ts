/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Password Reset Token Schema
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ADAMPasswordResetDocument extends Document {
  userId:    string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?:   Date;
  createdAt: Date;
}

const ADAMPasswordResetSchema = new Schema<ADAMPasswordResetDocument>(
  {
    userId:    { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt:    { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ADAMPasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ADAMPasswordResetModel = mongoose.model<ADAMPasswordResetDocument>(
  'ADAMPasswordReset',
  ADAMPasswordResetSchema,
);
