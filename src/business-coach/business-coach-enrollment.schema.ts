/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach Enrollment Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { BusinessCoachPricingChannel } from '../subscriptions/subscription.schema';

export enum BusinessCoachEnrollmentStatus {
  CODE_LOCKED   = 'code_locked',
  PROFILE_SAVED = 'profile_saved',
  PAID          = 'paid',
  COMPLETE      = 'complete',
}

export interface IBusinessCoachEnrollment extends Document {
  enrollmentId:    string;
  userId:          string;
  registerCode:    string;
  distributorLabel: string | null;
  status:          BusinessCoachEnrollmentStatus;
  pricingChannel:  BusinessCoachPricingChannel;
  stripeSessionId: string | null;
  subscriptionId:  string | null;
  businessName:    string | null;
  country:         string | null;
  businessFocus:   string | null;
  paidAt:          Date | null;
  completedAt:     Date | null;
  createdAt:       Date;
  updatedAt:       Date;
}

const BusinessCoachEnrollmentSchema = new Schema<IBusinessCoachEnrollment>(
  {
    enrollmentId:     { type: String, required: true, unique: true, index: true },
    userId:           { type: String, required: true, unique: true, index: true },
    registerCode:     { type: String, required: true, index: true },
    distributorLabel: { type: String, default: null },
    status:           {
      type:    String,
      enum:    Object.values(BusinessCoachEnrollmentStatus),
      default: BusinessCoachEnrollmentStatus.CODE_LOCKED,
      index:   true,
    },
    pricingChannel:   { type: String, enum: ['public', 'pin'], default: 'pin' },
    stripeSessionId:  { type: String, default: null },
    subscriptionId:   { type: String, default: null },
    businessName:     { type: String, default: null },
    country:          { type: String, default: null },
    businessFocus:    { type: String, default: null },
    paidAt:           { type: Date, default: null },
    completedAt:      { type: Date, default: null },
  },
  { timestamps: true, collection: 'adam_business_coach_enrollments' },
);

export const BusinessCoachEnrollmentModel = mongoose.model<IBusinessCoachEnrollment>(
  'BusinessCoachEnrollment',
  BusinessCoachEnrollmentSchema,
);
