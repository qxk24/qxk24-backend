#!/usr/bin/env node
/**
 * E2E Teaching Bridge verification (run on VPS with production .env).
 * Usage: node scripts/e2e-teaching-bridge.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
const { sign } = jwt;
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
const API = process.env.E2E_API_BASE ?? 'https://api.qxk24.com';

function loadEnv() {
  const raw = fs.readFileSync(envPath, 'utf8');
  const map = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    map[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return map;
}

const env = loadEnv();
const jwtSecret = env.JWT_SECRET;
const mongoUri = env.MONGODB_URI ?? env.MONGO_URI;
if (!jwtSecret || !mongoUri) {
  console.error('Missing JWT_SECRET or MONGODB_URI in .env');
  process.exit(1);
}

const token = sign(
  {
    userId:    'masa-bayu',
    role:      'founder',
    isFounder: true,
    name:      'Masa Bayu',
    kernel:    'QXK24',
    era:       'ERA_1',
  },
  jwtSecret,
  { expiresIn: '1h' },
);

const teachingMessage = [
  'Bismillahirrahmanirrahim. P.alt teaches ADAM:',
  'Fitra is the innate orientation of the soul toward truth (A).',
  'Iman is the conscious activation of that orientation toward Allah (B).',
  'Therefore Fitra and Iman are one movement — the soul knowing its Creator (C).',
  'Quran 30:30 — Set your face to the religion upright, the fitrah of Allah.',
].join('\n');

async function postTeaching() {
  const res = await fetch(`${API}/api/adam/chat/simple`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${token}`,
    },
    body: JSON.stringify({
      mode:    'TEACHING',
      message: teachingMessage,
    }),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  return { status: res.status, body };
}

async function waitForPending(client, maxSec = 180) {
  const col = client.db().collection('adam_teaching_bridge');
  const records = client.db().collection('adam_teaching_records');
  const started = Date.now();
  while (Date.now() - started < maxSec * 1000) {
    const pending = await col.findOne(
      { status: 'pending_confirmation' },
      { sort: { createdAt: -1 } },
    );
    if (pending) return pending;
    const latestRecord = await records.findOne({}, { sort: { createdAt: -1 } });
    const bridgeForRecord = latestRecord
      ? await col.findOne({ sourceTeachingRecordId: String(latestRecord._id) })
      : null;
    if (bridgeForRecord?.status === 'suspended') {
      return { suspended: bridgeForRecord };
    }
    await new Promise((r) => setTimeout(r, 5000));
    process.stdout.write('.');
  }
  return null;
}

async function confirmUnit(crystallisedUnitId) {
  const res = await fetch(`${API}/api/adam/teaching-bridge/confirm`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${token}`,
    },
    body: JSON.stringify({ crystallisedUnitId }),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  console.log('[E2E] Step 1 — founder teaching via /api/adam/chat/simple');
  const chat = await postTeaching();
  console.log('[E2E] Chat status:', chat.status);
  if (chat.status !== 200) {
    console.error('[E2E] Chat failed:', JSON.stringify(chat.body, null, 2));
    process.exit(1);
  }
  console.log('[E2E] ADAM replied (truncated):', String(chat.body?.response ?? '').slice(0, 120), '…');

  const client = new MongoClient(mongoUri);
  await client.connect();

  console.log('\n[E2E] Step 2 — waiting for adam_teaching_bridge pending (up to 180s)');
  const pending = await waitForPending(client);
  console.log('');

  if (!pending) {
    const rec = await client.db().collection('adam_teaching_records').findOne({}, { sort: { createdAt: -1 } });
    console.error('[E2E] Timeout. Latest teaching record:', rec ? rec.recordId : 'none');
    await client.close();
    process.exit(1);
  }

  if (pending.suspended) {
    console.error('[E2E] Unit suspended:', JSON.stringify(pending.suspended, null, 2));
    await client.close();
    process.exit(1);
  }

  const unitId = pending.crystallisedUnitId;
  console.log('[E2E] Pending unit:', unitId);
  console.log('[E2E] unit.level:', pending.unit?.level, 'authority:', pending.unit?.primaryAuthority);

  console.log('\n[E2E] Step 3 — confirm');
  const confirm = await confirmUnit(unitId);
  console.log('[E2E] Confirm:', confirm.status, JSON.stringify(confirm.body));

  const ku = await client.db().collection('adam_knowledge_units').findOne(
    { source: 'teaching_bridge' },
    { sort: { createdAt: -1 } },
  );
  console.log('\n[E2E] Step 4 — adam_knowledge_units:', ku ? { id: ku.id, state: ku.state, source: ku.source } : 'MISSING');

  const master = await client.db().collection('qxk24brain_master').findOne(
    { founderId: 'masa-bayu', 'studentTracks.0': { $exists: true } },
    { projection: { studentTracks: 1 } },
  );
  const tracks = master?.studentTracks ?? [];
  const withTopics = tracks.filter((t) => (t.masteredTopics?.length ?? 0) > 0);
  console.log('\n[E2E] Step 5 — student tracks with masteredTopics:', withTopics.length);
  for (const t of withTopics.slice(0, 5)) {
    console.log(`  - ${t.studentId}: level=${t.constitutionalLevel} topics=${JSON.stringify(t.masteredTopics)} zpd=${t.zpdReadiness}`);
  }

  await client.close();

  const ok = confirm.status === 200 && confirm.body?.success && ku;
  console.log(ok ? '\n[E2E] PASS' : '\n[E2E] FAIL');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
