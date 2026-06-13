/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Bootstrap Platform Admin CLI
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 *
 * Create ADAM account (if needed) + invite to platform admin roster.
 *
 * Local dev:
 *   npx ts-node --transpile-only src/scripts/bootstrap-platform-admin.ts \
 *     --userId aziz-admin --name "Aziz Admin" --password '***' --role super
 *
 * VPS (after deploy — uses dist/, not src/):
 *   cd /var/www/alamtologi/alm-backend
 *   npm run bootstrap:platform-admin -- --userId aziz-admin --name "Aziz Admin" --password '***' --role super
 */

import mongoose from 'mongoose';
import { ENV } from '../config/environments';
import { createStudentAccount, updateStudentAccount } from '../adam/adam-student-registry.service';
import { ADAMStudentAccountModel } from '../adam/adam-student.schema';
import { PlatformAdminRole } from '../platform/platform-admin.types';
import { invitePlatformAdmin } from '../platform/platform-admin.service';

function readArg(flag: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=').slice(1).join('=');
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1];
  }
  return undefined;
}

async function main(): Promise<void> {
  const userId = readArg('--userId')?.trim().toLowerCase();
  const name = readArg('--name')?.trim();
  const password = readArg('--password');
  const email = readArg('--email')?.trim().toLowerCase();
  const roleRaw = readArg('--role')?.trim().toLowerCase();

  if (!userId || !name || !password) {
    console.error(
      'Usage: bootstrap-platform-admin.ts --userId <id> --name "Full Name" --password <secret> [--email x@y.com] [--role super|operator|finance]',
    );
    process.exit(1);
  }

  const role = roleRaw && Object.values(PlatformAdminRole).includes(roleRaw as PlatformAdminRole)
    ? (roleRaw as PlatformAdminRole)
    : PlatformAdminRole.SUPER;

  await mongoose.connect(ENV.MONGODB_URI);

  const existing = await ADAMStudentAccountModel.findOne({ userId }).lean();
  if (existing) {
    await updateStudentAccount(userId, {
      name,
      password,
      active: true,
      ...(email ? { email } : {}),
    });
    console.log(`Updated existing ADAM account: ${userId}`);
  } else {
    await createStudentAccount({
      userId,
      name,
      password,
      email,
      createdBy: 'cli:platform-admin-bootstrap',
      accountRole: 'student',
      accountLane: 'umum',
    });
    console.log(`Created ADAM account: ${userId}`);
  }

  const admin = await invitePlatformAdmin({
    identifier: userId,
    role,
    modules:    ['all'],
    createdBy:  'cli:founder',
  });

  console.log('Platform admin roster:');
  console.log(JSON.stringify({
    userId:  admin.userId,
    name:    admin.name,
    role:    admin.role,
    modules: admin.modules,
    login:   'https://alamtologi.com/admin/login',
    hub:     'https://alamtologi.com/admin',
  }, null, 2));
  console.log('');
  console.log('Next: pm2 restart alm-backend --update-env  (reloads student login cache on VPS)');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
