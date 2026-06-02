/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Student Digest Sync Job (PM2 cron)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Pattern B fallback: sync idle student session digests every 30 minutes.
 * Run: node dist/jobs/student-digest-sync.job.js
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { initStudentRegistry } from '../adam/adam-student.service';
import { syncAllIdleStudentDigests } from '../qxk24brain/student-digest-bridge';

async function run(): Promise<void> {
  await connectDatabase();
  await initStudentRegistry();

  console.log('[DigestSyncJob] Connected — syncing idle student digests');
  const result = await syncAllIdleStudentDigests(30);
  console.log(`[DigestSyncJob] Complete: ${result.synced}/${result.processed} synced`);

  await disconnectDatabase();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[DigestSyncJob] Fatal:', err);
    process.exit(1);
  });
