/**
 * ============================================================
 * Module      : ADAM Journal Publish Service
 * Transitions status from PENDING_REVIEW → PUBLISHED.
 * Auction remains NOT_STARTED (deferred to Phase 2).
 * ============================================================
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

  const publicUrl = `https://alamtologi.com/journals/${journalNumber}`;
  console.log(`[journal:publish] ${journalNumber} published — ${publicUrl}`);
  return { publishedAt, publicUrl };
}
