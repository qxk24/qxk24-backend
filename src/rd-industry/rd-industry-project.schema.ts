/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D Industry Project Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import type {
  RdDeliverableStatus,
  RdIndustryDeliverable,
  RdIndustryDeliverableType,
  RdIndustryProjectStatus,
} from './rd-industry.types';

export interface IRdIndustryProject extends Document {
  userId:           string;
  rdSubscriptionId: string;
  projectFocus:     string;
  status:           RdIndustryProjectStatus;
  packId:           string | null;
  researchSessionId: string | null;
  technical:        RdIndustryDeliverable;
  implementation:   RdIndustryDeliverable;
  createdAt:        Date;
  updatedAt:        Date;
}

const SectionDraftSchema = new Schema({
  content:   { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

function deliverableSchema(type: RdIndustryDeliverableType) {
  return {
    type:               { type: String, enum: [type], default: type },
    status:             { type: String, enum: ['draft', 'sealed'], default: 'draft' },
    documentId:         { type: String, default: null },
    sections:           { type: Schema.Types.Mixed, default: {} },
    sealedAt:           { type: Date, default: null },
    technicalWpVersion: { type: String, default: null },
  };
}

const RdIndustryProjectSchema = new Schema<IRdIndustryProject>(
  {
    userId:            { type: String, required: true, index: true },
    rdSubscriptionId:  { type: String, required: true, index: true },
    projectFocus:      { type: String, required: true },
    status:            {
      type:    String,
      enum:    ['active', 'technical_sealed', 'pack_sealed', 'completed'],
      default: 'active',
    },
    packId:            { type: String, default: null, index: true },
    researchSessionId: { type: String, default: null },
    technical:         deliverableSchema('TECHNICAL_WHITEPAPER'),
    implementation:    deliverableSchema('IMPLEMENTATION_WHITEPAPER'),
  },
  { timestamps: true, collection: 'alamtologi_rd_industry_projects' },
);

RdIndustryProjectSchema.index({ userId: 1, status: 1 });

export const RdIndustryProjectModel = mongoose.model<IRdIndustryProject>(
  'RdIndustryProject',
  RdIndustryProjectSchema,
);
