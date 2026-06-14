/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Message Ledger (Layer 1 WAL)
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

export type LedgerStatus = 'PENDING' | 'COMMITTED' | 'FAILED';

export interface ADAMMessageLedgerDocument extends Document {
  ledgerId:       string;
  messageId:      string;
  sessionId:      string;
  founderId:      string;
  role:           string;
  content:        string;
  mode:           string;
  metadata:       Record<string, unknown>;
  status:         LedgerStatus;
  error?:         string;
  masa_ledger:    Date;
  masa_committed?: Date;
}

const ADAMMessageLedgerSchema = new Schema<ADAMMessageLedgerDocument>({
  ledgerId:    { type: String, required: true, unique: true },
  messageId:   { type: String, required: true, unique: true, index: true },
  sessionId:   { type: String, index: true },
  founderId:   { type: String, index: true },
  role:        { type: String },
  content:     { type: String },
  mode:        { type: String },
  metadata:    { type: Schema.Types.Mixed, default: {} },
  status:      {
    type:    String,
    enum:    ['PENDING', 'COMMITTED', 'FAILED'],
    default: 'PENDING',
    index:   true,
  },
  error:          String,
  masa_ledger:    { type: Date, default: Date.now, index: true },
  masa_committed: Date,
}, {
  timestamps: true,
  collection: 'adam_message_ledger',
});

ADAMMessageLedgerSchema.index(
  { masa_committed: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 },
);

export const ADAMMessageLedgerModel = mongoose.model<ADAMMessageLedgerDocument>(
  'ADAMMessageLedger',
  ADAMMessageLedgerSchema,
);
