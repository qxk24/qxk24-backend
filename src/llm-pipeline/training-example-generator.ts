/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Training Example Generator
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

import { randomUUID } from 'node:crypto';
import {
  FORMULA_XYZ_BOOK_ID,
  resolveSyllabusChapter,
} from './formula-xyz-syllabus';
import {
  ADAM_TRAINING_SYSTEM_IDENTITY,
} from './constitutional-seeds';
import {
  TrainingExampleModel,
  type TrainingExampleQuality,
  type TrainingExampleSource,
} from './training-example.schema';
import { SyllabusProgressModel } from './syllabus-progress.schema';

export interface CrystallisedUnitInput {
  crystallisedUnitId: string;
  nodeA:              string;
  nodeB?:             string;
  relationship?:      string;
  synthesis:          string;
  founderTeaching?:   string;
  adamReflection?:    string;
  family:             string;
  subRegion?:         string;
  primaryAuthority:   string;
  quranReference?:    string;
  level:              number;
  confirmedBy:        string;
  maqasidDimensions?: string[];
}

function pickResponse(unit: CrystallisedUnitInput): string {
  const text = unit.synthesis?.trim()
    || unit.founderTeaching?.trim()
    || unit.adamReflection?.trim();
  return text || `Dalam Alamtologi, ${unit.nodeA} perlu difahami melalui Q sebagai penimbang, Z sebagai medan rujukan, dan perjalanan X menuju Y.`;
}

function newExampleId(prefix: string): string {
  return `te-${prefix}-${randomUUID().slice(0, 12)}`;
}

interface TrainingExampleInsert {
  exampleId:          string;
  system:             string;
  instruction:        string;
  response:           string;
  source:             TrainingExampleSource;
  quality:            TrainingExampleQuality;
  knowledgeFamily:    string;
  primaryAuthority:   string;
  quranReference?:    string;
  stage:              number;
  confirmedBy:        string;
  syllabusBookId?:    string;
  syllabusChapterId?: string;
  crystallisedUnitId?: string;
  usedInTraining:     boolean;
}

async function insertExample(doc: TrainingExampleInsert): Promise<boolean> {
  try {
    await TrainingExampleModel.create(doc);
    return true;
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 11000) return false;
    throw err;
  }
}

async function bumpSyllabusChapter(chapterId: string, inserted: number): Promise<void> {
  if (inserted <= 0) return;

  const row = await SyllabusProgressModel.findOne({ chapterId }).lean();
  if (!row) return;

  const nextCount = (row.exampleCount ?? 0) + inserted;
  let status = row.status;
  if (nextCount >= 3) {
    status = 'training_ready';
  } else if (nextCount > 0 && status === 'pending') {
    status = 'in_progress';
  }

  await SyllabusProgressModel.updateOne(
    { chapterId },
    { $set: { exampleCount: nextCount, status } },
  );
}

/** Reconcile example counts + training_ready from verified training examples. */
export async function syncSyllabusProgressFromExamples(): Promise<void> {
  const { TrainingExampleModel } = await import('./training-example.schema');
  const agg = await TrainingExampleModel.aggregate([
    { $match: { quality: 'verified', syllabusChapterId: { $exists: true, $ne: '' } } },
    { $group: { _id: '$syllabusChapterId', count: { $sum: 1 } } },
  ]);

  for (const row of agg) {
    const chapterId = String(row._id);
    const nextCount = Number(row.count) || 0;
    const doc = await SyllabusProgressModel.findOne({ chapterId }).lean();
    if (!doc) continue;

    let status = doc.status;
    if (nextCount >= 3) {
      status = 'training_ready';
    } else if (nextCount > 0 && status === 'pending') {
      status = 'in_progress';
    }

    await SyllabusProgressModel.updateOne(
      { chapterId },
      { $set: { exampleCount: nextCount, status } },
    );
  }
}

export async function generateTrainingExamplesFromUnit(
  unit: CrystallisedUnitInput,
): Promise<number> {
  const syllabusChapterId = resolveSyllabusChapter({
    family:    unit.family,
    subRegion: unit.subRegion,
    nodeA:     unit.nodeA,
    level:     unit.level,
  });
  const response = pickResponse(unit);
  const base = {
    system:             ADAM_TRAINING_SYSTEM_IDENTITY,
    source:             'teaching_bridge' as const,
    quality:            'verified' as const,
    knowledgeFamily:    unit.family,
    primaryAuthority:   unit.primaryAuthority,
    quranReference:     unit.quranReference,
    stage:              unit.level,
    confirmedBy:        unit.confirmedBy,
    syllabusBookId:     FORMULA_XYZ_BOOK_ID,
    syllabusChapterId,
    crystallisedUnitId: unit.crystallisedUnitId,
    usedInTraining:     false,
  };

  const drafts: TrainingExampleInsert[] = [
    {
      ...base,
      exampleId:   newExampleId('def'),
      instruction: `Apakah yang dimaksudkan dengan ${unit.nodeA} dalam Alamtologi?`,
      response,
    },
  ];

  if (unit.nodeB?.trim()) {
    const rel = unit.relationship?.trim() || 'bergabung';
    drafts.push({
      ...base,
      exampleId:   newExampleId('rel'),
      instruction: `Bagaimana hubungan antara ${unit.nodeA} dan ${unit.nodeB} dalam Alamtologi? Apakah yang terhasil?`,
      response:    `Dalam Alamtologi, ${unit.nodeA} dan ${unit.nodeB} tidak berdiri berasingan. Apabila keduanya bertemu — ${rel} — kefahaman lengkap terbentuk. ${response}`,
    });
  }

  if (unit.quranReference?.trim()) {
    drafts.push({
      ...base,
      exampleId:        newExampleId('qur'),
      instruction:      `Apakah asas Al-Quran bagi konsep ${unit.nodeA} dalam Alamtologi?`,
      response:         `Dalam Alamtologi, setiap konsep mesti berakar pada Al-Quran (Q). Bagi ${unit.nodeA}, asasnya: ${unit.quranReference}. ${response} Ini memurnikan ilmu — bukan menolak soalan, tetapi melengkapkan pautan yang hilang kepada wahyu.`,
      primaryAuthority: 'quran',
    });
  }

  if (unit.maqasidDimensions && unit.maqasidDimensions.length > 0) {
    drafts.push({
      ...base,
      exampleId:   newExampleId('app'),
      instruction: `Bagaimana ${unit.nodeA} boleh diaplikasikan dalam kehidupan seharian?`,
      response:    `${response} Dimensi Maqasid: ${unit.maqasidDimensions.join(', ')}.`,
    });
  }

  let inserted = 0;
  for (const doc of drafts) {
    if (await insertExample(doc)) inserted++;
  }

  await bumpSyllabusChapter(syllabusChapterId, inserted);

  if (inserted > 0) {

  }

  return inserted;
}

export async function exportDatasetAsJsonl(): Promise<string> {
  const examples = await TrainingExampleModel
    .find({ quality: 'verified' })
    .sort({ createdAt: 1 })
    .lean();

  return examples.map((ex) => JSON.stringify({
    system:      ex.system,
    instruction: ex.instruction,
    response:    ex.response,
    metadata: {
      source:            ex.source,
      knowledgeFamily:   ex.knowledgeFamily,
      primaryAuthority:  ex.primaryAuthority,
      quranReference:    ex.quranReference,
      stage:             ex.stage,
      confirmedBy:       ex.confirmedBy,
      syllabusBookId:    ex.syllabusBookId,
      syllabusChapterId: ex.syllabusChapterId,
    },
  })).join('\n');
}

export interface LlmPipelineStats {
  total:               number;
  usedInTraining:      number;
  remaining:           number;
  syllabusCompleteness: number;
  syllabus: {
    bookId:           string;
    chaptersTotal:    number;
    chaptersTaught:   number;
    chaptersReady:    number;
    chapters:         Array<{
      chapterId:    string;
      title:        string;
      status:       string;
      exampleCount: number;
    }>;
  };
  bySource:            Record<string, number>;
  byFamily:            Record<string, number>;
  finetuneReady:       boolean;
  message:             string;
}

let lastSyllabusSync = 0;
const SYLLABUS_SYNC_MS = 60_000;

export async function getDatasetStats(): Promise<LlmPipelineStats> {
  const now = Date.now();
  if (now - lastSyllabusSync > SYLLABUS_SYNC_MS) {
    lastSyllabusSync = now;
    await syncSyllabusProgressFromExamples().catch((err) => {
      console.error('[LLM Pipeline] syncSyllabusProgressFromExamples:', err);
    });
  }

  const total = await TrainingExampleModel.countDocuments({ quality: 'verified' });
  const usedInTraining = await TrainingExampleModel.countDocuments({
    quality: 'verified',
    usedInTraining: true,
  });

  const bySourceAgg = await TrainingExampleModel.aggregate([
    { $match: { quality: 'verified' } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
  ]);
  const byFamilyAgg = await TrainingExampleModel.aggregate([
    { $match: { quality: 'verified' } },
    { $group: { _id: '$knowledgeFamily', count: { $sum: 1 } } },
  ]);

  const chapters = await SyllabusProgressModel.find({ bookId: FORMULA_XYZ_BOOK_ID })
    .sort({ sortOrder: 1 })
    .lean();

  const chaptersTotal = chapters.length;
  const chaptersTaught = chapters.filter((c) => c.status !== 'pending').length;
  const chaptersReady = chapters.filter((c) => c.status === 'training_ready').length;
  const syllabusCompleteness = chaptersTotal > 0
    ? Math.round((chaptersTaught / chaptersTotal) * 100)
    : 0;

  const finetuneReady = chaptersReady === chaptersTotal && chaptersTotal > 0;

  let message: string;
  if (finetuneReady) {
    message = 'Formula XYZ selesai — sedia untuk fine-tuning Alamtologi LLM';
  } else if (chaptersTaught === 0) {
    message = 'Peringkat awal — teruskan mengajar mengikut silibus';
  } else if (syllabusCompleteness < 50) {
    message = 'Sedang berkembang — silibus Formula XYZ belum separuh siap';
  } else if (syllabusCompleteness < 100) {
    message = 'Hampir siap — bab-bab berbaki perlu training_ready';
  } else {
    message = 'Teruskan mengajar';
  }

  return {
    total,
    usedInTraining,
    remaining: total - usedInTraining,
    syllabusCompleteness,
    syllabus: {
      bookId:        FORMULA_XYZ_BOOK_ID,
      chaptersTotal,
      chaptersTaught,
      chaptersReady,
      chapters: chapters.map((c) => ({
        chapterId:    c.chapterId,
        title:        c.title,
        status:       c.status,
        exampleCount: c.exampleCount ?? 0,
      })),
    },
    bySource: Object.fromEntries(bySourceAgg.map((s) => [String(s._id), s.count])),
    byFamily: Object.fromEntries(byFamilyAgg.map((f) => [String(f._id), f.count])),
    finetuneReady,
    message,
  };
}
