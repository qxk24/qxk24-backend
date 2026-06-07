/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Quantum State Snapshot (Layer 6)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
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
  kernel: { type: String, default: 'ALAMTOLOGI' },
  era:    { type: String, default: 'ERA_1' },
}, {
  timestamps: true,
  collection: 'adam_brain_snapshots',
});

ADAMSnapshotSchema.index({ founderId: 1, status: 1, masa_snapshot: -1 });

/** Atlas M0: auto-purge successful rollbacks; ACTIVE docs lack this field and are kept. */
const supersededTtlHours = parseInt(process.env.ADAM_SNAPSHOT_SUPERSEDED_TTL_HOURS ?? '24', 10) || 24;
ADAMSnapshotSchema.index(
  { masa_superseded: 1 },
  { expireAfterSeconds: supersededTtlHours * 60 * 60 },
);

/** Rollback-used snapshots — partial TTL so ACTIVE/SUPERSEDED indexes stay valid. */
const restoredTtlHours = parseInt(process.env.ADAM_SNAPSHOT_RESTORED_TTL_HOURS ?? '168', 10) || 168;
ADAMSnapshotSchema.index(
  { masa_restored: 1 },
  {
    expireAfterSeconds: restoredTtlHours * 60 * 60,
    partialFilterExpression: { status: 'RESTORED' },
  },
);

export const ADAMSnapshotModel = mongoose.model<ADAMSnapshotDocument>(
  'ADAMSnapshot',
  ADAMSnapshotSchema,
);
