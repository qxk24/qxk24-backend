/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Student Post-Session Sync Job (PM2 cron)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Pattern B fallback: sync idle student digests + relationship arcs every 30 minutes.
 * Run: node dist/jobs/student-post-session-sync.job.js
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { initStudentRegistry } from '../adam/adam-student.service';
import { syncAllIdleStudentDigests } from '../qxk24brain/student-digest-bridge';
import { syncAllIdleStudentArcs } from '../qxk24brain/student-arc-bridge';

async function run(): Promise<void> {
  await connectDatabase();
  await initStudentRegistry();

  console.log('[PostSessionSyncJob] Connected — syncing idle student post-session work');

  const [digestResult, arcResult] = await Promise.all([
    syncAllIdleStudentDigests(30),
    syncAllIdleStudentArcs(30),
  ]);

  console.log(
    `[PostSessionSyncJob] Digest: ${digestResult.synced}/${digestResult.processed} | ` +
      `Arc: ${arcResult.synced}/${arcResult.processed}`,
  );

  await disconnectDatabase();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[PostSessionSyncJob] Fatal:', err);
    process.exit(1);
  });
