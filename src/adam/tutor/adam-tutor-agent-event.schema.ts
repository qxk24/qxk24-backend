/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Event Schema
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

export enum TutorAgentEventStatus {
  DRAFT     = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
}

export enum TutorAgentEventLocationType {
  ONLINE   = 'online',
  PHYSICAL = 'physical',
}

export interface ITutorAgentEvent extends Document {
  eventId:       string;
  title:         string;
  description:   string | null;
  startsAt:      Date;
  endsAt:        Date;
  timezone:      string;
  locationType:  TutorAgentEventLocationType;
  locationLabel: string | null;
  meetingUrl:    string | null;
  capacity:      number | null;
  status:        TutorAgentEventStatus;
  isFeatured:    boolean;
  createdBy:     string;
  publishedAt:   Date | null;
  cancelledAt:   Date | null;
  createdAt:     Date;
  updatedAt:     Date;
}

const TutorAgentEventSchema = new Schema<ITutorAgentEvent>(
  {
    eventId:       { type: String, required: true, unique: true, index: true },
    title:         { type: String, required: true },
    description:   { type: String, default: null },
    startsAt:      { type: Date, required: true, index: true },
    endsAt:        { type: Date, required: true },
    timezone:      { type: String, default: 'Asia/Kuala_Lumpur' },
    locationType:  {
      type:    String,
      enum:    Object.values(TutorAgentEventLocationType),
      default: TutorAgentEventLocationType.ONLINE,
    },
    locationLabel: { type: String, default: null },
    meetingUrl:    { type: String, default: null },
    capacity:      { type: Number, default: null, min: 1 },
    status:        {
      type:    String,
      enum:    Object.values(TutorAgentEventStatus),
      default: TutorAgentEventStatus.DRAFT,
      index:   true,
    },
    isFeatured:    { type: Boolean, default: false, index: true },
    createdBy:     { type: String, required: true },
    publishedAt:   { type: Date, default: null },
    cancelledAt:   { type: Date, default: null },
  },
  { timestamps: true, collection: 'adam_tutor_agent_events' },
);

TutorAgentEventSchema.index({ status: 1, startsAt: 1 });

export const TutorAgentEventModel = mongoose.model<ITutorAgentEvent>(
  'TutorAgentEvent',
  TutorAgentEventSchema,
);
