/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Publish Service
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
 * Transitions status PENDING_REVIEW → PUBLISHED. Auction deferred to Phase 2.
 */

import { JournalV2Model } from './adam-journal-v2.schema';

export async function publishJournalV2(
  journalNumber: string,
): Promise<{ publishedAt: Date; publicUrl: string }> {
  const journal = await JournalV2Model.findOne({ journalNumber }).lean();
  if (!journal) throw new Error(`Journal not found: ${journalNumber}`);

  if (journal.status !== 'PENDING_REVIEW') {
    throw new Error(
      `Cannot publish "${journalNumber}" — ` +
      `status is "${journal.status}", expected "PENDING_REVIEW".`,
    );
  }

  const publishedAt = new Date();
  await JournalV2Model.updateOne(
    { journalNumber },
    {
      $set: {
        status:        'PUBLISHED',
        auctionStatus: 'NOT_STARTED',
        publishedAt,
        updatedAt:     publishedAt,
      },
    },
  );

  const publicUrl = `https://qxk24.com/journals/${journalNumber}`;
  console.log(`[journal:publish] ${journalNumber} published — ${publicUrl}`);
  return { publishedAt, publicUrl };
}
