#!/usr/bin/env node
/**
 * One-time: adam_teaching_bridge MongoDB indexes (Atlas).
 * Usage: node scripts/create-teaching-bridge-indexes.mjs
 * Loads MONGODB_URI / MONGO_URI from .env in cwd.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

function loadUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  if (!fs.existsSync(envPath)) throw new Error(`Missing .env at ${envPath}`);
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => /^MONGODB_URI=|^MONGO_URI=/.test(l));
  if (!line) throw new Error('MONGODB_URI not in .env');
  return line.replace(/^MONGODB_URI=|^MONGO_URI=/, '').trim().replace(/^["']|["']$/g, '');
}

const uri = loadUri();
const client = new MongoClient(uri);

try {
  await client.connect();
  const col = client.db().collection('adam_teaching_bridge');
  await col.createIndex({ crystallisedUnitId: 1 }, { unique: true });
  await col.createIndex({ status: 1, createdAt: -1 });
  await col.createIndex({ sourceTeachingRecordId: 1 });
  const names = (await col.indexes()).map((i) => i.name);
  console.log('[indexes]', names.join(', '));
} finally {
  await client.close();
}
