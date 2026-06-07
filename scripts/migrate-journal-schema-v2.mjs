import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in .env');
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('[migrate] MongoDB connection has no database handle');
  }

  console.log('[migrate] Connected to:', db.databaseName);

  const journalCount = await db.collection('adam_journals').countDocuments();
  console.log(`[migrate] Dropping ${journalCount} documents from adam_journals...`);
  await db.collection('adam_journals').deleteMany({});
  console.log('[migrate] adam_journals wiped clean.');

  const collections = await db.listCollections({ name: 'adam_journal_sessions' }).toArray();
  if (collections.length > 0) {
    await db.collection('adam_journal_sessions').deleteMany({});
    console.log('[migrate] adam_journal_sessions wiped clean.');
  }

  await db.collection('adam_journal_sequences').deleteMany({});
  await db.collection('adam_journal_sequences').insertOne({
    year: 2026,
    lastSequence: 0,
    createdAt: new Date(),
  });
  console.log('[migrate] Sequence counter initialized: QXK24-J2026 starts at 001.');

  await db.collection('adam_journals').createIndex(
    { journalNumber: 1 },
    { unique: true, sparse: true },
  );
  await db.collection('adam_journals').createIndex({ topicId: 1 });
  await db.collection('adam_journals').createIndex({ status: 1 });
  await db.collection('adam_journals').createIndex({ majorId: 1, disciplineId: 1 });
  await db.collection('adam_journals').createIndex({ publishedAt: -1 });
  console.log('[migrate] Indexes created on adam_journals.');

  await db.collection('adam_journal_sessions').createIndex(
    { sessionId: 1 },
    { unique: true },
  );
  await db.collection('adam_journal_sessions').createIndex({ journalId: 1 });
  await db.collection('adam_journal_sessions').createIndex({ founderUserId: 1, status: 1 });
  console.log('[migrate] Indexes created on adam_journal_sessions.');

  const seqDoc = await db.collection('adam_journal_sequences').findOne({ year: 2026 });
  const journalCountAfter = await db.collection('adam_journals').countDocuments();
  console.log('[migrate] Verification:');
  console.log('  adam_journals count:', journalCountAfter);
  console.log('  Sequence doc:', seqDoc);
  console.log('[migrate] Migration complete. Ready for QXK24-J2026-001.');

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
