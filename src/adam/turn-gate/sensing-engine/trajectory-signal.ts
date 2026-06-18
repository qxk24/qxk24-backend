/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sensing — Trajectory Signal (S7)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

import { isAdamContinuationDepthTurn } from '../../adam-response-generation';
import type { AdamThreadPosture } from '../adam-turn-gate.types';

/** TrajectorySignalReader — thread continuation vs new topic. */
export function readTrajectorySignal(message: string): AdamThreadPosture {
  if (isAdamContinuationDepthTurn(message)) return 'continuation';
  if (/\b(?:terangkan|jelaskan|huraikan)\s+lagi\b/i.test(message)) return 'depth-request';
  return 'new-topic';
}
