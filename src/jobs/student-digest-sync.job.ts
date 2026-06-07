/**
 * @deprecated Use student-post-session-sync.job.js — kept for one deploy cycle compatibility.
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

  console.log(
    `[DigestSyncJob] Digest: ${digestResult.synced}/${digestResult.processed} | ` +
      `Arc: ${arcResult.synced}/${arcResult.processed}`,
  );

  await disconnectDatabase();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[DigestSyncJob] Fatal:', err);
    process.exit(1);
  });
