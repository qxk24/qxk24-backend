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

export enum TutorEnrollmentStatus {
  CODE_LOCKED = 'code_locked',
  PAID        = 'paid',
  COMPLETE    = 'complete',
}

export interface ITutorEnrollment extends Document {
  enrollmentId:   string;
  userId:         string;
  registerCode:   string;
  band:           TutorSubscriptionLevel;
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
  paidAt:         Date | null;
  completedAt:    Date | null;
  createdAt:      Date;
  updatedAt:      Date;
}

const TutorEnrollmentSchema = new Schema<ITutorEnrollment>(
  {
    enrollmentId:    { type: String, required: true, unique: true, index: true },
    userId:          { type: String, required: true, unique: true, index: true },
    registerCode:    { type: String, required: true, index: true },
    band:            { type: String, enum: ['primary', 'secondary', 'university'], required: true },
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
    paidAt:          { type: Date, default: null },
    completedAt:     { type: Date, default: null },
  },
  { timestamps: true, collection: 'adam_tutor_enrollments' },
);

export const TutorEnrollmentModel = mongoose.model<ITutorEnrollment>(
  'TutorEnrollment',
  TutorEnrollmentSchema,
);
