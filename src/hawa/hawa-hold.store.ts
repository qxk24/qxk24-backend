/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : HAWA Hold Store
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { HawaHoldRecord, HawaVerdict } from './hawa.types';

const holds = new Map<string, HawaHoldRecord>();

function sessionKeys(sessionId: string): string[] {
  if (sessionId.startsWith('build_')) {
    return [sessionId, sessionId.slice(6)];
  }
  return [sessionId, `build_${sessionId}`];
}

export function markHawaHold(sessionId: string, verdict: HawaVerdict): void {
  const record: HawaHoldRecord = {
    sessionId,
    verdict,
    haltedAt: Date.now(),
  };
  for (const key of sessionKeys(sessionId)) {
    holds.set(key, record);
  }
}

export function getHawaHold(sessionId: string): HawaHoldRecord | undefined {
  for (const key of sessionKeys(sessionId)) {
    const record = holds.get(key);
    if (record) return record;
  }
  return undefined;
}

export function clearHawaHold(sessionId: string): void {
  for (const key of sessionKeys(sessionId)) {
    holds.delete(key);
  }
}

export function isHawaHeld(sessionId: string): boolean {
  return Boolean(getHawaHold(sessionId));
}
