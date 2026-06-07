/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ZPD Growth Signal Emitter
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
 */

import { ENV } from '../config/environments';

export interface ZpdGrowthSignalPayload {
  studentId:     string;
  signalType:    'zpd_advancement';
  currentLevel:  number;
  topicKey:      string;
  masteredCount: number;
  timestamp:     string;
}

export async function emitZpdGrowthSignal(
  studentId: string,
  currentLevel: number,
  topicKey: string,
  masteredCount: number,
): Promise<void> {
  if (!ENV.ADAM_GATEWAY_PLAS_ENABLED) return;
  if (!ENV.ADAM_GATEWAY_URL) return;

  const payload: ZpdGrowthSignalPayload = {
    studentId,
    signalType:    'zpd_advancement',
    currentLevel,
    topicKey,
    masteredCount,
    timestamp:     new Date().toISOString(),
  };

  const base = ENV.ADAM_GATEWAY_URL.replace(/\/$/, '');

  try {
    const res = await fetch(`${base}/api/adam/plas/growth`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[ZPD] Growth signal non-200: ${res.status} for student ${studentId}`);
    } else {
      console.log(
        `[ZPD] Growth signal emitted for student ${studentId} (level ${currentLevel}, topic: ${topicKey})`,
      );
    }
  } catch (err) {
    console.error(`[ZPD] Growth signal emit failed (non-fatal) for ${studentId}:`, err);
  }
}
