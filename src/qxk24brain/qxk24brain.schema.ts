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

export interface EntityConnection {
  targetUid:       string;
  targetFamily:    string;
  connectionType:  'parent' | 'sibling' | 'child' | 'principle';
  strength:        number;
  masa_connected:  Date;
  note?:           string;
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
  connections?:      EntityConnection[];
  auditStatus?:      'active' | 'dissolved' | 'waqf';
  transformationId?: string;
  dissolvedAt?:       Date;
  dissolutionReason?: string;
  checksum?:          string;
  integrity_status?:  'VERIFIED' | 'CORRUPTED' | 'REBUILT' | 'PENDING';
  masa_rebuilt?:      Date;
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
  connections: [{
    targetUid:       String,
    targetFamily:    String,
    connectionType:  { type: String, enum: ['parent', 'sibling', 'child', 'principle'] },
    strength:        { type: Number, min: 1, max: 7, default: 5 },
    masa_connected:  { type: Date, default: Date.now },
    note:            String,
  }],
  auditStatus:       { type: String, enum: ['active', 'dissolved', 'waqf'], default: 'active' },
  transformationId:  String,
  dissolvedAt:         Date,
  dissolutionReason:   String,
  checksum:            { type: String, index: true },
  integrity_status:    {
    type:    String,
    enum:    ['VERIFIED', 'CORRUPTED', 'REBUILT', 'PENDING'],
    default: 'PENDING',
    index:   true,
  },
  masa_rebuilt:        Date,
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
  /** AIDIL knowledge level 1–6 (Teaching Bridge v2 may advance) */
  constitutionalLevel?: number;
  masteredTopics?:      string[];
  openQuestions?:       string[];
  zpdReadiness?:        boolean;
  /** Fast-read summary from last ADAM reply (per turn hook) */
  lastSessionSummary?:  string;
}

export interface BrainSessionContext {
  currentSessionId?: string;
  lastSummary?:      string;
  messageCount?:     number;
  updatedAt?:        Date;
}

export interface ContinuityBridge {
  founderProfile:    string;
  relationshipArc:   string;
  lastSession:       string;
  openThreads:       string;
  nextSteps:         string;
  /** Phase 3 — family thread rollup from adam_teaching_records */
  relationalMemory?: string;
}

export interface QXK24BrainMasterDocument extends Document {
  uid:                   string;
  founderId:             string;
  unifiedUnderstanding:  string;
  principles:            PrincipleState[];
  activeFamilies:        ActiveFamily[];
  completedFamilies:     CompletedFamily[];
  studentTracks:         StudentTrack[];
  sessionContext?:       BrainSessionContext;
  continuityBridge?:     ContinuityBridge;
  continuityBridge_updated?: Date;
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
    constitutionalLevel: { type: Number, default: 1, min: 1, max: 6 },
    masteredTopics:      { type: [String], default: [] },
    openQuestions:       { type: [String], default: [] },
    zpdReadiness:        { type: Boolean, default: false },
    lastSessionSummary:  { type: String, default: '' },
  }],
  sessionContext: {
    currentSessionId: String,
    lastSummary:      String,
    messageCount:     Number,
    updatedAt:        Date,
  },
  continuityBridge: {
    founderProfile:    { type: String, default: '' },
    relationshipArc:   { type: String, default: '' },
    lastSession:         { type: String, default: '' },
    openThreads:         { type: String, default: '' },
    nextSteps:           { type: String, default: '' },
    relationalMemory:    { type: String, default: '' },
  },
  continuityBridge_updated: Date,
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

export type AidilAuditJudgment = 'MAKMUR' | 'ISLAH' | 'WAQF';
export type TransformationAuditStatus =
  | 'pending'
  | 'confirmed'
  | 'corrected'
  | 'waqf'
  | 'superseded';

export interface QXK24BrainLogDocument extends Document {
  transformationId:    string;
  entity_A_uid:        string;
  entity_A_summary:    string;
  entity_A_full:       string;
  entity_B_uid:        string;
  entity_B_content:    string;
  entity_C_uid:        string;
  entity_C_content:    string;
  entity_C_preview:    string;
  familySummary?:      string;
  masa_transformation: Date;
  family:              string;
  principle:           string;
  isNewFamily:         boolean;
  isNucleus?:          boolean;
  stage:               number;
  founderId:           string;
  kernel:              string;
  auditStatus:         TransformationAuditStatus;
  autoJudgment:        AidilAuditJudgment;
  founderJudgment?:    AidilAuditJudgment;
  founderCorrection?:  string;
  auditedAt?:          Date;
  dissolvedAt?:        Date;
  replacementTransformationId?: string;
  correctedFromId?:    string;
  priorActiveFamilies?: ActiveFamily[];
  priorCompletedFamilies?: CompletedFamily[];
}

const QXK24BrainLogSchema = new Schema<QXK24BrainLogDocument>({
  transformationId: { type: String, required: true, unique: true },
  entity_A_uid:     { type: String, required: true },
  entity_A_summary: { type: String, required: true },
  entity_A_full:    { type: String, required: true },
  entity_B_uid:     { type: String, required: true },
  entity_B_content: { type: String, required: true },
  entity_C_uid:     { type: String, required: true },
  entity_C_content: { type: String, required: true },
  entity_C_preview: { type: String, default: '' },
  familySummary:    { type: String },
  masa_transformation: { type: Date, default: Date.now },
  family:      { type: String, required: true },
  principle:   { type: String, required: true },
  isNewFamily: { type: Boolean, default: true },
  isNucleus:   { type: Boolean },
  stage:       { type: Number, default: 1 },
  founderId:   { type: String, default: 'masa-bayu', index: true },
  kernel:      { type: String, default: 'QXK24' },
  auditStatus: {
    type:    String,
    enum:    ['pending', 'confirmed', 'corrected', 'waqf', 'superseded'],
    default: 'pending',
    index:   true,
  },
  autoJudgment:    { type: String, enum: ['MAKMUR', 'ISLAH', 'WAQF'], default: 'MAKMUR' },
  founderJudgment: { type: String, enum: ['MAKMUR', 'ISLAH', 'WAQF'] },
  founderCorrection: String,
  auditedAt:         Date,
  dissolvedAt:       Date,
  replacementTransformationId: String,
  correctedFromId:   String,
  priorActiveFamilies: [{
    family:      String,
    principle:   String,
    nucleusUid:  String,
    stage:       Number,
    summary:     String,
    masa_opened: Date,
  }],
  priorCompletedFamilies: [{
    family:         String,
    principle:      String,
    completedUid:   String,
    masa_completed: Date,
    summary:        String,
  }],
}, {
  timestamps: true,
  collection: 'qxk24brain_log',
});

export const QXK24BrainLogModel = mongoose.model<QXK24BrainLogDocument>(
  'QXK24BrainLog',
  QXK24BrainLogSchema,
);

export interface ADAMReflectionDocument extends Document {
  reflectionId:         string;
  founderId:            string;
  content:              string;
  questionsForFounder:  string[];
  nearStage7Notes:      string[];
  missingConnections:   string[];
  uncertainties:        string[];
  masa_reflected:       Date;
  acknowledgedAt?:      Date;
  trigger:              'scheduled' | 'manual';
  kernel:               string;
  era:                  string;
}

const ADAMReflectionSchema = new Schema<ADAMReflectionDocument>({
  reflectionId:        { type: String, required: true, unique: true },
  founderId:           { type: String, default: 'masa-bayu', index: true },
  content:             { type: String, required: true },
  questionsForFounder: { type: [String], default: [] },
  nearStage7Notes:     { type: [String], default: [] },
  missingConnections:  { type: [String], default: [] },
  uncertainties:       { type: [String], default: [] },
  masa_reflected:      { type: Date, default: Date.now, index: true },
  acknowledgedAt:      { type: Date },
  trigger:             { type: String, enum: ['scheduled', 'manual'], default: 'scheduled' },
  kernel:              { type: String, default: 'QXK24' },
  era:                 { type: String, default: 'ERA_1' },
}, {
  timestamps: true,
  collection: 'adam_reflections',
});

export const ADAMReflectionModel = mongoose.model<ADAMReflectionDocument>(
  'ADAMReflection',
  ADAMReflectionSchema,
);
