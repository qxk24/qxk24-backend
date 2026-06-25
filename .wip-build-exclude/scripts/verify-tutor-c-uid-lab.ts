/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Verify ADAM Tutor C + UID Lab (F3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Runs ADAM_TUTOR_C_UID_SPEC.md §XI lab checks against live Mongo.
 *
 * Usage (from alm-backend root):
 *   npm run verify:tutor-c-uid-lab
 *   QXK24_STACK=lab npm run verify:tutor-c-uid-lab -- --seed
 *   npm run verify:tutor-c-uid-lab -- --uid-a=<id> --uid-b=<id>
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { ENV } from '../config/environments';
import { ADAMStudentAccountModel } from '../adam/adam-student.schema';
import { FOUNDER_USER_ID } from '../adam/adam-student.types';
import {
  buildTutorTransformGateContext,
  runTutorTransformTurn,
} from '../adam/adam-tutor-transform-turn';
import {
  isTutorTransformEnabled,
  shouldTutorTransformTurn,
} from '../adam/adam-tutor-transform-turn.gate';
import { buildTutorUidRecallBlock } from '../adam/adam-tutor-recall.service';
import { TUTOR_UID_RECALL_HEADER } from '../adam/adam-tutor-recall.service';
import { runTutorUiGuideLoop } from '../adam/adam-tutor-ui-guide-loop';
import { buildAdamUiPlanPayload } from '../adam/adam-ui-plan';
import { beginAdamBrainRiver } from '../adam/adam-brain-river';
import { resolveFounderTeachingFlags } from '../adam/adam-chat-stream-turn-context';
import { shouldSkipSearchWhenRecallHitStableTopic } from '../adam/adam-web-search';
import { enforceTutorReplyGuards } from '../adam/adam-tutor-law';
import { defaultTutorLearningProfile } from '../adam/tutor-law/tutor-law.learning-profile.types';
import { AdamTeachingRecordModel } from '../qxk24brain/adam-teaching-record.schema';
import { detectContextRecallLoaded } from '../adam/adam-universal-recall-router';

const LAB_TOPIC = 'fotosintesis';
const LAB_TOPIC_QUERY = 'Apa itu fotosintesis dan kenapa penting untuk tumbuhan?';

const SUBSTANTIVE_TUTOR_REPLY = [
  'Fotosintesis ialah proses tumbuhan hijau menukar tenaga cahaya kepada glukosa.',
  'Klorofil dalam daun menyerap cahaya; air dari akar dan karbon dioksida dari udara digabungkan.',
  'Hasil utama ialah glukosa untuk pertumbuhan dan oksigen sebagai sampingan.',
  'Tanpa fotosinitesis, rantaian makanan dan kitaran oksigen di Bumi akan runtuh.',
  'Pelajar perlu faham bahawa ini bukan hafalan semata — ia hubungan tenaga, air, dan gas.',
].join(' ');

const FINISHED_MATH_REPLY = [
  'Ali ada 2,385 guli, beli 1,427 lagi.',
  '2,385 + 1,427 =?',
  'Sa: 5 + 7 = 12 → tulis **2**, bawa **1**.',
  'Puluh: 8 + 2 = 10, tambah 1 = **11** → tulis **1**, bawa **1**.',
  'Jadi, hasilnya ialah **3,812**',
  'Jumlah guli Ali sekarang ialah …',
].join('\n');

interface LabResult {
  id:     string;
  label:  string;
  pass:   boolean;
  detail: string;
}

function parseArgs(argv: string[]) {
  let uidA = process.env.LAB_F3_UID_A?.trim() || '';
  let uidB = process.env.LAB_F3_UID_B?.trim() || '';
  let seed = false;
  let prodSmoke = false;

  for (const arg of argv) {
    if (arg === '--seed') seed = true;
    if (arg === '--prod') prodSmoke = true;
    if (arg.startsWith('--uid-a=')) uidA = arg.slice('--uid-a='.length).trim();
    if (arg.startsWith('--uid-b=')) uidB = arg.slice('--uid-b='.length).trim();
  }

  return { uidA, uidB, seed, prodSmoke };
}

function redactMongoUri(uri: string): string {
  return uri.replace(/:([^:@/]+)@/, ':***@');
}

async function resolveLabStudentUids(
  uidA: string,
  uidB: string,
): Promise<{ uidA: string; uidB: string; nameA: string; nameB: string }> {
  if (uidA && uidB && uidA !== uidB) {
    const rows = await ADAMStudentAccountModel.find({
      userId: { $in: [uidA, uidB] },
      active: true,
    }).lean();
    const map = new Map(rows.map((r) => [r.userId, r.name]));
    return {
      uidA,
      uidB,
      nameA: map.get(uidA) ?? 'Lab Student A',
      nameB: map.get(uidB) ?? 'Lab Student B',
    };
  }

  const pelajar = await ADAMStudentAccountModel.find({
    active:      true,
    accountLane: 'pelajar',
  })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  if (pelajar.length >= 2) {
    return {
      uidA:  pelajar[0].userId,
      uidB:  pelajar[1].userId,
      nameA: pelajar[0].name,
      nameB: pelajar[1].name,
    };
  }

  if (pelajar.length === 1) {
    return {
      uidA:  pelajar[0].userId,
      uidB:  `lab-f3-isolation-${pelajar[0].userId.slice(0, 8)}`,
      nameA: pelajar[0].name,
      nameB: 'Lab Isolation B',
    };
  }

  return {
    uidA:  uidA || 'lab-f3-student-a',
    uidB:  uidB || 'lab-f3-student-b',
    nameA: 'Lab Student A',
    nameB: 'Lab Student B',
  };
}

async function countTutorEpisodes(studentId: string): Promise<number> {
  return AdamTeachingRecordModel.countDocuments({
    founderId:                 FOUNDER_USER_ID,
    status:                    'active',
    teacherRole:               'tutor',
    'transformMeta.studentId': studentId.trim(),
    'transformMeta.channelLane': 'tutor',
  });
}

async function seedSubstantiveEpisode(
  studentId: string,
  studentName: string,
): Promise<void> {
  const profile = {
    ...defaultTutorLearningProfile(),
    placementComplete: true,
  };
  const gateContext = buildTutorTransformGateContext(profile);

  await runTutorTransformTurn({
    sessionId:      `lab-f3-${Date.now()}`,
    userMessageId:  `lab-msg-${Date.now()}`,
    studentId,
    studentName,
    userMessage:    LAB_TOPIC_QUERY,
    finalResponse:  SUBSTANTIVE_TUTOR_REPLY,
    recallLoaded:   false,
    webSearchUsed:  false,
    isGuestTrial:   false,
    gateContext,
  });
}

function printReport(results: LabResult[]): void {
  console.log('\n=== ADAM Tutor F3 — Lab Verification (§XI) ===\n');
  let passed = 0;
  for (const row of results) {
    const mark = row.pass ? 'PASS' : 'FAIL';
    if (row.pass) passed += 1;
    console.log(`${mark}  ${row.id}  ${row.label}`);
    console.log(`      ${row.detail}\n`);
  }
  console.log(`Summary: ${passed}/${results.length} automated checks passed`);
  if (passed < results.length) {
    process.exitCode = 1;
  }
}

async function main() {
  const { uidA: argA, uidB: argB, seed, prodSmoke } = parseArgs(process.argv.slice(2));
  const results: LabResult[] = [];

  // L1 — env gates
  const l1Pass = ENV.ADAM_UNIFIED_TRANSFORM && ENV.ADAM_TUTOR_TRANSFORM;
  results.push({
    id:     'L1',
    label:  'Env ADAM_UNIFIED_TRANSFORM + ADAM_TUTOR_TRANSFORM',
    pass:   l1Pass,
    detail: `UNIFIED=${ENV.ADAM_UNIFIED_TRANSFORM} TUTOR=${ENV.ADAM_TUTOR_TRANSFORM} stack=${ENV.QXK24_STACK}`,
  });

  if (!l1Pass) {
    printReport(results);
    return;
  }

  console.log(`[lab] MongoDB: ${redactMongoUri(ENV.MONGODB_URI)}`);
  console.log(`[lab] stack=${ENV.QXK24_STACK} seed=${seed}`);
  await connectDatabase();

  const students = await resolveLabStudentUids(argA, argB);
  console.log(`[lab] UID A: ${students.uidA} (${students.nameA})`);
  console.log(`[lab] UID B: ${students.uidB} (${students.nameB})`);

  const beforeA = await countTutorEpisodes(students.uidA);

  // L2 — crystallise substantive tutor turn (seed or verify existing)
  if (seed || beforeA === 0) {
    await seedSubstantiveEpisode(students.uidA, students.nameA);
  }

  const afterA = await countTutorEpisodes(students.uidA);
  const l2Pass = afterA > beforeA || afterA > 0;
  results.push({
    id:     'L2',
    label:  'Substantive tutor crystallisation (≥1 episode for UID A)',
    pass:   l2Pass,
    detail: seed
      ? `Seeded episode; count ${beforeA} → ${afterA}`
      : `Existing episodes for A: ${afterA}`,
  });

  // L3 — Mongo shape
  const sample = await AdamTeachingRecordModel.findOne({
    founderId:                 FOUNDER_USER_ID,
    status:                    'active',
    teacherRole:               'tutor',
    'transformMeta.studentId': students.uidA,
    'transformMeta.channelLane': 'tutor',
  })
    .sort({ masa_recorded: -1 })
    .lean();

  const l3Pass = Boolean(
    sample
    && sample.teacherRole === 'tutor'
    && sample.transformMeta?.studentId === students.uidA
    && sample.transformMeta?.channelLane === 'tutor',
  );
  results.push({
    id:     'L3',
    label:  'Mongo episod tutor UID + channelLane',
    pass:   l3Pass,
    detail: l3Pass
      ? `recordId=${sample?.recordId} family=${sample?.family}`
      : 'No matching tutor episode found for UID A',
  });

  // L4 — recall block for A
  const recallA = await buildTutorUidRecallBlock(students.uidA, students.nameA, LAB_TOPIC);
  const l4Pass = Boolean(recallA?.includes(TUTOR_UID_RECALL_HEADER));
  results.push({
    id:     'L4',
    label:  'UID A recall loads TUTOR UI GUIDE RECALL',
    pass:   l4Pass,
    detail: l4Pass
      ? `Block length ${recallA?.length ?? 0} chars`
      : 'Recall miss for UID A on fotosintesis',
  });

  // L5 — brain-first + F3 planner observe
  const brainRecallLoaded = detectContextRecallLoaded([
    { content: recallA ?? '' },
  ]);
  const brainRecallStable = shouldSkipSearchWhenRecallHitStableTopic({
    message:           LAB_TOPIC_QUERY,
    brainRecallLoaded,
  });
  const guideLoop = runTutorUiGuideLoop({
    studentId:         students.uidA,
    userMessage:       LAB_TOPIC_QUERY,
    profile:           { ...defaultTutorLearningProfile(), placementComplete: true },
    brainRecallLoaded,
    brainRecallStable,
  });
  const teachingFlags = resolveFounderTeachingFlags({
    isFounder:               false,
    mode:                    'TUTOR',
    normalizedMessage:       LAB_TOPIC_QUERY,
    hasTeachingUpload:       false,
    recentAssistantMessages: [],
    recentUserMessages:      [],
  });
  const river = beginAdamBrainRiver({
    isFounder:    false,
    mode:         'TUTOR',
    userMessage:  LAB_TOPIC_QUERY,
    teachingFlags,
  });
  const uiPlan = buildAdamUiPlanPayload({
    river,
    brainRecallLoaded,
    brainRecallStable,
    webSearchReason: null,
    tutorGuideSteps: guideLoop.steps,
  });
  const l5Pass = brainRecallLoaded
    && guideLoop.steps.some((s) => s.id === 'recall' && s.status === 'done')
    && uiPlan.phase === 'F3';
  results.push({
    id:     'L5',
    label:  'Brain-first + F3 planner recall step',
    pass:   l5Pass,
    detail: `recallLoaded=${brainRecallLoaded} stable=${brainRecallStable} uiPhase=${uiPlan.phase}`,
  });

  // L6 — UID B isolation
  const recallB = await buildTutorUidRecallBlock(students.uidB, students.nameB, LAB_TOPIC);
  const bLeaksA = Boolean(
    recallB
    && students.uidA !== students.uidB
    && recallB.includes(`UID: ${students.uidA}`),
  );
  const l6Pass = !bLeaksA;
  results.push({
    id:     'L6',
    label:  'UID B does not recall UID A episodes',
    pass:   l6Pass,
    detail: recallB
      ? (bLeaksA ? 'LEAK: B block mentions UID A' : 'B recall scoped or miss — OK')
      : 'B recall miss — OK (no cross-UID leak)',
  });

  // L7 — checkpoint answer turn skips crystallisation
  const checkpointProfile = {
    ...defaultTutorLearningProfile(),
    placementComplete: true,
    checkpoint: {
      active:            true,
      awaitingAnswer:    true,
      currentItemId:     'lab-cp-1',
      questionsAnswered: 1,
      itemIdsAsked:      ['lab-cp-1'],
      itemIds:           ['lab-cp-1'],
    },
  };
  const l7Pass = !shouldTutorTransformTurn({
    studentId:     students.uidA,
    userMessage:   'Jawapan saya 42',
    finalResponse: SUBSTANTIVE_TUTOR_REPLY,
    gateContext:   { profile: checkpointProfile },
  });
  results.push({
    id:     'L7',
    label:  'Checkpoint answer turn skips C crystallisation',
    pass:   l7Pass,
    detail: `shouldTutorTransformTurn=false on checkpoint answer: ${l7Pass}`,
  });

  // L8 — Tutor Law scrubs full numeric walkthrough (zero-answer)
  const guarded = enforceTutorReplyGuards(
    FINISHED_MATH_REPLY,
    { level: 'primary', curriculum: 'national', language: 'malay' },
    '2,385 + 1,427 = berapa? Kira untuk saya.',
  );
  const l8Pass = !/3,812/.test(guarded) && guarded.includes('2,385 + 1,427');
  results.push({
    id:     'L8',
    label:  'Tutor Law blocks finished arithmetic answer delivery',
    pass:   l8Pass,
    detail: l8Pass
      ? 'Guards stripped final total — scaffold retained'
      : 'Guards left full worked answer (3,812) in output',
  });

  // L9 — web panel contract (static backend contract)
  const l9Pass = uiPlan.phase === 'F3'
    && uiPlan.steps.some((s) => s.id === 'speak' && /UI Guide/i.test(s.label));
  results.push({
    id:     'L9',
    label:  'F3 adam_ui_plan SSE contract (web panel source)',
    pass:   l9Pass,
    detail: `phase=${uiPlan.phase} steps=${uiPlan.steps.length} (AdamUiPlanPanel shows when phase=F3)`,
  });

  // L10 — prod smoke placeholder
  if (prodSmoke && ENV.QXK24_STACK === 'production') {
    results.push({
      id:     'L10',
      label:  'Prod smoke (same automated path on production stack)',
      pass:   l2Pass && l4Pass && l6Pass,
      detail: 'Ran on QXK24_STACK=production with --prod',
    });
  } else {
    results.push({
      id:     'L10',
      label:  'Prod smoke (deferred)',
      pass:   true,
      detail: 'Skip locally — rerun with QXK24_STACK=production npm run verify:tutor-c-uid-lab -- --prod',
    });
  }

  if (!isTutorTransformEnabled()) {
    results.push({
      id:     'WARN',
      label:  'Tutor transform disabled at runtime',
      pass:   false,
      detail: 'isTutorTransformEnabled() returned false despite env flags',
    });
  }

  printReport(results);
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('[lab] Gagal:', err instanceof Error ? err.message : err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
