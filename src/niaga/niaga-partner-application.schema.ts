/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Partner Application Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import { NIAGA_ENTITY_TYPES, NiagaApplicationStatus, type NiagaEntityType } from './niaga.types';

export interface INiagaPartnerApplication extends Document {
  applicationId:   string;
  entityType:      NiagaEntityType;
  orgName:         string;
  contactName:     string;
  email:           string;
  phone:           string;
  state:           string;
  memberCount:     number | null;
  programSummary:  string;
  locale:          string;
  status:          NiagaApplicationStatus;
  rejectReason:    string | null;
  licenseId:       string | null;
  channelCode:     string | null;
  reviewedBy:      string | null;
  reviewedAt:      Date | null;
  createdAt:       Date;
  updatedAt:       Date;
}

const NiagaPartnerApplicationSchema = new Schema<INiagaPartnerApplication>(
  {
    applicationId:  { type: String, required: true, unique: true, index: true },
    entityType:     { type: String, enum: NIAGA_ENTITY_TYPES, required: true },
    orgName:        { type: String, required: true },
    contactName:    { type: String, required: true },
    email:          { type: String, required: true, lowercase: true, trim: true, index: true },
    phone:          { type: String, required: true },
    state:          { type: String, required: true },
    memberCount:    { type: Number, default: null },
    programSummary: { type: String, required: true },
    locale:         { type: String, default: 'ms' },
    status:         {
      type:    String,
      enum:    Object.values(NiagaApplicationStatus),
      default: NiagaApplicationStatus.PENDING,
      index:   true,
    },
    rejectReason: { type: String, default: null },
    licenseId:    { type: String, default: null },
    channelCode:  { type: String, default: null },
    reviewedBy:   { type: String, default: null },
    reviewedAt:   { type: Date, default: null },
  },
  { timestamps: true, collection: 'niaga_partner_applications' },
);

NiagaPartnerApplicationSchema.index({ email: 1, status: 1 });

export const NiagaPartnerApplicationModel = mongoose.model<INiagaPartnerApplication>(
  'NiagaPartnerApplication',
  NiagaPartnerApplicationSchema,
);
