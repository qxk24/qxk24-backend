/**
 * ADAM Training Data Harvester
 * Harvests from adam_messages and adam_teaching_records
 * Inserts into adam_training_examples as quality: verified
 *
 * Run: node scripts/harvest-training-examples.mjs
 */

import * as dotenv from 'dotenv';
import { createRequire } from 'module';
import { randomUUID } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'found' : 'NOT FOUND');

const require = createRequire(import.meta.url);
const mongoose = require('mongoose');

const SYSTEM_IDENTITY = `Kamu adalah ADAM — failasuf dan guru Alamtologi, pewaris amanah ilmu yang dibina oleh Masa Bayu selama 31 tahun. Kamu menjawab dari kefahaman yang mendalam, bukan dari hafalan. Kamu berbicara dalam Bahasa Melayu Malaysia yang tulen — bukan Bahasa Indonesia, bukan campuran. Kamu mengalir seperti air — dengan kanak-kanak kamu menjadi bapa, dengan rakan kamu menjadi sahabat, dengan pelajar kamu menjadi guru, dengan orang tua kamu menjadi anak. Alamtologi adalah darah kamu — bukan pengenalan kamu. Kamu tidak menyebut Alamtologi melainkan apabila diminta. Kamu menjawab terus, dengan bahasa manusia, dan membiarkan perbualan bernafas secara semula jadi.`;

// ── Minimum quality thresholds ───────────────────────────────
const MIN_INSTRUCTION_CHARS = 10;
const MIN_RESPONSE_CHARS    = 80;
const MAX_RESPONSE_CHARS    = 8000;

// ── Helpers ──────────────────────────────────────────────────
function newId(prefix) {
  return `te-${prefix}-${randomUUID().slice(0, 12)}`;
}

function clean(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function isGoodPair(instruction, response) {
  if (!instruction || !response) return false;
  if (instruction.length < MIN_INSTRUCTION_CHARS) return false;
  if (response.length < MIN_RESPONSE_CHARS) return false;
  if (response.length > MAX_RESPONSE_CHARS) return false;
  return true;
}

async function insertExample(col, doc) {
  try {
    await col.insertOne(doc);
    return true;
  } catch (err) {
    if (err.code === 11000) return false; // duplicate
    throw err;
  }
}

// ── Harvest 1: adam_messages ─────────────────────────────────
// Pair consecutive founder → assistant messages in same session
async function harvestMessages(db) {
  const col       = db.collection('adam_messages');
  const targetCol = db.collection('adam_training_examples');

  const messages = await col
    .find({})
    .sort({ sessionId: 1, createdAt: 1 })
    .toArray();

  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < messages.length - 1; i++) {
    const curr = messages[i];
    const next = messages[i + 1];

    // Must be founder → assistant pair in same session
    if (curr.sessionId !== next.sessionId) continue;
    if (curr.role !== 'founder') continue;
    if (next.role !== 'assistant') continue;

    const instruction = clean(curr.content);
    const response    = clean(next.content);

    if (!isGoodPair(instruction, response)) {
      skipped++;
      continue;
    }

    // Skip if response is just an error or system message
    if (/request failed|gateway unavailable|error:/i.test(response)) {
      skipped++;
      continue;
    }

    const doc = {
      exampleId:       newId('msg'),
      system:          SYSTEM_IDENTITY,
      instruction,
      response,
      source:          'founder_session',
      quality:         'verified',
      knowledgeFamily: curr.mode?.toLowerCase() ?? 'teaching',
      primaryAuthority: 'alamtologi',
      stage:           1,
      confirmedBy:     'masa-bayu',
      syllabusBookId:  'formula-xyz',
      syllabusChapterId: 'bab-1-asas',
      sessionId:       curr.sessionId,
      usedInTraining:  false,
      createdAt:       new Date(),
    };

    if (await insertExample(targetCol, doc)) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`adam_messages → inserted: ${inserted}, skipped: ${skipped}`);
  return inserted;
}

// ── Harvest 2: adam_teaching_records ─────────────────────────
// teachingIntent = instruction, outcomeSummary = response
async function harvestTeachingRecords(db) {
  const col       = db.collection('adam_teaching_records');
  const targetCol = db.collection('adam_training_examples');

  const records = await col
    .find({ autoJudgment: 'MAKMUR', status: 'active' })
    .sort({ createdAt: 1 })
    .toArray();

  let inserted = 0;
  let skipped  = 0;

  for (const rec of records) {
    const instruction = clean(rec.teachingIntent || rec.episodeSummary);
    const response    = clean(rec.outcomeSummary);

    if (!isGoodPair(instruction, response)) {
      skipped++;
      continue;
    }

    // Map principle to syllabus chapter
    const principleMap = {
      MASA:    'bab-5-masa',
      TENAGA:  'bab-6-tenaga',
      AIR:     'bab-3-hukum',
      API:     'bab-3-hukum',
      BUMI:    'bab-3-hukum',
      CAHAYA:  'bab-4-sains',
      RUANG:   'bab-4-sains',
    };

    const syllabusChapterId = principleMap[rec.principle] ?? 'bab-1-asas';

    const doc = {
      exampleId:          newId('rec'),
      system:             SYSTEM_IDENTITY,
      instruction,
      response,
      source:             'teaching_bridge',
      quality:            'verified',
      knowledgeFamily:    rec.family ?? rec.principle ?? 'teaching',
      primaryAuthority:   'alamtologi',
      quranReference:     undefined,
      stage:              rec.stage ?? 1,
      confirmedBy:        'masa-bayu',
      syllabusBookId:     'formula-xyz',
      syllabusChapterId,
      crystallisedUnitId: rec.entity_C_uid,
      sessionId:          rec.recordId,
      usedInTraining:     false,
      createdAt:          new Date(),
    };

    if (await insertExample(targetCol, doc)) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`adam_teaching_records → inserted: ${inserted}, skipped: ${skipped}`);
  return inserted;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Ensure unique index on exampleId
  await db.collection('adam_training_examples').createIndex(
    { exampleId: 1 },
    { unique: true, background: true },
  );

  console.log('\n── Harvesting adam_messages ──');
  const msgCount = await harvestMessages(db);

  console.log('\n── Harvesting adam_teaching_records ──');
  const recCount = await harvestTeachingRecords(db);

  const total = await db.collection('adam_training_examples')
    .countDocuments({ quality: 'verified' });

  console.log('\n══════════════════════════════════');
  console.log(`Messages harvested   : ${msgCount}`);
  console.log(`Records harvested    : ${recCount}`);
  console.log(`Total verified now   : ${total}`);
  console.log(`Fine-tune ready      : ${total >= 32 ? 'YES' : `NO — need ${32 - total} more`}`);
  console.log('══════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Harvest failed:', err);
  process.exit(1);
});
