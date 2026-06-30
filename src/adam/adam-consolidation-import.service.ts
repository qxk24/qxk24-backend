/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Consolidation Import (Lab → Production)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * One-time safe merge: copy full ADAM memory from lab DB into production DB.
 * Requires LAB_MONGODB_URI on the production stack (.env).
 */

import mongoose, { type Connection } from 'mongoose';
import type { Db } from 'mongodb';
import { ENV } from '../config/environments';

const FULL_MEMORY_COLLECTIONS = [
  'qxk24brain_master',
  'qxk24brain_entities',
  'qxk24brain_constitutional_checkpoints',
  'qxk24brain_log',
  'adam_knowledge_vault',
  'adam_knowledge',
  'adam_workspaces',
  'adam_founder_sessions',
  'adam_messages',
  'adam_teaching_uploads',
  'adam_consults',
  'adam_reflections',
  'adam_message_ledger',
  'adam_teaching_records',
  'adam_unresolved_holdings',
  'adamstudentaccounts',
] as const;

function labMongoUri(): string {
  const uri = process.env.LAB_MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      'LAB_MONGODB_URI is not set. Add the lab database URI to production .env ' +
      '(e.g. mongodb://localhost:27017/alamtologi_lab or the same Atlas DB with /qxk24_lab).',
    );
  }
  return uri;
}

function assertProductionStack(): void {
  if (ENV.QXK24_STACK === 'lab') {
    throw new Error(
      'Lab → production import runs on the production API only. ' +
      'Call POST /api/adam/students/import-lab-memory on api.qxk24.com (not /lab).',
    );
  }
}

function stripMongoMeta<T extends Record<string, unknown>>(doc: T): Omit<T, '_id' | '__v'> {
  const { _id, __v, ...rest } = doc;
  return rest;
}

async function openLabDb(): Promise<Connection> {
  return mongoose.createConnection(labMongoUri(), {
    maxPoolSize: 4,
    serverSelectionTimeoutMS: 10_000,
  }).asPromise();
}

function productionDb(): Db {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Production database is not connected.');
  return db;
}

async function replaceCollectionFromLab(
  labDb: Db,
  prod: Db,
  name: string,
): Promise<number> {
  let docs: Record<string, unknown>[];
  try {
    docs = await labDb.collection(name).find({}).toArray();
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 26) return 0;
    throw err;
  }

  const target = prod.collection(name);
  await target.deleteMany({});
  if (docs.length === 0) return 0;

  const payload = docs.map((d) => stripMongoMeta(d as Record<string, unknown>));
  await target.insertMany(payload, { ordered: false });
  return docs.length;
}

export interface FullMemoryImportResult {
  collections:    Record<string, number>;
  totalDocuments: number;
}

/** Clone full ADAM memory from lab into production (founder + all students). */
export async function importFullMemoryFromLab(): Promise<FullMemoryImportResult> {
  assertProductionStack();

  const labConn = await openLabDb();
  const labDb = labConn.db;
  if (!labDb) throw new Error('Could not open lab database connection.');

  const prod = productionDb();
  const collections: Record<string, number> = {};

  try {
    for (const name of FULL_MEMORY_COLLECTIONS) {
      collections[name] = await replaceCollectionFromLab(labDb, prod, name);
    }
  } finally {
    await labConn.close();
  }

  const totalDocuments = Object.values(collections).reduce((n, c) => n + c, 0);
  console.log(
    `[Alamtologi:Consolidation] Lab → production — ${totalDocuments} document(s) ` +
    `across ${FULL_MEMORY_COLLECTIONS.length} collections.`,
  );

  return { collections, totalDocuments };
}

/** Restore student login accounts only (lab → production). Does not touch Alamtologi Brain. */
export async function importStudentAccountsFromLab(): Promise<number> {
  assertProductionStack();

  const labConn = await openLabDb();
  const labDb = labConn.db;
  if (!labDb) throw new Error('Could not open lab database connection.');

  try {
    const count = await replaceCollectionFromLab(labDb, productionDb(), 'adamstudentaccounts');
    const { refreshStudentCache } = await import('./adam-student-registry.service');
    await refreshStudentCache();
    console.log(`[Alamtologi:Consolidation] Student accounts lab → production — ${count} account(s).`);
    return count;
  } finally {
    await labConn.close();
  }
}
