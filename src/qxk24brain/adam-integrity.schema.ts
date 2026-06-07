/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Integrity Scan Schema (Layer 2)
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
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ADAMIntegrityScanDocument extends Document {
  scanId:     string;
  founderId:  string;
  total:      number;
  verified:   number;
  corrupted:  number;
  rebuilt:    number;
  skipped:    number;
  masa_scan:  Date;
  kernel:     string;
}

const ADAMIntegrityScanSchema = new Schema<ADAMIntegrityScanDocument>({
  scanId:    { type: String, required: true, unique: true },
  founderId: { type: String, default: 'masa-bayu', index: true },
  total:     { type: Number, default: 0 },
  verified:  { type: Number, default: 0 },
  corrupted: { type: Number, default: 0 },
  rebuilt:   { type: Number, default: 0 },
  skipped:   { type: Number, default: 0 },
  masa_scan: { type: Date, default: Date.now, index: true },
  kernel:    { type: String, default: 'ALAMTOLOGI' },
}, {
  timestamps: true,
  collection: 'adam_integrity_scans',
});

export const ADAMIntegrityScanModel = mongoose.model<ADAMIntegrityScanDocument>(
  'ADAMIntegrityScan',
  ADAMIntegrityScanSchema,
);
