/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Event RSVP Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum TutorAgentEventRsvpStatus {
  GOING    = 'going',
  MAYBE    = 'maybe',
  DECLINED = 'declined',
}

export enum TutorAgentEventRsvpRespondentType {
  PROSPECT = 'prospect',
  AGENT    = 'agent',
}

export interface ITutorAgentEventRsvp extends Document {
  rsvpId:          string;
  eventId:         string;
  respondentType:  TutorAgentEventRsvpRespondentType;
  agentId:         string | null;
  agentCode:       string | null;
  contactName:     string;
  email:           string;
  phone:           string | null;
  organisation:    string | null;
  status:          TutorAgentEventRsvpStatus;
  notes:           string | null;
  attended:        boolean;
  respondedAt:     Date;
  createdAt:       Date;
  updatedAt:       Date;
}

const TutorAgentEventRsvpSchema = new Schema<ITutorAgentEventRsvp>(
  {
    rsvpId:         { type: String, required: true, unique: true, index: true },
    eventId:        { type: String, required: true, index: true },
    respondentType: {
      type:     String,
      enum:     Object.values(TutorAgentEventRsvpRespondentType),
      required: true,
    },
    agentId:        { type: String, default: null, index: true },
    agentCode:      { type: String, default: null },
    contactName:    { type: String, required: true },
    email:          { type: String, required: true, lowercase: true, trim: true },
    phone:          { type: String, default: null },
    organisation:   { type: String, default: null },
    status:         {
      type:     String,
      enum:     Object.values(TutorAgentEventRsvpStatus),
      required: true,
      index:    true,
    },
    notes:          { type: String, default: null },
    attended:       { type: Boolean, default: false },
    respondedAt:    { type: Date, required: true },
  },
  { timestamps: true, collection: 'adam_tutor_agent_event_rsvps' },
);

TutorAgentEventRsvpSchema.index({ eventId: 1, email: 1 }, { unique: true });

export const TutorAgentEventRsvpModel = mongoose.model<ITutorAgentEventRsvp>(
  'TutorAgentEventRsvp',
  TutorAgentEventRsvpSchema,
);
