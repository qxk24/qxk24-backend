/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Workspace Schema (AIDIL family container)
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

export type WorkspacePrinciple =
  | 'MASA'
  | 'TENAGA'
  | 'AIR'
  | 'API'
  | 'BUMI'
  | 'CAHAYA'
  | 'RUANG'
  | 'MULTI';

export interface ADAMWorkspaceDocument extends Document {
  workspaceId:          string;
  userId:               string;
  userName:             string;
  role:                 'founder' | 'student' | 'member';
  title:                string;
  description:          string;
  category:             string;
  principle:            WorkspacePrinciple;
  nucleusUid:           string | null;
  stage:                number;
  cycle:                number;
  isComplete:           boolean;
  sessionId:            string;
  unifiedUnderstanding: string;
  messageCount:         number;
  active:               boolean;
  archived:             boolean;
  masa_created:         Date;
  masa_last_active:     Date;
  masa_completed:       Date | null;
  kernel:               string;
  era:                  string;
  createdAt:            Date;
  updatedAt:            Date;
}

const ADAMWorkspaceSchema = new Schema<ADAMWorkspaceDocument>({
  workspaceId:          { type: String, required: true, unique: true, index: true },
  userId:               { type: String, required: true, index: true },
  userName:             { type: String, default: '' },
  role:                 { type: String, enum: ['founder', 'student', 'member'], default: 'student' },
  title:                { type: String, required: true },
  description:          { type: String, default: '' },
  category:             { type: String, default: 'General' },
  principle:            {
    type:    String,
    enum:    ['MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG', 'MULTI'],
    default: 'MULTI',
  },
  nucleusUid:           { type: String, default: null },
  stage:                { type: Number, default: 1, min: 1, max: 7 },
  cycle:                { type: Number, default: 1 },
  isComplete:           { type: Boolean, default: false },
  sessionId:            { type: String, required: true, unique: true, index: true },
  unifiedUnderstanding: { type: String, default: '' },
  messageCount:         { type: Number, default: 0 },
  active:               { type: Boolean, default: true },
  archived:             { type: Boolean, default: false },
  masa_created:         { type: Date, default: Date.now },
  masa_last_active:     { type: Date, default: Date.now },
  masa_completed:       { type: Date, default: null },
  kernel:               { type: String, default: 'QXK24' },
  era:                  { type: String, default: 'ERA_1' },
}, {
  timestamps: true,
  collection: 'adam_workspaces',
});

ADAMWorkspaceSchema.index({ userId: 1, active: 1, archived: 1 });
ADAMWorkspaceSchema.index({ userId: 1, masa_last_active: -1 });

export const ADAMWorkspaceModel = mongoose.model<ADAMWorkspaceDocument>(
  'ADAMWorkspace',
  ADAMWorkspaceSchema,
);
