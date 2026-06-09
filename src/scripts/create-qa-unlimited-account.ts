#!/usr/bin/env ts-node
/**
 * Founder CLI — create or upgrade a QA unlimited test account (no quota).
 *
 * Usage:
 *   npx ts-node --transpile-only src/scripts/create-qa-unlimited-account.ts --password 'YourSecurePass'
 *   npx ts-node --transpile-only src/scripts/create-qa-unlimited-account.ts --password 'x' --user-id qa-unlimited
 *   npx ts-node --transpile-only src/scripts/create-qa-unlimited-account.ts --upgrade ahmad --password 'x'
 */

import mongoose from 'mongoose';
import { ENV } from '../config/environments';
import {
  createQaUnlimitedAccount,
  QA_UNLIMITED_DEFAULT_USER_ID,
  upgradeStudentToQaUnlimited,
} from '../qa/qa-unlimited-account.service';

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
  console.log('[qa-unlimited] connected:', ENV.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@'));

  if (upgradeTarget) {
    const result = await upgradeStudentToQaUnlimited(upgradeTarget);
    console.log(JSON.stringify({
      mode:     'upgrade',
      ...result,
      tier:     'ENTERPRISE',
      quota:    'unlimited',
    }, null, 2));
    await mongoose.disconnect();
    process.exit(result.ok ? 0 : 1);
  }

  const result = await createQaUnlimitedAccount({
    name,
    password,
    userId,
    email,
  });

  console.log(JSON.stringify({
    mode:     'create',
    userId:   result.userId,
    name:     result.name,
    action:   result.action,
    tier:     'ENTERPRISE',
    quota:    'unlimited',
    loginUrl: `${ENV.ADAM_WEB_BASE_URL.replace(/\/$/, '')}/login?next=/adam/learn`,
    credentials: {
      loginId:  result.userId,
      password: '(as supplied on CLI — not stored in logs)',
    },
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[qa-unlimited] fatal:', err);
  process.exit(1);
});
