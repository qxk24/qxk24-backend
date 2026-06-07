/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal V2 Schema (Dedicated Writing System)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

// ── Section keys (canonical order) ───────────────────────────

export const JOURNAL_SECTION_KEYS = [
  'abstract',
  'movement_1_human_opening',
  'movement_2_achievement',
  'movement_3_honest_wall',
  'movement_4_alamtologi_framework',
  'movement_5_application',
  'movement_6_invitation',
  'references',
] as const;

export type JournalSectionKey = typeof JOURNAL_SECTION_KEYS[number];

// ── Minimum word count per section ───────────────────────────

export const SECTION_MIN_WORDS: Record<JournalSectionKey, number> = {
  abstract:                         150,
  movement_1_human_opening:         400,
  movement_2_achievement:           600,
  movement_3_honest_wall:           600,
  movement_4_alamtologi_framework:  700,
  movement_5_application:           500,
  movement_6_invitation:            250,
  references:                        50,
};

export const JOURNAL_MIN_TOTAL_WORDS = 4000;

// ── Status types ──────────────────────────────────────────────

export type JournalV2Status =
  | 'TITLE_DRAFT'
  | 'TITLE_APPROVED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type JournalAuctionStatus =
  | 'NOT_STARTED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'TRANSFERRED';

// ── Mongoose Document interface ───────────────────────────────

export interface JournalV2Document extends Document {
  // Identity
  journalNumber:    string;
  topicId:          string;
  majorId:          string;
  disciplineId:     string;
  disciplineLabel:  string;
  subfield:         string;

  // Authorship
  author:           string;
  organisation:     string;
  copyright:        string;

  // Title
  title:            string;
  subtitle:         string;

  // Technology
  technologyName:        string;
  technologyDescription: string;

  // Content
  sections:         Partial<Record<JournalSectionKey, string>>;
  approvedSections: JournalSectionKey[];
  totalWords:       number;

  // Session
  writingSessionId: string;
  founderUserId:    string;

  // Lifecycle
  status:           JournalV2Status;
  titleApprovedAt:  Date | null;
  sealedAt:         Date | null;
  publishedAt:      Date | null;

  // Auction (placeholder — bidding deferred)
  auctionStatus:       JournalAuctionStatus;
  auctionDurationHours: number;
  auctionStartedAt:    Date | null;
  auctionClosedAt:     Date | null;
  winningBidMYR:       number | null;
  winnerUserId:        string | null;

  // Timestamps (from mongoose)
  createdAt: Date;
  updatedAt: Date;
}

// ── Mongoose Schema ───────────────────────────────────────────

const sectionsSchema = new Schema(
  Object.fromEntries(
    JOURNAL_SECTION_KEYS.map(k => [k, { type: String, default: '' }]),
  ),
  { _id: false },
);

const JournalV2Schema = new Schema<JournalV2Document>(
  {
    // Identity
    journalNumber:   { type: String, unique: true, sparse: true, index: true },
    topicId:         { type: String, required: true, index: true },
    majorId:         { type: String, required: true, index: true },
    disciplineId:    { type: String, required: true },
    disciplineLabel: { type: String, default: '' },
    subfield:        { type: String, default: '' },

    // Authorship
    author:       { type: String, default: 'Masa Bayu' },
    organisation: { type: String, default: 'QIUBBX Technologies (M) Sdn Bhd' },
    copyright:    { type: String, default: '' },

    // Title
    title:    { type: String, default: '' },
    subtitle: { type: String, default: '' },

    // Technology
    technologyName:        { type: String, default: '' },
    technologyDescription: { type: String, default: '' },

    // Content
    sections:         { type: sectionsSchema, default: () => ({}) },
    approvedSections: { type: [String], default: [] },
    totalWords:       { type: Number, default: 0 },

    // Session
    writingSessionId: { type: String, default: '' },
    founderUserId:    { type: String, required: true },

    // Lifecycle
    status:          { type: String, default: 'TITLE_DRAFT', index: true },
    titleApprovedAt: { type: Date, default: null },
    sealedAt:        { type: Date, default: null },
    publishedAt:     { type: Date, default: null, index: true },

    // Auction
    auctionStatus:        { type: String, default: 'NOT_STARTED' },
    auctionDurationHours: { type: Number, default: 44 },
    auctionStartedAt:     { type: Date, default: null },
    auctionClosedAt:      { type: Date, default: null },
    winningBidMYR:        { type: Number, default: null },
    winnerUserId:         { type: String, default: null },
  },
  {
    timestamps:  true,
    collection:  'adam_journals',
  },
);

JournalV2Schema.index({ majorId: 1, disciplineId: 1 });
JournalV2Schema.index({ status: 1, publishedAt: -1 });

export const JournalV2Model = mongoose.model<JournalV2Document>(
  'JournalV2',
  JournalV2Schema,
);
