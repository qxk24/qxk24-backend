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
  /** ADAMGuru — guru may create kelas and teach ADAM; default student */
  accountRole?: 'student' | 'guru';
  /** umum = ADAM Learn; pelajar = ADAM Tutor (school/uni) */
  accountLane?: 'umum' | 'pelajar';
  /** Saved ADAM Tutor profile — level, syllabus, country (server-side for Founder visibility). */
  tutorProfile?: {
    level:       'primary' | 'secondary' | 'university';
    curriculum:  string;
    language?:   string;
    yearLabel?:  string;
    countryCode?: string;
    localeNote?: string;
  };
  tutorProfileUpdatedAt?: Date;
  /** Profesional+ — route ADAM Builder tools through local bridge daemon */
  macBridgeRoutingOpen?: boolean;
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
    accountRole: { type: String, enum: ['student', 'guru'], default: 'student', index: true },
    accountLane: { type: String, enum: ['umum', 'pelajar'], default: 'umum', index: true },
    tutorProfile: {
      level:       { type: String, enum: ['primary', 'secondary', 'university'] },
      curriculum:  { type: String },
      language:    { type: String },
      yearLabel:   { type: String },
      countryCode: { type: String },
      localeNote:  { type: String },
    },
    tutorProfileUpdatedAt: { type: Date },
    macBridgeRoutingOpen:  { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ADAMStudentAccountModel = mongoose.model<ADAMStudentAccountDocument>(
  'ADAMStudentAccount',
  ADAMStudentAccountSchema,
);
