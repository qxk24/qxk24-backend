#!/usr/bin/env ts-node
/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Create Qa Unlimited Account
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/**
 * Founder CLI — create or upgrade a founder unlimited account (no quota, all categories).
 *
 * Usage:
 *   npx ts-node --transpile-only src/scripts/create-qa-unlimited-account.ts --password 'YourSecurePass'
 *   npx ts-node --transpile-only src/scripts/create-qa-unlimited-account.ts --password 'x' --user-id qa-unlimited
 *   npx ts-node --transpile-only src/scripts/create-qa-unlimited-account.ts --upgrade ahmad --password 'x'
 */

import mongoose from 'mongoose';
import { ENV } from '../config/environments';
import { QA_UNLIMITED_DEFAULT_USER_ID } from '../qa/qa-unlimited-account.service';
import {
  createFounderUnlimitedAccount,
  upgradeStudentToFounderUnlimited,
} from '../subscriptions/founder-unlimited-grant.service';

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1]?.trim() || undefined;
}

async function main(): Promise<void> {
  const password = readArg('--password');
  const userId = readArg('--user-id') ?? QA_UNLIMITED_DEFAULT_USER_ID;
  const name = readArg('--name') ?? 'QA Unlimited';
  const email = readArg('--email');
  const upgradeTarget = readArg('--upgrade');

  if (!password || password.length < 8) {
    console.error('Usage: create-qa-unlimited-account.ts --password <min 8 chars> [--user-id qa-unlimited] [--name "QA Unlimited"] [--email x@y.com]');
    console.error('       create-qa-unlimited-account.ts --upgrade <login-or-name> --password <min 8 chars>');
    process.exit(1);
  }

  await mongoose.connect(ENV.MONGODB_URI);

  if (upgradeTarget) {
    const result = await upgradeStudentToFounderUnlimited(upgradeTarget);

    await mongoose.disconnect();
    process.exit(result.ok ? 0 : 1);
  }

  const result = await createFounderUnlimitedAccount({
    name,
    password,
    userId,
    email,
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[qa-unlimited] fatal:', err);
  process.exit(1);
});
