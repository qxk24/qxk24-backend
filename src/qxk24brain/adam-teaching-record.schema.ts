/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Record Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Append-only autobiographical memory — never erased.
 * One row per A + B = C transformation event ADAM can narrate from.
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { MomentLaw } from './adam-moment-reader.service';

export type TeachingRecordStatus = 'active' | 'superseded';

export interface RegisterCorrection {
  momentDetected: MomentLaw;
  momentActual:   MomentLaw;
  correctionNote: string;
  correctedAt:    Date;
  sessionId:      string;
}

export interface AdamTeachingRecordDocument extends Document {
  recordId:           string;
  founderId:          string;
  sessionId?:         string;
  founderMessageId?:  string;
  transformationId: string;
  entity_C_uid:       string;
  masa_recorded:      Date;
  stage:              number;
  family:             string;
  principle:          string;
  isNewFamily:        boolean;
  isNucleus?:         boolean;
  teacherRole:        'founder';
  teacherName:        string;
  episodeSummary:     string;
  teachingIntent:     string;
  outcomeSummary:     string;
  relationalTags:     string[];
  priorThreadId?:     string;
  autoJudgment:       string;
  auditStatus:        string;
  kernel:             string;
  era:                string;
  status:             TeachingRecordStatus;
  tcpChunkIndex?:     number;
  tcpChunkTotal?:     number;
  registerCorrection?: RegisterCorrection;
}

const AdamTeachingRecordSchema = new Schema<AdamTeachingRecordDocument>({
  recordId:           { type: String, required: true, unique: true },
  founderId:          { type: String, required: true, index: true },
  sessionId:          { type: String, index: true },
  founderMessageId:   { type: String, index: true },
  transformationId:   { type: String, required: true, unique: true, index: true },
  entity_C_uid:       { type: String, required: true, index: true },
  masa_recorded:        { type: Date, default: Date.now, index: true },
  stage:              { type: Number, required: true },
  family:             { type: String, required: true, index: true },
  principle:          { type: String, required: true, index: true },
  isNewFamily:        { type: Boolean, default: true },
  isNucleus:          { type: Boolean },
  teacherRole:        { type: String, enum: ['founder'], default: 'founder' },
  teacherName:        { type: String, default: 'Masa Bayu' },
  episodeSummary:     { type: String, required: true },
  teachingIntent:     { type: String, required: true },
  outcomeSummary:     { type: String, required: true },
  relationalTags:     { type: [String], default: [] },
  priorThreadId:      { type: String, index: true },
  autoJudgment:       { type: String, default: 'MAKMUR' },
  auditStatus:        { type: String, default: 'pending' },
  kernel:             { type: String, default: 'ALAMTOLOGI' },
  era:                { type: String, required: true },
  status:             {
    type:    String,
    enum:    ['active', 'superseded'],
    default: 'active',
    index:   true,
  },
  tcpChunkIndex:      { type: Number },
  tcpChunkTotal:      { type: Number },
  registerCorrection: {
    momentDetected: { type: String },
    momentActual:   { type: String },
    correctionNote: { type: String },
    correctedAt:    { type: Date },
    sessionId:      { type: String },
  },
}, {
  timestamps: true,
  collection: 'adam_teaching_records',
});

AdamTeachingRecordSchema.index({ founderId: 1, masa_recorded: -1 });
AdamTeachingRecordSchema.index({ founderId: 1, family: 1, masa_recorded: -1 });
AdamTeachingRecordSchema.index({ founderId: 1, 'registerCorrection.correctedAt': -1 });
AdamTeachingRecordSchema.index(
  { episodeSummary: 'text', teachingIntent: 'text', outcomeSummary: 'text', family: 'text' },
  { name: 'teaching_record_text' },
);

export const AdamTeachingRecordModel = mongoose.model<AdamTeachingRecordDocument>(
  'AdamTeachingRecord',
  AdamTeachingRecordSchema,
);
