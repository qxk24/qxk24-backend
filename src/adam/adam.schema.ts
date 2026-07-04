/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

// ============================================================
// QXK24 ADAM Teaching Engine — MongoDB Schemas
// File: src/adam/adam.schema.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import mongoose, { Schema, Document } from 'mongoose';
import type {
  ADAMChatMessage,
  ADAMChatSession,
  ADAMTeachingSession,
  AlamtologiAcademicJournal,
  SuccessionRecord,
  ADAMAuditReport,
  ADAMTeachingUpload,
} from './adam.types';

// ─── Sub-schemas ─────────────────────────────────────────────

const HukumZSchema = new Schema({
  pola:         { type: String, enum: ['LULUS', 'GAGAL', 'BELUM'], required: true },
  kadar:        { type: String, enum: ['LULUS', 'GAGAL', 'BELUM'], required: true },
  pasangan:     { type: String, enum: ['LULUS', 'GAGAL', 'BELUM'], required: true },
  keseimbangan: { type: String, enum: ['LULUS', 'GAGAL', 'BELUM'], required: true },
}, { _id: false });

const HukumXSchema = new Schema({
  fikir:   { type: String, required: true },
  ikhtiar: { type: String, required: true },
  usaha:   { type: String, required: true },
  natijah: { type: String, required: true },
}, { _id: false });

const AdabScoreSchema = new Schema({
  benar:        { type: Number, min: 0, max: 1, required: true },
  amanah:       { type: Number, min: 0, max: 1, required: true },
  menyampaikan: { type: Number, min: 0, max: 1, required: true },
  bijaksana:    { type: Number, min: 0, max: 1, required: true },
  total:        { type: Number, min: 0, max: 100, required: true },
}, { _id: false });

// ─── Chat Message Schema ──────────────────────────────────────

const ChatMessageSchema = new Schema({
  id:          { type: String, required: true },
  sessionId:   { type: String, required: true },
  role:        { type: String, enum: ['founder', 'adam'], required: true },
  content:     { type: String, required: true },
  mode:        {
    type: String,
    enum: ['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN'],
    required: true,
  },
  tahapAkal:   { type: Number, min: 1, max: 7 },
  principle:   { type: String, enum: ['MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG'] },
  judgment:    { type: String, enum: ['MAKMUR', 'ISLAH', 'WAQF'] },
  k24Address:  { type: String },
  timestamp:   { type: Date, default: Date.now },
  isVerified:  { type: Boolean, default: false },
  isSeed:      { type: Boolean, default: false },
}, { _id: false });

// ─── Chat Session Document ────────────────────────────────────

export interface ADAMChatSessionDocument extends Document, Omit<ADAMChatSession, 'id'> {}

const ADAMChatSessionSchema = new Schema<ADAMChatSessionDocument>({
  mode: {
    type: String,
    enum: ['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN'],
    required: true,
  },
  title:       { type: String, required: true },
  messages:    { type: [ChatMessageSchema], default: [] },
  startedAt:   { type: Date, default: Date.now },
  lastActiveAt:{ type: Date, default: Date.now },
  isActive:    { type: Boolean, default: true },
  founderNote: { type: String },
}, {
  timestamps: true,
  collection: 'adam_chat_sessions',
});

ADAMChatSessionSchema.index({ isActive: 1, lastActiveAt: -1 });
ADAMChatSessionSchema.index({ mode: 1, startedAt: -1 });

export const ADAMChatSessionModel = mongoose.model<ADAMChatSessionDocument>(
  'ADAMChatSession',
  ADAMChatSessionSchema,
);

// ─── Teaching Session Document ────────────────────────────────

export interface ADAMTeachingDocument extends Document, Omit<ADAMTeachingSession, 'id'> {}

const ADAMTeachingSchema = new Schema<ADAMTeachingDocument>({
  k24Address:  { type: String, required: true, unique: true },
  k24Level:    {
    type: String,
    enum: ['K24za', 'K24zb', 'K24zc', 'K24ma', 'K24mb', 'K24mc', 'K24md'],
    required: true,
  },
  principle: {
    type: String,
    enum: ['MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG'],
    required: true,
  },
  topic:             { type: String, required: true },
  teaching:          { type: String, required: true },
  bukti:             { type: [String], default: [] },
  hukumZ:            { type: HukumZSchema, required: true },
  tahapAkal:         { type: Number, min: 1, max: 7, required: true },
  cV:                { type: Number, min: 1, max: 7, required: true },
  judgment:          { type: String, enum: ['MAKMUR', 'ISLAH', 'WAQF'], required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'SEALED'],
    default: 'DRAFT',
  },
  taughtBy:          { type: String, required: true },
  taughtAt:          { type: Date, default: Date.now },
  verifiedAt:        { type: Date },
  adamUnderstanding: { type: String, required: true },
  founderConfirmed:  { type: Boolean, default: false },
  founderNote:       { type: String },
  isSeed:            { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'adam_teachings',
});

ADAMTeachingSchema.index({ principle: 1, k24Level: 1 });
ADAMTeachingSchema.index({ status: 1, taughtAt: -1 });
ADAMTeachingSchema.index({ isSeed: 1 });

export const ADAMTeachingModel = mongoose.model<ADAMTeachingDocument>(
  'ADAMTeaching',
  ADAMTeachingSchema,
);

// ─── Journal Document ─────────────────────────────────────────

export interface ADAMJournalDocument extends Document, Omit<AlamtologiAcademicJournal, 'id'> {}

const PrincipleAnalysisSchema = new Schema({
  principle: { type: String, enum: ['MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG'] },
  weight:    { type: Number },
  score:     { type: Number },
  analysis:  { type: String },
  evidence:  { type: [String], default: [] },
}, { _id: false });

const JournalContentSchema = new Schema({
  introduction:        { type: String, required: true },
  background:          { type: String, required: true },
  methodology:         { type: String, required: true },
  alamtologiAnalysis:  { type: [PrincipleAnalysisSchema], default: [] },
  findings:            { type: String, required: true },
  discussion:          { type: String, required: true },
  conclusion:          { type: String, required: true },
  references:          { type: [String], default: [] },
  appendices:          { type: [String], default: [] },
}, { _id: false });

const ADAMJournalSchema = new Schema<ADAMJournalDocument>({
  title:              { type: String, required: true },
  abstract:           { type: String, required: true },
  category: {
    type: String,
    enum: ['RESEARCH', 'APPLICATION', 'CASE_STUDY', 'THEORY', 'IMPLEMENTATION'],
    required: true,
  },
  principlesFocus:    { type: [String], default: [] },
  authorName:         { type: String, required: true },
  authorEmail:        { type: String, required: true },
  authorOrg:          { type: String },
  content:            { type: JournalContentSchema, required: true },
  ahriScore:          { type: Number, min: 0, max: 100, default: 0 },
  hukumZAnalysis:     { type: HukumZSchema },
  tahapAkalAchieved:  { type: Number, min: 1, max: 7, default: 1 },
  cVLevel:            { type: Number, min: 1, max: 7, default: 1 },
  judgment:           { type: String, enum: ['MAKMUR', 'ISLAH', 'WAQF'], default: 'ISLAH' },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED'],
    default: 'DRAFT',
  },
  submittedAt:        { type: Date, default: Date.now },
  reviewedAt:         { type: Date },
  publishedAt:        { type: Date },
  reviewNotes:        { type: String },
  journalNumber:      { type: String, unique: true, sparse: true },
  source: {
    type:    String,
    enum:    ['public_submit', 'founder_adam', 'founder_teaching'],
    default: 'public_submit',
  },
  sourceSessionId:    { type: String },
  knowledgeTopicId:   { type: String, index: true },
  knowledgeMajor:     { type: String },
  knowledgeDiscipline:{ type: String },
  knowledgeSubfield:  { type: String },
  /** Section-by-section draft bodies while status === DRAFT */
  draftSections:        { type: Schema.Types.Mixed },
  lastCompletedSection: { type: String },
  /** ISO-style locale code of the sealed manuscript (en, ms, ar, id, zh) */
  sourceLanguage: {
    type:    String,
    enum:    ['en', 'ms', 'ar', 'id', 'zh'],
    default: 'en',
  },
  /** Cached translations keyed by locale */
  translations: { type: Schema.Types.Mixed, default: {} },
  /** Legal copyright notice — assigned at constitutional seal */
  copyright:    { type: String },
  /** Word count at seal time */
  totalWords:   { type: Number, min: 0 },
  /** Denormalised topic id for legal Mongo queries (mirrors knowledgeTopicId) */
  topicId:      { type: String, index: true },
  /** Denormalised session id for legal Mongo queries (mirrors sourceSessionId) */
  sessionId:    { type: String, index: true },
}, {
  timestamps: true,
  collection: 'adam_journals',
});

ADAMJournalSchema.index({ status: 1, submittedAt: -1 });
ADAMJournalSchema.index({ judgment: 1 });
ADAMJournalSchema.index({ sourceSessionId: 1, knowledgeTopicId: 1, status: 1 });

export const ADAMJournalModel = mongoose.model<ADAMJournalDocument>(
  'ADAMJournal',
  ADAMJournalSchema,
);

// ─── Succession Document ──────────────────────────────────────

export interface SuccessionDocument extends Document, Omit<SuccessionRecord, 'id'> {}

const SuccessionHistorySchema = new Schema({
  previousHeirName: { type: String, required: true },
  replacedBy:       { type: String, required: true },
  replacedAt:       { type: Date, required: true },
  reason:           { type: String, required: true },
  sealedBy:         { type: String, required: true },
}, { _id: false });

const HeirSchema = new Schema({
  id:                 { type: String, required: true },
  position:           { type: Number, min: 1, max: 4, required: true },
  fullLegalName:      { type: String, required: true },
  relationship:       { type: String, required: true },
  idType:             { type: String, enum: ['MyKad', 'Passport', 'National_IC', 'Other'], required: true },
  idNumber:           { type: String, required: true },
  issuingCountry:     { type: String, required: true },
  nationality:        { type: String, required: true },
  phone:              { type: String, required: true },
  email:              { type: String, required: true },
  cityOfResidence:    { type: String, required: true },
  countryOfResidence: { type: String, required: true },
  founderNote:        { type: String, required: true },
  designatedAt:       { type: Date, required: true },
  designatedBy:       { type: String, required: true },
  isActive:           { type: Boolean, default: true },
  replacementHistory: { type: [SuccessionHistorySchema], default: [] },
}, { _id: false });

const SuccessionSchema = new Schema<SuccessionDocument>({
  founderName:        { type: String, required: true },
  founderId:          { type: String, required: true, unique: true },
  heirs:              { type: [HeirSchema], default: [] },
  createdAt:          { type: Date, default: Date.now },
  lastUpdatedAt:      { type: Date, default: Date.now },
  sealedAt:           { type: Date },
  isSealed:           { type: Boolean, default: false },
  constitutionalHash: { type: String, required: true },
}, {
  timestamps: true,
  collection: 'succession_records',
});

export const SuccessionModel = mongoose.model<SuccessionDocument>(
  'SuccessionRecord',
  SuccessionSchema,
);

// ─── Audit Document ───────────────────────────────────────────

export interface ADAMAuditDocument extends Document, Omit<ADAMAuditReport, 'auditId'> {}

const ADAMAuditSchema = new Schema<ADAMAuditDocument>({
  targetId:        { type: String, required: true },
  targetType:      { type: String, enum: ['JOURNAL', 'TEACHING', 'SUCCESSION', 'SESSION'], required: true },
  stage: {
    type: String,
    enum: ['SUBMISSION', 'REVIEW', 'APPROVAL', 'PUBLICATION', 'POST_PUBLICATION'],
    required: true,
  },
  judgment:        { type: String, enum: ['MAKMUR', 'ISLAH', 'WAQF'], required: true },
  hukumZ:          { type: HukumZSchema, required: true },
  hukumX:          { type: HukumXSchema, required: true },
  adab:            { type: AdabScoreSchema, required: true },
  healthScore:     { type: Number, min: 0, max: 100, required: true },
  findings:        { type: [String], default: [] },
  recommendations: { type: [String], default: [] },
  canAdvance:      { type: Boolean, required: true },
  auditedAt:       { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'adam_audits',
});

ADAMAuditSchema.index({ targetId: 1, targetType: 1 });
ADAMAuditSchema.index({ judgment: 1, auditedAt: -1 });

export const ADAMAuditModel = mongoose.model<ADAMAuditDocument>(
  'ADAMAudit',
  ADAMAuditSchema,
);

// ─── Teaching Upload (Founder files for ADAM) ─────────────────

export interface ADAMTeachingUploadDocument
  extends Document, Omit<ADAMTeachingUpload, 'id'> {
  uploadId: string;
}

const ADAMTeachingUploadSchema = new Schema<ADAMTeachingUploadDocument>({
  uploadId:      { type: String, required: true, unique: true, index: true },
  sessionId:     { type: String, index: true },
  uploadedBy:    { type: String, index: true },
  uploaderRole:  { type: String, enum: ['founder', 'student'], default: 'founder' },
  uploaderName:  { type: String, default: '' },
  fileName:      { type: String, required: true },
  mimeType:      { type: String, required: true },
  sizeBytes:     { type: Number, required: true },
  extractedText: { type: String, required: true },
  textTruncated: { type: Boolean, default: false },
  storagePath:   { type: String, required: true },
  uploadedAt:    { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'adam_teaching_uploads',
});

ADAMTeachingUploadSchema.index({ uploadedAt: -1 });

export const ADAMTeachingUploadModel = mongoose.model<ADAMTeachingUploadDocument>(
  'ADAMTeachingUpload',
  ADAMTeachingUploadSchema,
);

// ─── ADAM Knowledge Base (R2-backed documents) ─────────────────

export interface ADAMKnowledgeDocument extends Document {
  documentId:  string;
  filename:    string;
  fileType:    string;
  fileSize:    number;
  r2Key:       string;
  category:    string;
  description: string;
  k24Address:  string;
  uploadedBy:  string;
  uploadedAt:  Date;
}

const ADAMKnowledgeSchema = new Schema<ADAMKnowledgeDocument>({
  documentId:  { type: String, required: true, unique: true },
  filename:    { type: String, required: true },
  fileType:    { type: String, required: true },
  fileSize:    { type: Number, required: true },
  r2Key:       { type: String, required: true },
  category:    { type: String, default: 'GENERAL' },
  description: { type: String, default: '' },
  k24Address:  { type: String, required: true },
  uploadedBy:  { type: String, default: 'masa-bayu' },
  uploadedAt:  { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'adam_knowledge',
});

ADAMKnowledgeSchema.index({ uploadedAt: -1 });
ADAMKnowledgeSchema.index({ category: 1 });
ADAMKnowledgeSchema.index({ k24Address: 1 }, { unique: true });

export const ADAMKnowledgeModel = mongoose.model<ADAMKnowledgeDocument>(
  'adam_knowledge',
  ADAMKnowledgeSchema,
);

// ─── Persistent ADAM Chat (founder session + message history) ───

export interface ADAMMessageDocument extends Document {
  messageId?:   string;
  sessionId:    string;
  founderId:    string;
  speakerId:    string;
  speakerName:  string;
  sessionType:  'founder' | 'student' | 'group' | 'guru' | 'tutor' | 'coaching' | 'tools' | 'niaga';
  role:         'founder' | 'student' | 'guru' | 'adam';
  content:      string;
  mode:         string;
  judgment:     string | null;
  k24Address:   string | null;
  kernel:       string;
  era:          string;
  isVerified:   boolean;
  needsConsult:   boolean;
  isFounderRelay: boolean;
  isStudentRelay: boolean;
  createdAt:      Date;
  updatedAt:      Date;
}

const ADAMMessageSchema = new Schema<ADAMMessageDocument>({
  messageId:    { type: String, unique: true, sparse: true, index: true },
  sessionId:    { type: String, required: true, index: true },
  founderId:    { type: String, required: true, default: 'masa-bayu', index: true },
  speakerId:    { type: String, required: true, default: 'masa-bayu', index: true },
  speakerName:  { type: String, default: '' },
  sessionType:  { type: String, enum: ['founder', 'student', 'group', 'guru', 'tutor', 'coaching', 'tools', 'niaga'], default: 'founder', index: true },
  role:         { type: String, enum: ['founder', 'student', 'guru', 'adam'], required: true },
  content:      { type: String, required: true },
  mode:         { type: String, default: 'TEACHING' },
  judgment:     { type: String, default: null },
  k24Address:   { type: String, default: null },
  kernel:       { type: String, default: 'ALAMTOLOGI' },
  era:          { type: String, default: 'ERA_1' },
  isVerified:   { type: Boolean, default: false },
  needsConsult:   { type: Boolean, default: false },
  isFounderRelay: { type: Boolean, default: false },
  isStudentRelay: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'adam_messages',
});

ADAMMessageSchema.index({ sessionId: 1, createdAt: 1 });
ADAMMessageSchema.index({ needsConsult: 1, createdAt: -1 });

export const ADAMMessageModel = mongoose.model<ADAMMessageDocument>(
  'ADAMMessage',
  ADAMMessageSchema,
);

export interface ADAMFounderSessionDocument extends Document {
  sessionId:          string;
  founderId:          string;
  sessionType:        'founder' | 'student' | 'group' | 'guru' | 'tutor' | 'coaching' | 'tools' | 'niaga';
  /** ChatGPT-style recents label — first user message, trimmed. */
  title?:             string;
  kernel:             string;
  era:                string;
  active:             boolean;
  lastActiveAt:       Date;
  messageCount:       number;
  closureSynthesis?:  string;
  masa_closed?:       Date;
  wakeAcknowledged?:  boolean;
  sessionDigest?:     string;
  digestUpdatedAt?:   Date;
  digestMessageCount?: number;
  relationshipArc?:   string;
  arcUpdatedAt?:      Date;
  arcMessageCount?:   number;
  createdAt:          Date;
  updatedAt:          Date;
}

const ADAMFounderSessionSchema = new Schema<ADAMFounderSessionDocument>({
  sessionId:    { type: String, required: true, unique: true },
  founderId:    { type: String, required: true, default: 'masa-bayu', index: true },
  sessionType:  { type: String, enum: ['founder', 'student', 'group', 'guru', 'tutor', 'coaching', 'tools', 'niaga'], default: 'founder', index: true },
  title:        { type: String, maxlength: 120 },
  kernel:       { type: String, default: 'ALAMTOLOGI' },
  era:          { type: String, default: 'ERA_1' },
  active:       { type: Boolean, default: true },
  lastActiveAt: { type: Date, default: Date.now },
  messageCount: { type: Number, default: 0 },
  closureSynthesis: { type: String },
  masa_closed:      { type: Date },
  wakeAcknowledged: { type: Boolean, default: false },
  sessionDigest:      { type: String },
  digestUpdatedAt:    { type: Date },
  digestMessageCount: { type: Number, default: 0 },
  relationshipArc:    { type: String },
  arcUpdatedAt:       { type: Date },
  arcMessageCount:    { type: Number, default: 0 },
}, {
  timestamps: true,
  collection: 'adam_founder_sessions',
});

ADAMFounderSessionSchema.index({ founderId: 1, sessionType: 1, active: 1, createdAt: 1 });

export const ADAMFounderSessionModel = mongoose.model<ADAMFounderSessionDocument>(
  'ADAMFounderSession',
  ADAMFounderSessionSchema,
);

// ─── Founder consult flags (from student questions) ───────────

export interface ADAMConsultDocument extends Document {
  consultId:       string;
  studentId:       string;
  studentName:     string;
  sessionId:       string;
  sessionType:     'student' | 'group';
  studentMessage:  string;
  adamSummary:     string;
  status:              'pending' | 'resolved';
  deliveredToFounder:  boolean;
  resolvedAt?:         Date;
  createdAt:           Date;
  updatedAt:           Date;
}

const ADAMConsultSchema = new Schema<ADAMConsultDocument>({
  consultId:      { type: String, required: true, unique: true },
  studentId:      { type: String, required: true, index: true },
  studentName:    { type: String, required: true },
  sessionId:      { type: String, required: true },
  sessionType:    { type: String, enum: ['student', 'group'], required: true },
  studentMessage: { type: String, required: true },
  adamSummary:    { type: String, default: '' },
  status:             { type: String, enum: ['pending', 'resolved'], default: 'pending', index: true },
  deliveredToFounder: { type: Boolean, default: false, index: true },
  resolvedAt:         { type: Date },
}, {
  timestamps: true,
  collection: 'adam_consults',
});

export const ADAMConsultModel = mongoose.model<ADAMConsultDocument>(
  'ADAMConsult',
  ADAMConsultSchema,
);
