/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : LLM Pipeline Bootstrap Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  FORMULA_XYZ_BOOK_ID,
  FORMULA_XYZ_SYLLABUS,
} from './formula-xyz-syllabus';
import {
  ADAM_TRAINING_SYSTEM_IDENTITY,
  CONSTITUTIONAL_SEED_EXAMPLES,
} from './constitutional-seeds';
import { TrainingExampleModel } from './training-example.schema';
import { SyllabusProgressModel } from './syllabus-progress.schema';

let initPromise: Promise<void> | null = null;

export async function initLlmPipeline(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = bootstrapLlmPipeline();
  return initPromise;
}

async function bootstrapLlmPipeline(): Promise<void> {
  for (const chapter of FORMULA_XYZ_SYLLABUS) {
    const defaultStatus = chapter.chapterId === 'bab-3-hukum'
      ? 'crystallised'
      : 'pending';

    await SyllabusProgressModel.updateOne(
      { chapterId: chapter.chapterId },
      {
        $setOnInsert: {
          bookId:       chapter.bookId,
          chapterId:    chapter.chapterId,
          title:        chapter.titleBm,
          sortOrder:    chapter.sortOrder,
          status:       defaultStatus,
          exampleCount: 0,
        },
      },
      { upsert: true },
    );
  }

  for (const seed of CONSTITUTIONAL_SEED_EXAMPLES) {
    await TrainingExampleModel.updateOne(
      { exampleId: seed.exampleId },
      {
        $setOnInsert: {
          exampleId:          seed.exampleId,
          system:             ADAM_TRAINING_SYSTEM_IDENTITY,
          instruction:        seed.instruction,
          response:           seed.response,
          source:             seed.source,
          quality:            'verified',
          knowledgeFamily:    seed.knowledgeFamily,
          primaryAuthority:   seed.primaryAuthority,
          stage:              1,
          confirmedBy:        'masa-bayu',
          syllabusBookId:     FORMULA_XYZ_BOOK_ID,
          syllabusChapterId:  seed.syllabusChapterId,
          usedInTraining:     false,
        },
      },
      { upsert: true },
    );
  }

  console.log(
    `[LLM Pipeline] Syllabus ${FORMULA_XYZ_SYLLABUS.length} chapters · ` +
    `${CONSTITUTIONAL_SEED_EXAMPLES.length} constitutional seeds`,
  );
}
