/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Batch Scheduler
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Opt-in: ADAM_JOURNAL_BATCH_ENABLED=true
 * Each tick seals up to ADAM_JOURNAL_BATCH_SIZE pending subfields for today (MY).
 */

import { ENV } from '../config/environments';
import { getDailyJournalSegmentStatus } from './adam-journal-daily-segment';
import {
  getLastJournalBatchRun,
  isJournalBatchRunning,
  journalBatchConfig,
  runJournalBatch,
} from './adam-journal-batch.service';

let schedulerTimer: ReturnType<typeof setInterval> | null = null;

async function tick(): Promise<void> {
  const cfg = journalBatchConfig();
  if (!cfg.enabled || isJournalBatchRunning()) return;

  const status = await getDailyJournalSegmentStatus();
  if (status.pendingCountToday <= 0) return;

  await runJournalBatch(cfg.batchSize);
}

export function startAdamJournalBatchScheduler(): void {
  const cfg = journalBatchConfig();
  if (!cfg.enabled) {
    console.log('[ADAM Journal Batch] Scheduler disabled (set ADAM_JOURNAL_BATCH_ENABLED=true).');
    return;
  }

  if (schedulerTimer) return;

  const mode = cfg.dedicated ? 'dedicated hardware 24/7' : 'cloud';
  console.log(
    `[ADAM Journal Batch] Scheduler active (${mode}) — every ${cfg.intervalMs / 1000}s, ` +
    `${cfg.batchSize} journal(s)/tick, pause ${cfg.pauseMs}ms` +
    (cfg.journalsPerDayCapacityHint
      ? `, capacity hint ~${cfg.journalsPerDayCapacityHint}/day`
      : ''),
  );

  schedulerTimer = setInterval(() => {
    tick().catch((err) => {
      console.error('[ADAM Journal Batch] Scheduler tick failed:', err);
    });
  }, cfg.intervalMs);

  tick().catch((err) => {
    console.error('[ADAM Journal Batch] Initial tick failed:', err);
  });
}

export function stopAdamJournalBatchScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

export function getJournalBatchSchedulerStatus() {
  const cfg = journalBatchConfig();
  return {
    enabled:    cfg.enabled,
    intervalMs: cfg.intervalMs,
    batchSize:  cfg.batchSize,
    pauseMs:    cfg.pauseMs,
    running:    isJournalBatchRunning(),
    lastRun:    getLastJournalBatchRun(),
    kernel:     'Alamtologi',
    era:        ENV.QXK24_ERA,
  };
}
