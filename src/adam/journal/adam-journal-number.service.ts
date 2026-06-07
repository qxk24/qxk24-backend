/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Number Generator
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Generates atomic, sequential journal numbers per year (e.g. QXK24-J2026-001).
 */

import mongoose from 'mongoose';

const SequenceSchema = new mongoose.Schema(
  {
    year:         { type: Number, required: true, unique: true },
    lastSequence: { type: Number, default: 0 },
    createdAt:    { type: Date, default: () => new Date() },
  },
  { collection: 'adam_journal_sequences' },
);

const JournalSequenceModel =
  mongoose.models['JournalSequence'] ??
  mongoose.model('JournalSequence', SequenceSchema);

export async function generateJournalNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const result = await JournalSequenceModel.findOneAndUpdate(
    { year },
    { $inc: { lastSequence: 1 } },
    { upsert: true, new: true },
  ).lean() as { lastSequence: number } | null;

  if (!result) {
    throw new Error('[journal:number] Sequence generation failed');
  }

  const seq = String(result.lastSequence).padStart(3, '0');
  const journalNumber = `ALM-J${year}-${seq}`;

  console.log(`[journal:number] Generated: ${journalNumber}`);
  return journalNumber;
}
