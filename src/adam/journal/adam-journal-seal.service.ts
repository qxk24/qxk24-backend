/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Seal Service
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
 * Validates all 9 sections approved + totalWords ≥ 4000 → PENDING_REVIEW.
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

  return { sealedAt };
}
