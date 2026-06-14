/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Syllabus Progress Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { SyllabusChapterStatus } from './formula-xyz-syllabus';

export interface SyllabusProgressDocument extends Document {
  bookId:        string;
  chapterId:     string;
  title:         string;
  sortOrder:     number;
  status:        SyllabusChapterStatus;
  exampleCount:  number;
  updatedAt:     Date;
}

const SyllabusProgressSchema = new Schema<SyllabusProgressDocument>(
  {
    bookId:       { type: String, required: true, index: true },
    chapterId:    { type: String, required: true, unique: true },
    title:        { type: String, required: true },
    sortOrder:    { type: Number, required: true },
    status:       { type: String, default: 'pending' },
    exampleCount: { type: Number, default: 0 },
  },
  {
    collection: 'adam_syllabus_progress',
    timestamps: { createdAt: false, updatedAt: true },
    versionKey: false,
  },
);

export const SyllabusProgressModel = mongoose.model<SyllabusProgressDocument>(
  'SyllabusProgress',
  SyllabusProgressSchema,
);
