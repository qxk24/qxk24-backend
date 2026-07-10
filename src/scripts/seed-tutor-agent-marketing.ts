/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Backfill Agent Marketing Students
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
 *   npm run seed:tutor-agent-marketing
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { ENV } from '../config/environments';
import { backfillAllAgentMarketingStudents } from '../adam/tutor/adam-tutor-agent-marketing.service';

function redactMongoUri(uri: string): string {
  return uri.replace(/:([^:@/]+)@/, ':***@');
}

async function main() {
  try {

    await connectDatabase();

    const result = await backfillAllAgentMarketingStudents();

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
