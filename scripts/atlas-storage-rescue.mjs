#!/usr/bin/env node
/**
 * Atlas M0 storage rescue — audit collection sizes and optionally purge safe tiers.
 *
 * Usage (from qxk24-backend, with MONGODB_URI in env or .env):
 *   node scripts/atlas-storage-rescue.mjs              # audit only
 *   node scripts/atlas-storage-rescue.mjs --execute logs,ledger,snapshots
 *   node scripts/atlas-storage-rescue.mjs --execute chat-legacy --days 30
 *
 * Tiers (safe → aggressive):
 *   logs          — qxk24brain_log, adam_brain_backup_log, adam_integrity_scans
 *   ledger        — adam_message_ledger (committed >7d)
 *   snapshots     — adam_brain_snapshots ACTIVE only (keep newest 2)
 *   superseded    — delete all SUPERSEDED snapshots + ensure TTL indexes
 *   uploads       — adam_teaching_uploads older than --days (default 14)
 *   chat-legacy   — inactive adam_chat_sessions older than --days (embedded messages)
 *   journals-draft — DRAFT/REJECTED journals older than --days
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
  console.error('❌ Set MONGODB_URI (or add to qxk24-backend/.env)');
  process.exit(1);
}

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const tierArg = args.find((a) => a.startsWith('--tiers='))?.slice(8)
  ?? (execute ? args[args.indexOf('--execute') + 1] : null);
const tiers = tierArg ? tierArg.split(',').map((t) => t.trim()).filter(Boolean) : [];
const days = Number(args.find((a) => a.startsWith('--days='))?.slice(7) ?? 30);

async function collectionStats(db) {
  const names = await db.listCollections().toArray();
  const rows = [];
  for (const { name } of names) {
    try {
      const s = await db.command({ collStats: name, scale: 1024 * 1024 });
      rows.push({
        name,
        mb:     Math.round((s.storageSize ?? s.size ?? 0) * 100) / 100,
        count:  s.count ?? 0,
        avgObj: s.avgObjSize ? Math.round(s.avgObjSize / 1024) : 0,
      });
    } catch {
      rows.push({ name, mb: 0, count: 0, avgObj: 0 });
    }
  }
  return rows.sort((a, b) => b.mb - a.mb);
}

async function purgeLogs(db) {
  const cols = ['qxk24brain_log', 'adam_brain_backup_log', 'adam_integrity_scans'];
  let total = 0;
  for (const c of cols) {
    const r = await db.collection(c).deleteMany({});
    total += r.deletedCount;
    console.log(`   ${c}: deleted ${r.deletedCount}`);
  }
  return total;
}

async function purgeLedger(db) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const r = await db.collection('adam_message_ledger').deleteMany({
    status: 'COMMITTED',
    masa_committed: { $lt: cutoff },
  });
  console.log(`   adam_message_ledger (committed >7d): deleted ${r.deletedCount}`);
  return r.deletedCount;
}

async function purgeSuperseded(db) {
  const r = await db.collection('adam_brain_snapshots').deleteMany({ status: 'SUPERSEDED' });
  console.log(`   adam_brain_snapshots SUPERSEDED: deleted ${r.deletedCount}`);
  const ttlH = parseInt(process.env.ADAM_SNAPSHOT_SUPERSEDED_TTL_HOURS ?? '24', 10) || 24;
  const col = db.collection('adam_brain_snapshots');
  await col.createIndex(
    { masa_superseded: 1 },
    { expireAfterSeconds: ttlH * 60 * 60, name: 'masa_superseded_ttl' },
  );
  const restoredH = parseInt(process.env.ADAM_SNAPSHOT_RESTORED_TTL_HOURS ?? '168', 10) || 168;
  await col.createIndex(
    { masa_restored: 1 },
    {
      expireAfterSeconds: restoredH * 60 * 60,
      name: 'masa_restored_ttl',
      partialFilterExpression: { status: 'RESTORED' },
    },
  );
  console.log(`   TTL indexes ensured (SUPERSEDED ${ttlH}h, RESTORED ${restoredH}h)`);
  return r.deletedCount;
}

async function purgeSnapshots(db) {
  await db.collection('adam_brain_snapshots').deleteMany({ status: 'SUPERSEDED' });
  const col = db.collection('adam_brain_snapshots');
  const keep = 2;
  const newest = await col
    .find({ status: 'ACTIVE' })
    .sort({ createdAt: -1 })
    .limit(keep)
    .project({ snapshotId: 1 })
    .toArray();
  const keepIds = newest.map((d) => d.snapshotId).filter(Boolean);
  if (keepIds.length === 0) {
    const r = await col.deleteMany({ status: { $ne: 'RESTORED' } });
    console.log(`   adam_brain_snapshots ACTIVE: deleted ${r.deletedCount} (none to keep)`);
    return r.deletedCount;
  }
  const r = await col.deleteMany({
    status: 'ACTIVE',
    snapshotId: { $nin: keepIds },
  });
  console.log(`   adam_brain_snapshots ACTIVE: deleted ${r.deletedCount}, kept ${keepIds.length}`);
  return r.deletedCount;
}

async function purgeUploads(db) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const r = await db.collection('adam_teaching_uploads').deleteMany({ uploadedAt: { $lt: cutoff } });
  console.log(`   adam_teaching_uploads (>${days}d): deleted ${r.deletedCount}`);
  return r.deletedCount;
}

async function purgeChatLegacy(db) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const r = await db.collection('adam_chat_sessions').deleteMany({
    isActive: false,
    lastActiveAt: { $lt: cutoff },
  });
  console.log(`   adam_chat_sessions (inactive >${days}d): deleted ${r.deletedCount}`);
  return r.deletedCount;
}

async function purgeJournalDrafts(db) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const r = await db.collection('adam_journals').deleteMany({
    status: { $in: ['DRAFT', 'REJECTED'] },
    submittedAt: { $lt: cutoff },
  });
  console.log(`   adam_journals DRAFT/REJECTED (>${days}d): deleted ${r.deletedCount}`);
  return r.deletedCount;
}

const PURGE_FNS = {
  logs:           purgeLogs,
  ledger:         purgeLedger,
  snapshots:      purgeSnapshots,
  superseded:     purgeSuperseded,
  uploads:        purgeUploads,
  'chat-legacy':  purgeChatLegacy,
  'journals-draft': purgeJournalDrafts,
};

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('\n📊 Collection storage (MB, approximate)\n');
  const stats = await collectionStats(db);
  let totalMb = 0;
  for (const row of stats) {
    totalMb += row.mb;
    console.log(
      `  ${row.name.padEnd(36)} ${String(row.mb).padStart(8)} MB  ${String(row.count).padStart(8)} docs  ~${row.avgObj} KB/doc`,
    );
  }
  console.log(`\n  ${'TOTAL (storage)'.padEnd(36)} ${totalMb.toFixed(2).padStart(8)} MB\n`);

  if (!execute) {
    console.log('Dry run only. To purge safe tiers:');
    console.log('  node scripts/atlas-storage-rescue.mjs --execute logs,ledger,snapshots');
    console.log('  node scripts/atlas-storage-rescue.mjs --execute uploads,chat-legacy --days=30');
    console.log('\n⚠️  journals-draft removes old DRAFT/REJECTED only — not PENDING_REVIEW/PUBLISHED.');
    await mongoose.disconnect();
    return;
  }

  if (tiers.length === 0) {
    console.error('❌ --execute requires tier list: logs,ledger,snapshots,uploads,chat-legacy,journals-draft');
    process.exit(1);
  }

  console.log(`▶ Executing purge tiers: ${tiers.join(', ')} (days=${days})\n`);
  let deleted = 0;
  for (const tier of tiers) {
    const fn = PURGE_FNS[tier];
    if (!fn) {
      console.warn(`   skip unknown tier: ${tier}`);
      continue;
    }
    deleted += await fn(db);
  }

  console.log(`\n✅ Deleted ~${deleted} documents. Re-run without --execute to see new sizes.\n`);
  console.log('▶ If still over quota: Atlas → Collections → compact, or upgrade tier.\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
