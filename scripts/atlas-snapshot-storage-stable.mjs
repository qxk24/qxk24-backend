#!/usr/bin/env node
/**
 * One-shot: delete SUPERSEDED snapshots, ensure TTL indexes, compact, audit.
 *
 *   node scripts/atlas-snapshot-storage-stable.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile() {
  for (const name of ['.env', '.env.production']) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvFile();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ Set MONGODB_URI');
  process.exit(1);
}

const supersededTtlHours = parseInt(process.env.ADAM_SNAPSHOT_SUPERSEDED_TTL_HOURS ?? '24', 10) || 24;
const restoredTtlHours = parseInt(process.env.ADAM_SNAPSHOT_RESTORED_TTL_HOURS ?? '168', 10) || 168;

async function audit(db, label) {
  const stats = await db.command({ collStats: 'adam_brain_snapshots', scale: 1024 * 1024 });
  const byStatus = await db.collection('adam_brain_snapshots').aggregate([
    { $group: { _id: '$status', n: { $sum: 1 } } },
  ]).toArray();
  console.log(`\n📊 ${label}`);
  console.log(`   storage: ${stats.storageSize?.toFixed?.(2) ?? stats.storageSize} MB, docs: ${stats.count}`);
  for (const row of byStatus) console.log(`   ${row._id}: ${row.n}`);
  const indexes = await db.collection('adam_brain_snapshots').indexes();
  const ttl = indexes.filter((ix) => ix.expireAfterSeconds != null);
  console.log(`   TTL indexes: ${ttl.length}`);
  for (const ix of ttl) {
    console.log(`     ${ix.name} expireAfterSeconds=${ix.expireAfterSeconds}`);
  }
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const col = db.collection('adam_brain_snapshots');

  await audit(db, 'Before');

  const del = await col.deleteMany({ status: 'SUPERSEDED' });
  console.log(`\n▶ Deleted SUPERSEDED: ${del.deletedCount}`);

  await col.createIndex(
    { masa_superseded: 1 },
    { expireAfterSeconds: supersededTtlHours * 60 * 60, name: 'masa_superseded_ttl' },
  );
  await col.createIndex(
    { masa_restored: 1 },
    {
      expireAfterSeconds: restoredTtlHours * 60 * 60,
      name: 'masa_restored_ttl',
      partialFilterExpression: { status: 'RESTORED' },
    },
  );
  console.log(`▶ TTL policy: SUPERSEDED ${supersededTtlHours}h, RESTORED ${restoredTtlHours}h`);

  try {
    const compact = await db.command({ compact: 'adam_brain_snapshots' });
    console.log('▶ Compact:', compact.ok === 1 ? 'ok' : compact);
  } catch (err) {
    console.warn('▶ Compact skipped (Atlas tier may not allow):', err.message);
  }

  await audit(db, 'After — storage stable');
  console.log('\n✅ Storage stable pass complete.\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
