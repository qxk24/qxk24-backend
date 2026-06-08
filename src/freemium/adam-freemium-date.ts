/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Date (Malaysia)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';

const MS_PER_DAY = 86_400_000;

export function freemiumTimezone(): string {
  return ENV.ADAM_FREEMIUM_TIMEZONE || 'Asia/Kuala_Lumpur';
}

/** YYYY-MM-DD in Malaysia calendar — daily quota resets at local midnight. */
export function malaysiaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: freemiumTimezone(),
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(date);
}

/** YYYY-MM in Malaysia calendar — Premium monthly quota resets on the 1st (MY time). */
export function malaysiaMonthKey(date = new Date()): string {
  return malaysiaDateKey(date).slice(0, 7);
}

export function startOfMalaysiaDay(date = new Date()): Date {
  const ymd = malaysiaDateKey(date);
  return new Date(`${ymd}T00:00:00+08:00`);
}

export function endOfMalaysiaDay(date = new Date()): Date {
  return new Date(startOfMalaysiaDay(date).getTime() + MS_PER_DAY - 1);
}
