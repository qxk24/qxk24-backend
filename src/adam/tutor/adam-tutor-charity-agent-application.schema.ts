/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Charity Agent Application Schema
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

export enum TutorCharityApplicationStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ITutorCharityAgentApplication extends Document {
  applicationId:        string;
  status:               TutorCharityApplicationStatus;
  contactName:          string;
  email:                string;
  phone:                string | null;
  universityName:       string;
  matricNumber:         string;
  studentIdFileName:    string;
  studentIdMime:        string;
  studentIdStoredPath:  string;
  bankName:             string;
  bankAccountNumber:    string;
  bankAccountHolder:    string;
  termsAcceptedAt:      Date;
  agentId:              string | null;
  reviewedBy:           string | null;
  reviewedAt:           Date | null;
  rejectReason:         string | null;
  createdAt:            Date;
  updatedAt:            Date;
}

const TutorCharityAgentApplicationSchema = new Schema<ITutorCharityAgentApplication>(
  {
    applicationId:       { type: String, required: true, unique: true, index: true },
    status:              {
      type:    String,
      enum:    Object.values(TutorCharityApplicationStatus),
      default: TutorCharityApplicationStatus.PENDING,
      index:   true,
    },
    contactName:         { type: String, required: true },
    email:               { type: String, required: true, lowercase: true, trim: true, index: true },
    phone:               { type: String, default: null },
    universityName:      { type: String, required: true },
    matricNumber:        { type: String, required: true, index: true },
    studentIdFileName:   { type: String, required: true },
    studentIdMime:       { type: String, required: true },
    studentIdStoredPath: { type: String, required: true },
    bankName:            { type: String, required: true },
    bankAccountNumber:   { type: String, required: true },
    bankAccountHolder:   { type: String, required: true },
    termsAcceptedAt:     { type: Date, required: true },
    agentId:             { type: String, default: null, index: true },
    reviewedBy:          { type: String, default: null },
    reviewedAt:          { type: Date, default: null },
    rejectReason:        { type: String, default: null },
  },
  { timestamps: true, collection: 'adam_tutor_charity_agent_applications' },
);

export const TutorCharityAgentApplicationModel = mongoose.model<ITutorCharityAgentApplication>(
  'TutorCharityAgentApplication',
  TutorCharityAgentApplicationSchema,
);
