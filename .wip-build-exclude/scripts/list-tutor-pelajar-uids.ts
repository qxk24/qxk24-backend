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
  try {
    await connectDatabase();

    const agents = await TutorAgentModel.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    for (const a of agents) {

      const codes = await TutorRegisterCodeModel.countDocuments({
        agentId: a.agentId,
        status:  TutorRegisterCodeStatus.AVAILABLE,
      });

    }

    const qa = await TutorAgentModel.findOne({ email: TUTOR_TEST_AGENT_EMAIL }).lean();
    if (qa) {
      const samplePins = await TutorRegisterCodeModel.find({
        agentId: qa.agentId,
        status:  TutorRegisterCodeStatus.AVAILABLE,
      })
        .limit(3)
        .lean();

      for (const p of samplePins) {

      }

    }

    const pelajar = await ADAMStudentAccountModel.find({
      active:      true,
      accountLane: 'pelajar',
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    if (pelajar.length === 0) {

    } else {
      for (const s of pelajar) {
        const episodes = await AdamTeachingRecordModel.countDocuments({
          teacherRole:               'tutor',
          'transformMeta.studentId': s.userId,
          'transformMeta.channelLane': 'tutor',
          status:                    'active',
        });

      }
    }

    const enrollments = await TutorEnrollmentModel.find({})
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean();

    if (enrollments.length === 0) {

    } else {
      for (const e of enrollments) {

      }
    }

    const allStudents = await ADAMStudentAccountModel.find({ active: true })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    for (const s of allStudents) {

    }

    await disconnectDatabase();

  } catch (err) {
    console.error(err);
    throw err;
  }}

main().catch(async (err) => {
  try {
    console.error('[list] Gagal:', err instanceof Error ? err.message : err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);

  } catch (err) {
    console.error(err);
    throw err;
  }});
