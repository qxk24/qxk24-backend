#!/usr/bin/env ts-node
/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Journal Section Migrate CLI (Quran split)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Remaps in-progress journals from 8-section → 9-section layout:
 *   movement_4_alamtologi_framework → movement_5_alamtologi_framework
 *   movement_5_application          → movement_6_application
 *   movement_6_invitation           → movement_7_invitation
 *   movement_4_quran                → (empty — regenerate with ADAM)
 *
 * Usage:
 *   npm run migrate:journal-quran-split -- --dry-run
 *   npm run migrate:journal-quran-split -- --execute
 */

import { ENV } from '../config/environments';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { migrateJournalSectionsToQuranSplit } from '../adam/journal/adam-journal-section-migrate.service';

function parseArgs(argv: string[]): { dryRun: boolean; execute: boolean; help: boolean } {
  let dryRun = true;
  let execute = false;
  let help = false;
  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true;
    if (arg === '--execute') {
      execute = true;
      dryRun = false;
    }
    if (arg === '--help' || arg === '-h') help = true;
  }
  return { dryRun, execute, help };
}

function printHelp(): void {
  console.log(`
Journal section migration — 8-section → 9-section (Quran split)

Options:
  --dry-run     Preview changes (default)
  --execute     Apply writes to MongoDB
  --help        This message

Skips PUBLISHED / ARCHIVED V2 journals. Chat DRAFT drafts only.

After migration, regenerate Movement 4 (Quran) via ADAM for each journal.
`);
}

async function main(): Promise<void> {
  const { dryRun, help } = parseArgs(process.argv.slice(2));
  if (help) {
    printHelp();
    process.exit(0);
  }

  console.log('[journal:migrate] Connecting…', ENV.MONGODB_URI.replace(/:([^:@/]+)@/, ':***@'));
  await connectDatabase();

  try {
    const result = await migrateJournalSectionsToQuranSplit({ dryRun });
    console.log('\n[journal:migrate] Summary', JSON.stringify(result, null, 2));

    if (dryRun) {
      console.log('\nDry run only — re-run with --execute to apply.');
    } else if (result.v2Updated + result.chatUpdated > 0) {
      console.log('\n✅ Migration applied. Regenerate movement_4_quran per journal in the write workspace or chat.');
    } else {
      console.log('\nNothing to migrate.');
    }
  } finally {
    await disconnectDatabase();
  }
}

main().catch((err: unknown) => {
  console.error('[journal:migrate] FAILED', err);
  process.exit(1);
});
