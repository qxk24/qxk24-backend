/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Kelas, Lane, Membership, Invitation
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

export const GURU_LANE_DIGEST_MAX_CHARS = 8_000;

export interface AdamGuruKelasDocument extends Document {
  kelasId:    string;
  guruId:     string;
  guruName:   string;
  title:      string;
  subject:    string;
  sessionId:  string;
  /** Short code students use to request joining this kelas. */
  joinCode:   string;
  active:     boolean;
  /** When false, ADAM listens silently — messages logged, no speech until wake (still monitors session). */
  adamAwake:  boolean;
  createdAt:  Date;
  updatedAt:  Date;
}

const AdamGuruKelasSchema = new Schema<AdamGuruKelasDocument>({
  kelasId:   { type: String, required: true, unique: true, index: true },
  guruId:    { type: String, required: true, index: true },
  guruName:  { type: String, required: true },
  title:     { type: String, required: true },
  subject:   { type: String, required: true, default: '' },
  sessionId: { type: String, required: true, unique: true, index: true },
  joinCode:  { type: String, default: '' },
  active:    { type: Boolean, default: true, index: true },
  adamAwake: { type: Boolean, default: true },
}, { timestamps: true, collection: 'adam_guru_kelas' });

AdamGuruKelasSchema.index({ joinCode: 1 }, { unique: true, sparse: true });

export const AdamGuruKelasModel = mongoose.model<AdamGuruKelasDocument>(
  'AdamGuruKelas',
  AdamGuruKelasSchema,
);

export interface AdamGuruLaneDocument extends Document {
  kelasId:     string;
  guruId:      string;
  guruName:    string;
  subject:     string;
  laneDigest:  string;
  topicTags:   string[];
  teachCount:  number;
  updatedAt:   Date;
  createdAt:   Date;
}

const AdamGuruLaneSchema = new Schema<AdamGuruLaneDocument>({
  kelasId:    { type: String, required: true, unique: true, index: true },
  guruId:     { type: String, required: true, index: true },
  guruName:   { type: String, required: true },
  subject:    { type: String, default: '' },
  laneDigest: { type: String, default: '' },
  topicTags:  { type: [String], default: [] },
  teachCount: { type: Number, default: 0 },
}, { timestamps: true, collection: 'adam_guru_lanes' });

export const AdamGuruLaneModel = mongoose.model<AdamGuruLaneDocument>(
  'AdamGuruLane',
  AdamGuruLaneSchema,
);

export interface AdamGuruMemberDocument extends Document {
  kelasId:   string;
  userId:    string;
  userName:  string;
  role:      'guru' | 'student';
  joinedAt:  Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdamGuruMemberSchema = new Schema<AdamGuruMemberDocument>({
  kelasId:  { type: String, required: true, index: true },
  userId:   { type: String, required: true, index: true },
  userName: { type: String, required: true },
  role:     { type: String, enum: ['guru', 'student'], required: true },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'adam_guru_members' });

AdamGuruMemberSchema.index({ kelasId: 1, userId: 1 }, { unique: true });

export const AdamGuruMemberModel = mongoose.model<AdamGuruMemberDocument>(
  'AdamGuruMember',
  AdamGuruMemberSchema,
);

export type GuruInvitationStatus = 'pending' | 'accepted' | 'revoked';

export interface AdamGuruInvitationDocument extends Document {
  inviteId:       string;
  kelasId:        string;
  guruId:         string;
  inviteeUserId:  string;
  inviteeName:    string;
  token:          string;
  status:         GuruInvitationStatus;
  createdAt:      Date;
  updatedAt:      Date;
}

const AdamGuruInvitationSchema = new Schema<AdamGuruInvitationDocument>({
  inviteId:      { type: String, required: true, unique: true, index: true },
  kelasId:       { type: String, required: true, index: true },
  guruId:        { type: String, required: true, index: true },
  inviteeUserId: { type: String, required: true, index: true },
  inviteeName:   { type: String, required: true },
  token:         { type: String, required: true, unique: true, index: true },
  status:        { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
}, { timestamps: true, collection: 'adam_guru_invitations' });

export const AdamGuruInvitationModel = mongoose.model<AdamGuruInvitationDocument>(
  'AdamGuruInvitation',
  AdamGuruInvitationSchema,
);

export type GuruJoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AdamGuruJoinRequestDocument extends Document {
  requestId:      string;
  kelasId:        string;
  guruId:         string;
  studentUserId:  string;
  studentName:    string;
  message:        string;
  status:         GuruJoinRequestStatus;
  createdAt:      Date;
  updatedAt:      Date;
}

const AdamGuruJoinRequestSchema = new Schema<AdamGuruJoinRequestDocument>({
  requestId:     { type: String, required: true, unique: true, index: true },
  kelasId:       { type: String, required: true, index: true },
  guruId:        { type: String, required: true, index: true },
  studentUserId: { type: String, required: true, index: true },
  studentName:   { type: String, required: true },
  message:       { type: String, default: '' },
  status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true, collection: 'adam_guru_join_requests' });

AdamGuruJoinRequestSchema.index(
  { kelasId: 1, studentUserId: 1, status: 1 },
);

export const AdamGuruJoinRequestModel = mongoose.model<AdamGuruJoinRequestDocument>(
  'AdamGuruJoinRequest',
  AdamGuruJoinRequestSchema,
);
