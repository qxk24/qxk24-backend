/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Prospect Lead Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum TutorAgentProspectInterest {
  EXPLORING        = 'exploring',
  COMMERCIAL       = 'commercial',
  STUDENT_CHARITY  = 'student_charity',
}

export interface ITutorAgentProspectLead extends Document {
  leadId:        string;
  contactName:   string;
  email:         string;
  phone:         string | null;
  organisation:  string | null;
  state:         string;
  interest:      TutorAgentProspectInterest;
  notes:         string | null;
  createdAt:     Date;
  updatedAt:     Date;
}

const TutorAgentProspectLeadSchema = new Schema<ITutorAgentProspectLead>(
  {
    leadId:       { type: String, required: true, unique: true, index: true },
    contactName:  { type: String, required: true },
    email:        { type: String, required: true, lowercase: true, trim: true, index: true },
    phone:        { type: String, default: null },
    organisation: { type: String, default: null },
    state:        { type: String, required: true },
    interest:     {
      type:     String,
      enum:     Object.values(TutorAgentProspectInterest),
      required: true,
    },
    notes:        { type: String, default: null },
  },
  { timestamps: true, collection: 'adam_tutor_agent_prospect_leads' },
);

TutorAgentProspectLeadSchema.index({ email: 1 }, { unique: true });

export const TutorAgentProspectLeadModel = mongoose.model<ITutorAgentProspectLead>(
  'TutorAgentProspectLead',
  TutorAgentProspectLeadSchema,
);
