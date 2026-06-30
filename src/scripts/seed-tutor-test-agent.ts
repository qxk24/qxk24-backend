/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Seed ADAM Tutor Test Agent
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Usage (from alm-backend root):
 *   npm run seed:tutor-test-agent
 *   MONGODB_URI='mongodb+srv://…' npm run seed:tutor-test-agent
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { ENV } from '../config/environments';
import {
  provisionDefaultTutorTestAgent,
  TUTOR_TEST_AGENT_EMAIL,
} from '../adam/tutor/adam-tutor-test-agent.service';

function redactMongoUri(uri: string): string {
  return uri.replace(/:([^:@/]+)@/, ':***@');
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Seed ADAM Tutor test agent (${TUTOR_TEST_AGENT_EMAIL})

  npm run seed:tutor-test-agent

Portal login: /adam/tutor/agen
Admin: ADAM Tutor admin → PIN & agents → QA test agen
`);
    return;
  }

  console.log(`[seed] MongoDB: ${redactMongoUri(ENV.MONGODB_URI)}`);
  await connectDatabase();

  const result = await provisionDefaultTutorTestAgent({
    activatedBy: 'seed:tutor-test-agent',
    sendEmail:   true,
  });

  console.log('\n=== ADAM Tutor — Test Agen Account ===\n');
  console.log(`Organisation : ${result.orgName}`);
  console.log(`Email        : ${result.email}`);
  console.log(`Pakej        : ${result.packageTier} · ${result.band} · ${result.packageStatus}`);
  console.log(`PIN balance  : ${result.pinBalance} / ${result.pinPurchasedTotal}`);
  console.log('');
  console.log(`Agen Code    : ${result.agentCode}`);
  console.log(`Portal Token : ${result.portalToken}`);
  console.log('');
  console.log('Login URL    : https://www.qxk24.com/adam/tutor/agen');
  if (result.credentialsEmailSent) {
    console.log(`\nCredentials also emailed to ${result.email}.`);
  } else {
    console.log('\nEmail not sent — copy the portal token above.');
  }
  console.log('');

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('[seed] Gagal:', err instanceof Error ? err.message : err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
