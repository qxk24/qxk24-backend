/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Seed Lab Tutor Pelajar Pair (F3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  createStudentAccount,
  getStudentAccount,
} from '../adam/adam-student-registry.service';
import { defaultTutorLearningProfile } from '../adam/tutor-law/tutor-law.learning-profile.types';
import { saveTutorLearningProfile } from '../adam/adam-tutor-learning-profile.service';

const LAB_PAIR = [
  { userId: 'lab-pelajar-a', name: 'Lab Pelajar A' },
  { userId: 'lab-pelajar-b', name: 'Lab Pelajar B' },
] as const;

const LAB_PASSWORD = 'LabPelajarF3!2026';

async function main() {
  await connectDatabase();

  for (const row of LAB_PAIR) {
    const existing = await getStudentAccount(row.userId);
    if (existing) {
      console.log(`[seed] exists: ${row.userId} (${existing.name})`);
      continue;
    }

    await createStudentAccount({
      userId:      row.userId,
      name:        row.name,
      password:    LAB_PASSWORD,
      createdBy:   'seed:lab-pelajar-pair',
      accountRole: 'student',
      accountLane: 'pelajar',
    });

    const profile = {
      ...defaultTutorLearningProfile(),
      placementComplete: true,
    };
    await saveTutorLearningProfile(row.userId, profile);

    console.log(`[seed] created: ${row.userId} lane=pelajar placementComplete=true`);
  }

  console.log('\nLab pelajar login (local):');
  for (const row of LAB_PAIR) {
    console.log(`  userId=${row.userId} password=${LAB_PASSWORD}`);
  }

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('[seed] Gagal:', err instanceof Error ? err.message : err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
