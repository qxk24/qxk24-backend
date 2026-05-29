/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Backup Log (Layer 10)
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
 */

import mongoose, { Schema, Document } from 'mongoose';

export type BackupStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';

export interface ADAMBackupLogDocument extends Document {
  backupId:      string;
  founderId:     string;
  r2Key:         string;
  status:        BackupStatus;
  byteSize:      number;
  entityCount:   number;
  vaultCount:    number;
  encrypted:     boolean;
  errorMessage?: string;
  masa_backup:   Date;
  kernel:        string;
  era:           string;
}

const ADAMBackupLogSchema = new Schema<ADAMBackupLogDocument>({
  backupId:    { type: String, required: true, unique: true },
  founderId:   { type: String, required: true, index: true },
  r2Key:       { type: String, required: true },
  status:      { type: String, enum: ['SUCCESS', 'FAILED', 'SKIPPED'], required: true },
  byteSize:    { type: Number, default: 0 },
  entityCount: { type: Number, default: 0 },
  vaultCount:  { type: Number, default: 0 },
  encrypted:   { type: Boolean, default: true },
  errorMessage: String,
  masa_backup: { type: Date, default: Date.now, index: true },
  kernel:      { type: String, default: 'QXK24' },
  era:         { type: String, default: 'ERA_1' },
}, {
  timestamps: true,
  collection: 'adam_brain_backup_log',
});

ADAMBackupLogSchema.index({ founderId: 1, masa_backup: -1 });

export const ADAMBackupLogModel = mongoose.model<ADAMBackupLogDocument>(
  'ADAMBackupLog',
  ADAMBackupLogSchema,
);
