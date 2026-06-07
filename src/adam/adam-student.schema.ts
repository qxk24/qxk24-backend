/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Account Schema
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ADAMStudentAccountDocument extends Document {
  userId:         string;
  name:           string;
  passwordHash:   string;
  email?:         string;
  googleSub?:     string;
  active:         boolean;
  createdBy:      string;
  /** env = seeded from STUDENT_PASSWORDS; founder = P.alt reset; self-register = student signup */
  passwordSource?: 'env' | 'founder' | 'self-register' | 'google' | 'self';
  passwordUpdatedAt?: Date;
  createdAt:      Date;
  updatedAt:      Date;
}

const ADAMStudentAccountSchema = new Schema<ADAMStudentAccountDocument>(
  {
    userId:       { type: String, required: true, unique: true, index: true },
    name:         { type: String, required: true },
    passwordHash:   { type: String, required: true },
    email:          { type: String, sparse: true, unique: true, index: true },
    googleSub:      { type: String, sparse: true, unique: true, index: true },
    active:         { type: Boolean, default: true, index: true },
    createdBy:      { type: String, required: true },
    passwordSource: { type: String, enum: ['env', 'founder', 'self-register', 'google', 'self'] },
    passwordUpdatedAt: { type: Date },
  },
  { timestamps: true },
);

export const ADAMStudentAccountModel = mongoose.model<ADAMStudentAccountDocument>(
  'ADAMStudentAccount',
  ADAMStudentAccountSchema,
);
