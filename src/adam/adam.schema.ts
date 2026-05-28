// ============================================================
// QXK24 ADAM Teaching Engine — MongoDB Schemas
// File: src/adam/adam.schema.ts
// Version: 1.0.0
// Author: QXK24 Constitutional Kernel
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
}, {
  timestamps: true,
  collection: 'adam_journals',
});

ADAMJournalSchema.index({ status: 1, submittedAt: -1 });
ADAMJournalSchema.index({ judgment: 1 });
ADAMJournalSchema.index({ journalNumber: 1 });

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
