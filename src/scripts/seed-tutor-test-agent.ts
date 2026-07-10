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
  try {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {

      return;
    }

    await connectDatabase();

    const result = await provisionDefaultTutorTestAgent({
      activatedBy: 'seed:tutor-test-agent',
      sendEmail:   true,
    });

    if (result.credentialsEmailSent) {

    } else {

    }

    await disconnectDatabase();

  } catch (err) {
    console.error(err);
    throw err;
  }}

main().catch(async (err) => {
  try {
    console.error('[seed] Gagal:', err instanceof Error ? err.message : err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);

  } catch (err) {
    console.error(err);
    throw err;
  }});
