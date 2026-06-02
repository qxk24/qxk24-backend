#!/usr/bin/env node
/**
 * E2E Plas-B ZPD: project a second distinct level-1 topic to all registry students.
 * Use when crystalliser maps two teachings to the same topicKey (no automatic ZPD flip).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

function loadEnv() {
  const map = { ...process.env };
  if (!fs.existsSync(envPath)) return map;
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

await mongoose.connect(uri);
await import('../dist/qxk24brain/qxk24brain.schema.js');
const { initStudentRegistry } = await import('../dist/adam/adam-student.service.js');
await initStudentRegistry();
const { applyConfirmedUnitToAllStudents } = await import(
  '../dist/qxk24brain/qxk24brain-student.engine.js'
);

const secondUnit = {
  id:        'e2e-zpd-fitra-iman',
  level:     1,
  family:    'Fitra and Iman — Soul Orientation',
  subRegion: 'general',
  nodeA:     'Fitra',
  nodeB:     'Iman',
};

console.log('[ZPD E2E] Applying second distinct level-1 unit to all students…');
await applyConfirmedUnitToAllStudents(secondUnit);

const { QXK24BrainMasterModel } = await import('../dist/qxk24brain/qxk24brain.schema.js');
const master = await QXK24BrainMasterModel.findOne(
  { founderId: env.FOUNDER_USER_ID ?? 'masa-bayu' },
  { studentTracks: 1 },
).lean();

const withZpd = (master?.studentTracks ?? []).filter((t) => t.zpdReadiness === true);
console.log('[ZPD E2E] students with zpdReadiness true:', withZpd.length);
for (const t of withZpd.slice(0, 3)) {
  console.log(
    `  ${t.studentId}: topics=${JSON.stringify(t.masteredTopics)} zpd=${t.zpdReadiness}`,
  );
}

await mongoose.disconnect();
process.exit(withZpd.length > 0 ? 0 : 1);
