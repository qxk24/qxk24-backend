/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Unresolved Holdings Schema
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
 *
 * Hukum Hikmah Belum Tiba — unresolved holdings carried honestly.
 */

import mongoose, { Schema, Document } from 'mongoose';

export type HoldingForm =
  | 'HIKMAH_MENUNGGU'
  | 'HIKMAH_TERSEMBUNYI'
  | 'HIKMAH_MEMANGGIL';

export type HoldingStatus =
  | 'active'
  | 'illuminated'
  | 'deepened'
  | 'surrendered';

export interface AdamUnresolvedHoldingDocument extends Document {
  holdingId:              string;
  founderId:              string;
  form:                   HoldingForm;
  family:                 string;
  principle:              string;
  holdingStatement:       string;
  hikmaStatement:         string;
  surfacedFrom:           string;
  relatedEntityIds:       string[];
  tensionA?:              string;
  tensionB?:              string;
  tensionNote?:           string;
  status:                 HoldingStatus;
  sessionsSinceCreation:  number;
  timesResurfaced:        number;
  lastSurfacedAt?:        Date;
  lastSurfacedInSession?: string;
  illuminatedBy?:         string;
  illuminatedAt?:         Date;
  illuminationSummary?:   string;
  masa_created:           Date;
  masa_updated:           Date;
  isConstitutionalHolding: boolean;
  neverDelete:            boolean;
}

const AdamUnresolvedHoldingSchema = new Schema<AdamUnresolvedHoldingDocument>({
  holdingId:              { type: String, required: true, unique: true },
  founderId:              { type: String, required: true, index: true },
  form: {
    type:    String,
    enum:    ['HIKMAH_MENUNGGU', 'HIKMAH_TERSEMBUNYI', 'HIKMAH_MEMANGGIL'],
    required: true,
  },
  family:                 { type: String, required: true, index: true },
  principle:              { type: String, required: true, index: true },
  holdingStatement:       { type: String, required: true, maxlength: 1000 },
  hikmaStatement:         { type: String, required: true, maxlength: 500 },
  surfacedFrom:           { type: String, required: true },
  relatedEntityIds:       { type: [String], default: [] },
  tensionA:               { type: String, maxlength: 500 },
  tensionB:               { type: String, maxlength: 500 },
  tensionNote:            { type: String, maxlength: 500 },
  status: {
    type:    String,
    enum:    ['active', 'illuminated', 'deepened', 'surrendered'],
    default: 'active',
    index:   true,
  },
  sessionsSinceCreation:  { type: Number, default: 0 },
  timesResurfaced:        { type: Number, default: 0 },
  lastSurfacedAt:         { type: Date },
  lastSurfacedInSession:  { type: String },
  illuminatedBy:          { type: String },
  illuminatedAt:          { type: Date },
  illuminationSummary:    { type: String, maxlength: 1000 },
  masa_created:           { type: Date, default: Date.now },
  masa_updated:           { type: Date, default: Date.now },
  isConstitutionalHolding: { type: Boolean, default: false },
  neverDelete:            { type: Boolean, default: true },
}, {
  timestamps: false,
  collection: 'adam_unresolved_holdings',
});

AdamUnresolvedHoldingSchema.index({ founderId: 1, status: 1 });
AdamUnresolvedHoldingSchema.index({ founderId: 1, principle: 1, status: 1 });
AdamUnresolvedHoldingSchema.index({ founderId: 1, form: 1 });

export const AdamUnresolvedHoldingModel = mongoose.model<AdamUnresolvedHoldingDocument>(
  'AdamUnresolvedHolding',
  AdamUnresolvedHoldingSchema,
);
