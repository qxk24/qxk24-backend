/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : List ADAM Tutor Pelajar UIDs (lab helper)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { ADAMStudentAccountModel } from '../adam/adam-student.schema';
import { TutorEnrollmentModel } from '../adam/tutor/adam-tutor-enrollment.schema';
import { TutorAgentModel } from '../adam/tutor/adam-tutor-agent.schema';
import {
  TutorRegisterCodeModel,
  TutorRegisterCodeStatus,
} from '../adam/tutor/adam-tutor-register-code.schema';
import { TUTOR_TEST_AGENT_EMAIL } from '../adam/tutor/adam-tutor-test-agent.service';
import { AdamTeachingRecordModel } from '../qxk24brain/adam-teaching-record.schema';

async function main() {
  await connectDatabase();

  const agents = await TutorAgentModel.find({})
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  console.log('\n=== Tutor Agents (latest 5) ===\n');
  for (const a of agents) {
    console.log(`agentId=${a.agentId}`);
    console.log(`  email=${a.email} org=${a.orgName}`);
    console.log(`  code=${a.agentCode} package=${a.packageStatus} pins=${a.pinBalance}/${a.pinPurchasedTotal}`);
    const codes = await TutorRegisterCodeModel.countDocuments({
      agentId: a.agentId,
      status:  TutorRegisterCodeStatus.AVAILABLE,
    });
    console.log(`  available PINs=${codes}\n`);
  }

  const qa = await TutorAgentModel.findOne({ email: TUTOR_TEST_AGENT_EMAIL }).lean();
  if (qa) {
    const samplePins = await TutorRegisterCodeModel.find({
      agentId: qa.agentId,
      status:  TutorRegisterCodeStatus.AVAILABLE,
    })
      .limit(3)
      .lean();
    console.log('=== QA Test Agent PIN samples ===');
    console.log(`agentId=${qa.agentId} agentCode=${qa.agentCode}`);
    for (const p of samplePins) {
      console.log(`  PIN: ${p.registerCode} band=${p.band}`);
    }
    console.log('');
  }

  const pelajar = await ADAMStudentAccountModel.find({
    active:      true,
    accountLane: 'pelajar',
  })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  console.log(`=== Pelajar accounts (accountLane=pelajar) — ${pelajar.length} shown ===\n`);
  if (pelajar.length === 0) {
    console.log('  (tiada — daftar pelajar dengan PIN ejen atau self-register tutor)\n');
  } else {
    for (const s of pelajar) {
      const episodes = await AdamTeachingRecordModel.countDocuments({
        teacherRole:               'tutor',
        'transformMeta.studentId': s.userId,
        'transformMeta.channelLane': 'tutor',
        status:                    'active',
      });
      console.log(`userId=${s.userId}`);
      console.log(`  name=${s.name} email=${s.email ?? '—'} createdBy=${s.createdBy}`);
      console.log(`  tutorEpisodes=${episodes}\n`);
    }
  }

  const enrollments = await TutorEnrollmentModel.find({})
    .sort({ updatedAt: -1 })
    .limit(15)
    .lean();

  console.log(`=== Tutor enrollments — ${enrollments.length} shown ===\n`);
  if (enrollments.length === 0) {
    console.log('  (tiada enrollment)\n');
  } else {
    for (const e of enrollments) {
      console.log(`userId=${e.userId} status=${e.status} band=${e.band}`);
      console.log(`  name=${e.studentName ?? '—'} code=${e.registerCode} agent=${e.agentLabel ?? e.agentId}\n`);
    }
  }

  const allStudents = await ADAMStudentAccountModel.find({ active: true })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();
  console.log('=== All active student accounts (any lane) — latest 10 ===\n');
  for (const s of allStudents) {
    console.log(`userId=${s.userId} lane=${s.accountLane ?? 'umum'} name=${s.name}`);
  }

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('[list] Gagal:', err instanceof Error ? err.message : err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
