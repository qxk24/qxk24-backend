/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Invite Platform Admin CLI
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 *
 * Usage:
 *   npx ts-node --transpile-only src/scripts/invite-platform-admin.ts user@qiubbx.com
 *   npx ts-node --transpile-only src/scripts/invite-platform-admin.ts qiubbx-admin-1 --role super
 */

import mongoose from 'mongoose';
import { ENV } from '../config/environments';
import { PlatformAdminRole } from '../platform/platform-admin.types';
import { invitePlatformAdmin } from '../platform/platform-admin.service';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const identifier = args.find((a) => !a.startsWith('--'));
  const roleArg = args.find((a) => a.startsWith('--role='))?.split('=')[1]
    ?? (args.includes('--role') ? args[args.indexOf('--role') + 1] : undefined);

  if (!identifier) {
    console.error('Usage: invite-platform-admin.ts <userId|email> [--role operator|finance|super]');
    process.exit(1);
  }

  const role = roleArg && Object.values(PlatformAdminRole).includes(roleArg as PlatformAdminRole)
    ? (roleArg as PlatformAdminRole)
    : PlatformAdminRole.OPERATOR;

  await mongoose.connect(ENV.MONGODB_URI);

  const admin = await invitePlatformAdmin({
    identifier,
    role,
    createdBy: 'cli:founder',
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
