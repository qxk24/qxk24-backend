/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Parent Guardian Schema (ERA_2i)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export type GuardianRelationship = 'mother' | 'father' | 'guardian' | 'other';

export interface ITutorParentGuardian extends Document {
  linkId:            string;
  studentUserId:     string;
  guardianName:      string;
  guardianEmail:     string;
  relationship:      GuardianRelationship;
  consentAt:         Date;
  accessTokenHash:   string;
  accessTokenHint:   string;
  lastAccessAt:      Date | null;
  active:            boolean;
  createdAt:         Date;
  updatedAt:         Date;
}

const TutorParentGuardianSchema = new Schema<ITutorParentGuardian>(
  {
    linkId:          { type: String, required: true, unique: true, index: true },
    studentUserId:   { type: String, required: true, unique: true, index: true },
    guardianName:    { type: String, required: true },
    guardianEmail:   { type: String, required: true, index: true },
    relationship:    {
      type: String,
      enum: ['mother', 'father', 'guardian', 'other'],
      default: 'guardian',
    },
    consentAt:       { type: Date, required: true },
    accessTokenHash: { type: String, required: true },
    accessTokenHint: { type: String, required: true },
    lastAccessAt:    { type: Date, default: null },
    active:          { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'adam_tutor_parent_guardians' },
);

export const TutorParentGuardianModel = mongoose.model<ITutorParentGuardian>(
  'TutorParentGuardian',
  TutorParentGuardianSchema,
);
