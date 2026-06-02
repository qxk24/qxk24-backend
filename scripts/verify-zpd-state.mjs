#!/usr/bin/env node
/** Quick Atlas checks for Plas-B ZPD deploy verification (no secrets printed). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) return process.env;
  const map = { ...process.env };
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    map[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return map;
}

const env = loadEnv();
const uri = env.MONGODB_URI ?? env.MONGO_URI;
if (!uri) {
  console.error('MONGODB_URI required');
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db();

const master = await db.collection('qxk24brain_master').findOne(
  { founderId: env.FOUNDER_USER_ID ?? 'masa-bayu' },
  { projection: { studentTracks: 1 } },
);
const tracks = master?.studentTracks ?? [];
console.log('studentTracks.length:', tracks.length);

const sample = tracks.find((t) => t.studentId === 'aziz-tamhid');
console.log('aziz-tamhid:', JSON.stringify({
  constitutionalLevel: sample?.constitutionalLevel,
  masteredTopicsCount:   (sample?.masteredTopics ?? []).length,
  zpdReadiness:          sample?.zpdReadiness,
  masteredTopics:        sample?.masteredTopics,
}));

const pending = await db.collection('adam_teaching_bridge')
  .find({ state: 'pending_confirmation' })
  .project({ crystallisedUnitId: 1, unitId: 1, createdAt: 1 })
  .sort({ createdAt: -1 })
  .limit(5)
  .toArray();
console.log('pending_confirmation:', pending.length);
for (const p of pending) {
  console.log('  unit:', p.crystallisedUnitId ?? p.unitId);
}

const zpdTrue = tracks.filter((t) => t.zpdReadiness === true);
console.log('students with zpdReadiness true:', zpdTrue.map((t) => t.studentId));

const signals = await db.collection('adam_plas_growth_signals')
  .find({})
  .sort({ createdAt: -1 })
  .limit(5)
  .toArray();
console.log('growth_signals count (latest 5 shown):', signals.length);
for (const s of signals) {
  console.log('  ', s.studentId, s.signalType, s.topicKey, s.processed);
}

await client.close();
