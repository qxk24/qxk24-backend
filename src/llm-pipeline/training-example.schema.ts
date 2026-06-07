/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Training Example Schema
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

export type TrainingExampleSource =
  | 'teaching_bridge'
  | 'founder_session'
  | 'constitutional_negative'
  | 'constitutional_purification'
  | 'textbook_seed';

export type TrainingExampleQuality = 'verified' | 'candidate' | 'rejected';

export interface TrainingExampleDocument extends Document {
  exampleId:          string;
  system:             string;
  instruction:        string;
  response:           string;
  source:             TrainingExampleSource;
  quality:            TrainingExampleQuality;
  knowledgeFamily:    string;
  primaryAuthority:   string;
  quranReference?:    string;
  stage:              number;
  confirmedBy:        string;
  syllabusBookId?:    string;
  syllabusChapterId?: string;
  crystallisedUnitId?: string;
  sessionId?:         string;
  createdAt:          Date;
  usedInTraining:     boolean;
  trainingRun?:       string;
}

const TrainingExampleSchema = new Schema<TrainingExampleDocument>(
  {
    exampleId:          { type: String, required: true, unique: true },
    system:             { type: String, required: true },
    instruction:        { type: String, required: true },
    response:           { type: String, required: true },
    source:             { type: String, required: true, index: true },
    quality:            { type: String, default: 'verified' },
    knowledgeFamily:    { type: String, required: true, index: true },
    primaryAuthority:   { type: String, required: true },
    quranReference:     { type: String },
    stage:              { type: Number, default: 1 },
    confirmedBy:        { type: String, required: true },
    syllabusBookId:     { type: String, index: true },
    syllabusChapterId:  { type: String, index: true },
    crystallisedUnitId: { type: String, index: true },
    sessionId:          { type: String },
    usedInTraining:     { type: Boolean, default: false },
    trainingRun:        { type: String },
  },
  {
    collection: 'adam_training_examples',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

TrainingExampleSchema.index({ quality: 1, createdAt: -1 });
TrainingExampleSchema.index({ usedInTraining: 1 });

export const TrainingExampleModel = mongoose.model<TrainingExampleDocument>(
  'TrainingExample',
  TrainingExampleSchema,
);
