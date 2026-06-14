/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Teaching Records Backfill CLI
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Usage (from qxk24-backend root):
 *   npm run backfill:teaching-records
 *   npm run backfill:teaching-records -- --dry-run
 *   QXK24_STACK=lab npm run backfill:teaching-records
 *   MONGODB_URI='mongodb+srv://…/qxk24' npm run backfill:teaching-records
 *
 * Local .env defaults to mongodb://localhost:27017/alamtologi — often EMPTY.
 * Production brain logs live on Atlas; lab logs on qxk24_lab (VPS or .env.lab).
 */

import { ENV } from '../config/environments';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  backfillTeachingRecordsFromBrainLog,
  getTeachingRecordBackfillDiagnostics,
} from '../qxk24brain/adam-teaching-record-backfill.service';

function parseArgs(argv: string[]) {
  let dryRun = false;
  let help = false;
  let founderId = 'masa-bayu';
  let limit: number | undefined;

  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true;
    if (arg === '--help' || arg === '-h') help = true;
    if (arg.startsWith('--founder=')) founderId = arg.slice('--founder='.length);
    if (arg.startsWith('--limit=')) {
      const n = parseInt(arg.slice('--limit='.length), 10);
      if (Number.isFinite(n) && n > 0) limit = n;
    }
  }

  return { dryRun, help, founderId, limit };
}

function redactMongoUri(uri: string): string {
  return uri.replace(/:([^:@/]+)@/, ':***@');
}

function mongoDatabaseName(uri: string): string {
  const match = uri.match(/\/([^/?]+)(?:\?|$)/);
  return match?.[1] ?? '(default)';
}

function printHelp() {
  console.log(`
Teaching records backfill — qxk24brain_log → adam_teaching_records

Options:
  --dry-run          Preview only; no writes
  --founder=ID       Founder id (default: masa-bayu)
  --limit=N          Max log rows to scan
  --help             This message

Environment:
  MONGODB_URI        Target database (from .env or .env.lab)
  QXK24_STACK=lab    Load .env.lab instead of .env

Examples:
  npm run backfill:teaching-records -- --dry-run
  QXK24_STACK=lab npm run backfill:teaching-records
  MONGODB_URI='mongodb+srv://user:pass@host/qxk24' npm run backfill:teaching-records

Note: localhost/qxk24 on Mac is usually empty. Use Atlas URI for production data.
Backfill already ran on VPS — production (28 records) + lab (210 records).
`.trim());
}

async function main() {
  const { dryRun, help, founderId, limit } = parseArgs(process.argv.slice(2));

  if (help) {
    printHelp();
    process.exit(0);
  }

  const stack = process.env.QXK24_STACK ?? 'production';
  const dbName = mongoDatabaseName(ENV.MONGODB_URI);

  console.log('[backfill:teaching-records] connecting…');
  console.log(`  stack=${stack}  database=${dbName}`);
  console.log(`  uri=${redactMongoUri(ENV.MONGODB_URI)}`);

  await connectDatabase();

  const before = await getTeachingRecordBackfillDiagnostics(founderId);
  console.log(
    `[backfill:teaching-records] before: brain_log=${before.brainLogCount} ` +
    `teaching_records=${before.teachingRecordCount}`,
  );

  if (before.brainLogCount === 0) {
    console.warn('');
    console.warn('[backfill:teaching-records] ⚠️  qxk24brain_log is EMPTY on this database.');
    console.warn('  Local .env often points to mongodb://localhost:27017/alamtologi with no data.');
    console.warn('  Options:');
    console.warn('    • QXK24_STACK=lab npm run backfill:teaching-records  (.env.lab → qxk24_lab)');
    console.warn('    • MONGODB_URI=<Atlas production URI> npm run backfill:teaching-records');
    console.warn('    • Run on VPS: ssh … "cd /var/www/qxk24/backend && node dist/scripts/backfill-teaching-records.js"');
    console.warn('');
  }

  console.log(
    `[backfill:teaching-records] founder=${founderId} dryRun=${dryRun}` +
    (limit ? ` limit=${limit}` : ''),
  );

  const result = await backfillTeachingRecordsFromBrainLog(founderId, {
    dryRun,
    limit,
    skipExisting: true,
    refreshBridge: !dryRun,
  });

  const after = dryRun
    ? before
    : await getTeachingRecordBackfillDiagnostics(founderId);

  console.log(JSON.stringify({ ...result, before, after }, null, 2));

  await disconnectDatabase();
  process.exit(0);
}

main().catch((err) => {
  console.error('[backfill:teaching-records] failed:', err);
  void disconnectDatabase().finally(() => process.exit(1));
});
