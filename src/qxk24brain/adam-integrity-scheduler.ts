/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Integrity Scan Scheduler (Layer 2)
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
import {
  integrityAlreadyRanToday,
  runIntegrityScan,
} from './adam-integrity.service';

const FOUNDER_ID = 'masa-bayu';
const CHECK_INTERVAL_MS = 60_000;

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let running = false;

function integrityConfig() {
  const enabled = process.env.ADAM_INTEGRITY_ENABLED !== 'false';
  const hour = parseInt(process.env.ADAM_INTEGRITY_HOUR ?? '4', 10);
  const minute = parseInt(process.env.ADAM_INTEGRITY_MINUTE ?? '0', 10);
  const timezone = process.env.ADAM_INTEGRITY_TIMEZONE
    ?? process.env.ADAM_REFLECTION_TIMEZONE
    ?? 'Asia/Kuala_Lumpur';
  return {
    enabled,
    hour:   Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 4,
    minute: Number.isFinite(minute) ? Math.min(Math.max(minute, 0), 59) : 0,
    timezone,
  };
}

function localTimeParts(now: Date, timezone: string): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  return {
    hour:   parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
  };
}

async function tick(): Promise<void> {
  const cfg = integrityConfig();
  if (!cfg.enabled || running) return;

  const { hour, minute } = localTimeParts(new Date(), cfg.timezone);
  if (hour !== cfg.hour || minute !== cfg.minute) return;

  if (await integrityAlreadyRanToday(FOUNDER_ID, cfg.timezone)) return;

  running = true;
  try {
    await runIntegrityScan(FOUNDER_ID);
  } finally {
    running = false;
  }
}

export function startAdamIntegrityScheduler(): void {
  const cfg = integrityConfig();
  if (!cfg.enabled) {
    console.log('[ADAM Integrity] Scheduler disabled (ADAM_INTEGRITY_ENABLED=false).');
    return;
  }

  if (schedulerTimer) return;

  console.log(
    `[ADAM Integrity] Scheduler active — daily at ${String(cfg.hour).padStart(2, '0')}:${String(cfg.minute).padStart(2, '0')} (${cfg.timezone})`,
  );

  schedulerTimer = setInterval(() => {
    tick().catch((err) => {
      console.error('[ADAM Integrity] Scheduler tick failed:', err);
    });
  }, CHECK_INTERVAL_MS);

  tick().catch((err) => {
    console.error('[ADAM Integrity] Initial scheduler tick failed:', err);
  });
}

export function getIntegritySchedulerStatus() {
  const cfg = integrityConfig();
  return {
    enabled:  cfg.enabled,
    hour:     cfg.hour,
    minute:   cfg.minute,
    timezone: cfg.timezone,
    kernel:   'QXK24',
    era:      ENV.QXK24_ERA,
    layer:    'LAYER_2_INTEGRITY',
  };
}
