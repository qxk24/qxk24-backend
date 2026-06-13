/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Partner License Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import {
  NIAGA_ENTITY_TYPES,
  NiagaLicenseStatus,
  NiagaLicenseTier,
  type NiagaEntityType,
} from './niaga.types';

export interface INiagaPartnerLicense extends Document {
  licenseId:          string;
  applicationId:      string;
  channelCode:        string;
  parentCode:         string | null;
  entityType:         NiagaEntityType;
  tier:               NiagaLicenseTier;
  orgName:            string;
  contactName:        string;
  email:              string;
  phone:              string;
  state:              string;
  memberCount:        number | null;
  setupFeeMyr:        number;
  renewalFeeMyr:      number;
  wholesalePerSeat:   number;
  maxActiveTraders:   number | null;
  setupPaid:          boolean;
  renewalDue:         Date;
  status:             NiagaLicenseStatus;
  approvedBy:         string | null;
  notes:              string | null;
  portalToken:        string;
  createdAt:          Date;
  updatedAt:          Date;
}

const NiagaPartnerLicenseSchema = new Schema<INiagaPartnerLicense>(
  {
    licenseId:        { type: String, required: true, unique: true, index: true },
    applicationId:    { type: String, required: true, unique: true, index: true },
    channelCode:      { type: String, required: true, unique: true, index: true },
    parentCode:       { type: String, default: null, index: true },
    entityType:       { type: String, enum: NIAGA_ENTITY_TYPES, required: true },
    tier:             { type: String, enum: Object.values(NiagaLicenseTier), required: true },
    orgName:          { type: String, required: true },
    contactName:      { type: String, required: true },
    email:            { type: String, required: true, lowercase: true, trim: true },
    phone:            { type: String, required: true },
    state:            { type: String, required: true },
    memberCount:      { type: Number, default: null },
    setupFeeMyr:      { type: Number, required: true },
    renewalFeeMyr:    { type: Number, required: true },
    wholesalePerSeat: { type: Number, required: true },
    maxActiveTraders: { type: Number, default: null },
    setupPaid:        { type: Boolean, default: false },
    renewalDue:         { type: Date, required: true },
    status:           {
      type:    String,
      enum:    Object.values(NiagaLicenseStatus),
      default: NiagaLicenseStatus.ACTIVE,
      index:   true,
    },
    approvedBy:       { type: String, default: null },
    notes:            { type: String, default: null },
    portalToken:      { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'niaga_partner_licenses' },
);

export const NiagaPartnerLicenseModel = mongoose.model<INiagaPartnerLicense>(
  'NiagaPartnerLicense',
  NiagaPartnerLicenseSchema,
);
