/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Enrollment Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import type { TutorPricingChannel } from './adam-tutor-pricing.types';

export enum TutorEnrollmentStatus {
  CODE_LOCKED   = 'code_locked',
  PROFILE_SAVED = 'profile_saved',
  PAID          = 'paid',
  COMPLETE      = 'complete',
}

export interface ITutorEnrollment extends Document {
  enrollmentId:   string;
  userId:         string;
  registerCode:   string;
  band:           TutorSubscriptionLevel | null;
  agentLabel:     string | null;
  agentId:        string | null;
  status:         TutorEnrollmentStatus;
  stripeSessionId: string | null;
  subscriptionId:  string | null;
  studentName:    string | null;
  schoolName:     string | null;
  state:          string | null;
  yearLabel:      string | null;
  language:       string | null;
  subjectsTaken:  string[];
  paidAt:         Date | null;
  completedAt:    Date | null;
  /** First successful monthly payment — start of 12-month agent-price window. */
  agentPriceStartedAt: Date | null;
  /** End of current agent-price window (USD 15.90/mo). */
  agentPriceEndsAt:    Date | null;
  /** When public USD 19 switch is scheduled (usually = agentPriceEndsAt). */
  priceSwitchAt:       Date | null;
  /** When subscription actually moved to public pricing. */
  priceSwitchedAt:     Date | null;
  pricingChannel:      TutorPricingChannel;
  createdAt:      Date;
  updatedAt:      Date;
}

const TutorEnrollmentSchema = new Schema<ITutorEnrollment>(
  {
    enrollmentId:    { type: String, required: true, unique: true, index: true },
    userId:          { type: String, required: true, unique: true, index: true },
    registerCode:    { type: String, required: true, index: true },
    band:            { type: String, enum: ['primary', 'secondary', 'university', null], default: null },
    agentLabel:      { type: String, default: null },
    agentId:         { type: String, default: null, index: true },
    status:          {
      type:    String,
      enum:    Object.values(TutorEnrollmentStatus),
      default: TutorEnrollmentStatus.CODE_LOCKED,
      index:   true,
    },
    stripeSessionId: { type: String, default: null },
    subscriptionId:  { type: String, default: null },
    studentName:     { type: String, default: null },
    schoolName:      { type: String, default: null },
    state:           { type: String, default: null },
    yearLabel:       { type: String, default: null },
    language:        { type: String, default: null },
    subjectsTaken:   { type: [String], default: [] },
    paidAt:          { type: Date, default: null },
    completedAt:     { type: Date, default: null },
    agentPriceStartedAt: { type: Date, default: null, index: true },
    agentPriceEndsAt:    { type: Date, default: null, index: true },
    priceSwitchAt:       { type: Date, default: null },
    priceSwitchedAt:     { type: Date, default: null },
    pricingChannel:      {
      type:    String,
      enum:    ['agent', 'public'],
      default: 'agent',
      index:   true,
    },
  },
  { timestamps: true, collection: 'adam_tutor_enrollments' },
);

export const TutorEnrollmentModel = mongoose.model<ITutorEnrollment>(
  'TutorEnrollment',
  TutorEnrollmentSchema,
);
