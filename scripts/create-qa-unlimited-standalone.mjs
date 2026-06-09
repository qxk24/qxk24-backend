#!/usr/bin/env node
/**
 * Standalone QA unlimited account creator — no ts-node, no src/ imports.
 * Run from alm-backend root (loads .env automatically):
 *
 *   node scripts/create-qa-unlimited-standalone.mjs --password 'YourSecurePass8+'
 *   node scripts/create-qa-unlimited-standalone.mjs --password 'x' --user-id qa-unlimited
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function loadEnv() {
  dotenv.config({ path: resolve(ROOT, '.env') });
  dotenv.config({ path: resolve(ROOT, '.env.lab') });
  const envPath = resolve(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1]?.trim() || undefined;
}

const ENTERPRISE_ACCESS = {
  memoryLevel:          'organisational',
  episodicRecords:      true,
  relationalArc:        true,
  continuityBridge:     true,
  presenceLayer:        true,
  unresolvedHoldings:   true,
  apiAccess:            true,
  apiCallsPerMonth:     -1,
  publishingRights:     true,
  customWorkspace:      true,
  whiteLabel:           true,
  supportLevel:         'dedicated',
  maxUsers:             -1,
};

const QA_NOTES = 'QA_UNLIMITED — internal testing only, no quota';
const FOUNDER_ID = 'masa-bayu';

async function main() {
  loadEnv();

  const password = readArg('--password');
  const userId = (readArg('--user-id') ?? 'qa-unlimited').toLowerCase();
  const name = readArg('--name') ?? 'QA Unlimited';
  const email = readArg('--email');

  if (!password || password.length < 8) {
    console.error('Usage: node scripts/create-qa-unlimited-standalone.mjs --password <min 8 chars> [--user-id qa-unlimited] [--name "QA Unlimited"]');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing — set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[qa-unlimited] connected');

  const db = mongoose.connection.db;
  const students = db.collection('adamstudentaccounts');
  const subs = db.collection('alamtologi_subscriptions');

  const hash = await bcrypt.hash(password, 10);
  const now = new Date();

  const existingStudent = await students.findOne({ userId });
  if (!existingStudent) {
    await students.insertOne({
      userId,
      name,
      passwordHash: hash,
      ...(email ? { email: email.toLowerCase() } : {}),
      active: true,
      createdBy: 'founder-qa-unlimited',
      passwordSource: 'founder',
      passwordUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    console.log('[qa-unlimited] student account created:', userId);
  } else {
    await students.updateOne(
      { userId },
      {
        $set: {
          name,
          passwordHash: hash,
          active: true,
          passwordSource: 'founder',
          passwordUpdatedAt: now,
          updatedAt: now,
        },
      },
    );
    console.log('[qa-unlimited] student account updated (password reset):', userId);
  }

  await subs.updateMany(
    { userId, tier: { $ne: 'ENTERPRISE' }, status: 'ACTIVE' },
    { $set: { status: 'CANCELLED', cancelledAt: now, cancelReason: 'qa_unlimited_upgrade' } },
  );

  const existingEnt = await subs.findOne({
    userId,
    tier: 'ENTERPRISE',
    status: 'ACTIVE',
    enterpriseNotes: { $regex: 'QA_UNLIMITED' },
  });

  if (!existingEnt) {
    await subs.insertOne({
      userId,
      founderId: FOUNDER_ID,
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      billingCycle: 'ENTERPRISE',
      region: 'OTHER',
      currency: 'MYR',
      amountPerCycle: 0,
      provider: 'FOUNDER_WAQF',
      access: ENTERPRISE_ACCESS,
      isFounderFunded: true,
      enterpriseNotes: QA_NOTES,
      currentPeriodStart: now,
      currentPeriodEnd: null,
      pencarianUsage: null,
      neverDelete: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('[qa-unlimited] ENTERPRISE subscription created');
  } else {
    console.log('[qa-unlimited] ENTERPRISE subscription already active');
  }

  const base = (process.env.ADAM_WEB_BASE_URL ?? 'https://alamtologi.com').replace(/\/$/, '');
  console.log(JSON.stringify({
    ok: true,
    userId,
    name,
    tier: 'ENTERPRISE',
    quota: 'unlimited',
    loginUrl: `${base}/login?next=/adam/learn`,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[qa-unlimited] fatal:', err);
  process.exit(1);
});
