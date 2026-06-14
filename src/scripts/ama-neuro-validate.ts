#!/usr/bin/env ts-node
/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Ama Neuro Validate
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
 * Langkah 6 — AMA neuro validation CLI (Tahap 4).
 * Usage: npx ts-node --transpile-only src/scripts/ama-neuro-validate.ts [--device]
 */

import {
  runDefaultSimulatorProtocol,
  getLastNeuroValidationReport,
} from '../lib/ama/ama-neuro-validation.service';

function main(): void {
  const deviceMode = process.argv.includes('--device');
  console.log('[AMA Neuro] Running Langkah 6 validation protocol…');
  console.log(`[AMA Neuro] Mode: ${deviceMode ? 'device (await ingest via API)' : 'simulator'}`);

  const report = runDefaultSimulatorProtocol();
  console.log(JSON.stringify(report, null, 2));

  const last = getLastNeuroValidationReport();
  if (last?.gatePassed) {
    console.log('\n✅ Tahap 4 GATE PASSED — set ADAM_AMA_NEURO_GATE_PASSED=true and ADAM_AMA_NEURO_CALIBRATE=true on lab.');
    process.exit(0);
  }

  console.error('\n❌ Tahap 4 GATE FAILED — do not enable production AMA without re-run.');
  process.exit(1);
}

main();
