/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Atomic Recovery Scheduler
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

import { recoverFailedMessages } from './adam-atomic.service';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

let recoveryTimer: ReturnType<typeof setInterval> | null = null;
let running = false;

function recoveryIntervalMs(): number {
  const raw = process.env.ADAM_ATOMIC_RECOVERY_MS;
  if (!raw) return DEFAULT_INTERVAL_MS;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 60_000 ? n : DEFAULT_INTERVAL_MS;
}

async function tick(): Promise<void> {
  if (running) return;
  if (process.env.ADAM_ATOMIC_RECOVERY_ENABLED === 'false') return;

  running = true;
  try {
    await recoverFailedMessages();
  } finally {
    running = false;
  }
}

export function startAdamAtomicRecoveryScheduler(): void {
  if (process.env.ADAM_ATOMIC_RECOVERY_ENABLED === 'false') {

    return;
  }

  if (recoveryTimer) return;

  const intervalMs = recoveryIntervalMs();

  recoveryTimer = setInterval(() => {
    tick().catch((err) => {
      console.error('[ADAM Atomic] Recovery tick failed:', err);
    });
  }, intervalMs);

  tick().catch((err) => {
    console.error('[ADAM Atomic] Initial recovery tick failed:', err);
  });
}

export function stopAdamAtomicRecoveryScheduler(): void {
  if (recoveryTimer) {
    clearInterval(recoveryTimer);
    recoveryTimer = null;
  }
}
