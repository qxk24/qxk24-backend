/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Lab Production Import
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { type Connection } from 'mongoose';
import type { Db } from 'mongodb';
import { ENV } from '../config/environments';
import { ADAMFounderSessionModel, ADAMMessageModel } from './adam.schema';
import { ADAMWorkspaceModel } from './adam-workspace.schema';

/** Production → lab: full constitutional memory (founder + all students). */
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

const WORKSPACES = 'adam_workspaces';
const SESSIONS = 'adam_founder_sessions';
const MESSAGES = 'adam_messages';

function productionMongoUri(): string {
  const uri = process.env.PRODUCTION_MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      'PRODUCTION_MONGODB_URI is not set on the lab stack. Add it to .env.lab (e.g. mongodb://localhost:27017/alamtologi).',
    );
  }
  return uri;
}

function assertLabStack(): void {
  if (ENV.QXK24_STACK !== 'lab') {
    throw new Error('Import from production is only available on the lab stack.');
  }
}

function stripMongoMeta<T extends Record<string, unknown>>(doc: T): Omit<T, '_id' | '__v'> {
  const { _id, __v, ...rest } = doc;
  return rest;
}

async function openProductionDb(): Promise<Connection> {
  return mongoose.createConnection(productionMongoUri(), {
    maxPoolSize: 4,
    serverSelectionTimeoutMS: 10_000,
  }).asPromise();
}

function labDb(): Db {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Lab database is not connected.');
  return db;
}

async function replaceCollectionFromProduction(
  prodDb: Db,
  lab: Db,
  name: string,
): Promise<number> {
  let docs: Record<string, unknown>[];
  try {
    docs = await prodDb.collection(name).find({}).toArray();
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 26) return 0;
    throw err;
  }

  const target = lab.collection(name);
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

/** Clone full ADAM memory from production — brain, books, chats, vault (founder + all students). */
export async function importFullMemoryFromProduction(): Promise<FullMemoryImportResult> {
  assertLabStack();

  const prodConn = await openProductionDb();
  const prodDb = prodConn.db;
  if (!prodDb) throw new Error('Could not open production database connection.');

  const lab = labDb();
  const collections: Record<string, number> = {};

  try {
    for (const name of FULL_MEMORY_COLLECTIONS) {
      collections[name] = await replaceCollectionFromProduction(prodDb, lab, name);
    }
  } finally {
    await prodConn.close();
  }

  const totalDocuments = Object.values(collections).reduce((n, c) => n + c, 0);
  console.log(`[Alamtologi:LabImport] Full memory sync — ${totalDocuments} document(s) across ${FULL_MEMORY_COLLECTIONS.length} collections.`);

  return { collections, totalDocuments };
}

export interface LabImportResult {
  userId:     string;
  workspaces: number;
  sessions:   number;
  messages:   number;
}

/** Copy one student's books/sessions/messages (partial — prefer importFullMemoryFromProduction). */
export async function importStudentDataFromProduction(userId: string): Promise<LabImportResult> {
  assertLabStack();

  const prodConn = await openProductionDb();

  try {
    const prodDb = prodConn.db;
    if (!prodDb) throw new Error('Could not open production database connection.');

    const wsCol = prodDb.collection(WORKSPACES);
    const sessCol = prodDb.collection(SESSIONS);
    const msgCol = prodDb.collection(MESSAGES);

    const workspaces = await wsCol
      .find({ userId, archived: { $ne: true } })
      .toArray();

    const sessionIds = new Set<string>(
      workspaces.map((w) => String(w.sessionId)),
    );

    const studentSessions = await sessCol
      .find({ founderId: userId, sessionType: 'student' })
      .toArray();

    for (const sess of studentSessions) {
      sessionIds.add(String(sess.sessionId));
    }

    let workspaceCount = 0;
    for (const ws of workspaces) {
      const payload = stripMongoMeta(ws as Record<string, unknown>);
      await ADAMWorkspaceModel.replaceOne(
        { workspaceId: String(ws.workspaceId) },
        payload,
        { upsert: true },
      );
      workspaceCount += 1;
    }

    const sessions = sessionIds.size
      ? await sessCol.find({ sessionId: { $in: [...sessionIds] } }).toArray()
      : [];

    let sessionCount = 0;
    for (const sess of sessions) {
      const payload = stripMongoMeta(sess as Record<string, unknown>);
      await ADAMFounderSessionModel.replaceOne(
        { sessionId: String(sess.sessionId) },
        payload,
        { upsert: true },
      );
      sessionCount += 1;
    }

    const messages = sessionIds.size
      ? await msgCol.find({ sessionId: { $in: [...sessionIds] } }).toArray()
      : [];

    let messageCount = 0;
    for (const msg of messages) {
      const payload = stripMongoMeta(msg as Record<string, unknown>);
      const filter = msg.messageId
        ? { messageId: String(msg.messageId) }
        : {
            sessionId: String(msg.sessionId),
            createdAt: msg.createdAt,
            role:      String(msg.role),
          };

      await ADAMMessageModel.replaceOne(filter, payload, { upsert: true });
      messageCount += 1;
    }

    console.log(
      `[Alamtologi:LabImport] ${userId}: ${workspaceCount} workspace(s), ${sessionCount} session(s), ${messageCount} message(s)`,
    );

    return {
      userId,
      workspaces: workspaceCount,
      sessions:   sessionCount,
      messages:   messageCount,
    };
  } finally {
    await prodConn.close();
  }
}

export async function importAllStudentsFromProduction(
  _userIds: string[],
): Promise<FullMemoryImportResult> {
  return importFullMemoryFromProduction();
}
