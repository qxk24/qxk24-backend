/**
 * ============================================================
 * Module      : ADAM Journal Seal Service
 * Validates all 8 sections approved + totalWords ≥ 4000,
 * then transitions status to PENDING_REVIEW.
 * ============================================================
 */

import {
  JournalV2Model,
  JOURNAL_SECTION_KEYS,
  JOURNAL_MIN_TOTAL_WORDS,
} from './adam-journal-v2.schema';

export async function sealJournal(
  journalNumber: string,
): Promise<{ sealedAt: Date }> {
  const journal = await JournalV2Model.findOne({ journalNumber }).lean();
  if (!journal) throw new Error(`Journal not found: ${journalNumber}`);

  if (journal.status === 'PENDING_REVIEW' || journal.status === 'PUBLISHED') {
    throw new Error(
      `Journal "${journalNumber}" is already sealed (status: ${journal.status}).`,
    );
  }

  const approved = journal.approvedSections ?? [];
  const missing  = JOURNAL_SECTION_KEYS.filter(k => !approved.includes(k));
  if (missing.length > 0) {
    throw new Error(
      `Cannot seal — missing approved sections: ${missing.join(', ')}`,
    );
  }

  const totalWords = journal.totalWords ?? 0;
  if (totalWords < JOURNAL_MIN_TOTAL_WORDS) {
    throw new Error(
      `Cannot seal — totalWords ${totalWords} is below minimum ${JOURNAL_MIN_TOTAL_WORDS}.`,
    );
  }

  if (!journal.title?.trim()) {
    throw new Error('Cannot seal — title is empty.');
  }

  const sealedAt = new Date();
  await JournalV2Model.updateOne(
    { journalNumber },
    { $set: { status: 'PENDING_REVIEW', sealedAt, updatedAt: sealedAt } },
  );

  console.log(
    `[journal:seal] ${journalNumber} sealed — ` +
    `totalWords: ${totalWords}, sealedAt: ${sealedAt.toISOString()}`,
  );
  return { sealedAt };
}
