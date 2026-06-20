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
  console.log(`[seed] MongoDB: ${redactMongoUri(ENV.MONGODB_URI)}`);
  await connectDatabase();

  const result = await backfillAllAgentMarketingStudents();
  console.log('\n=== ADAM Tutor — Marketing student backfill ===\n');
  console.log(`Agents processed : ${result.processed}`);
  console.log(`Accounts created : ${result.created}`);
  console.log(`Accounts updated : ${result.updated}`);
  console.log('\nDemo login per agent: Kod Ejen + Token Portal → tab Demo ADAM\n');

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('[seed] Gagal:', err instanceof Error ? err.message : err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
