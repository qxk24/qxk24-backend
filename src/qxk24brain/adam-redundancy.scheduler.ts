/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Redundancy Scheduler (Layer 10)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { backupBrainToR2 } from './adam-redundancy.service';

const FOUNDER_ID = 'masa-bayu';
const CHECK_INTERVAL_MS = 60_000;

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let running = false;
let lastRunDateKey = '';

function backupConfig() {
  const enabled = process.env.ADAM_BACKUP_ENABLED !== 'false';
  const hour = parseInt(process.env.ADAM_BACKUP_HOUR ?? '2', 10);
  const minute = parseInt(process.env.ADAM_BACKUP_MINUTE ?? '0', 10);
  const timezone = process.env.ADAM_BACKUP_TIMEZONE ?? 'Asia/Kuala_Lumpur';
  return {
    enabled,
    hour:   Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 2,
    minute: Number.isFinite(minute) ? Math.min(Math.max(minute, 0), 59) : 0,
    timezone,
  };
}

function localTimeParts(now: Date, timezone: string): { hour: number; minute: number; dateKey: string } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  return {
    hour:    parseInt(get('hour'), 10),
    minute:  parseInt(get('minute'), 10),
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

async function tick(): Promise<void> {
  const cfg = backupConfig();
  if (!cfg.enabled || running) return;

  const { hour, minute, dateKey } = localTimeParts(new Date(), cfg.timezone);
  if (hour !== cfg.hour || minute !== cfg.minute) return;
  if (lastRunDateKey === dateKey) return;

  running = true;
  try {
    const result = await backupBrainToR2(FOUNDER_ID);
    if (result.status !== 'FAILED') {
      lastRunDateKey = dateKey;
    }
  } finally {
    running = false;
  }
}

export function startAdamRedundancyScheduler(): void {
  const cfg = backupConfig();
  if (!cfg.enabled) {

    return;
  }

  if (schedulerTimer) return;

  schedulerTimer = setInterval(() => {
    tick().catch((err) => {
      console.error('[ADAM Redundancy] Scheduler tick failed:', err);
    });
  }, CHECK_INTERVAL_MS);

  tick().catch((err) => {
    console.error('[ADAM Redundancy] Initial scheduler tick failed:', err);
  });
}

export function getRedundancySchedulerStatus() {
  const cfg = backupConfig();
  return {
    enabled:  cfg.enabled,
    hour:     cfg.hour,
    minute:   cfg.minute,
    timezone: cfg.timezone,
    layer:    'LAYER_10_REDUNDANCY',
    kernel:   ENV.QXK24_KERNEL_VERSION,
    era:      ENV.QXK24_ERA,
  };
}
