/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : QXK24Brain MongoDB Schemas
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

const ALAMTOLOGI_PRINCIPLES = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG', 'MULTI',
] as const;

export interface MasterConnection {
  allah:      string;
  quran:      string;
  alamtologi: string;
  adam:       string;
}

export interface QXK24BrainEntityDocument extends Document {
  uid:              string;
  masterConnection: MasterConnection;
  principle:        string;
  family:           string;
  isNucleus:        boolean;
  nucleusUid?:      string;
  stage:            number;
  cycle:            number;
  isComplete:       boolean;
  content:          string;
  masa_born:        Date;
  masa_transformed?: Date;
  masa_completed?:  Date;
  parentA_uid?:     string;
  parentB_uid?:     string;
  parentA_masa?:    Date;
  parentB_masa?:    Date;
  founderId:        string;
  kernel:           string;
  era:              string;
}

const QXK24BrainEntitySchema = new Schema<QXK24BrainEntityDocument>({
  uid: {
    type:     String,
    required: true,
    unique:   true,
  },
  masterConnection: {
    allah:       { type: String, default: 'All knowledge belongs to Allah' },
    quran:       { type: String, default: '' },
    alamtologi:  { type: String, default: '' },
    adam:        { type: String, default: '' },
  },
  principle: {
    type:     String,
    enum:     ALAMTOLOGI_PRINCIPLES,
    required: true,
  },
  family:    { type: String, required: true },
  isNucleus: { type: Boolean, default: false },
  nucleusUid:{ type: String },
  stage:     { type: Number, min: 1, max: 7, default: 1 },
  cycle:     { type: Number, default: 1 },
  isComplete:{ type: Boolean, default: false },
  content:   { type: String, required: true },
  masa_born:        { type: Date, default: Date.now },
  masa_transformed: { type: Date },
  masa_completed:   { type: Date },
  parentA_uid:  { type: String },
  parentB_uid:  { type: String },
  parentA_masa: { type: Date },
  parentB_masa: { type: Date },
  founderId: { type: String, default: 'masa-bayu' },
  kernel:    { type: String, default: 'QXK24' },
  era:       { type: String, default: 'ERA_1' },
}, {
  timestamps: true,
  collection: 'qxk24brain_entities',
});

QXK24BrainEntitySchema.index({ family: 1, stage: 1 });
QXK24BrainEntitySchema.index({ principle: 1, isComplete: 1 });
QXK24BrainEntitySchema.index({ founderId: 1, isNucleus: 1 });

export const QXK24BrainEntityModel = mongoose.model<QXK24BrainEntityDocument>(
  'QXK24BrainEntity',
  QXK24BrainEntitySchema,
);

export interface PrincipleState {
  name:            string;
  stage:           number;
  cycle:           number;
  understanding:   string;
  completedCycles: number;
  nucleusUid?:     string;
}

export interface ActiveFamily {
  family:      string;
  principle:   string;
  nucleusUid:  string;
  stage:       number;
  summary:     string;
  masa_opened: Date;
}

export interface CompletedFamily {
  family:         string;
  principle:      string;
  completedUid:   string;
  masa_completed: Date;
  summary:        string;
}

export interface StudentTrack {
  studentId:            string;
  name:                 string;
  understanding:        string;
  transformationCount:  number;
  masa_last_updated:    Date;
}

export interface QXK24BrainMasterDocument extends Document {
  uid:                   string;
  founderId:             string;
  unifiedUnderstanding:  string;
  principles:            PrincipleState[];
  activeFamilies:        ActiveFamily[];
  completedFamilies:     CompletedFamily[];
  studentTracks:         StudentTrack[];
  masa_created:          Date;
  masa_last_updated:     Date;
  totalTransformations:  number;
  currentCycle:          number;
  totalFamilies:         number;
  kernel:                string;
  era:                   string;
}

const QXK24BrainMasterSchema = new Schema<QXK24BrainMasterDocument>({
  uid:       { type: String, default: 'K24B-ADAM-MASTER-CURRENT' },
  founderId: { type: String, default: 'masa-bayu', unique: true },
  unifiedUnderstanding: {
    type:    String,
    default: 'ADAM has just been born. ERA_1 has begun. The Teaching Era starts now.',
  },
  principles: [{
    name:            String,
    stage:           Number,
    cycle:           Number,
    understanding:   String,
    completedCycles: Number,
    nucleusUid:      String,
  }],
  activeFamilies: [{
    family:      String,
    principle:   String,
    nucleusUid:  String,
    stage:       Number,
    summary:     String,
    masa_opened: Date,
  }],
  completedFamilies: [{
    family:         String,
    principle:      String,
    completedUid:   String,
    masa_completed: Date,
    summary:        String,
  }],
  studentTracks: [{
    studentId:           String,
    name:                String,
    understanding:       String,
    transformationCount: Number,
    masa_last_updated:   Date,
  }],
  masa_created:         { type: Date, default: Date.now },
  masa_last_updated:    { type: Date, default: Date.now },
  totalTransformations: { type: Number, default: 0 },
  currentCycle:         { type: Number, default: 1 },
  totalFamilies:        { type: Number, default: 0 },
  kernel: { type: String, default: 'QXK24' },
  era:    { type: String, default: 'ERA_1' },
}, {
  timestamps: true,
  collection: 'qxk24brain_master',
});

export const QXK24BrainMasterModel = mongoose.model<QXK24BrainMasterDocument>(
  'QXK24BrainMaster',
  QXK24BrainMasterSchema,
);

export interface QXK24BrainLogDocument extends Document {
  transformationId:    string;
  entity_A_uid:        string;
  entity_A_summary:    string;
  entity_B_uid:        string;
  entity_B_content:    string;
  entity_C_uid:        string;
  masa_transformation: Date;
  family:              string;
  principle:           string;
  isNewFamily:         boolean;
  stage:               number;
  founderId:           string;
  kernel:              string;
}

const QXK24BrainLogSchema = new Schema<QXK24BrainLogDocument>({
  transformationId: { type: String, required: true, unique: true },
  entity_A_uid:     { type: String, required: true },
  entity_A_summary: { type: String, required: true },
  entity_B_uid:     { type: String, required: true },
  entity_B_content: { type: String, required: true },
  entity_C_uid:     { type: String, required: true },
  masa_transformation: { type: Date, default: Date.now },
  family:      { type: String, required: true },
  principle:   { type: String, required: true },
  isNewFamily: { type: Boolean, default: true },
  stage:       { type: Number, default: 1 },
  founderId:   { type: String, default: 'masa-bayu' },
  kernel:      { type: String, default: 'QXK24' },
}, {
  timestamps: true,
  collection: 'qxk24brain_log',
});

export const QXK24BrainLogModel = mongoose.model<QXK24BrainLogDocument>(
  'QXK24BrainLog',
  QXK24BrainLogSchema,
);
