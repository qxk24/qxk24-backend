/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Platform Settings Schema
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ADAMPlatformSettingsDocument extends Document {
  key:                    string;
  studentSelfRegisterOpen: boolean;
  /** Founder dashboard — route Builder MCP through local Mac bridge daemon */
  macBridgeRoutingOpen:   boolean;
  updatedBy?:             string;
  updatedAt:              Date;
}

const ADAMPlatformSettingsSchema = new Schema<ADAMPlatformSettingsDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    studentSelfRegisterOpen: { type: Boolean, default: false },
    macBridgeRoutingOpen:    { type: Boolean, default: false },
    updatedBy: { type: String },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    versionKey: false,
  },
);

export const ADAMPlatformSettingsModel = mongoose.model<ADAMPlatformSettingsDocument>(
  'ADAMPlatformSettings',
  ADAMPlatformSettingsSchema,
);

export const PLATFORM_SETTINGS_KEY = 'platform';
