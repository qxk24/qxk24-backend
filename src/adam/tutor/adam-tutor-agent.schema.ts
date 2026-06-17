/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum TutorAgentStatus {
  ACTIVE    = 'active',
  SUSPENDED = 'suspended',
}

export interface ITutorAgent extends Document {
  agentId:            string;
  agentCode:          string;
  portalToken:        string;
  orgName:            string;
  contactName:        string;
  email:              string;
  phone:              string | null;
  state:              string;
  commissionPercent:  number;
  walletBalanceMyr:   number;
  status:             TutorAgentStatus;
  createdBy:          string;
  notes:              string | null;
  createdAt:          Date;
  updatedAt:          Date;
}

const TutorAgentSchema = new Schema<ITutorAgent>(
  {
    agentId:           { type: String, required: true, unique: true, index: true },
    agentCode:         { type: String, required: true, unique: true, index: true },
    portalToken:       { type: String, required: true, index: true },
    orgName:           { type: String, required: true },
    contactName:       { type: String, required: true },
    email:             { type: String, required: true, lowercase: true, trim: true },
    phone:             { type: String, default: null },
    state:             { type: String, required: true },
    commissionPercent: { type: Number, default: 20, min: 0, max: 50 },
    walletBalanceMyr:  { type: Number, default: 0 },
    status:            {
      type:    String,
      enum:    Object.values(TutorAgentStatus),
      default: TutorAgentStatus.ACTIVE,
      index:   true,
    },
    createdBy:         { type: String, required: true },
    notes:             { type: String, default: null },
  },
  { timestamps: true, collection: 'adam_tutor_agents' },
);

export const TutorAgentModel = mongoose.model<ITutorAgent>(
  'TutorAgent',
  TutorAgentSchema,
);
