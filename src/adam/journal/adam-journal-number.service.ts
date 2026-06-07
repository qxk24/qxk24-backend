/**
 * ============================================================
 * Module      : ADAM Journal Number Generator
 * Generates atomic, sequential journal numbers per year.
 * e.g. ALM-J2026-001, ALM-J2026-002 ...
 * ============================================================
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
