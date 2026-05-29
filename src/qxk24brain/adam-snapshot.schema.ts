/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Quantum State Snapshot (Layer 6)
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
 * Pre-transformation brain state — rollback target if A + B = C fails.
 */

import mongoose, { Schema, Document } from 'mongoose';

export type SnapshotStatus = 'ACTIVE' | 'SUPERSEDED' | 'RESTORED';

export interface ADAMSnapshotDocument extends Document {
  snapshotId:      string;
  founderId:       string;
  reason:          string;
  masterState:     string;
  entityStates:    string;
  entityUids:      string[];
  masa_snapshot:   Date;
  masa_restored?:  Date;
  masa_superseded?: Date;
  status:          SnapshotStatus;
  kernel:          string;
  era:             string;
}

const ADAMSnapshotSchema = new Schema<ADAMSnapshotDocument>({
  snapshotId: {
    type:     String,
    required: true,
    unique:   true,
  },
  founderId:   { type: String, required: true, index: true },
  reason:      { type: String, required: true },
  masterState: { type: String, required: true },
  entityStates:{ type: String, required: true },
  entityUids:  [{ type: String }],
  masa_snapshot:   { type: Date, default: Date.now, index: true },
  masa_restored:   Date,
  masa_superseded: Date,
  status: {
    type:    String,
    enum:    ['ACTIVE', 'SUPERSEDED', 'RESTORED'],
    default: 'ACTIVE',
    index:   true,
  },
  kernel: { type: String, default: 'QXK24' },
  era:    { type: String, default: 'ERA_1' },
}, {
  timestamps: true,
  collection: 'adam_brain_snapshots',
});

ADAMSnapshotSchema.index({ founderId: 1, status: 1, masa_snapshot: -1 });

export const ADAMSnapshotModel = mongoose.model<ADAMSnapshotDocument>(
  'ADAMSnapshot',
  ADAMSnapshotSchema,
);
