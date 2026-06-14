#!/usr/bin/env ts-node
/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Grant Profesional
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
 * Founder CLI — grant ADAM Profesional to students by name or login id.
 *
 * Usage:
 *   npx ts-node --transpile-only src/scripts/grant-profesional.ts ahmad suhaila aziz izwahanie
 *   npx ts-node --transpile-only src/scripts/grant-profesional.ts --dry-run ahmad
 */

import mongoose from 'mongoose';
import { ENV } from '../config/environments';
import {
  grantFounderProfesionalBatch,
  resolveStudentForGrant,
} from '../subscriptions/founder-profesional-grant.service';

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
  const dryRun = process.argv.includes('--dry-run');

  if (args.length === 0) {
    console.error('Usage: grant-profesional.ts [--dry-run] <login-or-name> [...]');
    process.exit(1);
  }

  await mongoose.connect(ENV.MONGODB_URI);
  console.log('[grant-profesional] connected:', ENV.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@'));

  if (dryRun) {
    for (const id of args) {
      const student = await resolveStudentForGrant(id);
      console.log(JSON.stringify({
        identifier: id,
        resolved:   student ?? null,
      }));
    }
    await mongoose.disconnect();
    return;
  }

  const results = await grantFounderProfesionalBatch(args, {
    notes: 'Founder grant — Profesional (batch upgrade from Basic)',
    periodMonths: 12,
  });

  console.log(JSON.stringify({ results }, null, 2));

  const failed = results.filter((r) => !r.ok);
  await mongoose.disconnect();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[grant-profesional] fatal:', err);
  process.exit(1);
});
