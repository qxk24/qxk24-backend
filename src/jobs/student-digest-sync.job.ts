/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Student Digest Sync Job
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { initStudentRegistry } from '../adam/adam-student.service';
import { syncAllIdleStudentDigests } from '../qxk24brain/student-digest-bridge';
import { syncAllIdleStudentArcs } from '../qxk24brain/student-arc-bridge';

async function run(): Promise<void> {
  await connectDatabase();
  await initStudentRegistry();

  const [digestResult, arcResult] = await Promise.all([
    syncAllIdleStudentDigests(30),
    syncAllIdleStudentArcs(30),
  ]);

  await disconnectDatabase();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[DigestSyncJob] Fatal:', err);
    process.exit(1);
  });
