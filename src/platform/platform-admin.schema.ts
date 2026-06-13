/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Platform Admin Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import {
  PLATFORM_ADMIN_MODULES,
  PLATFORM_ADMIN_MODULE_ALL,
  PlatformAdminRole,
  PlatformAdminStatus,
  type PlatformAdminModuleGrant,
} from './platform-admin.types';

export interface IPlatformAdmin extends Document {
  adminId:    string;
  userId:     string;
  email:      string | null;
  name:       string;
  role:       PlatformAdminRole;
  modules:    PlatformAdminModuleGrant[];
  status:     PlatformAdminStatus;
  createdBy:  string;
  revokedBy:  string | null;
  revokedAt:  Date | null;
  createdAt:  Date;
  updatedAt:  Date;
}

const moduleEnum = [...PLATFORM_ADMIN_MODULES, PLATFORM_ADMIN_MODULE_ALL];

const PlatformAdminSchema = new Schema<IPlatformAdmin>(
  {
    adminId:   { type: String, required: true, unique: true, index: true },
    userId:    { type: String, required: true, unique: true, index: true },
    email:     { type: String, default: null, lowercase: true, trim: true, index: true },
    name:      { type: String, required: true },
    role:      {
      type:    String,
      enum:    Object.values(PlatformAdminRole),
      default: PlatformAdminRole.OPERATOR,
      index:   true,
    },
    modules:   {
      type:    [String],
      enum:    moduleEnum,
      default: [PLATFORM_ADMIN_MODULE_ALL],
    },
    status:    {
      type:    String,
      enum:    Object.values(PlatformAdminStatus),
      default: PlatformAdminStatus.ACTIVE,
      index:   true,
    },
    createdBy: { type: String, required: true },
    revokedBy: { type: String, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'platform_admins' },
);

export const PlatformAdminModel = mongoose.model<IPlatformAdmin>(
  'PlatformAdmin',
  PlatformAdminSchema,
);

/** Legacy Fasa 1 collection — read + migrate on invite */
export const LegacyNiagaPlatformAdminModel = mongoose.model(
  'NiagaPlatformAdminLegacy',
  new Schema({}, { strict: false, collection: 'niaga_platform_admins' }),
);
