/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Journal Finalise CLI
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
  'Published on Alamtologi — qxk24.com. ' +
  'Unauthorised reproduction is prohibited under the ' +
  'Malaysian Copyright Act 1987.';

async function main() {
  try {
    const topicArg = process.argv.find((a) => a.startsWith('--topic='))?.split('=')[1]
      ?? (process.argv.includes('--topic') ? process.argv[process.argv.indexOf('--topic') + 1] : undefined);

    const topicId = topicArg?.trim() || '3.1-thermodynamics';
    const journalNumber = 'ALM-J2026-001';

    await connectDatabase();

    const result = await finaliseJournal({
      journalNumber,
      topicId,
      source:    'founder_teaching',
      status:    'PENDING_REVIEW',
      copyright: DEFAULT_COPYRIGHT,
    });

    await disconnectDatabase();

  } catch (err) {
    console.error(err);
    throw err;
  }}

main().catch((err: unknown) => {
  console.error('[finalise:journal] FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
