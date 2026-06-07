/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Journal Finalise CLI
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
 *
 * Usage:
 *   npm run finalise:journal
 *   npm run finalise:journal -- --topic 3.1-thermodynamics
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { finaliseJournal } from '../adam/adam-journal-finalise';

const DEFAULT_COPYRIGHT =
  '© 2026 QIUBBX Technologies (M) Sdn Bhd. ' +
  'All rights reserved. Alamtologi is the proprietary ' +
  'knowledge system of QIUBBX Technologies (M) Sdn Bhd, ' +
  'founded and developed by Masa Bayu. ' +
  'Published on Alamtologi — alamtologi.com. ' +
  'Unauthorised reproduction is prohibited under the ' +
  'Malaysian Copyright Act 1987.';

async function main() {
  const topicArg = process.argv.find((a) => a.startsWith('--topic='))?.split('=')[1]
    ?? (process.argv.includes('--topic') ? process.argv[process.argv.indexOf('--topic') + 1] : undefined);

  const topicId = topicArg?.trim() || '3.1-thermodynamics';
  const journalNumber = 'ALM-J2026-001';

  await connectDatabase();

  console.log(`\n[finalise:journal] Sealing ${journalNumber} for topic ${topicId}…\n`);

  const result = await finaliseJournal({
    journalNumber,
    topicId,
    source:    'founder_teaching',
    status:    'PENDING_REVIEW',
    copyright: DEFAULT_COPYRIGHT,
  });

  console.log(JSON.stringify({
    idempotent:  result.idempotent,
    id:          result.journal.id,
    journalNumber: result.journal.journalNumber,
    topicId:     result.journal.topicId ?? result.journal.knowledgeTopicId,
    sessionId:   result.journal.sessionId ?? result.journal.sourceSessionId,
    source:      result.journal.source,
    status:      result.journal.status,
    totalWords:  result.totalWords,
    copyright:   result.journal.copyright?.slice(0, 80) + '…',
    title:       result.journal.title,
  }, null, 2));

  console.log('\nMongoDB verify:\n');
  console.log(`db.adam_journals.findOne(
  { journalNumber: "${journalNumber}" },
  {
    journalNumber: 1,
    topicId: 1,
    source: 1,
    sessionId: 1,
    status: 1,
    totalWords: 1,
    createdAt: 1,
    copyright: 1,
    _id: 0
  }
)`);

  await disconnectDatabase();
}

main().catch((err: unknown) => {
  console.error('[finalise:journal] FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
