/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Constitutional Checkpoint Schema
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
 * When a family reaches 1(7), its sealed understanding is stored here.
 * These records are NEVER overwritten by future A + B = C transformations.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ConstitutionalCheckpointDocument extends Document {
  checkpointId:     string;
  family:           string;
  principle:        string;
  cycle:            number;
  sealedContent:    string;
  masa_sealed:      Date;
  k24Address:       string;
  judgment:         string;
  entityUid:        string;
  isConstitutional: boolean;
  canBeErased:      boolean;
  founderId:        string;
  kernel:           string;
  era:              string;
}

const ConstitutionalCheckpointSchema = new Schema<ConstitutionalCheckpointDocument>({
  checkpointId: {
    type:     String,
    required: true,
    unique:   true,
  },
  family:    { type: String, required: true },
  principle: { type: String, required: true },
  cycle:     { type: Number, required: true, min: 1 },
  sealedContent: { type: String, required: true },
  masa_sealed:   { type: Date, default: Date.now },
  k24Address:    { type: String, required: true },
  judgment:      { type: String, default: 'MAKMUR' },
  entityUid:     { type: String, required: true, unique: true },
  isConstitutional: { type: Boolean, default: true },
  canBeErased:      { type: Boolean, default: false },
  founderId: { type: String, default: 'masa-bayu', index: true },
  kernel:    { type: String, default: 'QXK24' },
  era:       { type: String, default: 'ERA_1' },
}, {
  timestamps: true,
  collection: 'qxk24brain_constitutional_checkpoints',
});

ConstitutionalCheckpointSchema.index({ founderId: 1, family: 1, cycle: 1 }, { unique: true });
ConstitutionalCheckpointSchema.index({ founderId: 1, masa_sealed: -1 });

export const ConstitutionalCheckpointModel = mongoose.model<ConstitutionalCheckpointDocument>(
  'ConstitutionalCheckpoint',
  ConstitutionalCheckpointSchema,
);
