/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor — CE Hardware & Digital Logic Classifier
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Depends on : tutor-law.ce-intent-classifier.ts
 * Consumed by: tutor-law.code-intent-classifier.ts (ce-hardware route)
 *
 * KEY PEDAGOGY: truth table before circuit; trace before simulate.
 */

export type {
  HardwareClassifierInput,
  HardwareClassifierOutput,
} from './tutor-law.ce-hardware.types';

export {
  HardwareIntent,
  HardwareTopic,
} from './tutor-law.ce-hardware.types';

export { classifyHardwareIntent } from './tutor-law.ce-hardware-classifier.core';

import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { classifyHardwareIntent } from './tutor-law.ce-hardware-classifier.core';
import {
  HW_CIRCUIT_DESC_MARKERS,
  HW_HDL_MARKERS,
  HW_TRUTH_TABLE_MARKERS,
  countHardwareHits,
} from './tutor-law.ce-hardware.signals';
import type { CEClassifierOutput } from './tutor-law.ce-intent.types';
import { CEAbstractionLayer } from './tutor-law.ce-intent.types';
import type {
  HardwareClassifierInput,
  HardwareClassifierOutput,
  HardwareTopic,
} from './tutor-law.ce-hardware.types';

export const CE_HARDWARE_ROUTE = 'ce-hardware-classifier';

export function shouldRouteToCEHardware(ceRouting: CEClassifierOutput | null | undefined): boolean {
  return ceRouting?.routeTo === CE_HARDWARE_ROUTE;
}

export function buildHardwareClassifierInput(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  ceRouting?:          CEClassifierOutput | null;
  sessionState?: {
    hardwarePriorTopic?: HardwareTopic | null;
    stuckCount?:         number;
  };
}): HardwareClassifierInput {
  const rawText = input.userMessage ?? '';
  const blob = [rawText, ...(input.recentUserMessages ?? [])].join('\n');
  const normText = normalizeMathClassifierText(rawText);

  return {
    rawText,
    normText,
    hasTruthTable:    countHardwareHits(normText, HW_TRUTH_TABLE_MARKERS) >= 1
      || /\|\s*[01abxy]\s*\|/i.test(blob),
    hasCircuitDesc:   countHardwareHits(normText, HW_CIRCUIT_DESC_MARKERS) >= 1,
    hasHDLCode:       countHardwareHits(normText, HW_HDL_MARKERS) >= 1
      || /```(?:verilog|vhdl)/i.test(blob),
    stuckCount:       input.sessionState?.stuckCount ?? 0,
    priorTopic:       input.sessionState?.hardwarePriorTopic ?? null,
    abstractionLayer: input.ceRouting?.abstractionLayer ?? CEAbstractionLayer.UNKNOWN,
  };
}

export function classifyTutorCEHardwareIntent(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  ceRouting?:          CEClassifierOutput | null;
  sessionState?: {
    hardwarePriorTopic?: HardwareTopic | null;
    stuckCount?:         number;
  };
}): HardwareClassifierOutput | null {
  if (!shouldRouteToCEHardware(input.ceRouting)) return null;
  return classifyHardwareIntent(buildHardwareClassifierInput(input));
}
