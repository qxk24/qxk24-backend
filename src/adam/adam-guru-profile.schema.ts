/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Teacher Profile
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

export const GURU_PROFILE_MAX_SUBJECTS = 12;
export const GURU_PROFILE_BIO_MAX = 500;

export interface AdamGuruProfileDocument extends Document {
  guruId:          string;
  fullName:        string;
  credentialTitle: string;
  institution:     string;
  email:           string;
  phone:           string;
  country:         string;
  bio:             string;
  /** Subjects this guru teaches — each kelas uses one subject (isolated ADAM lane). */
  subjects:        string[];
  teachingFocus:   string;
  createdAt:       Date;
  updatedAt:       Date;
}

const AdamGuruProfileSchema = new Schema<AdamGuruProfileDocument>({
  guruId:          { type: String, required: true, unique: true, index: true },
  fullName:        { type: String, required: true },
  credentialTitle: { type: String, default: '' },
  institution:     { type: String, required: true },
  email:           { type: String, default: '' },
  phone:           { type: String, default: '' },
  country:         { type: String, default: '' },
  bio:             { type: String, default: '' },
  subjects:        { type: [String], default: [] },
  teachingFocus:   { type: String, default: '' },
}, { timestamps: true, collection: 'adam_guru_profiles' });

export const AdamGuruProfileModel = mongoose.model<AdamGuruProfileDocument>(
  'AdamGuruProfile',
  AdamGuruProfileSchema,
);
