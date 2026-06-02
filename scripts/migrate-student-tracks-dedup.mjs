#!/usr/bin/env node
/**
 * One-time: consolidate duplicate studentTracks rows per studentId.
 * Usage:
 *   node scripts/migrate-student-tracks-dedup.mjs
 *   DRY_RUN=false node scripts/migrate-student-tracks-dedup.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

function loadEnv() {
  if (process.env.MONGODB_URI) return;
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;
const FOUNDER_ID = process.env.FOUNDER_USER_ID ?? 'masa-bayu';
const DRY_RUN = process.env.DRY_RUN !== 'false';

async function run() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI required');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const col = client.db().collection('qxk24brain_master');
  const master = await col.findOne({ founderId: FOUNDER_ID });

  if (!master) {
    console.log('No master document found.');
    await client.close();
    return;
  }

  const tracks = master.studentTracks ?? [];
  console.log(`Total rows before dedup: ${tracks.length}`);

  const grouped = {};
  for (const t of tracks) {
    if (!grouped[t.studentId]) grouped[t.studentId] = [];
    grouped[t.studentId].push(t);
  }

  const deduped = [];
  let mergedCount = 0;

  for (const [studentId, rows] of Object.entries(grouped)) {
    if (rows.length === 1) {
      deduped.push(rows[0]);
      continue;
    }

    const base = rows.reduce((a, b) =>
      (b.masteredTopics?.length ?? 0) > (a.masteredTopics?.length ?? 0) ? b : a,
    );

    const allTopics = [...new Set(rows.flatMap((r) => r.masteredTopics ?? []))];
    const allQuestions = [...new Set(rows.flatMap((r) => r.openQuestions ?? []))];
    const maxLevel = Math.max(...rows.map((r) => r.constitutionalLevel ?? 1));
    const maxTransform = Math.max(...rows.map((r) => r.transformationCount ?? 0));
    const anyZpd = rows.some((r) => r.zpdReadiness === true);
    const latestSummary = rows
      .filter((r) => r.lastSessionSummary)
      .sort(
        (a, b) =>
          new Date(b.masa_last_updated ?? 0).getTime() -
          new Date(a.masa_last_updated ?? 0).getTime(),
      )[0]?.lastSessionSummary ?? '';

    deduped.push({
      ...base,
      masteredTopics:      allTopics,
      openQuestions:       allQuestions,
      constitutionalLevel: maxLevel,
      transformationCount: maxTransform,
      zpdReadiness:        anyZpd,
      lastSessionSummary:  latestSummary,
      masa_last_updated:   new Date(),
    });

    mergedCount++;
    console.log(`Merged ${rows.length} rows for studentId: ${studentId}`);
  }

  console.log(`Total rows after dedup: ${deduped.length} (merged ${mergedCount} studentIds)`);

  if (DRY_RUN) {
    console.log('DRY RUN — no writes. Set DRY_RUN=false to apply.');
  } else {
    await col.updateOne(
      { founderId: FOUNDER_ID },
      { $set: { studentTracks: deduped, masa_last_updated: new Date() } },
    );
    console.log('Migration complete. studentTracks deduped and written.');
  }

  await client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
