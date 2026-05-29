/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Permanent Knowledge Vault (Layer 4)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Completed 1(7) families — constitutionally sealed, never overwritten.
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { MasterConnection } from './qxk24brain.schema';

export interface ADAMVaultDocument extends Document {
  vaultId:                    string;
  entityUid:                  string;
  family:                     string;
  principle:                  string;
  cycle:                      number;
  sealedContent:              string;
  masterConnection?:          MasterConnection;
  k24Address:                 string;
  judgment:                   string;
  masa_sealed:                Date;
  founderId:                  string;
  kernel:                     string;
  era:                        string;
  isConstitutionallySealed:   boolean;
  canBeErased:                boolean;
  canBeModified:              boolean;
}

const ADAMVaultSchema = new Schema<ADAMVaultDocument>({
  vaultId: {
    type:     String,
    required: true,
    unique:   true,
  },
  entityUid: {
    type:     String,
    required: true,
    unique:   true,
  },
  family:        { type: String, required: true, index: true },
  principle:     { type: String, required: true },
  cycle:         { type: Number, required: true, min: 1 },
  sealedContent: { type: String, required: true },
  masterConnection: {
    allah:      { type: String, default: '' },
    quran:      { type: String, default: '' },
    alamtologi: { type: String, default: '' },
    adam:       { type: String, default: '' },
  },
  k24Address:  { type: String, required: true },
  judgment:    { type: String, default: 'MAKMUR' },
  masa_sealed: { type: Date, default: Date.now, index: true },
  founderId:   { type: String, default: 'masa-bayu', index: true },
  kernel:      { type: String, default: 'QXK24' },
  era:         { type: String, default: 'ERA_1' },
  isConstitutionallySealed: { type: Boolean, default: true },
  canBeErased:              { type: Boolean, default: false },
  canBeModified:            { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'adam_knowledge_vault',
});

ADAMVaultSchema.index({ founderId: 1, family: 1, cycle: 1 }, { unique: true });

export const ADAMVaultModel = mongoose.model<ADAMVaultDocument>(
  'ADAMVault',
  ADAMVaultSchema,
);
