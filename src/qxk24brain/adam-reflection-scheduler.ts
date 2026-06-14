/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Reflection Scheduler
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
  adamNightlyReflection,
  reflectionAlreadyRanToday,
} from './adam-nightly-reflection.service';

const FOUNDER_ID = 'masa-bayu';
const CHECK_INTERVAL_MS = 60_000;

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let running = false;

function reflectionConfig() {
  const enabled = process.env.ADAM_REFLECTION_ENABLED !== 'false';
  const hour = parseInt(process.env.ADAM_REFLECTION_HOUR ?? '3', 10);
  const minute = parseInt(process.env.ADAM_REFLECTION_MINUTE ?? '0', 10);
  const timezone = process.env.ADAM_REFLECTION_TIMEZONE ?? 'Asia/Kuala_Lumpur';
  return {
    enabled,
    hour:   Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 3,
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
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const dateKey = `${get('year')}-${get('month')}-${get('day')}`;
  return { hour, minute, dateKey };
}

async function tick(): Promise<void> {
  const cfg = reflectionConfig();
  if (!cfg.enabled || running) return;

  const { hour, minute } = localTimeParts(new Date(), cfg.timezone);
  if (hour !== cfg.hour || minute !== cfg.minute) return;

  if (await reflectionAlreadyRanToday(FOUNDER_ID, cfg.timezone)) return;

  running = true;
  try {
    await adamNightlyReflection(FOUNDER_ID, 'scheduled');
  } finally {
    running = false;
  }
}

export function startAdamReflectionScheduler(): void {
  const cfg = reflectionConfig();
  if (!cfg.enabled) {
    console.log('[ADAM Reflection] Scheduler disabled (ADAM_REFLECTION_ENABLED=false).');
    return;
  }

  if (schedulerTimer) return;

  console.log(
    `[ADAM Reflection] Scheduler active — daily at ${String(cfg.hour).padStart(2, '0')}:${String(cfg.minute).padStart(2, '0')} (${cfg.timezone})`,
  );

  schedulerTimer = setInterval(() => {
    tick().catch((err) => {
      console.error('[ADAM Reflection] Scheduler tick failed:', err);
    });
  }, CHECK_INTERVAL_MS);

  tick().catch((err) => {
    console.error('[ADAM Reflection] Initial scheduler tick failed:', err);
  });
}

export function stopAdamReflectionScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

export function getReflectionSchedulerStatus() {
  const cfg = reflectionConfig();
  return {
    enabled:   cfg.enabled,
    hour:      cfg.hour,
    minute:    cfg.minute,
    timezone:  cfg.timezone,
    kernel:    'ALAMTOLOGI',
    era:       ENV.QXK24_ERA,
  };
}
